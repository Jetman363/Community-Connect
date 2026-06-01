# Admin Privileges & Monitoring

Platform administration for Community Connect (Radius). Built on Phase 7 enterprise admin (`/admin`, RBAC, audit logs).

## Administrator login

1. Open **http://localhost:3000/login** (or **/admin/login**, which redirects to login with `redirect=/admin`).
2. Sign in as **`demo@communityconnect.app`** / **`Demo1234!`** (seeded `ADMIN`).
3. Complete onboarding if prompted, then open **/admin** or **/admin/settings**.

Super-admin demo: **`super@communityconnect.app`** / **`Demo1234!`**.

Admin routes use the main app login — there is no separate credential store. Middleware enforces role checks after JWT validation.

## Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/admin/login` | Public | Redirects to `/login?redirect=/admin&admin=1` |
| `/admin` | MODERATOR+ | Enterprise console (overview, moderation, audit tab) |
| `/admin/settings` | ADMIN+ | Admin settings hub |
| `/admin/settings/privileges` | ADMIN+ | Role assignment & permission matrix |
| `/admin/monitoring` | ADMIN+ | Website monitoring (30s auto-refresh) |
| `/admin/system` | MODERATOR+ | System ops (cache, queue) |
| `/admin/launch` | ADMIN+ | Launch metrics |
| `/admin/ops` | PUBLIC_SAFETY+ | Dispatch / ops panel |

Personal preferences remain at **`/settings`** (not admin).

## Privileges admins can manage

Admins with `users:manage_roles` can:

- Search users (`GET /api/admin/users?q=`)
- Change a user’s primary platform role (`PATCH /api/admin/users/[id]/roles`)
- View RBAC matrix (`GET /api/admin/roles`) — roles include Resident, Business Owner, Moderator, HOA Manager, Public Safety, Dispatcher, Admin, Super Admin, Enterprise Client, etc.
- Assign scoped roles via existing `POST /api/admin/roles` (community/org assignments)

Only **SUPER_ADMIN** can assign the `SUPER_ADMIN` role.

## Monitoring metrics

**`/admin/monitoring`** aggregates:

- **API** — `/api/health` status & uptime
- **Database, cache, queue, socket** — health checks
- **Active sessions** — `UserSession` count (fallback: registered users)
- **Error rate** — recent audit log entries matching error/fail/deny patterns
- **Page performance** — placeholder p95/avg (wire to RUM in production)
- **Integrations** — connector health from integrations service
- **System services** — email, Sentry, AI moderation stubs from `getSystemHealth()`

Auto-refresh every **30 seconds**.

## APIs added / extended

- `GET /api/admin/roles` — auth required; returns roles, permissions, matrix
- `GET /api/admin/users` — search users
- `PATCH /api/admin/users/[id]/roles` — update primary role
- `GET /api/admin/monitoring` — aggregated monitoring payload

## Navigation

Sidebar (ADMIN / SUPER_ADMIN only): **Admin Settings**, **Monitoring**.  
Header user menu: **Admin Settings** for ADMIN+.
