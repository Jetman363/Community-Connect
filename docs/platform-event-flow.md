# Platform Event Flow

Live operational events flow from external connectors through the Integration Management Service into the Real-Time Alert Engine and out to dashboard WebSocket clients.

```mermaid
flowchart LR
  subgraph external [External Sources]
    Flock[Flock Safety]
    LS[LifeSpot]
    CAD[CAD APIs]
    OSINT[OSINT Feeds]
  end

  subgraph integration [Integration Service :8050]
    WH[Webhook Ingest]
    POLL[Polling Worker]
    NORM[Connector Normalize]
    EQ[Event Queue]
    BR[Alert Bridge]
  end

  subgraph streaming [Kafka / Redis]
    INT_STREAM["bluecore.integrations.{agency}.events"]
    INGRESS["bluecore.alerts.ingress"]
    PROCESSED["bluecore.alerts.processed"]
  end

  subgraph alert [Alert Engine :8060]
    CW[Consumer Worker]
    ADAPT[Integration Adapter]
    CORR[AI Correlation]
    THREAT[Threat Engine]
    DIST[Distribution]
  end

  subgraph realtime [Realtime Dashboard]
    REDIS[(Redis Pub/Sub)]
    WSG[WebSocket Gateway :8061]
    UI[BlueCore Frontend]
  end

  Flock --> WH
  LS --> WH
  CAD --> POLL
  OSINT --> POLL
  WH --> NORM
  POLL --> NORM
  NORM --> EQ
  EQ --> INT_STREAM
  EQ --> BR
  BR --> INGRESS
  INGRESS --> CW
  CW --> ADAPT
  ADAPT --> CORR --> THREAT --> DIST
  DIST --> PROCESSED
  DIST --> REDIS
  REDIS --> WSG --> UI
```

## Message contract

Integration events are wrapped for alert ingress:

```json
{
  "message_type": "integration.normalized",
  "event": {
    "source": "flock_safety",
    "event_type": "flock.plate_read",
    "agency_id": "...",
    "connector_id": "...",
    "occurred_at": "2026-05-27T14:22:00Z",
    "external_id": "read-999",
    "payload": { "plate": "ABC123" },
    "metadata": {}
  }
}
```

## Configuration

| Variable | Service | Purpose |
|----------|---------|---------|
| `ALERT_BRIDGE_ENABLED` | integration | Forward events to alert engine |
| `KAFKA_ALERT_INGRESS_TOPIC` | integration | Target Kafka topic |
| `ALERT_ENGINE_URL` | integration | HTTP fallback |
| `ALERT_BRIDGE_SECRET` | both | Internal HTTP bridge auth |
| `INTEGRATION_BRIDGE_ENABLED` | alert-engine | Accept integration envelopes |

## Test a live flow

1. Start stack: `docker compose up -d` in `deployments/docker`
2. Create connector + send webhook to integration service
3. Event publishes to Kafka ingress → alert engine processes → Redis → WebSocket
4. Open frontend dashboard — alert appears with live WS badge
