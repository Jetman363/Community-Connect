# Performance — v1.0

## Lighthouse targets (production)

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTFB | < 800ms (Vercel edge) |

## Applied optimizations

- `next/image` via `CommunityImage` for feed and cards
- Dynamic import pattern documented for map and admin charts (lazy load on route)
- API cache headers: `/api/search/ai` (30s private), `/api/ai/insights` (120s private), `/api/admin/launch-metrics` (60s private)
- Service worker shell cache for dashboard/discover/marketplace routes
- Feed ranking client-side to avoid extra round-trips
- Prisma `withDbTimeout` on search and launch metrics

## Recommended next steps

- Enable `@next/bundle-analyzer` (`npm run analyze`)
- Redis session/cache for hot search queries
- Image CDN (Cloudinary / Vercel Blob) for marketplace uploads
