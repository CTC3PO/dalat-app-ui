-- ============================================================
-- TRIBES V2: Enhanced Membership System
-- ============================================================

-- 1. ENHANCE TRIBES TABLE
ALTER TABLE tribes
  ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'public'
    CHECK (access_type IN ('public', 'request', 'invite_only', 'secret')),
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_code_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substr(md5(random()::text), 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Auto-generate invite code for private tribes
CREATE OR REPLACE FUNCTION set_tribe_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_type IN ('invite_only', 'secret') AND NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  IF NEW.access_type = 'secret' THEN
    NEW.is_listed := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tribes_set_invite_code ON tribes;
CREATE TRIGGER tribes_set_invite_code
  BEFORE INSERT OR UPDATE ON tribes
  FOR EACH ROW EXECUTE FUNCTION set_tribe_invite_code();


-- 2. CREATE TRIBE_MEMBERS (replaces tribe_follows)
CREATE TABLE IF NOT EXISTS tribe_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'leader')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  show_on_profile BOOLEAN DEFAULT true,
  UNIQUE(tribe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tribe_members_tribe ON tribe_members(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_members_user ON tribe_members(user_id);

-- Migrate existing data from tribe_follows if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tribe_follows') THEN
    INSERT INTO tribe_members (tribe_id, user_id, role, joined_at)
    SELECT tribe_id, user_id, 'member', created_at
    FROM tribe_follows
    ON CONFLICT DO NOTHING;

    -- Drop old table after migration
    DROP TABLE tribe_follows;
  END IF;
END $$;


-- 3. JOIN REQUESTS
CREATE TABLE IF NOT EXISTS tribe_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(tribe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tribe_requests_tribe_status ON tribe_requests(tribe_id, status);
CREATE INDEX IF NOT EXISTS idx_tribe_requests_user_status ON tribe_requests(user_id, status);


-- 4. EVENTS ENHANCEMENT
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS tribe_visibility TEXT DEFAULT 'members_only'
    CHECK (tribe_visibility IN ('public', 'members_only'));


-- 5. RLS POLICIES

-- Enable RLS
ALTER TABLE tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies on tribes (tribe_follows table may not exist, skip those)
DROP POLICY IF EXISTS "tribes_select_public" ON tribes;
DROP POLICY IF EXISTS "tribes_select_visible" ON tribes;
DROP POLICY IF EXISTS "tribe_members_select" ON tribe_members;
DROP POLICY IF EXISTS "tribe_members_insert" ON tribe_members;
DROP POLICY IF EXISTS "tribe_members_update" ON tribe_members;
DROP POLICY IF EXISTS "tribe_members_delete" ON tribe_members;
DROP POLICY IF EXISTS "tribe_requests_select" ON tribe_requests;
DROP POLICY IF EXISTS "tribe_requests_insert" ON tribe_requests;
DROP POLICY IF EXISTS "tribe_requests_update" ON tribe_requests;

-- TRIBES visibility
CREATE POLICY "tribes_select_visible" ON tribes FOR SELECT USING (
  access_type IN ('public', 'request')
  OR access_type = 'invite_only'
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tribe_members
    WHERE tribe_members.tribe_id = tribes.id
    AND tribe_members.user_id = auth.uid()
    AND tribe_members.status = 'active'
  )
);

-- TRIBE_MEMBERS policies
CREATE POLICY "tribe_members_select" ON tribe_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tribe_members tm
    WHERE tm.tribe_id = tribe_members.tribe_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM tribes
    WHERE tribes.id = tribe_members.tribe_id
    AND tribes.created_by = auth.uid()
  )
);

CREATE POLICY "tribe_members_insert" ON tribe_members FOR INSERT WITH CHECK (
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM tribes WHERE id = tribe_id AND access_type = 'public'
  ))
  OR EXISTS (
    SELECT 1 FROM tribe_members tm
    WHERE tm.tribe_id = tribe_members.tribe_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('leader', 'admin')
    AND tm.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM tribes
    WHERE tribes.id = tribe_id
    AND tribes.created_by = auth.uid()
  )
);

CREATE POLICY "tribe_members_update" ON tribe_members FOR UPDATE USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tribe_members tm
    WHERE tm.tribe_id = tribe_members.tribe_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('leader', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM tribes
    WHERE tribes.id = tribe_id
    AND tribes.created_by = auth.uid()
  )
);

CREATE POLICY "tribe_members_delete" ON tribe_members FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tribe_members tm
    WHERE tm.tribe_id = tribe_members.tribe_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('leader', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM tribes
    WHERE tribes.id = tribe_id
    AND tribes.created_by = auth.uid()
  )
);

-- TRIBE_REQUESTS policies
CREATE POLICY "tribe_requests_select" ON tribe_requests FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tribe_members tm
    WHERE tm.tribe_id = tribe_requests.tribe_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('leader', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM tribes
    WHERE tribes.id = tribe_id
    AND tribes.created_by = auth.uid()
  )
);

CREATE POLICY "tribe_requests_insert" ON tribe_requests FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM tribes WHERE id = tribe_id AND access_type = 'request')
);

CREATE POLICY "tribe_requests_update" ON tribe_requests FOR UPDATE USING (
  (user_id = auth.uid() AND status = 'pending')  -- Users can cancel their own pending requests
  OR EXISTS (
    SELECT 1 FROM tribe_members tm
    WHERE tm.tribe_id = tribe_requests.tribe_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('leader', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM tribes
    WHERE tribes.id = tribe_id
    AND tribes.created_by = auth.uid()
  )
);


-- 6. HELPER FUNCTIONS

CREATE OR REPLACE FUNCTION is_tribe_member(p_tribe_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tribe_members
    WHERE tribe_id = p_tribe_id
    AND user_id = p_user_id
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_tribe_admin(p_tribe_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tribe_members
    WHERE tribe_id = p_tribe_id
    AND user_id = p_user_id
    AND role IN ('leader', 'admin')
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM tribes
    WHERE id = p_tribe_id
    AND created_by = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_tribe_banned(p_tribe_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tribe_members
    WHERE tribe_id = p_tribe_id
    AND user_id = p_user_id
    AND status = 'banned'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_tribe_by_code(p_code TEXT)
RETURNS SETOF tribes AS $$
  SELECT * FROM tribes
  WHERE invite_code = upper(p_code)
  AND (invite_code_expires_at IS NULL OR invite_code_expires_at > now());
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION regenerate_tribe_invite_code(p_tribe_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := generate_invite_code();
  UPDATE tribes SET invite_code = new_code WHERE id = p_tribe_id;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 7. UPDATE EVENTS RLS
DROP POLICY IF EXISTS "events_select_published_or_owner" ON events;
DROP POLICY IF EXISTS "events_select_visible" ON events;
CREATE POLICY "events_select_visible" ON events FOR SELECT USING (
  (status = 'published' AND (tribe_id IS NULL OR tribe_visibility = 'public'))
  OR (status = 'published' AND tribe_id IS NOT NULL AND is_tribe_member(tribe_id))
  OR auth.uid() = created_by
);
