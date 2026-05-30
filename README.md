# Community Connect

Modern full-stack community engagement platform: safety alerts, local services, events, reporting, AI assistant, marketplace, and HOA tools.

Built as a standalone app in the BlueCore monorepo at `community-connect/`.

## Tech stack

- **Next.js 16** (App Router) + React + TypeScript
- **Tailwind CSS v4** + Framer Motion + ShadCN-style UI components
- **PostgreSQL** + **Prisma ORM**
- **JWT** auth + RBAC + OAuth stubs
- **Socket.io** (custom dev server)
- **OpenAI** (optional) + **Google Maps** (optional)

## Quick start

```bash
cd community-connect
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed

npm run dev          # Next.js only (no Socket.io)
# OR
npm run dev:socket   # Next.js + Socket.io on :3000
```

Open [http://localhost:3000](http://localhost:3000).

**Demo credentials** (after seed):

- Email: `demo@communityconnect.app`
- Password: `Demo1234!`

## Environment variables

See [`.env.example`](.env.example). Required for full functionality:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes (prod) | PostgreSQL connection string |
| `JWT_SECRET` | Yes (prod) | Session signing secret |
| `OPENAI_API_KEY` | No | Mock AI responses without it |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Map placeholder without it |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Standard Next.js dev server |
| `npm run dev:socket` | Custom server with Socket.io |
| `npm run build` | Production build |
| `npm run test` | Unit tests (Vitest) |
| `npm run smoke` | API smoke tests (requires running server) |
| `npm run test:coverage` | Test coverage report |
| `npm run db:generate` | Prisma client generate |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed demo data |

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`docs/PHASE8.md`](docs/PHASE8.md) for full production architecture.

### Production quickstart

```bash
cd community-connect
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, APP_ENV=production

npm ci
npx prisma migrate deploy
npm run build
npm run test
npm start
```

**Verify:** `curl http://localhost:3000/api/health` and `bash scripts/smoke-test.sh`

### Vercel (frontend + API routes)

1. Connect repo, set root directory to `community-connect`
2. Set `DATABASE_URL`, `JWT_SECRET`, optional `REDIS_URL`, `SENTRY_DSN`
3. Build command: `prisma generate && next build` (see `vercel.json`)

Socket.io requires a separate Node service or use polling fallback on Vercel.

### Database (Railway / Supabase)

```bash
DATABASE_URL="postgresql://..."
npx prisma migrate deploy
npm run db:seed   # staging only
```

### CI/CD

- `.github/workflows/community-connect-ci.yml` — lint, typecheck, build, test
- Deploy templates for staging and production

### Launch checklist

[`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md)

## API documentation

See [`docs/API.md`](docs/API.md).

## Project structure

```
app/           # Pages & API routes
components/    # UI + layout
lib/           # Auth, Prisma, AI, maps, storage, socket
hooks/         # useSocket, etc.
prisma/        # Schema + seed
types/         # Shared TypeScript types
docs/          # API reference
server.ts      # Socket.io custom server
```

## Feature status

| Feature | Status |
|---------|--------|
| Auth (JWT, RBAC) | Functional |
| Community feed | Functional with DB; demo fallback |
| Safety alerts | Functional + Socket.io pattern |
| Events & RSVP | Functional |
| Reporting + AI category | Functional (mock AI without key) |
| Marketplace | Functional |
| HOA (announcements, docs, votes) | Functional / seed data |
| Admin dashboard | Functional with role gate |
| OAuth (Google/Apple/Facebook) | Stub endpoints |
| S3 uploads | Stub (local storage default) |
| Crime / heat maps | UI placeholders |
