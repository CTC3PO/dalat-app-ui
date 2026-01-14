# Code Analysis: dalat.app

## Executive Summary

**dalat.app** is a modern event management platform built for Da Lat, Vietnam. It enables users to discover, create, and manage local events with features including RSVP management, waitlists, notifications, and multi-language support (English, French, Vietnamese).

---

## Technology Stack

### Core Framework & Libraries
- **Next.js 15** (App Router) - React framework with server-side rendering
- **React 19** - Latest React with Server Components
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - Component library (Radix UI primitives)

### Backend & Database
- **Supabase** - PostgreSQL database, authentication, and RLS policies
- **Supabase Auth** - OAuth and email authentication with cookie-based sessions

### Third-Party Services
- **Novu** - Multi-channel notification system (In-App, Email, SMS-ready)
- **Google Maps API** - Place autocomplete for event locations
- **date-fns & date-fns-tz** - Date/time handling with timezone support

### Development Tools
- **ESLint** - Code linting
- **Bun** - Package manager (lockfile present)

---

## Architecture Overview

### Project Structure
```
app/                    # Next.js App Router pages
├── [username]/         # User profile pages
├── api/                # API routes
│   └── notifications/  # Notification webhooks
├── auth/               # Authentication pages
├── events/             # Event listing and detail pages
├── onboarding/         # User onboarding flow
└── settings/           # User settings

components/             # React components
├── auth/               # Authentication components
├── events/             # Event-related components
├── profile/            # Profile management
├── settings/           # Settings UI
└── ui/                 # Reusable UI primitives

lib/                    # Utility libraries
├── supabase/           # Supabase client helpers
├── types/              # TypeScript type definitions
└── novu.ts             # Notification service wrapper

supabase/migrations/    # Database migrations
```

### Key Architectural Patterns

1. **Server Components by Default**: Most pages are Server Components for optimal performance
2. **Client Components When Needed**: Interactive UI (forms, buttons) marked with `"use client"`
3. **Cookie-Based Auth**: Sessions stored in HTTP-only cookies via `@supabase/ssr`
4. **Row-Level Security (RLS)**: Database-level access control via Supabase policies
5. **Database Functions**: Complex business logic (RSVP, waitlist) handled in PostgreSQL functions
6. **Middleware**: Session management via `lib/supabase/proxy.ts`

---

## Database Schema

### Core Tables

#### `profiles`
- User profiles with username, display name, bio, avatar
- Auto-created on signup via trigger
- Supports locale (en/fr/vi)
- Username is unique and required post-onboarding

#### `events`
- Event details: title, description, slug, dates, location
- Timezone handling (all times in Da Lat timezone: `Asia/Ho_Chi_Minh`)
- Capacity management (nullable for unlimited)
- Status: `draft`, `published`, `cancelled`
- Google Maps integration (URL and address)

#### `rsvps`
- RSVP status: `going`, `waitlist`, `cancelled`
- Plus ones support (guests)
- Confirmation tracking (`confirmed_at`)
- Reminder tracking (`reminder_24h_sent_at`, `reminder_2h_sent_at`)
- Unique constraint: one RSVP per user per event

#### `tribes` (Future Feature)
- Recurring event groups
- Currently defined but not fully implemented

#### `tribe_follows`
- User-following relationships for tribes
- Not yet actively used

### Key Database Functions

1. **`rsvp_event(p_event_id, p_plus_ones)`**
   - Atomic RSVP creation/update
   - Handles capacity checking and waitlist assignment
   - Uses row locking for concurrency safety
   - Returns status (going/waitlist)

2. **`cancel_rsvp(p_event_id)`**
   - Cancels user's RSVP
   - Automatically promotes next person from waitlist (FIFO)
   - Uses row locking with `SKIP LOCKED` for safe concurrent promotions

3. **`get_event_counts(p_event_id)`**
   - Public-safe count aggregation
   - Returns going_count, waitlist_count, going_spots (includes plus_ones)
   - Can be called by anonymous users

4. **`confirm_attendance(p_event_id, p_confirmed)`**
   - Handles 24h confirmation responses
   - If not confirmed, cancels RSVP

### Row-Level Security (RLS) Policies

- **Profiles**: Public read, owner write
- **Events**: Public read if published, owner can edit/delete
- **RSVPs**: Authenticated read, owner write
- **Tribes**: Public read, creator write
- **Tribe Follows**: Owner-only read/write

---

## Authentication Flow

### OAuth & Email Auth
1. User clicks login → redirects to Supabase Auth
2. After authentication → `/auth/callback` handles OAuth code exchange
3. Session created → stored in HTTP-only cookies
4. Onboarding check → if no username, redirect to `/onboarding`
5. Profile setup → user sets username (required), display name, bio
6. Session maintained → via middleware (`lib/supabase/proxy.ts`)

