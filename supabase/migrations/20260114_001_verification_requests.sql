-- Verification Requests Table
-- Allows users to request verified organizer status
-- Admin reviews and approves/rejects requests

CREATE TABLE verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is requesting
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,

  -- Organizer info being requested
  organizer_name text NOT NULL,
  organizer_type text NOT NULL
    CHECK (organizer_type IN ('ward', 'city', 'venue', 'cultural_org', 'committee', 'business', 'other')),
  organizer_description text,

  -- Proof of legitimacy
  proof_links text[] DEFAULT '{}',  -- URLs to Facebook pages, websites, official documents
  proof_message text,               -- Additional context from the requester

  -- Contact info for verification
  contact_email text,
  contact_phone text,

  -- Review status
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),

  -- Admin review
  reviewed_by uuid REFERENCES profiles,
  reviewed_at timestamptz,
  admin_notes text,                 -- Internal notes from admin
  rejection_reason text,            -- Public reason if rejected

  -- If approved, link to created/existing organizer
  organizer_id uuid REFERENCES organizers,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status) WHERE status = 'pending';
CREATE INDEX idx_verification_requests_created ON verification_requests(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER verification_requests_updated_at BEFORE UPDATE ON verification_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "verification_requests_select_own"
ON verification_requests FOR SELECT
USING (user_id = auth.uid());

-- Admins and moderators can view all requests
CREATE POLICY "verification_requests_select_admin"
ON verification_requests FOR SELECT
USING (has_role_level('moderator'));

-- Users can create their own requests (limit to 1 pending per user)
CREATE POLICY "verification_requests_insert_own"
ON verification_requests FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM verification_requests
    WHERE user_id = auth.uid()
    AND status = 'pending'
  )
);

-- Users can update their pending requests (edit before review)
CREATE POLICY "verification_requests_update_own"
ON verification_requests FOR UPDATE
USING (
  user_id = auth.uid()
  AND status IN ('pending', 'more_info_needed')
)
WITH CHECK (
  user_id = auth.uid()
  AND status IN ('pending', 'more_info_needed')
);

-- Admins can update any request (for approval/rejection)
CREATE POLICY "verification_requests_update_admin"
ON verification_requests FOR UPDATE
USING (has_role('admin'))
WITH CHECK (has_role('admin'));

-- Users can delete their own pending requests (withdraw)
CREATE POLICY "verification_requests_delete_own"
ON verification_requests FOR DELETE
USING (
  user_id = auth.uid()
  AND status = 'pending'
);

-- ============================================
-- HELPER FUNCTION: Approve verification
-- ============================================

-- Function to approve a verification request
-- Creates organizer if needed, updates user role, links everything
CREATE OR REPLACE FUNCTION approve_verification_request(
  request_id uuid,
  admin_notes_input text DEFAULT NULL,
  existing_organizer_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request verification_requests;
  v_organizer_id uuid;
  v_result json;
BEGIN
  -- Check caller is admin
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Only admins can approve verification requests';
  END IF;

  -- Get the request
  SELECT * INTO v_request FROM verification_requests WHERE id = request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' AND v_request.status != 'more_info_needed' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Use existing organizer or create new one
  IF existing_organizer_id IS NOT NULL THEN
    v_organizer_id := existing_organizer_id;

    -- Update organizer ownership and verification
    UPDATE organizers
    SET
      owner_id = v_request.user_id,
      is_verified = true,
      updated_at = now()
    WHERE id = v_organizer_id;
  ELSE
    -- Create new organizer
    INSERT INTO organizers (
      slug,
      name,
      description,
      organizer_type,
      contact_email,
      contact_phone,
      owner_id,
      is_verified
    ) VALUES (
      lower(regexp_replace(v_request.organizer_name, '[^a-zA-Z0-9]+', '-', 'g')),
      v_request.organizer_name,
      v_request.organizer_description,
      v_request.organizer_type,
      v_request.contact_email,
      v_request.contact_phone,
      v_request.user_id,
      true
    )
    RETURNING id INTO v_organizer_id;
  END IF;

  -- Update user role to organizer_verified
  UPDATE profiles
  SET role = 'organizer_verified'
  WHERE id = v_request.user_id;

  -- Update the request
  UPDATE verification_requests
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_notes = admin_notes_input,
    organizer_id = v_organizer_id
  WHERE id = request_id;

  v_result := json_build_object(
    'success', true,
    'organizer_id', v_organizer_id,
    'user_id', v_request.user_id
  );

  RETURN v_result;
END;
$$;

-- Function to reject a verification request
CREATE OR REPLACE FUNCTION reject_verification_request(
  request_id uuid,
  rejection_reason_input text,
  admin_notes_input text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request verification_requests;
BEGIN
  -- Check caller is admin
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Only admins can reject verification requests';
  END IF;

  -- Get the request
  SELECT * INTO v_request FROM verification_requests WHERE id = request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status NOT IN ('pending', 'more_info_needed') THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Update the request
  UPDATE verification_requests
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_notes = admin_notes_input,
    rejection_reason = rejection_reason_input
  WHERE id = request_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Function to request more info
CREATE OR REPLACE FUNCTION request_more_info_verification(
  request_id uuid,
  admin_notes_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Only admins can request more info';
  END IF;

  UPDATE verification_requests
  SET
    status = 'more_info_needed',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_notes = admin_notes_input
  WHERE id = request_id
  AND status IN ('pending', 'more_info_needed');

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION approve_verification_request(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_verification_request(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION request_more_info_verification(uuid, text) TO authenticated;
