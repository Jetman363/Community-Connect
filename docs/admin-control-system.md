# Admin Control System

Production-grade admin platform for BlueCore law enforcement AI.

## Architecture Map

| Prompt folder | Implementation |
|---------------|----------------|
| `/backend` | `auth/service` (users, personnel, audit) + `gateway/service` (admin proxy) |
| `/admin-ui` | `frontend/app/admin/` |
| `/services` | `integration-service` (connectors), `alert-engine` (rules) |
| `/middleware` | `gateway/service/app/middleware/rate_limit.py`, per-service RBAC |
| `/models` | `auth/service/app/models.py`, `integration-service/app/models.py`, `alert-engine/app/models.py` |

## RBAC Roles

| Role | Capabilities |
|------|-------------|
| **SuperAdmin** | Full platform access, cross-cutting permissions |
| **Admin** | User management, connectors, rules, audit export |
| **Supervisor** | Rule management, read-only users/personnel |
| **Analyst** | Read connectors, rules, audit |
| **Viewer** | Read-only across admin modules |

Unified permission matrix: `shared/python/shared_lib/admin_rbac.py`

## API Endpoints (via Gateway `:8000`)

All routes require JWT + admin role unless noted.

### User Management — `/v1/admin/users`
- `GET` — list/search users
- `POST` — create user (bcrypt password)
- `PATCH /{id}` — update role, enable/disable
- `DELETE /{id}` — delete user
- `POST /{id}/reset-password` — admin password reset

### Personnel — `/v1/admin/personnel`
- Officer directory with badge ID, unit, clearance level
- Search/filter by name, badge, unit

### Connectors — `/v1/admin/connectors`
- Proxied to integration-service
- Fernet-encrypted credentials at rest
- `POST /{id}/test` — connection health check

### Alert Rules — `/v1/admin/rules`
- Geofence, vehicle match, keyword triggers
- Create / update / disable / delete

### Audit — `/v1/admin/audit`
- Searchable admin action log (actor, IP, before/after state)
- `GET /export` — CSV export

## Security

- JWT authentication on all admin routes
- bcrypt password hashing (auth service)
- Encrypted connector credentials (Fernet, integration-service)
- Rate limiting: 120 req/min on `/v1/admin/*` (gateway middleware)
- Agency-scoped tenant isolation on all mutations

## Frontend

Navigate to **http://localhost:3000/admin**

- `/admin` — overview
- `/admin/users` — user management UI
- `/admin/connectors` — integration manager
- `/admin/rules` — alert rule builder
- `/admin/audit` — audit log viewer

Demo mode works without backend; live mode requires gateway + auth + integration + alert-engine.

## Local Development

```bash
# Gateway (proxies admin APIs)
cd gateway/service && ./scripts/start.sh

# Auth (admin user/personnel/audit)
cd auth/service && .venv/bin/uvicorn app.main:app --port 8001 --reload

# Integration + Alert Engine (Docker recommended)
docker compose -f deployments/docker/docker-compose.yml up -d integration-service alert-engine

# Frontend
cd frontend && npm run dev
```

Set in `.env`:
```
INTEGRATION_SERVICE_URL=http://localhost:8050
AUTH_SERVICE_URL=http://localhost:8001
ALERT_ENGINE_URL=http://localhost:8060
```
