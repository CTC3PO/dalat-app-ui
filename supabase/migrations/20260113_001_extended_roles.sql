-- Extended User Roles System
-- New hierarchy: admin > moderator > organizer_verified > organizer_pending > contributor > user
--
-- Role descriptions:
-- - admin (100): Full platform access, can verify organizers, manage all content
-- - moderator (80): Can moderate content and users, view all data
-- - organizer_verified (60): Verified official organizers, can create festivals + official events
-- - organizer_pending (50): Submitted verification request, awaiting approval
-- - contributor (40): Can submit events via AI extraction
-- - user (10): Default role, basic access

-- ============================================
-- STEP 1: Update role constraint on profiles
-- ============================================

-- Drop existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with all roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'moderator', 'organizer_verified', 'organizer_pending', 'contributor'));

-- Update index to cover all privileged roles
DROP INDEX IF EXISTS idx_profiles_role;
CREATE INDEX idx_profiles_role ON profiles(role)
  WHERE role IN ('admin', 'moderator', 'organizer_verified', 'organizer_pending', 'contributor');

-- Update column comment
COMMENT ON COLUMN profiles.role IS 'User role hierarchy: admin (100), moderator (80), organizer_verified (60), organizer_pending (50), contributor (40), user (10)';

-- ============================================
-- STEP 2: Role hierarchy helper functions
-- ============================================

-- Get numeric level for a role (higher = more permissions)
CREATE OR REPLACE FUNCTION get_role_level(p_role text)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_role
    WHEN 'admin' THEN 100
    WHEN 'moderator' THEN 80
    WHEN 'organizer_verified' THEN 60
    WHEN 'organizer_pending' THEN 50
    WHEN 'contributor' THEN 40
    WHEN 'user' THEN 10
    ELSE 0
  END;
$$;

-- Check if current user has at least a given role level
CREATE OR REPLACE FUNCTION has_role_level(required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND get_role_level(role) >= get_role_level(required_role)
  );
$$;

-- Check if current user has a specific role
CREATE OR REPLACE FUNCTION has_role(check_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = check_role
  );
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_role_level(text) TO authenticated;
GRANT EXECUTE ON FUNCTION has_role_level(text) TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;

-- ============================================
-- STEP 3: Add organizer_type to organizers table
-- ============================================

-- Add organizer type for categorization (ward, city, venue, cultural_org, committee, business)
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS organizer_type text DEFAULT 'venue'
  CHECK (organizer_type IN ('ward', 'city', 'venue', 'cultural_org', 'committee', 'business', 'other'));

-- Add contact fields for official organizers
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS zalo_url text;

-- Index for organizer type queries
CREATE INDEX IF NOT EXISTS idx_organizers_type ON organizers(organizer_type);

COMMENT ON COLUMN organizers.organizer_type IS 'Type: ward (phường), city (thành phố), venue, cultural_org, committee, business, other';
