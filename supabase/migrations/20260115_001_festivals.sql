-- Festivals Table
-- A festival is a "container" for multiple program events
-- Only verified organizers or admins can create festivals

CREATE TABLE festivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,

  -- Basic info
  title text NOT NULL,
  subtitle text,                    -- e.g., "Mùa Hoa 2026" or "Season 15"
  description text,                 -- Rich text description

  -- Date range
  start_date date NOT NULL,
  end_date date NOT NULL,
  CHECK (end_date >= start_date),

  -- Media
  cover_image_url text,             -- Hero image for festival hub
  logo_url text,                    -- Festival-specific logo if different from organizer

  -- Location (defaults to Đà Lạt)
  location_city text DEFAULT 'Đà Lạt',
  location_description text,        -- e.g., "Across 12 wards of Đà Lạt"

  -- Sources and links
  sources text[] DEFAULT '{}',      -- Official announcement URLs
  website_url text,
  facebook_url text,
  hashtags text[] DEFAULT '{}',     -- e.g., ['#DaLatFlowerFestival', '#DaLat2026']

  -- Status
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_featured boolean DEFAULT false, -- Show in featured section

  -- Ownership and creation
  created_by uuid NOT NULL REFERENCES profiles,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_festivals_slug ON festivals(slug);
CREATE INDEX idx_festivals_status ON festivals(status) WHERE status = 'published';
CREATE INDEX idx_festivals_dates ON festivals(start_date, end_date);
CREATE INDEX idx_festivals_featured ON festivals(is_featured) WHERE is_featured = true;
CREATE INDEX idx_festivals_created_by ON festivals(created_by);

-- Updated_at trigger
CREATE TRIGGER festivals_updated_at BEFORE UPDATE ON festivals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Festival Organizers (many-to-many)
-- ============================================

CREATE TABLE festival_organizers (
  festival_id uuid NOT NULL REFERENCES festivals ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES organizers ON DELETE CASCADE,
  role text DEFAULT 'organizer'
    CHECK (role IN ('lead', 'organizer', 'sponsor', 'partner', 'supporter')),
  sort_order int DEFAULT 0,
  PRIMARY KEY (festival_id, organizer_id)
);

CREATE INDEX idx_festival_organizers_festival ON festival_organizers(festival_id);
CREATE INDEX idx_festival_organizers_organizer ON festival_organizers(organizer_id);

-- ============================================
-- Festival Events (link events to festivals)
-- ============================================

CREATE TABLE festival_events (
  festival_id uuid NOT NULL REFERENCES festivals ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events ON DELETE CASCADE,

  -- Type of event within festival
  event_type text NOT NULL DEFAULT 'official_program'
    CHECK (event_type IN (
      'official_program',       -- Official festival program event
      'community_side_event',   -- Community-organized related event
      'announcement_only'       -- Announced but no confirmed time yet
    )),

  -- Display settings
  is_highlighted boolean DEFAULT false,  -- Featured within festival
  sort_order int DEFAULT 0,              -- Manual ordering

  -- Metadata
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES profiles,

  PRIMARY KEY (festival_id, event_id)
);

CREATE INDEX idx_festival_events_festival ON festival_events(festival_id);
CREATE INDEX idx_festival_events_event ON festival_events(event_id);
CREATE INDEX idx_festival_events_type ON festival_events(event_type);

-- ============================================
-- Festival Updates (announcement feed)
-- ============================================

CREATE TABLE festival_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id uuid NOT NULL REFERENCES festivals ON DELETE CASCADE,

  -- Content
  title text NOT NULL,
  body text,                        -- Rich text content
  image_urls text[] DEFAULT '{}',   -- Multiple images allowed
  source_url text,                  -- Link to original announcement

  -- Type
  update_type text DEFAULT 'announcement'
    CHECK (update_type IN ('announcement', 'schedule_change', 'highlight', 'reminder')),

  -- Status
  is_pinned boolean DEFAULT false,

  -- Ownership
  created_by uuid NOT NULL REFERENCES profiles,
  posted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_festival_updates_festival ON festival_updates(festival_id);
CREATE INDEX idx_festival_updates_posted ON festival_updates(posted_at DESC);
CREATE INDEX idx_festival_updates_pinned ON festival_updates(is_pinned) WHERE is_pinned = true;

