# v1.0 Architecture — Community Connect

## Production readiness score: **78 / 100**

Honest assessment: strong web/PWA feature set and AI layer with mock fallback; native store shells, production PNG assets, rate limiting, and full offline sync remain post–v1.

| Dimension | Score | Notes |
|-----------|-------|-------|
| Feature completeness | 90 | Phases 1–10 + marketplace + v1 AI |
| AI / ML | 75 | OpenAI optional; rules + mocks solid |
| Mobile UX | 80 | 6-tab nav, PWA, gestures |
| Security | 75 | Audit pass with recommendations |
| Ops / deploy | 70 | Vercel-ready; monitoring TBD |
| Native apps | 40 | Docs only; Capacitor post–v1 |

## System diagram

```mermaid
flowchart TB
  subgraph client [Client]
    PWA[PWA / Next.js App Router]
    SW[Service Worker sw.js]
  end
  subgraph api [API Routes]
    AIChat[/api/ai/chat]
    AISearch[/api/search/ai]
    Insights[/api/ai/insights]
    Launch[/api/admin/launch-metrics]
  end
  subgraph ai [lib/ai]
    Core[core.ts]
    Assistant[assistant.ts]
    Search[search.ts]
    Mod[moderation.ts]
  end
  subgraph data [Data]
    PG[(PostgreSQL / Prisma)]
  end
  PWA --> SW
  PWA --> AIChat & AISearch & Insights
  AIChat --> Assistant --> Core
  AISearch --> Search --> Core
  Assistant --> PG
  Mod --> PG
  Launch --> PG
```

## Layers

- **App:** Next.js 16 App Router, `(main)` shell with sidebar + mobile nav  
- **DB:** Prisma 6 — User, Post, MarketplaceListing, ModerationCase, PersonalizationProfile  
- **AI:** Server-only modules; `OPENAI_API_KEY` enables live completions  
- **Mobile/PWA:** `manifest.json`, install prompt, 6-item bottom nav  
- **Deployment:** Vercel primary (`docs/DEPLOYMENT-V1.md`)

## Launch command center

`/admin/launch` → `/api/admin/launch-metrics` (ADMIN role)
