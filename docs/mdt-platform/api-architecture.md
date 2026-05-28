# MDT Platform — API Architecture

## Base URL

```
Production: https://api.{agency}.bluecore.gov/v1
Development: http://localhost:8000/v1
```

## Authentication

All endpoints require `Authorization: Bearer <JWT>` except health checks.

Gateway propagates identity headers to downstream services:
- `x-user-id`, `x-roles`, `x-agency-id`

## CAD Dispatch Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/cad/incidents?agency_id=` | All | List incidents |
| POST | `/cad/incidents` | Dispatcher, Calltaker | Create incident |
| GET | `/cad/incidents/{id}` | All | Get incident detail |
| PATCH | `/cad/incidents/{id}` | Dispatcher | Update incident |
| POST | `/cad/incidents/{id}/assign` | Dispatcher | Assign unit |
| GET | `/cad/incidents/{id}/recommendations` | Dispatcher | Unit recommendation engine |
| GET | `/cad/units?agency_id=` | All | List units |
| PATCH | `/cad/units/{id}/status` | Officer | Update unit status |
| POST | `/cad/units/silent-emergency` | Officer | Silent emergency activation |
| GET | `/cad/calls?agency_id=` | Calltaker | List emergency calls |
| POST | `/cad/calls` | Calltaker | Create call record |
| GET | `/cad/bolos?agency_id=` | Officer | Active BOLO alerts |
| GET/POST | `/cad/messages` | All | Dispatch messaging |

## AI Call Parser Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/calls/parse` | Parse transcript → structured CAD fields |
| GET | `/ai/calls/examples` | Example parse output |

### Parse Request

```json
{
  "text": "There's a white Ford F-150 speeding northbound on Highway 281...",
  "agency_id": "agency-demo-001",
  "call_id": "optional-uuid"
}
```

### Parse Response

```json
{
  "incident_type": "traffic",
  "priority": "P2",
  "dispatch_code": "10-55",
  "suggested_unit_types": ["patrol"],
  "narrative_summary": "Traffic incident at Highway 281 near Evans Road involving white Ford F-150.",
  "entities": [
    { "type": "vehicle", "value": "white Ford F-150", "confidence": 0.88 }
  ],
  "threat_indicators": [],
  "confidence": 0.82,
  "cad_fields": {
    "location": "Highway 281 near Evans Road",
    "vehicle": "white Ford F-150",
    "direction": "northbound"
  }
}
```

## WebSocket Events

Connect: `ws://localhost:8061/v1/ws?token=<JWT>`

Event types:
- `incident.created`, `incident.updated`
- `unit.assigned`, `unit.status`, `unit.emergency`
- `incident.remark`, `bolo.new`

## External CAD Integration

See [CAD Integration](./cad-integration.md) for REST, WebSocket, XML, and JSON feed connectors.
