# Phase 6: Resilience and Observability

## Implemented

- Idempotency for RMS report creation via `X-Idempotency-Key`
- Replay-safe outbox dispatch responses (already dispatched returns success metadata)
- Prometheus metrics endpoints and counters
- Outbox relay circuit-breaker and adaptive backoff
- Consumer replay protection via persistent processed-message store

## Endpoints

- Auth metrics: `GET /metrics`
- RMS metrics: `GET /metrics`
- Relay metrics: `:9110/metrics` (process metrics server)
- Consumer metrics: `:9111/metrics` (process metrics server)

## Key Metrics

- `auth_users_registered_total`
- `auth_login_success_total`
- `auth_outbox_dispatched_total`
- `rms_reports_created_total`
- `rms_idempotent_hits_total`
- `rms_outbox_dispatched_total`
- `outbox_relay_dispatch_success_total`
- `outbox_relay_dispatch_failure_total`
- `outbox_relay_dlq_total`
- `outbox_relay_backoff_seconds`
- `event_consumer_processed_total`
- `event_consumer_replay_skipped_total`
- `event_consumer_failures_total`
