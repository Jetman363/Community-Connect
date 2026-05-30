# Compliance

Privacy, data retention, and user data rights for Community Connect.

## Privacy Principles

- Collect minimum data required for community features
- Community-scoped data isolation where applicable
- Audit logging for admin actions
- User-accessible export and deletion requests

## Data Categories

| Category | Examples | Retention |
|----------|----------|-----------|
| Account | email, profile, role | Until deletion + 30-day grace |
| Content | posts, comments, listings | Until user/community deletion |
| Safety | reports, alerts | 7 years (jurisdiction-dependent) |
| Audit logs | admin actions | 365 days default (`AuditLogRetention`) |
| Sessions | token hash, IP, user agent | Until expiry |

## GDPR / CCPA Workflows

### Data Export

`GET /api/users/me/export` — returns JSON bundle of user profile, posts, notifications.

**Production TODO:** Include all related entities (comments, favorites, messages).

### Account Deletion

`POST /api/users/me/delete` with `{ confirmEmail, reason? }`:

1. Validates email matches session
2. Records audit log with 30-day grace period
3. Scheduled purge job (Phase 9) anonymizes/deletes data

UI: Settings → Privacy & Data

## Data Retention Policy

- **Inactive accounts:** Review after 24 months (Phase 9 cron)
- **Moderation records:** Retained per legal hold requirements
- **Backups:** 30 days rolling (provider-dependent)

## Cookie Policy

- `cc_token` — authentication (essential)
- Theme preference — localStorage (functional)

## Third-Party Processors

| Processor | Purpose | DPA required |
|-----------|---------|--------------|
| Vercel | Hosting | Yes |
| Supabase/Railway | Database | Yes |
| OpenAI | AI features (optional) | Yes if enabled |
| Google Maps | Map display (optional) | Yes if enabled |
| Resend/SMTP | Email | Yes if enabled |
| Sentry | Error tracking | Yes if enabled |

## User Rights

- Access — export endpoint
- Rectification — profile settings
- Erasure — deletion request
- Portability — JSON export format
- Objection — contact support (placeholder)

## Compliance Checklist

- [ ] Privacy policy published
- [ ] Cookie banner (if non-essential cookies added)
- [ ] DPA signed with processors
- [ ] Deletion purge job implemented
- [ ] Data retention cron configured
- [ ] Legal review for safety report retention
