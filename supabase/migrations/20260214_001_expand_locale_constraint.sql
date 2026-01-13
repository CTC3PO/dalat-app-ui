-- Expand locale constraint from 3 to 12 locales (The Global Twelve)
-- This aligns the profile locale field with our content locale support

-- Drop the old constraint and add the expanded one
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_locale_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_locale_check
CHECK (locale IN ('en', 'vi', 'ko', 'zh', 'ru', 'fr', 'ja', 'ms', 'th', 'de', 'es', 'id'));

COMMENT ON COLUMN profiles.locale IS 'User language preference - The Global Twelve: en, vi, ko, zh, ru, fr, ja, ms, th, de, es, id';
