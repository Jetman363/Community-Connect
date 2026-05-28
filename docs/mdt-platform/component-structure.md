# Frontend & Backend Component Structure

## Repository Layout

```
public-safety-ai/
├── apps/
│   └── mdt-platform/              # MDT + Dispatch + 911 PWA (Next.js :3001)
│       ├── app/
│       │   ├── mdt/               # Officer MDT interface
│       │   ├── dispatch/          # Dispatcher console
│       │   ├── calltaker/         # 911 call intake
│       │   ├── layout.tsx
│       │   └── page.tsx           # Role selection landing
│       ├── components/
│       │   ├── mdt/               # MdtDashboard, StatusButtons, CallDetail
│       │   ├── dispatch/          # DispatchConsole, UnitBoard, IncidentQueue
│       │   └── calltaker/         # CalltakerConsole, AiParsePanel
│       ├── lib/
│       │   ├── cad-api.ts         # REST client for CAD endpoints
│       │   ├── use-cad-websocket.ts
│       │   ├── auth-context.tsx
│       │   ├── config.ts
│       │   └── types.ts
│       └── public/
│           ├── manifest.json      # PWA manifest
│           └── sw.js              # Service worker (offline cache)
│
├── frontend/                      # Command center UI (existing, :3000)
│
├── services/
│   └── cad-dispatch-service/      # CAD/dispatch backend (:8070)
│       ├── app/
│       │   ├── models.py          # SQLAlchemy models
│       │   ├── schemas.py         # Pydantic request/response
│       │   ├── events.py          # Redis + WS broadcast
│       │   ├── routers/           # incidents, units, calls
│       │   └── services/          # Business logic
│       └── requirements.txt
│
├── ai-engine/
│   └── call-parser/               # AI 911 parsing engine (:8080)
│       └── app/
│           ├── parser.py          # NLP entity extraction
│           ├── schemas.py
│           └── main.py
│
├── gateway/service/               # API gateway proxies
│   └── app/routers/
│       ├── cad_proxy.py
│       └── call_parser_proxy.py
│
├── connectors/cad/                # External CAD integration examples
│   ├── rest_adapter.py
│   └── websocket_adapter.py
│
└── docs/mdt-platform/             # Architecture documentation
```

## Frontend Component Hierarchy

```
App (AuthProvider)
├── Home (role selection)
├── MdtPage
│   └── MdtDashboard
│       ├── CallQueue (sidebar)
│       ├── CallDetail (center)
│       ├── StatusButtons (right)
│       └── DispatchChat
├── DispatchPage
│   └── DispatchConsole
│       ├── IncomingCallsPanel
│       ├── ActiveIncidentsPanel
│       ├── AvailableUnitsPanel (drag source)
│       ├── MapAssignmentDropZone (drop target)
│       └── UnitStatusBoard
└── CalltakerPage
    └── CalltakerConsole
        ├── CallerInfoForm
        ├── LiveTranscript
        ├── AiParsePanel
        └── GisPlot
```

## Backend Service Architecture

```
cad-dispatch-service
├── Routers (HTTP)
│   ├── /v1/incidents      → incident_service
│   ├── /v1/units          → unit_service
│   └── /v1/calls, /bolos  → direct DB
├── Services
│   ├── incident_service   → CRUD, assign, remarks, audit
│   └── unit_service       → status, GPS, recommendations
└── Events
    └── publish_cad_event  → Redis pub/sub + WS gateway
```
