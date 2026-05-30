# Launch Checklist

Comprehensive pre-launch verification for Community Connect.

## Infrastructure

- [ ] PostgreSQL provisioned with connection pooler URL
- [ ] `npx prisma migrate deploy` succeeds on production DB
- [ ] Vercel project configured (`community-connect` root)
- [ ] All env vars set per `.env.example`
- [ ] `JWT_SECRET` is 64+ random characters (not default)
- [ ] `APP_ENV=production`, `NODE_ENV=production`
- [ ] Redis configured (recommended for prod)
- [ ] S3 bucket + IAM credentials (if using uploads)
- [ ] Email provider configured (Resend/SMTP)
- [ ] Sentry DSN configured (recommended)

## Security

- [ ] Security headers verified (curl -I)
- [ ] HTTPS enforced
- [ ] Admin routes require MODERATOR+ role
- [ ] Rate limits active on auth/write endpoints
- [ ] `npm audit` — no unresolved high/critical
- [ ] Secrets not committed to git
- [ ] OAuth credentials secured (if enabled)

## Application

- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] `bash scripts/smoke-test.sh` passes against staging
- [ ] `/api/health` returns `status: ok`
- [ ] Login/logout flow works
- [ ] Feed, alerts, marketplace load
- [ ] Admin console accessible to admin role
- [ ] `/admin/system` shows health metrics

## Data & Compliance

- [ ] Privacy policy live
- [ ] GDPR export endpoint tested
- [ ] Account deletion request flow tested
- [ ] Backup script tested (`scripts/backup-db.sh`)
- [ ] DR restore tested on staging

## Observability

- [ ] Structured logs visible in Vercel
- [ ] Sentry receiving test errors
- [ ] `/api/metrics` accessible to admins
- [ ] Uptime monitoring on `/api/health`

## CI/CD

- [ ] `community-connect-ci.yml` green on main
- [ ] Staging deploy workflow configured
- [ ] Production deploy workflow configured
- [ ] Rollback procedure documented

## Performance

- [ ] Lighthouse score acceptable on key pages
- [ ] Map loads via dynamic import
- [ ] DB indexes reviewed (see PHASE8.md)
- [ ] CDN caching for static assets

## Documentation

- [ ] README production quickstart updated
- [ ] DEPLOYMENT.md reviewed by ops
- [ ] On-call runbook assigned

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Security | | |
| Product | | |
