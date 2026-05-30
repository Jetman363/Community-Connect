#!/usr/bin/env bash
# Placeholder backup verification — extend with restore-to-temp-db checks
set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "File not found: $BACKUP_FILE"
  exit 1
fi

echo "Verifying $BACKUP_FILE ..."
gzip -t "$BACKUP_FILE"
LINES=$(zcat "$BACKUP_FILE" | head -n 20)
if echo "$LINES" | grep -q "PostgreSQL database dump"; then
  echo "OK: valid pg_dump header detected"
else
  echo "WARN: pg_dump header not found in first 20 lines — manual review recommended"
fi

echo "Verification complete (stub — run full restore test in staging)"
