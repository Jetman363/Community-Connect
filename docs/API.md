# Community Connect API

Base URL: `/api` (same origin as the Next.js app).

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register `{ email, password, displayName, role? }` |
| POST | `/auth/login` | — | Login `{ email, password }` — sets `cc_token` cookie |
| POST | `/auth/logout` | — | Clear session cookie |
| GET | `/auth/me` | JWT | Current user + profile |
| GET | `/auth/oauth/:provider` | — | OAuth stub (google, apple, facebook) |

## Community

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/posts` | — | List posts (demo fallback if DB down) |
| POST | `/posts` | JWT | Create post `{ content, title?, category?, mediaUrls? }` |

## Safety

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/alerts` | — | Active safety alerts |
| POST | `/alerts` | JWT (PUBLIC_SAFETY+) | Create alert |

## Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/events` | — | List events |
| POST | `/events` | JWT | Create event |
| POST | `/events/:id/rsvp` | JWT | RSVP to event |

## Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reports` | JWT | User's reports |
| POST | `/reports` | JWT | Submit report (AI categorization) |

## Marketplace

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/marketplace?q=` | — | List/search listings |
| POST | `/marketplace` | JWT | Create listing |

## HOA

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/hoa` | — | Announcements, documents, votes |

## Businesses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/businesses` | — | Local services directory |

## AI

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/chat` | — | `{ messages: [{ role, content }] }` → `{ reply }` |

## Upload

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | JWT | `multipart/form-data` field `file` |

## Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/stats` | MODERATOR+ | Dashboard counts |
| GET | `/admin/users` | ADMIN | User list |

## Realtime (Socket.io)

Path: `/api/socket` when running `npm run dev:socket`.

Events:
- Client → `alert:subscribe` — join alerts room
- Client → `join:community` — join community room
- Server → `alert:new` — new safety alert
- Server → `community:update` — feed update

## Rate limiting

In-memory per-IP limits on auth, posts, reports, AI, and upload routes. Use Redis in production.
