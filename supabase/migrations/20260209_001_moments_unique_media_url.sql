-- Prevent duplicate moments by adding unique constraint on media_url
-- This prevents the same file from being inserted multiple times

-- First, delete any remaining duplicates (keep the oldest)
DELETE FROM moments a
USING moments b
WHERE a.media_url = b.media_url
  AND a.media_url IS NOT NULL
  AND a.created_at > b.created_at;

-- Add unique constraint on media_url (only for non-null values)
-- This allows multiple text-only moments (where media_url is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_moments_media_url_unique
ON moments(media_url)
WHERE media_url IS NOT NULL;
