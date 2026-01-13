# Handover: AI Extract Feature Removal

**Date:** 2026-01-13
**Task:** Complete removal of the AI Extract feature from dalat.app
**Status:** Code removal complete, database cleanup pending

---

## Background

The user requested removal of the "AI Extract" feature - a feature that allowed uploading event posters/images and using Claude Vision API to automatically extract event details (title, date, location, etc.) from them. The user described this as "scope creep" and "over-engineering" that added maintenance burden without sufficient value.

---

## What Was Removed

### 1. Core Library Files (DELETED)
- `lib/ai-extraction.ts` - Core extraction logic using Anthropic Claude Vision API
- `lib/ai-extraction.test.ts` - Unit tests for extraction functions

### 2. API Routes (DELETED)
- `app/api/extract-events/route.ts` - POST endpoint that:
  - Accepted image uploads
  - Called Claude Vision API to extract events
  - Included rate limiting
- `app/api/events/bulk/route.ts` - POST endpoint for bulk publishing extracted events

### 3. UI Pages (DELETED)
- `app/[locale]/admin/extract/page.tsx` - Admin extraction interface
- `app/[locale]/organizer/extract/page.tsx` - Organizer extraction interface

### 4. UI Components (DELETED)
- `components/admin/poster-upload.tsx` - Drag-drop image upload component
- `components/admin/event-review-card.tsx` - Card for reviewing/editing extracted events

### 5. Documentation (DELETED)
- `HANDOVER_ORGANIZERS_AI_EXTRACTION.md` - Feature handover documentation

### 6. Database Migration (DELETED)
- `supabase/migrations/20250114_001_extraction_logs.sql` - Created:
  - `extraction_logs` table
  - `extraction-uploads` storage bucket
  - Related RLS policies

### 7. Type Definitions (REMOVED from `lib/types/index.ts`)
```typescript
// REMOVED:
export interface ExtractedEventData {
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  address: string | null;
  confidence: number;
  duplicate_of?: string;
  duplicate_confidence?: number;
}

export interface ExtractionLog {
  id: string;
  user_id: string;
  image_url: string;
  organizer_id: string | null;
  extracted_count: number;
  published_count: number;
  skipped_count: number;
  raw_response: ExtractedEventData[] | null;
  status: 'pending' | 'reviewed' | 'completed';
  created_at: string;
  profiles?: Profile;
  organizers?: Organizer;
}
```

### 8. Analytics Code (REMOVED from `lib/admin/analytics.ts`)
- Removed `ExtractionStats` interface
- Removed `getExtractionStats()` function
- Removed `extractionStats` from `FullDashboardData` interface
- Removed extraction stats from `getFullDashboardData()` Promise.all

### 9. Navigation Items (REMOVED)
- **Admin layout** (`app/[locale]/admin/layout.tsx`):
  - Removed nav item `{ href: "/admin/extract", label: t("navAiExtract"), icon: Sparkles }`
  - Removed `Sparkles` import from lucide-react

- **Organizer layout** (`app/[locale]/organizer/layout.tsx`):
  - Removed nav item `{ href: "/organizer/extract", label: t("aiExtract"), icon: Sparkles }`
  - Removed `Sparkles` import

### 10. Quick Actions (REMOVED)
- **Admin dashboard** (`app/[locale]/admin/page.tsx`):
  - Removed extraction stats card (showed total extractions & success rate)
  - Removed "Extract from Poster" quick action link
  - Removed `Sparkles` import

- **Organizer dashboard** (`app/[locale]/organizer/page.tsx`):
  - Removed "Extract from Poster" quick action link
  - Removed `Sparkles` import

- **Organizer events page** (`app/[locale]/organizer/events/page.tsx`):
  - Removed extraction link from empty state
  - Changed text from "Create your first event or use AI extraction" to `{t("createFirstEvent")}`

### 11. Internationalization Keys (REMOVED from all 3 locale files)

**Removed from `messages/en.json`, `messages/vi.json`, `messages/fr.json`:**

```json
// errors section:
"extractionFailed": "..."
"publishFailed": "..."

// admin section:
"aiExtract": "..."
"aiExtractDescription": "..."
"extractFromPoster": "..."
"navAiExtract": "..."

// Entire sections removed:
"extraction": { ... }  // ~18 keys
"posterUpload": { ... }  // ~7 keys

// organizerPortal section (en.json only):
"aiExtract": "..."
"extractFromPoster": "..."
```

---

## What Was NOT Removed (Intentionally Kept)

