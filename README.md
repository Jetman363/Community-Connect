# BlueCore Operations Platform

CJIS-aligned, modular law enforcement operations platform built as the **BlueCore** microservices monorepo. Includes a full **MDT & Emergency Communications Platform** for officer terminals, dispatch consoles, and 911 call intake.

## Monorepo Layout

- `apps/mdt-platform/` **MDT + Dispatch + 911 PWA** (Next.js, port 3001)
- `frontend/` Command center UI (Next.js, port 3000)
- `services/cad-dispatch-service/` Real-time CAD dispatch, units, incidents
- `ai-engine/call-parser/` AI-assisted 911 call parsing engine
- `services/` Domain microservices (RMS, alerts, audit, integrations)
- `auth/` Identity and access management microservice
- `gateway/` API gateway (REST + GraphQL entrypoint)
- `connectors/cad/` External CAD integration adapters (REST, WebSocket)
- `shared/` Shared libraries/contracts
- `deployments/` Docker Compose and Kubernetes manifests
- `docs/mdt-platform/` MDT architecture, schema, wireframes, API docs

## MDT Platform Quick Start

```bash
# Start full backend stack (includes cad-dispatch + call-parser)
docker compose -f deployments/docker/docker-compose.yml up --build

# Start MDT frontend (separate terminal)
cd apps/mdt-platform
npm install
npm run dev
```

Open `http://localhost:3001` — select a role (Officer, Dispatcher, Calltaker) to enter the interface.

| Interface | URL | Description |
|-----------|-----|-------------|
| Officer MDT | `/mdt` | Patrol terminal — calls, status, silent emergency |
| Dispatch | `/dispatch` | Unit assignment, incident queue, status board |
| 911 Intake | `/calltaker` | AI-assisted call parsing and CAD auto-fill |

**Documentation:** `docs/mdt-platform/architecture.md`

## Command Center Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` — use pre-filled demo credentials on the login page.

### Backend Services

1. Copy `.env.example` to `.env`
2. Build and run:
   - `docker compose -f deployments/docker/docker-compose.yml up --build`
3. Open API docs:
   - Auth: `http://localhost:8001/docs`
   - Gateway: `http://localhost:8000/docs`

## Security Baseline

- Zero-trust service-to-service validation stubs
- JWT with signed access/refresh token support
- RBAC/ABAC policy evaluation hook points
- Immutable audit event model and append-only write path
- CJIS/FedRAMP-ready architecture boundaries documented in `docs/`
