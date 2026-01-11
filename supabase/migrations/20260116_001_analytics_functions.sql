-- Analytics Functions for Admin Dashboard
-- Server-side aggregations for efficient chart rendering

-- ============================================
-- User Growth Analytics
-- ============================================

-- User registrations over last N days
CREATE OR REPLACE FUNCTION get_user_growth(days_back int DEFAULT 30)
RETURNS TABLE (date date, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', created_at)::date as date,
    count(*) as count
  FROM profiles
  WHERE created_at >= now() - (days_back || ' days')::interval
  GROUP BY date_trunc('day', created_at)
  ORDER BY date;
$$;

-- Role distribution
CREATE OR REPLACE FUNCTION get_role_distribution()
RETURNS TABLE (role text, count bigint, percentage numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH role_counts AS (
    SELECT role, count(*) as cnt
    FROM profiles
    GROUP BY role
  ),
  total AS (
    SELECT sum(cnt) as total FROM role_counts
  )
  SELECT
    rc.role,
    rc.cnt as count,
    round((rc.cnt::numeric / t.total) * 100, 1) as percentage
  FROM role_counts rc, total t
  ORDER BY rc.cnt DESC;
$$;

-- ============================================
-- Event Analytics
-- ============================================

-- Event creation/publishing over last N days
CREATE OR REPLACE FUNCTION get_event_activity(days_back int DEFAULT 30)
RETURNS TABLE (date date, created bigint, published bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', created_at)::date as date,
    count(*) as created,
    count(*) FILTER (WHERE status = 'published') as published
  FROM events
  WHERE created_at >= now() - (days_back || ' days')::interval
  GROUP BY date_trunc('day', created_at)
  ORDER BY date;
$$;

-- Event status distribution
CREATE OR REPLACE FUNCTION get_event_status_distribution()
RETURNS TABLE (status text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status, count(*)
  FROM events
  GROUP BY status
  ORDER BY count DESC;
$$;

-- ============================================
-- RSVP Analytics
-- ============================================

-- RSVP trends over last N days
CREATE OR REPLACE FUNCTION get_rsvp_trends(days_back int DEFAULT 30)
RETURNS TABLE (date date, going bigint, waitlist bigint, interested bigint, cancelled bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', created_at)::date as date,
    count(*) FILTER (WHERE status = 'going') as going,
    count(*) FILTER (WHERE status = 'waitlist') as waitlist,
    count(*) FILTER (WHERE status = 'interested') as interested,
    count(*) FILTER (WHERE status = 'cancelled') as cancelled
  FROM rsvps
  WHERE created_at >= now() - (days_back || ' days')::interval
  GROUP BY date_trunc('day', created_at)
  ORDER BY date;
$$;

-- RSVP status totals
CREATE OR REPLACE FUNCTION get_rsvp_totals()
RETURNS TABLE (status text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status, count(*)
  FROM rsvps
  GROUP BY status
  ORDER BY count DESC;
$$;

-- ============================================
-- Organizer Analytics
-- ============================================

-- Organizer verification stats
CREATE OR REPLACE FUNCTION get_organizer_stats()
RETURNS TABLE (
  total_organizers bigint,
  verified_count bigint,
  unverified_count bigint,
  by_type json
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) as total_organizers,
    count(*) FILTER (WHERE is_verified) as verified_count,
    count(*) FILTER (WHERE NOT is_verified) as unverified_count,
    (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT organizer_type, count(*) as count
        FROM organizers
        GROUP BY organizer_type
        ORDER BY count DESC
      ) t
    ) as by_type
  FROM organizers;
$$;

-- ============================================
-- Extraction Analytics
-- ============================================

-- AI extraction stats
CREATE OR REPLACE FUNCTION get_extraction_stats()
RETURNS TABLE (
  total_extractions bigint,
  total_extracted bigint,
  total_published bigint,
  total_skipped bigint,
  success_rate numeric,
  by_status json
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) as total_extractions,
    coalesce(sum(extracted_count), 0) as total_extracted,
    coalesce(sum(published_count), 0) as total_published,
    coalesce(sum(skipped_count), 0) as total_skipped,
    CASE
      WHEN sum(extracted_count) > 0
      THEN round((sum(published_count)::numeric / sum(extracted_count)) * 100, 1)
      ELSE 0
    END as success_rate,
    (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT status, count(*) as count
        FROM extraction_logs
        GROUP BY status
      ) t
    ) as by_status
  FROM extraction_logs;
$$;

-- ============================================
-- Festival Analytics
-- ============================================

-- Festival stats
CREATE OR REPLACE FUNCTION get_festival_stats()
RETURNS TABLE (
  total_festivals bigint,
  active_festivals bigint,
  upcoming_festivals bigint,
  total_official_events bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) as total_festivals,
    count(*) FILTER (
      WHERE status = 'published'
      AND start_date <= current_date
      AND end_date >= current_date
    ) as active_festivals,
    count(*) FILTER (
      WHERE status = 'published'
      AND start_date > current_date
    ) as upcoming_festivals,
    (
      SELECT count(*)
      FROM festival_events
      WHERE event_type = 'official_program'
    ) as total_official_events
  FROM festivals;
$$;

-- ============================================
-- Verification Queue Analytics
-- ============================================

-- Pending verification requests count
CREATE OR REPLACE FUNCTION get_verification_queue_stats()
RETURNS TABLE (
  pending_count bigint,
  approved_count bigint,
  rejected_count bigint,
  more_info_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) FILTER (WHERE status = 'pending') as pending_count,
    count(*) FILTER (WHERE status = 'approved') as approved_count,
    count(*) FILTER (WHERE status = 'rejected') as rejected_count,
    count(*) FILTER (WHERE status = 'more_info_needed') as more_info_count
  FROM verification_requests;
$$;

-- ============================================
-- Notification Analytics
-- ============================================

-- Push notification adoption
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE (
  users_with_push bigint,
  total_users bigint,
  adoption_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(DISTINCT user_id) FROM push_subscriptions) as users_with_push,
    (SELECT count(*) FROM profiles) as total_users,
    CASE
      WHEN (SELECT count(*) FROM profiles) > 0
      THEN round(
        ((SELECT count(DISTINCT user_id) FROM push_subscriptions)::numeric /
         (SELECT count(*) FROM profiles)) * 100, 1
      )
      ELSE 0
    END as adoption_rate;
$$;

-- ============================================
-- Combined Dashboard Stats
-- ============================================

-- Single function to get all dashboard stats in one call
CREATE OR REPLACE FUNCTION get_dashboard_overview()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Only admins/moderators can view dashboard stats
  IF NOT has_role_level('moderator') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  SELECT json_build_object(
    'users', json_build_object(
      'total', (SELECT count(*) FROM profiles),
      'new_today', (SELECT count(*) FROM profiles WHERE created_at >= current_date),
      'new_this_week', (SELECT count(*) FROM profiles WHERE created_at >= current_date - 7)
    ),
    'events', json_build_object(
      'total', (SELECT count(*) FROM events),
      'published', (SELECT count(*) FROM events WHERE status = 'published'),
      'draft', (SELECT count(*) FROM events WHERE status = 'draft')
    ),
    'rsvps', json_build_object(
      'total', (SELECT count(*) FROM rsvps),
      'going', (SELECT count(*) FROM rsvps WHERE status = 'going'),
      'interested', (SELECT count(*) FROM rsvps WHERE status = 'interested')
    ),
    'organizers', json_build_object(
      'total', (SELECT count(*) FROM organizers),
      'verified', (SELECT count(*) FROM organizers WHERE is_verified)
    ),
    'festivals', json_build_object(
      'total', (SELECT count(*) FROM festivals),
      'active', (SELECT count(*) FROM festivals WHERE status = 'published' AND start_date <= current_date AND end_date >= current_date)
    ),
    'verification_queue', json_build_object(
      'pending', (SELECT count(*) FROM verification_requests WHERE status = 'pending')
    ),
    'notifications', json_build_object(
      'users_with_push', (SELECT count(DISTINCT user_id) FROM push_subscriptions)
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_growth(int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_activity(int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_status_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION get_rsvp_trends(int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rsvp_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION get_organizer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_extraction_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_festival_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_verification_queue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_overview() TO authenticated;
