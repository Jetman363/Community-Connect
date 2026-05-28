# Demo Mode Workflow

Fully connected simulation linking **911 Call Intake**, **CAD Dispatch**, **Supervisor Command**, and **Officer MDT** — with live WebSocket sync, automated scenarios, messaging, and RMS handoff.

---

## Prerequisites

- Docker Desktop running
- Node.js 18+ (for MDT frontend)
- Ports available: `3001`, `8070`, `8090`, `8061`, `8080`, `8000`

---

## One-Command Start

```bash
~/public-safety-ai/scripts/run-mdt-demo.sh
```

This script:

1. Starts Docker services (CAD, demo orchestrator, WebSocket gateway, Redis, Postgres)
2. Waits for health checks
3. Launches the MDT frontend at **http://localhost:3001** in demo mode

### Manual Start

```bash
# Backend stack
docker compose -f ~/public-safety-ai/deployments/docker/docker-compose.yml up -d

# MDT frontend (separate terminal)
cd ~/public-safety-ai/apps/mdt-platform
NEXT_PUBLIC_DEMO_MODE=true NEXT_PUBLIC_AGENCY_ID=agency-demo-001 npm run dev
```

---

## Service Map

| Service | Port | Purpose |
|---------|------|---------|
| **MDT Platform** | 3001 | All four UI interfaces |
| **demo-orchestrator** | 8090 | Scenarios, timeline, messaging, audit |
| **cad-dispatch-service** | 8070 | Incidents, units, assignments |
| **call-parser-service** | 8080 | AI 911 call parsing |
| **websocket-gateway** | 8061 | Real-time event broadcast |
| **API Gateway** | 8000 | Production auth proxy (not used in demo REST mode) |

In demo mode, the frontend talks **directly** to CAD (:8070) and the demo orchestrator (:8090) — no JWT required for REST. WebSocket uses a demo token format: `demo:{agency_id}:{role}:{user_id}`.

---

## Multi-Tab Demo (Recommended)

Open **4 browser tabs** at http://localhost:3001. Sign in with a **different role in each tab**:

| Tab | Role to select | URL | What to watch |
|-----|----------------|-----|---------------|
| 1 | Calltaker | `/calltaker` | Incoming call popup, AI parse, Create CAD Event |
| 2 | Dispatcher | `/dispatch` | Call queue fills, drag-and-drop unit assign, comms |
| 3 | Supervisor | `/supervisor` | Force overview, map, timeline, escalation |
| 4 | Officer | `/mdt` | Dispatch appears, status buttons, messaging |

> **Tip:** Use separate browser profiles or incognito windows so each tab keeps its own role session.

---

## Automated Scenario Walkthrough

1. Go to **Supervisor** tab (`/supervisor`) or the **home page**
2. In the **Demo Control Panel**, click **Start Demo Scenario**
3. Pick a scenario (e.g. **Traffic Stop — Reckless Driver**)
4. Watch all four tabs update in real time:

```
Scenario starts
  → Calltaker: incoming call banner + dialogue auto-fills
  → Dispatch: new incident in queue
  → Supervisor: timeline event + map unit movement
  → Officer MDT: assigned call appears, status changes auto-play
  → End: RMS case created (report_completed event)
```

### Available Scenarios

| ID | Name | Priority | Highlights |
|----|------|----------|------------|
| `traffic_stop` | Traffic Stop — Reckless Driver | P2 | AI DWI call, unit 1A12 dispatched |
| `burglary` | Burglary In Progress | P1 | Weapons, multi-unit response, backup request |
| `domestic` | Domestic Disturbance | P1 | EMS + patrol, injuries flagged |
| `officer_assist` | Officer Assistance | P1 | Silent emergency, all units respond |
| `pursuit` | Vehicle Pursuit | P1 | Supervisor escalation, K9 assigned |

---

## Manual Workflow (Step-by-Step)

Use this for live presentations without auto-scenarios:

### Step 1 — 911 Call (Calltaker tab)

1. Enter caller info and transcript
2. Click **AI Parse & Auto-Fill**
3. Click **Create Incident & Dispatch**
4. → Dispatch and Supervisor tabs update instantly

### Step 2 — Dispatch (Dispatcher tab)

1. Select incident from **Incoming / Active** queue
2. Drag an available unit onto the assignment zone (or click a recommended unit)
3. Send a message via **Live Comms**
4. → Officer MDT shows assignment; timeline updates everywhere

### Step 3 — Officer Response (MDT tab)

1. Select the dispatched call
2. Press status buttons: **En Route** → **On Scene** → **Clear**
3. Use **Silent Emergency** to trigger officer-assist scenario behavior
4. → Supervisor sees status changes on the unit board

### Step 4 — Supervisor Oversight (Supervisor tab)

1. Monitor **Force Overview** stats
2. Click an incident → **Escalate Incident**
3. Watch the **Synchronized Timeline** fill in
4. Send supervisor messages via **Live Comms**

---

## Event Flow Architecture

