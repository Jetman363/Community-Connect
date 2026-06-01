# Community Connect — local startup

Use this checklist when starting the app for real development (not a throwaway demo session).

## Prerequisites

- Node.js 20+ and `npm install` already run in this directory
- Docker (for local PostgreSQL)

## 1. Environment

```bash
cd community-connect
cp .env.example .env   # skip if .env already exists
```

Edit `.env` and set at minimum:

| Variable | Local dev |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL URL (see `.env.example`) |
| `JWT_SECRET` | Long random string (≥ 32 chars) |
| `APP_ENV` | `development` |
| `NEXT_PUBLIC_APP_ENV` | `development` |
| `NODE_ENV` | `development` |

For **production** deploys, set `APP_ENV=production`, `NODE_ENV=production`, and use `npx prisma migrate deploy` + `npm run build && npm start`. See `README.md` and `docs/DEPLOYMENT.md`.

There are no separate “demo mode” env flags; optional integrations (OpenAI, Maps, Redis) can stay empty for local use.

## 2. Database

PostgreSQL container (typical name: `docker-postgres-1`):

```bash
docker start docker-postgres-1    # if stopped
docker ps --filter name=docker-postgres-1
```

Stop when you are done (optional):

```bash
docker stop docker-postgres-1
```

Apply schema:

```bash
npx prisma migrate deploy
```

Optional fresh sample users and community data:

```bash
npm run db:seed
```

After seed, test login: `demo@communityconnect.app` / `Demo1234!` (see `README.md` for other seeded roles).

## 3. Run the app

**Development:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Production-like local check:**

```bash
npm run build
npm start
```

**With Socket.io** (optional): `npm run dev:socket`

## 4. Clean rebuild

If builds behave oddly:

```bash
rm -rf .next
npm run build
```

## 5. PWA / service worker (after demo or production testing)

Production builds register `/sw.js`. If you previously installed the app or cached an old demo build:

1. In Chrome/Edge: DevTools → **Application** → **Service Workers** → **Unregister**, then **Clear site data** for `localhost:3000`.
2. Or run in the browser console on the site:

```javascript
navigator.serviceWorker.getRegistrations().then((regs) =>
  Promise.all(regs.map((r) => r.unregister()))
);
```

During `npm run dev`, the app automatically unregisters service workers (`components/pwa/pwa-register.tsx`).

## 6. Stop dev server

Find and stop only the process listening on port 3000:

```bash
lsof -ti :3000 | xargs kill
```

Avoid killing unrelated Node processes.
