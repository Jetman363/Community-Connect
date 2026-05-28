# Outbox + Audit Verification (Phase 4)

## Implemented

- Auth service persistent outbox table (`outbox_events`) with pending and dispatch APIs.
- RMS service persistent outbox table with pending and dispatch APIs.
- Shared event bus supports Redis Streams backend (`EVENT_BUS_BACKEND=redis`).
- Audit service includes chain verification endpoint.

## API Endpoints

- Auth outbox:
  - `GET /v1/outbox/pending`
  - `POST /v1/outbox/dispatch/{event_id}`
- RMS outbox:
  - `GET /v1/outbox/pending`
  - `POST /v1/outbox/dispatch/{event_id}`
- Audit integrity:
  - `GET /v1/verify`

## Operational Notes

- Outbox records are written in-service with core transactions and dispatched asynchronously.
- Dispatch is idempotent at the event row level via dispatched marker.
- Redis Streams topics are prefixed by `EVENT_BUS_TOPIC_PREFIX`.
