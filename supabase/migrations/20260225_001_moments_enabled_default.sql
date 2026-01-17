-- Change moments_enabled default from false to true
-- Events without explicit settings will now allow anyone to post moments by default

-- Update the column default for new rows
ALTER TABLE event_settings
ALTER COLUMN moments_enabled SET DEFAULT true;

-- Update the can_post_moment function to handle no-settings case as enabled
CREATE OR REPLACE FUNCTION can_post_moment(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_who_can_post text;
  v_moments_enabled boolean;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  -- Get event settings
  SELECT moments_enabled, moments_who_can_post
  INTO v_moments_enabled, v_who_can_post
  FROM event_settings
  WHERE event_id = p_event_id;

  -- If no settings exist, default to 'anyone' can post (moments enabled by default)
  IF NOT FOUND THEN
    v_moments_enabled := true;
    v_who_can_post := 'anyone';
  END IF;

  -- If moments_enabled is explicitly false, only creator can post
  IF NOT v_moments_enabled THEN
    RETURN EXISTS (SELECT 1 FROM events WHERE id = p_event_id AND created_by = v_uid);
  END IF;

  -- Check permission based on who_can_post setting (defaults to 'anyone')
  CASE COALESCE(v_who_can_post, 'anyone')
    WHEN 'anyone' THEN
      RETURN true;
    WHEN 'rsvp' THEN
      RETURN EXISTS (
        SELECT 1 FROM rsvps
        WHERE event_id = p_event_id
        AND user_id = v_uid
        AND status IN ('going', 'waitlist', 'interested')
      );
    WHEN 'confirmed' THEN
      RETURN EXISTS (
        SELECT 1 FROM rsvps
        WHERE event_id = p_event_id
        AND user_id = v_uid
        AND status = 'going'
      );
    ELSE
      RETURN false;
  END CASE;
END;
$$;