CREATE TRIGGER festival_updates_updated_at BEFORE UPDATE ON festival_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_updates ENABLE ROW LEVEL SECURITY;

-- FESTIVALS --

-- Anyone can view published festivals
CREATE POLICY "festivals_select_published"
ON festivals FOR SELECT
USING (status = 'published');

-- Creators can view their own drafts
CREATE POLICY "festivals_select_own"
ON festivals FOR SELECT
USING (created_by = auth.uid());

-- Admins/moderators can view all
CREATE POLICY "festivals_select_admin"
ON festivals FOR SELECT
USING (has_role_level('moderator'));

-- Only verified organizers and admins can create festivals
CREATE POLICY "festivals_insert_verified"
ON festivals FOR INSERT
WITH CHECK (
  has_role_level('organizer_verified')
  AND created_by = auth.uid()
);

-- Creators or admins can update
CREATE POLICY "festivals_update_own"
ON festivals FOR UPDATE
USING (created_by = auth.uid() OR has_role('admin'))
WITH CHECK (created_by = auth.uid() OR has_role('admin'));

-- Only admins can delete
CREATE POLICY "festivals_delete_admin"
ON festivals FOR DELETE
USING (has_role('admin'));

-- FESTIVAL_ORGANIZERS --

-- Anyone can view (follows festival visibility)
CREATE POLICY "festival_organizers_select"
ON festival_organizers FOR SELECT
USING (true);

-- Verified organizers can manage for their festivals
CREATE POLICY "festival_organizers_insert"
ON festival_organizers FOR INSERT
WITH CHECK (
  has_role_level('organizer_verified')
  AND EXISTS (
    SELECT 1 FROM festivals
    WHERE id = festival_id
    AND (created_by = auth.uid() OR has_role('admin'))
  )
);

CREATE POLICY "festival_organizers_delete"
ON festival_organizers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM festivals
    WHERE id = festival_id
    AND (created_by = auth.uid() OR has_role('admin'))
  )
);

-- FESTIVAL_EVENTS --

-- Anyone can view (follows festival visibility)
CREATE POLICY "festival_events_select"
ON festival_events FOR SELECT
USING (true);

-- Verified organizers can link events to their festivals
CREATE POLICY "festival_events_insert"
ON festival_events FOR INSERT
WITH CHECK (
  has_role_level('organizer_verified')
  AND EXISTS (
    SELECT 1 FROM festivals
    WHERE id = festival_id
    AND (created_by = auth.uid() OR has_role('admin'))
  )
);

CREATE POLICY "festival_events_update"
ON festival_events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM festivals
    WHERE id = festival_id
    AND (created_by = auth.uid() OR has_role('admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM festivals
    WHERE id = festival_id
    AND (created_by = auth.uid() OR has_role('admin'))
  )
);

CREATE POLICY "festival_events_delete"
ON festival_events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM festivals
    WHERE id = festival_id
    AND (created_by = auth.uid() OR has_role('admin'))
  )
);

-- FESTIVAL_UPDATES --

-- Anyone can view
CREATE POLICY "festival_updates_select"
ON festival_updates FOR SELECT
USING (true);

-- Verified organizers can post updates to their festivals
CREATE POLICY "festival_updates_insert"
ON festival_updates FOR INSERT
WITH CHECK (
  has_role_level('organizer_verified')
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM festivals
    WHERE id = festival_id
    AND (created_by = auth.uid() OR has_role('admin'))
  )
);

CREATE POLICY "festival_updates_update_own"
ON festival_updates FOR UPDATE
USING (created_by = auth.uid() OR has_role('admin'))
WITH CHECK (created_by = auth.uid() OR has_role('admin'));

CREATE POLICY "festival_updates_delete"
ON festival_updates FOR DELETE
USING (created_by = auth.uid() OR has_role('admin'));

-- ============================================
-- STORAGE BUCKET for Festival Media
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'festival-media',
  'festival-media',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Verified organizers can upload festival media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'festival-media'
  AND has_role_level('organizer_verified')
);

CREATE POLICY "Anyone can view festival media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'festival-media');

CREATE POLICY "Verified organizers can update festival media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'festival-media'
  AND has_role_level('organizer_verified')
);

CREATE POLICY "Admins can delete festival media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'festival-media'
  AND has_role('admin')
);
