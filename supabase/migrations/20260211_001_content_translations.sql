-- Content Translations Table
-- Stores translations for user-generated content (events, moments, profiles)
-- Supporting "The Global Twelve" languages: en, vi, ko, zh, ru, fr, ja, ms, th, de, es, id

-- Create content translations table
CREATE TABLE content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic reference to content
  content_type text NOT NULL CHECK (content_type IN ('event', 'moment', 'profile')),
  content_id uuid NOT NULL,

  -- Translation data
  source_locale text NOT NULL DEFAULT 'en',
  target_locale text NOT NULL CHECK (target_locale IN ('en', 'vi', 'ko', 'zh', 'ru', 'fr', 'ja', 'ms', 'th', 'de', 'es', 'id')),
  field_name text NOT NULL CHECK (field_name IN ('title', 'description', 'text_content', 'bio')),
  translated_text text NOT NULL,

  -- Metadata
  translation_status text DEFAULT 'auto' CHECK (translation_status IN ('auto', 'reviewed', 'edited')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Each content/field/locale combo should be unique
  UNIQUE (content_type, content_id, target_locale, field_name)
);

-- Indexes for fast lookup
CREATE INDEX idx_translations_content ON content_translations(content_type, content_id);
CREATE INDEX idx_translations_lookup ON content_translations(content_type, content_id, target_locale);
CREATE INDEX idx_translations_status ON content_translations(translation_status) WHERE translation_status = 'auto';

-- Auto-update timestamp trigger
CREATE TRIGGER content_translations_updated_at
  BEFORE UPDATE ON content_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add source_locale columns to source tables
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_locale text DEFAULT 'en';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS source_locale text DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_source_locale text DEFAULT 'en';

-- RLS Policies
ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;

-- Translations are publicly readable (for displaying content)
CREATE POLICY "translations_select_public"
ON content_translations FOR SELECT USING (true);

-- Content owners and admins can manage translations
CREATE POLICY "translations_insert_authenticated"
ON content_translations FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Admin/moderator check
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    OR
    -- Event owner check
    (content_type = 'event' AND EXISTS (
      SELECT 1 FROM events WHERE id = content_id AND created_by = auth.uid()
    ))
    OR
    -- Profile owner check
    (content_type = 'profile' AND content_id = auth.uid())
    OR
    -- Moment owner check
    (content_type = 'moment' AND EXISTS (
      SELECT 1 FROM moments WHERE id = content_id AND user_id = auth.uid()
    ))
  )
);

CREATE POLICY "translations_update_authenticated"
ON content_translations FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    OR
    (content_type = 'event' AND EXISTS (
      SELECT 1 FROM events WHERE id = content_id AND created_by = auth.uid()
    ))
    OR
    (content_type = 'profile' AND content_id = auth.uid())
    OR
    (content_type = 'moment' AND EXISTS (
      SELECT 1 FROM moments WHERE id = content_id AND user_id = auth.uid()
    ))
  )
);

CREATE POLICY "translations_delete_authenticated"
ON content_translations FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    OR
    (content_type = 'event' AND EXISTS (
      SELECT 1 FROM events WHERE id = content_id AND created_by = auth.uid()
    ))
    OR
    (content_type = 'profile' AND content_id = auth.uid())
    OR
    (content_type = 'moment' AND EXISTS (
      SELECT 1 FROM moments WHERE id = content_id AND user_id = auth.uid()
    ))
  )
);

-- Grant service role full access for API translation operations
COMMENT ON TABLE content_translations IS 'Stores AI-generated translations for user content in 12 languages';