### Session Management
- **Server Components**: Use `createClient()` from `lib/supabase/server.ts`
- **Client Components**: Use `createClient()` from `lib/supabase/client.ts`
- **Middleware**: `lib/supabase/proxy.ts` refreshes sessions and protects routes

### Protected Routes
- Most routes are public (events, profiles)
- Event creation, settings require authentication
- Middleware checks session and redirects if needed

---

## Event Management Features

### Event Creation (`/events/new`)
- **Form Fields**: Title, description, date/time, location, capacity, chat URL
- **Location**: Google Places Autocomplete integration
- **Time Handling**: All times entered/displayed in Da Lat timezone
- **Slug Generation**: Auto-generated from title with random suffix
- **Validation**: Title, date, time required

### Event Display (`/events/[slug]`)
- **Public Access**: Anyone can view published events
- **RSVP Button**: State-aware (going/waitlist/not going)
- **Attendee List**: Shows all confirmed attendees with avatars
- **Waitlist Position**: Shows user's position if on waitlist
- **Organizer Actions**: Edit/delete for event creator
- **Add to Calendar**: iCal export support

### RSVP Logic
- **Capacity Check**: If event has capacity and is full → waitlist
- **Going Status**: User confirmed and within capacity
- **Waitlist Status**: User confirmed but over capacity (FIFO ordering)
- **Cancellation**: User can cancel → if was "going", promotes next waitlist user
- **Plus Ones**: Support for bringing guests

---

## Notification System (Novu)

### Integration Architecture
- **Server-Side Only**: Notifications triggered from API routes
- **Subscriber Management**: Users identified by Supabase user ID
- **HMAC Authentication**: Secure subscriber hash for Novu widget
- **Multi-Language**: Translations handled in code (`lib/novu.ts`)

### Notification Types

1. **RSVP Confirmation** (`rsvp`)
   - Triggered immediately after RSVP
   - Includes event details and description

2. **24h Confirmation Reminder** (`24h-re-confirmation` / `24h-reminder-scheduled`)
   - Sent 24 hours before event
   - Asks if user is still coming
   - Yes/No buttons

3. **2h Final Reminder** (`2h-reminder` / `2h-reminder-scheduled`)
   - Sent 2 hours before event
   - Includes location details
   - Links to Google Maps if available

4. **Waitlist Promotion** (`waitlist-promotion`)
   - Sent when user moves from waitlist to going
   - Includes event details
   - Schedules reminders for promoted user

5. **Organizer Notifications** (`new-rsvp-organizer`)
   - Sent to event creator when someone RSVPs
   - Shows attendee name

### Scheduled Reminders
- Reminders scheduled using Novu's delay feature
- Calculated based on event start time (24h before, 2h before)
- Handles timezone correctly (Da Lat timezone)

### API Routes
- `/api/notifications/rsvp` - RSVP confirmation and reminder scheduling
- `/api/notifications/cancel` - Waitlist promotion notification
- `/api/notifications/confirm` - Attendance confirmation handler

---

## UI/UX Features

### Design System
- **Theme Support**: Dark/light mode via `next-themes`
- **Responsive**: Mobile-first design with Tailwind breakpoints
- **Accessibility**: Radix UI primitives for keyboard navigation and ARIA

### Key Components
- **EventCard**: Grid display with counts and basic info
- **EventForm**: Multi-step form with validation
- **RsvpButton**: State-aware button with loading states
- **PlaceAutocomplete**: Google Places integration for locations
- **NotificationInbox**: Novu widget integration
- **UserMenu**: Profile dropdown with settings link

### Internationalization (i18n)
- **Languages**: English, French, Vietnamese
- **User Preference**: Stored in profile `locale` field
- **Notification Translations**: All messages translated in `lib/novu.ts`
- **UI Translations**: Not yet fully implemented (only notifications)

---

## Timezone Handling

### All Times in Da Lat Timezone
- **Default Timezone**: `Asia/Ho_Chi_Minh` (UTC+7)
- **Storage**: Times stored as UTC in database
- **Display**: Always converted back to Da Lat timezone for display
- **Form Input**: Users enter time in Da Lat timezone

### Key Functions (`lib/timezone.ts`)
- `toUTCFromDaLat(date, time)` - Converts Da Lat time to UTC for storage
- `formatInDaLat(isoString, formatStr)` - Formats UTC time as Da Lat time
- `getDateTimeInDaLat(isoString)` - Extracts date/time parts for form defaults

---

## Performance Optimizations

### Server-Side Rendering
- Most pages are Server Components for fast initial load
- Data fetching happens server-side
- Reduced client-side JavaScript bundle

