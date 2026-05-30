#!/usr/bin/env bash
# PostgreSQL backup template — requires pg_dump and DATABASE_URL
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/community_connect_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
echo "Backing up to $FILE ..."
pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "Backup complete: $FILE ($(du -h "$FILE" | cut -f1))"