### 1. Anthropic SDK (`@anthropic-ai/sdk`)
The SDK is still used by `app/api/enhance-text/route.ts` - a separate AI feature for enhancing text content. The package remains in `package.json`.

### 2. Documentation Files (Low Priority)
These files contain references to extraction but are just historical docs:
- `docs/handover-admin-analytics.md`
- `docs/admin-dashboard-handover.md`
- `docs/i18n-handover.md`

---

## What Still Needs To Be Done (DATABASE CLEANUP)

### 1. Drop the `extraction_logs` Table
The table still exists in the Supabase database. Run this SQL:

```sql
-- Drop the extraction_logs table
DROP TABLE IF EXISTS extraction_logs CASCADE;
```

### 2. Delete the Storage Bucket
The `extraction-uploads` storage bucket still exists. Either:
- Delete via Supabase Dashboard > Storage > extraction-uploads > Delete bucket
- Or run:
```sql
-- Delete all objects first, then the bucket
DELETE FROM storage.objects WHERE bucket_id = 'extraction-uploads';
DELETE FROM storage.buckets WHERE id = 'extraction-uploads';
```

### 3. Remove the `get_extraction_stats()` SQL Function
This function exists in the database (from `supabase/migrations/20260116_001_analytics_functions.sql`):

```sql
-- Drop the extraction stats function
DROP FUNCTION IF EXISTS get_extraction_stats();
```

### 4. Revoke Permissions (if applicable)
```sql
-- Revoke execute permission (may already fail if function dropped)
REVOKE EXECUTE ON FUNCTION get_extraction_stats() FROM authenticated;
```

---

## Verification Checklist

### Code Removal (DONE)
- [x] Build succeeds (`npm run build` passes)
- [x] No TypeScript errors
- [x] No broken imports
- [x] Navigation items removed from admin and organizer layouts
- [x] Quick actions removed from dashboards
- [x] i18n keys removed from all 3 locales (en, vi, fr)
- [x] Types removed from `lib/types/index.ts`
- [x] Analytics code cleaned in `lib/admin/analytics.ts`

### Database Cleanup (TODO)
- [ ] `extraction_logs` table dropped
- [ ] `extraction-uploads` storage bucket deleted
- [ ] `get_extraction_stats()` function dropped
- [ ] Verify no orphaned RLS policies

### Optional Cleanup
- [ ] Update/remove references in docs files
- [ ] Remove `admin.successRate` i18n key if no longer used elsewhere

---

## Files Modified (Summary)

| File | Change |
|------|--------|
| `lib/types/index.ts` | Removed 2 interfaces |
| `lib/admin/analytics.ts` | Removed extraction stats function and type |
| `app/[locale]/admin/layout.tsx` | Removed nav item, Sparkles import |
| `app/[locale]/admin/page.tsx` | Removed stats card, quick action, Sparkles import |
| `app/[locale]/organizer/layout.tsx` | Removed nav item, Sparkles import |
| `app/[locale]/organizer/page.tsx` | Removed quick action, Sparkles import |
| `app/[locale]/organizer/events/page.tsx` | Removed extraction link from empty state |
| `messages/en.json` | Removed ~30 i18n keys |
| `messages/vi.json` | Removed ~30 i18n keys |
| `messages/fr.json` | Removed ~30 i18n keys |

---

## Notes for Reviewer

1. **Linter ran after edits** - The files were auto-formatted after my edits. The changes are correct.

2. **Grid layout in admin page** - After removing the extraction stats card, the admin dashboard now shows 2 cards instead of 3 in the Festival & Organizer Stats section. The grid uses `lg:grid-cols-3` but now only has 2 items. Consider adjusting to `lg:grid-cols-2` if the asymmetry is undesirable.

3. **The `admin.successRate` i18n key** - This key was used only for extraction stats display. It may now be unused. Verify before removing.

4. **Migration file was deleted** - The migration `20250114_001_extraction_logs.sql` was deleted from the repo. If this migration was already applied to production, the database artifacts (table, bucket, policies) still exist and need manual cleanup.

---

## Commands to Run Database Cleanup

```bash
# Connect to Supabase and run these SQL commands:

-- 1. Drop the table
DROP TABLE IF EXISTS extraction_logs CASCADE;

-- 2. Drop the function
DROP FUNCTION IF EXISTS get_extraction_stats();

-- 3. Delete storage bucket (do this via Dashboard or):
DELETE FROM storage.objects WHERE bucket_id = 'extraction-uploads';
DELETE FROM storage.buckets WHERE id = 'extraction-uploads';
```

---

*End of handover document*
