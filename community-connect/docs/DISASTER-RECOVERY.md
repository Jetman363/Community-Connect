# Disaster Recovery

## Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **RTO** (Recovery Time Objective) | 4 hours | Restore app + DB from backup |
| **RPO** (Recovery Point Objective) | 1 hour | Hourly DB backups in production |

## Backup Strategy

### Database

- **Automated:** Supabase/Railway daily backups (enable in provider dashboard)
- **Manual:** `scripts/backup-db.sh`

```bash
export DATABASE_URL="postgresql://..."
bash scripts/backup-db.sh
# Output: ./backups/community_connect_YYYYMMDD_HHMMSS.sql.gz
```

### Application state

- Redis: ephemeral (cache/rate limits) — no backup required
- S3 uploads: enable versioning + cross-region replication for production
- Secrets: stored in Vercel/Railway env — document in password manager

## Restore Playbook

### 1. Database restore

```bash
# Verify backup
bash scripts/verify-backup.sh ./backups/community_connect_20250529_120000.sql.gz

# Restore to new database (staging first!)
gunzip -c backup.sql.gz | psql "$DATABASE_URL"
```

### 2. Application redeploy

1. Roll back Vercel deployment or redeploy last known-good tag
2. Run `npx prisma migrate deploy`
3. Verify `/api/health` returns `status: ok`

### 3. Cache warm-up

- Redis repopulates on traffic; no manual step required
- Optional: purge CDN cache after rollback

## Incident Scenarios

| Scenario | Action |
|----------|--------|
| DB corruption | Restore from latest backup; RPO ≤ 1h |
| Vercel outage | Wait or failover DNS to standby region |
| Redis down | App continues with in-memory fallback (degraded) |
| S3 outage | Uploads fail; serve cached assets from CDN |
| Credential leak | Rotate JWT_SECRET (forces re-login), DB password, API keys |

## Testing DR

- Quarterly: restore backup to staging DB and run smoke tests
- Document results in runbook ticket

## Contacts

- On-call: _[define team rotation]_
- Escalation: _[define escalation path]_