### Database Optimizations
- **Indexes**: On `slug`, `starts_at`, `status`, `username`
- **Partial Indexes**: `status = 'published'` for events
- **Batch Queries**: Event counts fetched in single query, not per-event
- **Row Locking**: Used in RSVP functions to prevent race conditions

### Client-Side Optimizations
- **React Transitions**: Uses `useTransition` for non-blocking UI updates
- **Suspense Boundaries**: Loading states for async data
- **Optimistic UI**: Button states update immediately

---

## Security Features

### Authentication Security
- **HTTP-Only Cookies**: Session tokens not accessible to JavaScript
- **CSRF Protection**: Supabase handles CSRF tokens
- **OAuth**: Secure OAuth flows with code exchange

### Database Security
- **Row-Level Security**: All tables protected with RLS policies
- **Security Definer Functions**: Database functions run with elevated privileges but are carefully scoped
- **Input Validation**: Client and server-side validation
- **SQL Injection Prevention**: Parameterized queries via Supabase client

### API Security
- **Authentication Checks**: All API routes verify user authentication
- **Authorization**: Checks user ownership before mutations
- **Error Handling**: Generic error messages to prevent information leakage

---

## Code Quality & Patterns

### Strengths
✅ **Type Safety**: Comprehensive TypeScript types
✅ **Separation of Concerns**: Clear separation between server/client code
✅ **Reusable Components**: Well-structured component library
✅ **Database Functions**: Complex logic in database for consistency
✅ **Error Handling**: Try-catch blocks and error states in UI
✅ **Loading States**: Proper loading and error UI feedback
✅ **Code Organization**: Logical file structure

### Areas for Improvement
⚠️ **Error Handling**: Some API routes could have more specific error handling
⚠️ **Testing**: No test files visible in codebase
⚠️ **Documentation**: Limited inline documentation
⚠️ **Type Definitions**: Some `any` types could be more specific
⚠️ **Validation**: Form validation could use Zod schemas (Zod is installed but not used in forms)
⚠️ **Internationalization**: UI strings hardcoded (only notifications are translated)

---

## Potential Issues & Considerations

### Current Issues
1. **Timezone Display**: Event time formatting might not respect user's locale/format preferences
2. **RSVP Race Conditions**: While row locking is used, there's a window between capacity check and insert
3. **Notification Delivery**: No retry logic if Novu API fails
4. **Avatar Storage**: Migration exists but implementation details unclear
5. **Tribe Feature**: Database schema exists but UI/features not implemented

### Scalability Considerations
1. **Event Counts**: Current batch query works but could be slow with many events
2. **Notification Rate Limiting**: No rate limiting on notification API routes
3. **Database Connections**: No connection pooling visible (Supabase handles this)
4. **Caching**: No caching strategy for frequently accessed data

### Future Enhancements
- **Email Notifications**: Novu supports email but templates not defined
- **SMS Notifications**: Novu supports SMS but not configured
- **Event Search**: No search/filter functionality
- **Event Categories/Tags**: Not implemented
- **Tribe Features**: Schema ready but features not built
- **Event Images**: Upload functionality not visible (only URL input)

---

## Dependencies Analysis

### Production Dependencies
- **Core**: Next.js, React, TypeScript - Standard, well-maintained
- **UI**: Radix UI, Tailwind, shadcn/ui - Modern, accessible
- **Database**: Supabase - Managed, production-ready
- **Notifications**: Novu - Enterprise-grade notification service
- **Date Handling**: date-fns - Reliable, well-maintained
- **Validation**: Zod installed but not fully utilized

### Potential Concerns
- **Latest Versions**: Using "latest" for some packages (could cause breaking changes)
- **Lockfile**: Bun lockfile present (team should use Bun consistently)
- **Google Maps**: Requires API key and billing setup

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NOVU_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_NOVU_APP_ID= (if using notification widget)
GOOGLE_MAPS_API_KEY= (for place autocomplete)
```

---

## Deployment Considerations

### Vercel (Recommended)
- Next.js optimized deployment
- Environment variables via dashboard
- Automatic preview deployments

### Database Migrations
- Migrations in `supabase/migrations/`
- Should be run via Supabase CLI or dashboard
- Order matters (timestamps in filenames)

### Build Process
```bash
npm run build  # or bun run build
npm run start  # Production server
```

---

## Summary

**dalat.app** is a well-architected event management platform with:
- ✅ Modern tech stack (Next.js 15, React 19, TypeScript)
- ✅ Robust authentication and authorization
- ✅ Sophisticated RSVP and waitlist management
- ✅ Multi-language notification system
- ✅ Proper timezone handling
- ✅ Good separation of concerns
- ⚠️ Missing tests
- ⚠️ Some features incomplete (tribes, i18n)
- ⚠️ Could benefit from more validation and error handling

The codebase demonstrates solid software engineering practices and is well-positioned for production use with some enhancements.
