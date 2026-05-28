# MDT Platform — Authentication Flow

```mermaid
sequenceDiagram
    participant Client as MDT / Dispatch / Calltaker
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant CAD as CAD Dispatch
    participant WS as WebSocket Gateway

    Client->>Auth: POST /v1/auth/login (credentials + MFA)
    Auth-->>Client: JWT access_token + refresh_token

    Client->>Gateway: API request + Authorization: Bearer JWT
    Gateway->>Gateway: Validate JWT, extract roles + agency_id
    Gateway->>CAD: Proxy with x-user-id, x-roles, x-agency-id
    CAD->>CAD: RBAC check + audit log
    CAD-->>Gateway: Response
    Gateway-->>Client: Response

    Client->>WS: Connect ws://host/v1/ws?token=JWT
    WS->>WS: Validate JWT, subscribe by agency_id
    CAD->>WS: Publish event via Redis
    WS-->>Client: Real-time incident/unit update
```

## Roles & Permissions

| Role | MDT | Dispatch | Calltaker | Admin |
|------|-----|----------|-----------|-------|
| Officer | ✓ | — | — | — |
| Dispatcher | ✓ | ✓ | — | — |
| Calltaker | — | — | ✓ | — |
| Supervisor | ✓ | ✓ | ✓ | — |
| Admin | ✓ | ✓ | ✓ | ✓ |
| System Administrator | ✓ | ✓ | ✓ | ✓ (+ config) |

## MFA Support

Auth service supports TOTP-based MFA. Required for:
- Dispatcher and Calltaker roles (configurable per agency)
- Admin and System Administrator (always required)

## Session Management

- Access token TTL: 15 minutes (configurable)
- Refresh token TTL: 8 hours (shift-aligned)
- Secure, HttpOnly cookies for web clients
- Token revocation via auth service blocklist (Redis)

## Demo Mode

The MDT frontend (`apps/mdt-platform`) includes demo role selection for development without live auth. Production deployments must integrate with the auth service login flow.
