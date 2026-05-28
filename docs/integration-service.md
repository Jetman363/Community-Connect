# Integration Management Service Architecture

## Components

1. **Connector Framework** (`app/connectors/base.py`) — abstract base with auth, webhook, polling, normalization, retry, health
2. **Connector Registry** (`app/connectors/registry.py`) — type registration and instantiation
3. **Webhook Ingestion Engine** (`app/services/integration.py`) — signature verify, normalize, route
4. **Credential Encryption** (`app/security/encryption.py`) — Fernet-based at-rest encryption
5. **Event Queue** (`app/services/event_queue.py`) — Redis Streams or Kafka with signed envelopes
6. **RBAC** (`app/security/rbac.py`) — role-based permissions with agency scoping
7. **Audit Logging** (`app/repository.py`) — append-only integration audit trail

## Data Model

- `connector_instances` — registered integrations per agency
- `encrypted_credentials` — API keys and secrets (encrypted)
- `oauth2_tokens` — OAuth2 access/refresh tokens (encrypted)
- `webhook_deliveries` — inbound webhook tracking
- `agency_permissions` — agency-level RBAC grants
- `integration_audit_logs` — immutable audit events

## Event Flow

```
External System → Webhook/Poll → Connector.normalize → EventQueue (Redis or Kafka) → Downstream Consumers
```

## Security

- JWT authentication on all management endpoints
- Agency-scoped RBAC on all operations
- Encrypted credential storage
- Webhook HMAC signature verification
- Signed event envelopes on the event bus

## Event Backend Selection

Set `EVENT_BACKEND=redis` (default) or `EVENT_BACKEND=kafka`.

### Kafka settings

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Broker list |
| `KAFKA_CLIENT_ID` | `integration-service` | Client identifier |
| `KAFKA_TOPIC_PARTITIONS` | `1` | Partitions per agency topic |
| `KAFKA_REPLICATION_FACTOR` | `1` | Topic replication |
| `KAFKA_AUTO_CREATE_TOPICS` | `true` | Auto-provision agency topics |
| `KAFKA_PRODUCER_ACKS` | `all` | Durability ack level |
| `KAFKA_COMPRESSION_TYPE` | `gzip` | Payload compression |
| `KAFKA_SECURITY_PROTOCOL` | `PLAINTEXT` | `SASL_SSL` for secured clusters |
| `KAFKA_SASL_MECHANISM` | `` | e.g. `SCRAM-SHA-512` |
| `KAFKA_SASL_USERNAME` | `` | SASL username |
| `KAFKA_SASL_PASSWORD` | `` | SASL password |
| `KAFKA_SSL_CAFILE` | `` | CA bundle for TLS |
