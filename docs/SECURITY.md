# Security

## Threat Model Summary

| Threat | Mitigation | Status |
|--------|------------|--------|
| Session hijacking | httpOnly + Secure + SameSite cookies | Implemented |
| CSRF | SameSite=Lax; see `lib/security/csrf.ts` | Implemented |
| XSS | CSP headers; input sanitization | Baseline |
| Brute-force login | Rate limiting (20/min) | Implemented |
| Privilege escalation | RBAC + middleware role gates | Implemented |
| Data exfiltration | Auth on `/api/users/me/*`; admin metrics gated | Implemented |
| Injection | Prisma parameterized queries; Zod validation | Implemented |
| File upload abuse | Rate limits; type/size checks on upload route | Partial |

## Security Headers

Configured in `next.config.ts` and `lib/security/headers.ts`:

- Content-Security-Policy (baseline)
- Strict-Transport-Security (production only)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

## Security Audit Checklist

- [ ] Rotate `JWT_SECRET` before production launch
- [ ] Enable HTTPS only (Vercel default)
- [ ] Set `APP_ENV=production` and `NODE_ENV=production`
- [ ] Configure Redis for distributed rate limits
- [ ] Enable Sentry error tracking
- [ ] Review admin route access (MODERATOR+ / PUBLIC_SAFETY for ops)
- [ ] Run `npm audit` and resolve high/critical
- [ ] Penetration test on auth + API endpoints
- [ ] Verify GDPR export/delete workflows
- [ ] Enable DB encryption at rest (provider)
- [ ] Configure WAF (Cloudflare) for DDoS

## Incident Response Outline

1. **Detect** — Sentry alert, health check failure, user report
2. **Triage** — Classify severity (P1–P4); assign on-call
3. **Contain** — Suspend affected users, rotate secrets, block IPs
4. **Eradicate** — Patch vulnerability, deploy fix
5. **Recover** — Verify health, notify users if required
6. **Post-mortem** — Document timeline, root cause, action items

## Session Security

- Cookie: `cc_token`, httpOnly, SameSite=Lax, Secure in production
- Expiry: `SESSION_MAX_AGE_SECONDS` (default 7 days)
- MFA stub: `/api/users/me/mfa` (full TOTP in Phase 9)

## Reporting Vulnerabilities

Email: security@communityconnect.app (placeholder)
