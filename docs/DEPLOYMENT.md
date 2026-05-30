# Deployment Guide

Deploy Community Connect to **Vercel** (app) + **Railway/Supabase** (PostgreSQL) + optional **Redis** and **S3**.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (Supabase or Railway)
- Vercel account
- Optional: Upstash/Railway Redis, AWS S3, Resend/SMTP

## 1. Database (Supabase or Railway)

```bash
# Create project, copy connection string (use pooler for serverless)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

cd community-connect
npx prisma migrate deploy
npm run db:seed   # staging only
```

## 2. Vercel

1. Import repo; set **Root Directory** to `community-connect`
2. Framework: Next.js (auto-detected)
3. Build: `prisma generate && next build` (see `vercel.json`)
4. Environment variables:

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Pooler URL for serverless |
| `JWT_SECRET` | 64+ random characters |
| `APP_ENV` | `staging` or `production` |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `REDIS_URL` | Optional |
| `SENTRY_DSN` | Optional |
| `EMAIL_PROVIDER` | `resend` or `smtp` |
| `RESEND_API_KEY` | If using Resend |
| `AWS_*` | If `STORAGE_PROVIDER=s3` |

5. Deploy

## 3. Redis (optional)

**Upstash:** Create database, copy `REDIS_URL`, add to Vercel env.

Enables: distributed rate limits, shared cache, BullMQ (Phase 9 worker).

## 4. S3 (optional)

```bash
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=community-connect-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## 5. Socket.io (separate service)

Vercel does not support persistent WebSockets. Options:

- Deploy `server.ts` to Railway/Fly with `NEXT_PUBLIC_SOCKET_URL`
- Use polling fallback (limited realtime)

```bash
npm run dev:socket   # local reference
```

## 6. CI/CD

GitHub Actions workflows (monorepo root):

- `.github/workflows/community-connect-ci.yml` — lint, typecheck, build, test
- `.github/workflows/community-connect-deploy-staging.yml` — staging template
- `.github/workflows/community-connect-deploy-production.yml` — production template

Configure secrets: `DATABASE_URL`, `JWT_SECRET`, `VERCEL_TOKEN`, etc.

## 7. Post-deploy verification

```bash
BASE_URL=https://staging.example.com bash scripts/smoke-test.sh
curl https://staging.example.com/api/health
```

## Staging vs Production

| | Staging | Production |
|---|---------|------------|
| Branch/tag | `staging` | `community-connect-v*` tag |
| Seed data | Yes | No |
| Sentry | Optional | Required |
| Redis | Recommended | Required at scale |
