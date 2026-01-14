-- Add latitude and longitude columns to events table for map view
-- Migration: 20260114_001_add_event_coordinates.sql

ALTER TABLE events
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add index for geospatial queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_events_coordinates ON events (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN events.latitude IS 'Latitude coordinate for map display';
COMMENT ON COLUMN events.longitude IS 'Longitude coordinate for map display';
