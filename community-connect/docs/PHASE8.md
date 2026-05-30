# Phase 8 — Production Readiness

Community Connect production architecture, infrastructure, and launch preparation (builds on Phases 1–7).

## Architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    Web[Next.js Web App]
    Mobile[Future Mobile]
  end

  subgraph vercel [Vercel Edge / Serverless]
    Next[Next.js 16 App Router]
    API[API Routes]
    MW[Middleware + Security Headers]
  end

  subgraph data [Data Layer]
    PG[(PostgreSQL / Supabase)]
    Redis[(Redis — optional)]
    S3[(S3 — optional)]
  end

  subgraph workers [Background]
    Queue[In-process / BullMQ Queue]
    Email[Email Provider]
  end

  subgraph observability [Observability]
    Health[/api/health]
    Metrics[/api/metrics]
    Logs[Structured JSON Logs]
    Sentry[Sentry — optional]
  end

  Web --> Next
  Next --> API
  MW --> Next
  API --> PG
  API --> Redis
  API --> S3
  API --> Queue
  Queue --> Email
  API --> Health
  API --> Metrics
  API --> Logs
  Next --> Sentry
```

## Service Dependencies

| Service | Required | Fallback when unset |
|---------|----------|---------------------|
| PostgreSQL | Production | Demo auth + mock data |
| Redis | No | In-memory cache + rate limits |
| S3 | No | Local `public/uploads` |
| Sentry | No | Structured console logs |
| SMTP/Resend | No | Console email logging |
| Socket.io | No | Polling / no realtime |

## Network Topology

- **Public:** Vercel CDN → Next.js (TLS terminated at edge)
- **Private:** App → Supabase/Railway PostgreSQL (pooler URL for serverless)
- **Optional:** App → Upstash/Railway Redis (TLS)
- **Optional:** App → AWS S3 (IAM credentials)
- **Separate service:** Socket.io on Railway/Fly when realtime required

## Scaling Strategy

1. **Horizontal:** Vercel serverless auto-scales API routes; use connection pooler for Postgres
2. **Cache:** Redis for feed/search/rate limits when `REDIS_URL` set; CDN for static assets
3. **Queue:** In-process queue in dev; BullMQ workers on dedicated Node process in prod
4. **Database:** Review indexes (see below); read replicas for analytics at scale

### Recommended Prisma Indexes (existing + review)

- `User.email` — unique (auth lookups)
- `Post`: `[communityId, createdAt DESC]` — feed pagination
- `SafetyAlert`: `[communityId, active, createdAt DESC]` — alert panels
- `AuditLog`: `[action, createdAt DESC]` — admin audit
- `ModerationCase`: status + createdAt for queues

Add composite indexes before high-traffic launch based on slow-query logs.

## Cache Strategy

| Key pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `feed:{communityId}:{sort}:{page}` | 60s | On new post in community |
| `search:{communityId}:{query}` | 120s | TTL expiry |
| `rl:{namespace}:{ip}` | window | Auto-expire |
| `user:profile:{id}` | 300s | On profile update |

Implementation: `lib/cache/redis.ts` with in-memory Map fallback.

## Security Posture

- JWT in httpOnly, SameSite=Lax cookies
- CSP, HSTS (prod), X-Frame-Options via `next.config.ts` + middleware
- RBAC + permission checks on admin/ops routes
- Rate limiting (memory or Redis)
- Input sanitization (`lib/security/sanitize.ts`)
- GDPR export/delete stubs (`/api/users/me/export`, `/api/users/me/delete`)

## Environment Differences

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| `APP_ENV` | development | staging | production |
| `JWT_SECRET` | dev default | secret | 64+ char random |
| `REDIS_URL` | unset | optional | recommended |
| `SENTRY_DSN` | unset | set | set |
| `EMAIL_PROVIDER` | console | resend/smtp | resend/smtp |
| Cookie `secure` | false | true | true |

Validated via `config/env.ts` (Zod).

## Launch Checklist

See [`LAUNCH-CHECKLIST.md`](./LAUNCH-CHECKLIST.md).

## Phase 9 Roadmap

- Full BullMQ workers + dead-letter replay UI
- Sentry SDK integration (`@sentry/nextjs`)
- TOTP MFA enrollment + verification
- S3 presigned uploads + virus scan
- OAuth production (Google/Apple)
- WebSocket service deployment
- Full GDPR purge job + data retention cron
- E2E tests (Playwright)
- WAF / DDoS (Cloudflare)

## Related Docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md)
- [SECURITY.md](./SECURITY.md)
- [COMPLIANCE.md](./COMPLIANCE.md)
