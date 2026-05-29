# Phase 2 — Frontend UI/UX

Phase 2 delivers a polished, mock-data-driven frontend for Community Connect. All pages are fully navigable with client-side state; no new backend logic was added.

## Route Map

| Route | Page | Status |
|-------|------|--------|
| `/dashboard` | Home dashboard | ✅ Complete |
| `/feed` | Community feed | ✅ Complete |
| `/alerts` | Alerts center | ✅ Complete |
| `/events` | Events (list/calendar/map) | ✅ Complete |
| `/marketplace` | Marketplace | ✅ Complete |
| `/services` | Services directory | ✅ Complete |
| `/profile` | User profile | ✅ Complete |
| `/settings` | Account settings | ✅ Complete |
| `/messages` | Messaging UI | ✅ Complete |
| `/assistant` | AI assistant | ✅ Complete |
| `/admin` | Admin console | ✅ Complete (role-gated) |
| `/map` | Community map | ✅ Polished placeholder |
| `/hoa` | HOA portal | ✅ Polished placeholder |
| `/report` | Submit report | ✅ Polished placeholder |

## Component Structure

```
components/
├── ai/
│   └── floating-assistant.tsx    # FAB + chat popup
├── cards/
│   ├── alert-card.tsx
│   ├── business-card.tsx
│   ├── event-card.tsx
│   ├── feed-post.tsx
│   └── marketplace-listing.tsx
├── dashboard/
│   ├── alerts-panel.tsx
│   ├── events-carousel.tsx
│   ├── feed-preview.tsx
│   ├── nearby-services.tsx
│   └── welcome-header.tsx        # Welcome + weather widget
├── layout/
│   ├── app-shell.tsx             # Shell + mobile menu + toast
│   ├── header.tsx                # Search, notifications, profile
│   ├── mobile-nav.tsx
│   ├── sidebar.tsx
│   └── theme-toggle.tsx
└── ui/
    ├── avatar.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dropdown.tsx
    ├── filter-chips.tsx
    ├── input.tsx
    ├── label.tsx
    ├── map-placeholder.tsx
    ├── modal.tsx
    ├── page-header.tsx           # PageTransition + PageHeader
    ├── skeleton.tsx
    ├── tabs.tsx
    ├── textarea.tsx
    └── toast.tsx
```

## Mock Data

All mock data lives in `lib/mock-data/`:

| File | Contents |
|------|----------|
| `users.ts` | Demo users, current user context |
| `alerts.ts` | Safety alerts with severity/category |
| `posts.ts` | Feed posts, polls, categories |
| `events.ts` | Events with RSVP state |
| `businesses.ts` | Local services directory |
| `marketplace.ts` | Listings (sell/buy/trade/job/free) |
| `notifications.ts` | Header notification dropdown |
| `messages.ts` | Conversations and messages |
| `admin.ts` | Users, moderation queue, analytics |
| `index.ts` | Re-exports + `getUserById()` helper |

Legacy `lib/demo-data.ts` remains for API fallbacks; new UI uses `lib/mock-data/`.

## Data Sources: Mock vs API

| Feature | Phase 2 Source | Existing API (501/stub) |
|---------|----------------|-------------------------|
| Dashboard, feed, alerts | Mock data | `/api/posts`, `/api/alerts` (stub) |
| Events RSVP | Client state | `/api/events`, `/api/events/[id]/rsvp` (stub) |
| Marketplace | Mock data | `/api/marketplace` (stub) |
| Services | Mock data | `/api/businesses` (stub) |
| Messages | Mock data | `/api/v1/messages` (stub) |
| AI assistant | Client-side mock replies | `/api/ai/chat` (exists, unused in UI) |
| Admin | Mock data | `/api/admin/*` (stub) |
| Auth / nav guards | Real middleware | `/api/auth/*` |
| Theme | Client localStorage | — |

## Frontend Architecture

- **Framework:** Next.js 16 App Router, React 19
- **Styling:** Tailwind CSS 4, CSS variables for theming
- **Animation:** Framer Motion (page transitions, cards, sidebar, modals)
- **State:** React `useState` / `useCallback`; no global store in Phase 2
- **Auth context:** `currentUser` from mock data; middleware uses real JWT cookies
- **Toast:** `ToastProvider` in app shell

## Responsive Strategy

| Breakpoint | Layout |
|------------|--------|
| Mobile (`< md`) | Bottom nav, collapsible slide-out menu, stacked cards, floating AI above nav |
| Tablet (`md–lg`) | Header search, 2-column grids, sidebar hidden |
| Desktop (`≥ lg`) | Left sidebar (240px), header search/notifications/profile, 2–3 column grids |

Mobile-first CSS with `hidden md:flex`, `lg:grid-cols-3`, touch-friendly tap targets (min 44px), horizontal scroll carousels with snap.

## App Shell

- **Desktop:** Logo + search + notifications + profile dropdown + theme toggle + report CTA; left sidebar navigation
- **Mobile:** Hamburger menu, bottom nav (Home, Alerts, Map, Community, Profile), mobile search bar

## Phase 3 Prep Notes

1. **Maps:** Replace `MapPlaceholder` with Google Maps via `@googlemaps/js-api-loader` and `lib/maps.ts`
2. **API wiring:** Swap mock imports for SWR/React Query fetching from existing `/api/*` routes
3. **Real-time:** Connect `hooks/use-socket.ts` for live alerts and messages
4. **AI:** Wire `/assistant` and floating button to `/api/ai/chat`
5. **Auth context:** Replace `currentUser` mock with `/api/auth/me` response
6. **Infinite scroll:** Replace mock pagination with cursor-based API on feed
7. **Image upload:** Report and post creation → `/api/upload`
8. **Admin RBAC:** Gate admin nav item from JWT role instead of mock user

## Development

```bash
cd community-connect
npm run dev
# Login: resident@communityconnect.app / Demo1234!
# Admin:  demo@communityconnect.app / Demo1234!
```

```bash
npm run build   # Must pass before Phase 2 sign-off
```
