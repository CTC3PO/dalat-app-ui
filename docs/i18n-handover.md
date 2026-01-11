# Internationalization (i18n) Handover Document

## Overview

Full app localization has been implemented for dalat.app, supporting three languages:
- **English (en)** - Default
- **French (fr)**
- **Vietnamese (vi)**

The implementation uses **next-intl** for its native Next.js App Router support, Server Components compatibility, and TypeScript type-safety.

---

## Architecture

### Key Files

| File | Purpose |
|------|---------|
| `lib/i18n/config.ts` | Locale types and configuration |
| `lib/i18n/get-locale.ts` | Server-side locale detection from user profile |
| `lib/i18n/request.ts` | next-intl request configuration |
| `messages/en.json` | English translations (~130 keys) |
| `messages/fr.json` | French translations |
| `messages/vi.json` | Vietnamese translations |

### How It Works

1. **Locale Detection**: User's preferred locale is stored in `profiles.locale` column
2. **Server Components**: Use `getTranslations()` from `next-intl/server`
3. **Client Components**: Use `useTranslations()` hook
4. **Layout Integration**: `app/layout.tsx` wraps app with `NextIntlClientProvider`

---

## Translation Structure

```json
{
  "common": { "back", "save", "cancel", "loading" },
  "nav": { "events", "settings", "signIn", "signOut" },
  "auth": { "welcomeTitle", "signInDescription", "continueWithGoogle" },
  "home": { "title", "subtitle", "noEvents", "footer" },
  "events": { "going", "interested", "waitlist", "full", "viewOnMap" },
  "rsvp": { "imGoing", "joinWaitlist", "cancelRsvp", "waitlistPosition" },
  "eventForm": { "title", "description", "date", "time", "location", ... },
  "profile": { "editProfile", "username", "displayName", "bio", ... },
  "settings": { "notifications", "appearance", "language" },
  "notifications": { "enable", "enabled", "blocked", "unavailable" },
  "userMenu": { "editProfile", "settings", "theme", "signOut" },
  "calendar": { "addToCalendar", "googleCalendar", "appleOutlook" },
  "eventActions": { "editEvent", "deleteEvent", "deleteConfirm" },
  "attendees": { "whosGoing", "waitlist", "interested" },
  "admin": { "dashboard", "organizers", "aiExtract" },
  "extraction": { "title", "description", "eventsExtracted" },
  "empty": { "noEventsYet", "beFirstToCreate" }
}
```

---

## Usage Examples

### Server Component
```tsx
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("home");
  return <h1>{t("title")}</h1>;
}
```

### Client Component
```tsx
"use client";
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("events");
  return <span>{t("going")}</span>;
}
```

### With Variables (ICU Format)
```tsx
// Translation: "You're #{position} on the waitlist"
t("waitlistPosition", { position: 3 })

// Translation: "Who's going ({count})"
t("whosGoing", { count: 12 })
```

---

## Menu Structure Change

The settings menu was restructured:

| Before | After |
|--------|-------|
| `/settings` → Profile + Settings combined | `/settings/profile` → Profile editing only |
| | `/settings` → App settings (notifications, appearance, language) |

Navigation tabs in `components/settings/settings-tabs.tsx` handle switching between them.

---

## Completed Translations

### Priority 1 - Core Navigation ✅
- `components/user-menu.tsx`
- `components/events/event-card.tsx`
- `components/events/rsvp-button.tsx`
- `app/page.tsx`

### Priority 2 - Event Details ✅
- `app/events/[slug]/page.tsx`
- `components/events/event-form.tsx`
- `components/events/attendee-list.tsx`
- `components/events/add-to-calendar.tsx`
- `components/events/event-actions.tsx`

### Priority 3 - Auth & Profile ✅
- `components/login-form.tsx`
- `components/auth/oauth-buttons.tsx`
- `components/auth-button.tsx`
- `components/profile/profile-edit-form.tsx`
- `components/profile/avatar-upload.tsx`

### Priority 4 - Settings ✅
- `app/settings/page.tsx`
- `components/settings/notification-settings.tsx`
- `components/settings/theme-selector.tsx`
- `components/settings/language-selector.tsx`

---

## Remaining Work

### Priority 5 - Admin (Not Critical)
- `app/admin/page.tsx` - Dashboard strings
- `app/admin/extract/page.tsx` - Extraction UI
- Festival and verification pages (WIP features)

### Notification Migration
`lib/novu.ts` still has inline translations for notification content. Consider migrating to use shared translation files for consistency.

### Testing
- Manual testing of all three languages needed
- Verify no hardcoded English strings remain in translated components

---

## Adding New Translations

1. Add key to `messages/en.json` in appropriate namespace
2. Add corresponding translations to `messages/fr.json` and `messages/vi.json`
3. Use in component:
   - Server: `const t = await getTranslations("namespace")`
   - Client: `const t = useTranslations("namespace")`

---

## Language Selection Flow

1. User clicks language in Settings or User Menu
2. `LanguageSelector` component updates `profiles.locale` in Supabase
3. `router.refresh()` triggers page reload
4. `lib/i18n/get-locale.ts` reads new locale from profile
5. App renders with new language

---

## Known Issues

1. **Festival pages**: Some hardcoded strings remain (WIP feature)
2. **Admin pages**: Not translated (admin-only, low priority)
3. **useEffect warnings**: Some components may show ESLint warnings about `t` in dependency arrays - this is expected behavior with next-intl

---

## Dependencies

```json
{
  "next-intl": "^4.1.0"
}
```

Configuration in `next.config.ts`:
```ts
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");
export default withNextIntl(nextConfig);
```
