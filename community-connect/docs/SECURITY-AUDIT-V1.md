# Security Audit v1.0 — Community Connect

Audit date: 2026-05-30 (codebase review)

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Auth & sessions | Pass | HTTP-only JWT cookie, `requireAuth` on APIs |
| RBAC / admin | Pass | Middleware + `hasMinRole` for admin routes |
| API input validation | Pass | Zod schemas on mutations |
| AI security | Partial | Mock fallback safe; OpenAI prompts exclude auto-delete |
| Marketplace | Partial | Heuristic + AI scam signals; human moderation queue |
| Headers | Pass | `buildSecurityHeaders` in middleware |
| Secrets | Pass | No keys committed; `OPENAI_API_KEY` server-only |

## AI security

- `lib/ai/moderation.ts` creates `ModerationCase` only — **never auto-deletes** content  
- Chat/insights/search run server-side; no API key exposed to client  
- Demo mode when `OPENAI_API_KEY` unset  

## API security

- Protected routes enforced in `middleware.ts`  
- Onboarding cookie `cc_onboarded` prevents skipping interest setup  
- Rate limiting: recommend Upstash/Vercel WAF before high-traffic launch  

## Marketplace security

- `checkListingScamRisk` + `analyzeListing` for seller guidance  
- Admin moderation queue (`/api/admin/moderation`)  
- Report flow via existing `ContentReport` models  

## Findings / recommendations

1. Add rate limits on `/api/ai/chat` and `/api/search/ai`  
2. CSP report-only mode before enforcing strict CSP  
3. Pen-test OAuth social links when production keys added (`docs/SOCIAL-OAUTH.md`)  
