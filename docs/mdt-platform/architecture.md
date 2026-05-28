# BlueCore MDT Platform — Architecture

## Overview

The BlueCore MDT Platform is a browser-based emergency communications system for law enforcement, operating as a **separate interface** from primary CAD/RMS systems while securely connecting through APIs and real-time WebSocket channels.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                              │
├─────────────────┬─────────────────────┬─────────────────────────────────┤
│  Officer MDT    │  Dispatch Console   │  911 Call Intake + AI Parser    │
│  (PWA :3001)    │  (Multi-monitor)    │  (ANI/ALI, Text-to-911)         │
└────────┬────────┴──────────┬──────────┴──────────────┬──────────────────┘
         │                   │                         │
         └───────────────────┼─────────────────────────┘
                             ▼
              ┌──────────────────────────────┐
              │     API Gateway (:8000)      │
              │  JWT · RBAC · Rate Limiting  │
              └──────────────┬───────────────┘
                             │
     ┌───────────┬───────────┼───────────┬───────────┬───────────┐
     ▼           ▼           ▼           ▼           ▼           ▼
  Auth       CAD Dispatch  Call Parser  Alert Eng   RMS      Integration
  (:8001)    (:8070)       (:8080)      (:8060)    (:8010)   (:8050)
     │           │           │           │           │           │
     └───────────┴───────────┴─────┬─────┴───────────┴───────────┘
                                   ▼
              ┌────────────────────────────────────────┐
              │  PostgreSQL · Redis · Kafka            │
              │  WebSocket Gateway (:8061)             │
              └────────────────────────────────────────┘
```

## Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| `gateway` | 8000 | API routing, auth propagation, CORS |
| `auth` | 8001 | JWT, MFA, RBAC, user management |
| `cad-dispatch-service` | 8070 | Incidents, units, calls, BOLO, messaging |
| `call-parser-service` | 8080 | NLP entity extraction, threat detection |
| `websocket-gateway` | 8061 | Real-time event distribution |
| `alert-engine` | 8060 | Officer safety, BOLO, external alerts |
| `rms-service` | 8010 | Incident reports, RMS export |
| `integration-service` | 8050 | CAD/RMS/NCIC connectors |

## Operational Areas

### 1. Officer MDT (`/mdt`)
- Real-time dispatched calls, unit status buttons, GIS map placeholder
- Silent emergency, BOLO alerts, dispatch chat, navigation routing hooks
- Touch-optimized dark tactical UI, offline PWA caching

### 2. Dispatch Console (`/dispatch`)
- Multi-panel layout: incoming calls, active incidents, available units, GIS
- Drag-and-drop unit assignment, unit recommendation engine
- Live status board, supervisor monitoring hooks

### 3. 911 Call Intake (`/calltaker`)
- ANI/ALI auto-fill, multi-line call handling UI
- AI-assisted parsing with manual override
- RapidSOS / NG911 connector hooks

## CJIS Compliance Foundations

- All actions logged to `cad_audit_logs` with actor, resource, timestamp
- JWT authentication with role-based access (Officer, Dispatcher, Calltaker, Supervisor, Admin)
- Encryption in transit (TLS) and at rest (PostgreSQL TDE ready)
- Agency-scoped data isolation via `agency_id` on all records

## Future Expansion Hooks

Architecture supports future modules via the integration service:
- Body camera feeds, drone streams, LPR (Flock Safety), LifeSpot
- Real-time crime center, facial recognition hooks, smart city sensors
- AI predictive analytics, jail management integration

See also:
- [Database Schema](./database-schema.md)
- [API Architecture](./api-architecture.md)
- [Real-Time Events](./realtime-events.md)
- [CAD Integration](./cad-integration.md)
- [AI Parsing Workflow](./ai-parsing-workflow.md)
- [Authentication Flow](./authentication-flow.md)
- [Wireframes](./wireframes.md)