```
┌──────────────┐     REST      ┌────────────────────┐
│  Calltaker   │──────────────▶│ demo-orchestrator  │
│  Dispatch    │──────────────▶│      (:8090)       │
│  Supervisor  │               └─────────┬──────────┘
│  Officer MDT │                         │
└──────┬───────┘                         │ HTTP + Redis
       │                                 ▼
       │ WebSocket              ┌────────────────────┐
       └───────────────────────▶│ cad-dispatch (:8070)│
                                └─────────┬──────────┘
                                          │
       ┌──────────────────────────────────┤
       ▼                                  ▼
┌──────────────┐                   ┌──────────────┐
│ websocket-   │◀── Redis pub/sub ─│  RMS sync    │
│ gateway      │                   │  (on complete)│
│   (:8061)    │                   └──────────────┘
└──────┬───────┘
       │ broadcast to all tabs
       ▼
   LIVE / Timeline / Banners / Messages
```

---

## Live Event Types

All interfaces subscribe to the same WebSocket stream. Key events:

| Event | Triggered when |
|-------|----------------|
| `new_call_created` | 911 call submitted |
| `cad_event_created` | CAD incident created |
| `unit_assigned` | Dispatcher assigns unit |
| `officer_enroute` | Officer presses En Route |
| `officer_onscene` | Officer presses On Scene |
| `unit_cleared` | Officer clears |
| `officer_request_backup` | Silent emergency / backup |
| `incident_escalated` | Supervisor escalates |
| `supervisor_note_added` | Supervisor adds note |
| `report_started` | Officer starts report |
| `report_completed` | RMS case synced |
| `message_sent` | Any live comms message |
| `scenario_started` | Auto scenario begins |
| `scenario_completed` | Auto scenario ends |

---

## Demo Orchestrator API

Base URL: `http://localhost:8090`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Service health |
| GET | `/v1/demo/status` | Demo mode state, active scenario |
| POST | `/v1/demo/toggle` | `{ "enabled": true/false }` |
| GET | `/v1/demo/scenarios` | List scenarios |
| POST | `/v1/demo/scenarios/{id}/start` | Run automated scenario |
| POST | `/v1/demo/scenarios/stop` | Stop running scenario |
| GET | `/v1/demo/timeline` | Synchronized event timeline |
| GET | `/v1/demo/messages` | Live comms history |
| POST | `/v1/demo/messages` | Send message |
| POST | `/v1/demo/calls/create` | Create CAD event from calltaker |
| POST | `/v1/demo/supervisor/note` | Add supervisor note |
| GET | `/v1/demo/rms/cases` | RMS cases created by demo |
| GET | `/v1/demo/audit` | Audit log |

---

## Troubleshooting

### Dispatch shows OFFLINE

The **LIVE/OFFLINE** indicator is the WebSocket connection, not REST data.

1. **Sign out and sign in again** — old sessions may have the invalid `demo-jwt-token`. New format: `demo:agency-demo-001:dispatcher:disp-001`
2. Confirm WebSocket gateway is running:
   ```bash
   curl http://localhost:8061/healthz
   ```
3. Rebuild gateway if you pulled code changes:
   ```bash
   docker compose -f deployments/docker/docker-compose.yml build websocket-gateway
   docker compose -f deployments/docker/docker-compose.yml up -d websocket-gateway
   ```
   Ensure `ALLOW_DEMO_WS=true` is set in docker-compose for websocket-gateway.

### No incidents / empty queues

```bash
curl http://localhost:8070/v1/health
curl "http://localhost:8070/v1/incidents?agency_id=agency-demo-001"
```

If CAD is down or `cad_db` is missing:
```bash
docker exec docker-postgres-1 psql -U bluecore -d auth_db -c "CREATE DATABASE cad_db;"
docker compose -f deployments/docker/docker-compose.yml restart cad-dispatch-service
```

### Demo scenarios do nothing

```bash
curl http://localhost:8090/healthz
curl http://localhost:8090/v1/demo/scenarios
```

Start orchestrator if missing:
```bash
docker compose -f deployments/docker/docker-compose.yml up -d demo-orchestrator
```

### Frontend won't load (port 3001)

```bash
cd ~/public-safety-ai/apps/mdt-platform
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```

### Tabs don't sync

- Confirm all tabs are on http://localhost:3001 (not 3000)
- Each tab must be signed in (different roles OK)
- Check browser console for WebSocket errors
- Hard refresh (Cmd+Shift+R) after backend restart

---

## Demo Mode Toggle

The **Demo Mode ON/OFF** switch in the Demo Control Panel:

| ON | OFF |
|----|-----|
| Simulated units & GPS | Architecture ready for live CAD feeds |
| Direct REST to CAD (no JWT) | Production path via gateway + auth |
| Automated scenarios | Manual / integration-driven only |
| Fake ANI/ALI | RapidSOS / NG911 connector hooks |

---

## Related Docs

- [Architecture](./architecture.md)
- [Real-Time Events](./realtime-events.md)
- [API Architecture](./api-architecture.md)
- [Wireframes](./wireframes.md)
