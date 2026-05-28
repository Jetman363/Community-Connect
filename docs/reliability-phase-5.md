# Reliability Enhancements (Phase 5)

## Added Components

- `outbox-relay` worker:
  - Polls auth and RMS outbox pending endpoints
  - Dispatches events through each service's dispatch API
  - Tracks retry counts in local SQLite
  - Moves permanently failing records to dead-letter storage and emits `dlq.outbox.v1` Redis stream events

- `event-consumer` worker:
  - Uses Redis Streams consumer groups (`XREADGROUP`)
  - Provides at-least-once processing semantics
  - ACKs successful processing
  - Emits failures to `dlq.consumer.v1`

## Key Streams

- `bluecore.auth.user.created.v1`
- `bluecore.auth.user.login.v1`
- `bluecore.rms.report.created.v1`
- `bluecore.ai.report.generated.v1`
- `bluecore.dlq.outbox.v1`
- `bluecore.dlq.consumer.v1`

## Operational Behavior

- Outbox relay retries transient failures up to `OUTBOX_RELAY_MAX_RETRIES`.
- Final failures are dead-lettered with reason and source metadata.
- Consumer group and consumer names are configurable for horizontal scale-out.
