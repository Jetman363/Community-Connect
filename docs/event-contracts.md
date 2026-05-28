# Event Contracts (Phase 3)

## Versioned Topics

- `rms.report.created.v1`
- `ai.report.generated.v1`

## Contract Rules

- Event names are immutable and versioned with suffix `.vN`
- Payloads use snake_case and include tenant boundary keys (`agency_id`)
- Producers must not remove existing keys in-place; breaking changes require new topic version
- Audit correlation should include actor and resource identifiers when available

## Planned Broker Adapters

- Redis Streams adapter
- NATS JetStream adapter
- Kafka adapter

Current implementation publishes through a shared publisher interface in `shared/python/shared_lib/event_bus.py`.
