# Deployment v1.0

## Primary: Vercel

1. Import monorepo / `community-connect` root  
2. Framework preset: **Next.js**  
3. Build: `npm run build`  
4. Install: `npm install` (runs `postinstall` → `prisma generate`)  
5. Add Postgres (Vercel Postgres or Neon) → `DATABASE_URL`  
6. Run migrations: `npx prisma migrate deploy` (CI step or manual)  
7. Optional seed: `npm run db:seed` (non-prod only)  

## Env vars (master list)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | Auth token signing |
| `OPENAI_API_KEY` | No | Live AI; omit for mock mode |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `SESSION_MAX_AGE_SECONDS` | No | Cookie max-age |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical URL for links |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | No | Map features |
| Social OAuth vars | No | See `docs/SOCIAL-OAUTH.md` |
| `REDIS_URL` | No | Optional cache (ioredis) |

## AWS / Azure / GCP (overview)

- **AWS:** Amplify or ECS + RDS Postgres + CloudFront  
- **Azure:** Static Web Apps or Container Apps + Azure Database for PostgreSQL  
- **GCP:** Cloud Run + Cloud SQL  

Same container image: Node 20, `npm run build && npm start`.

## Monitoring

- Vercel Analytics + Logs  
- Recommended: Sentry for client/server errors  
- Uptime check: `/api/health` or `/dashboard`  
- Admin: `/admin/launch` for engagement snapshot  
