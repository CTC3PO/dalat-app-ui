-- Moment Deletion Functions
-- Allows users to delete their own content and admins/moderators to delete any content

-- ============================================
-- DELETE OWN MOMENT (for content creators)
-- ============================================

-- Users can delete their own moments (any status except already removed)
CREATE OR REPLACE FUNCTION delete_own_moment(p_moment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_status text;
BEGIN
  -- Get the moment's user_id and current status
  SELECT user_id, status INTO v_user_id, v_current_status
  FROM moments
  WHERE id = p_moment_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'moment_not_found';
  END IF;

  -- Check if user is the moment creator
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'not_moment_owner';
  END IF;

  -- Cannot delete already removed moments
  IF v_current_status = 'removed' THEN
    RAISE EXCEPTION 'already_removed';
  END IF;

  -- Update the status to removed
  UPDATE moments
  SET
    status = 'removed',
    moderation_note = 'Deleted by owner',
    updated_at = now()
  WHERE id = p_moment_id;

  RETURN jsonb_build_object(
    'ok', true,
    'moment_id', p_moment_id,
    'new_status', 'removed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION delete_own_moment(uuid) TO authenticated;

-- ============================================
-- ADMIN/MODERATOR MOMENT REMOVAL
-- ============================================

-- Update remove_moment to also allow admins and moderators
CREATE OR REPLACE FUNCTION remove_moment(
  p_moment_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_current_status text;
  v_is_event_creator boolean;
  v_is_admin_or_mod boolean;
BEGIN
  -- Get the moment's event_id and current status
  SELECT event_id, status INTO v_event_id, v_current_status
  FROM moments
  WHERE id = p_moment_id;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'moment_not_found';
  END IF;

  -- Check if user is event creator
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE id = v_event_id AND created_by = auth.uid()
  ) INTO v_is_event_creator;

  -- Check if user is admin or moderator
  SELECT has_role_level('moderator') INTO v_is_admin_or_mod;

  -- Must be event creator OR admin/moderator
  IF NOT v_is_event_creator AND NOT v_is_admin_or_mod THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Can remove published or pending moments
  IF v_current_status NOT IN ('published', 'pending') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  -- Update the status with optional reason
  UPDATE moments
  SET
    status = 'removed',
    moderation_note = COALESCE(p_reason, 'Removed by moderator'),
    updated_at = now()
  WHERE id = p_moment_id;

  RETURN jsonb_build_object(
    'ok', true,
    'moment_id', p_moment_id,
    'new_status', 'removed'
  );
END;
$$;

-- Grant already exists from previous migration, but redeclare for safety
GRANT EXECUTE ON FUNCTION remove_moment(uuid, text) TO authenticated;
