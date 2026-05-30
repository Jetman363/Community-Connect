# QA Report v1.0

## Test matrix

| Area | Automated | Manual |
|------|-----------|--------|
| Auth login/register | `lib/validations.test.ts` | Login redirect, cookie |
| AI core utils | `lib/ai/core.test.ts` | Chat with/without OpenAI key |
| Marketplace nav | — | Mobile 6-tab, sidebar marketplace |
| Smart search | — | `/search` tabs + NL mode |
| Onboarding | — | Interest save → dashboard |
| PWA | — | Install prompt, offline shell |
| Feed | — | Pull-to-refresh, swipe save/share |
| Admin launch | — | `/admin/launch` metrics |

## Known risks

- Onboarding middleware requires `cc_onboarded` cookie — existing dev users must complete onboarding once or set cookie via API  
- PNG icons are placeholders until SVG conversion (see `public/icons/README.md`)  
- `sw.js` caches limited shell; not full offline data  
- Native apps not in repo — store packages are documentation only  

## Launch checklist

- [ ] `npm run build` && `npm run test` green  
- [ ] `prisma migrate deploy` on production DB  
- [ ] Set production env vars (`docs/DEPLOYMENT-V1.md`)  
- [ ] Regenerate PWA PNG icons from SVG  
- [ ] Host privacy/terms pages  
- [ ] Smoke test: marketplace, feed, AI chat, search  
- [ ] Admin launch metrics accessible to ADMIN role  
- [ ] Enable monitoring (Sentry/Datadog)  

Path: **this file** (`docs/QA-REPORT-V1.md`)
