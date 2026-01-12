-- Moments Batch Upload Support
-- Enables pro photographers to bulk upload 500+ files efficiently

-- ============================================
-- SCHEMA CHANGES
-- ============================================

-- Add batch_id column to moments for grouping bulk uploads
ALTER TABLE moments
ADD COLUMN IF NOT EXISTS batch_id uuid DEFAULT NULL;

-- Index for querying by batch (only index rows that have a batch_id)
CREATE INDEX IF NOT EXISTS idx_moments_batch_id ON moments(batch_id)
WHERE batch_id IS NOT NULL;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is a photographer for an event (event creator)
-- Can be extended later to check an event_photographers table
CREATE OR REPLACE FUNCTION is_event_photographer(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  -- For now, event creator is considered photographer
  RETURN EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id AND created_by = v_uid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_event_photographer(uuid) TO authenticated;

-- ============================================
-- BATCH INSERT RPC
-- ============================================

-- Create multiple moments in a single transaction
-- Used by pro photographer mode for bulk uploads
CREATE OR REPLACE FUNCTION create_moments_batch(
  p_event_id uuid,
  p_moments jsonb  -- Array of {content_type, media_url, text_content, batch_id}
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_status text;
  v_moment_record jsonb;
  v_inserted_ids uuid[] := '{}';
  v_moment_id uuid;
  v_batch_id uuid;
  v_content_type text;
  v_media_url text;
  v_text_content text;
  v_count int := 0;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Check if user can post (must be event photographer/creator for batch mode)
  IF NOT public.is_event_photographer(p_event_id) THEN
    RAISE EXCEPTION 'not_allowed_batch_upload';
  END IF;

  -- Validate array size (max 100 per batch for safety)
  IF jsonb_array_length(p_moments) > 100 THEN
    RAISE EXCEPTION 'batch_too_large';
  END IF;

  -- Pro photographer mode always publishes immediately
  v_status := 'published';

  -- Insert all moments
  FOR v_moment_record IN SELECT * FROM jsonb_array_elements(p_moments)
  LOOP
    v_content_type := v_moment_record->>'content_type';
    v_media_url := v_moment_record->>'media_url';
    v_text_content := v_moment_record->>'text_content';
    v_batch_id := NULLIF(v_moment_record->>'batch_id', '')::uuid;

    -- Validate content type
    IF v_content_type NOT IN ('photo', 'video', 'text') THEN
      RAISE EXCEPTION 'invalid_content_type';
    END IF;

    -- Validate content based on type
    IF v_content_type IN ('photo', 'video') AND v_media_url IS NULL THEN
      RAISE EXCEPTION 'media_url_required';
    END IF;

    INSERT INTO moments (
      event_id,
      user_id,
      content_type,
      media_url,
      text_content,
      status,
      batch_id
    )
    VALUES (
      p_event_id,
      v_uid,
      v_content_type,
      v_media_url,
      v_text_content,
      v_status,
      v_batch_id
    )
    RETURNING id INTO v_moment_id;

    v_inserted_ids := array_append(v_inserted_ids, v_moment_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'count', v_count,
    'moment_ids', to_jsonb(v_inserted_ids),
    'status', v_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_moments_batch(uuid, jsonb) TO authenticated;

-- ============================================
-- HELPER: GET BATCH MOMENTS
-- ============================================

-- Get all moments from a specific batch (for upload status tracking)
CREATE OR REPLACE FUNCTION get_batch_moments(p_batch_id uuid)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  content_type text,
  media_url text,
  text_content text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.event_id,
    m.content_type,
    m.media_url,
    m.text_content,
    m.status,
    m.created_at
  FROM moments m
  WHERE m.batch_id = p_batch_id
    AND m.user_id = auth.uid()
  ORDER BY m.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_batch_moments(uuid) TO authenticated;
