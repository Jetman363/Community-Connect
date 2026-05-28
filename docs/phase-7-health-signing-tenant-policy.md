# Phase 7: Health, Signing, Tenant Policy

## Health and Readiness Probes

- Auth service:
  - `GET /healthz`
  - `GET /readyz`
- Gateway:
  - `GET /v1/healthz`
  - `GET /v1/readyz`
- RMS:
  - `GET /healthz`
  - `GET /readyz`
- Kubernetes liveness/readiness probes added for auth and gateway deployments.

## Signed Event Envelopes

- Shared publisher now emits signed message envelopes:
  - `message.envelope` (topic, timestamp, payload)
  - `message.signature` (HMAC-SHA256)
- Signing key is configured by `EVENT_SIGNING_SECRET`.
- Event consumer validates signatures before processing.

## Tenant-Aware Authorization

- Gateway enforces tenant match checks between JWT claims and payload agency scope.
- Gateway propagates `x-agency-id` to RMS.
- RMS enforces cross-tenant read and write restrictions.
- Auth registration now requires `attributes.agency_id` for tenant scoping.
