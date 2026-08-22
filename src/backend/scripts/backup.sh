#!/usr/bin/env bash
# Dayflow HRMS — nightly logical backup with 14-day retention.
# Install:  0 2 * * *  /srv/dayflow/backend/scripts/backup.sh >> /var/log/dayflow-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/dayflow}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_NAME="${DB_NAME:-dayflow_hrms}"
DB_USER="${DB_USER:-dayflow}"
DB_HOST="${DB_HOST:-127.0.0.1}"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="${BACKUP_DIR}/${DB_NAME}-${STAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# --single-transaction keeps InnoDB tables consistent without locking writers.
mysqldump \
  --host="${DB_HOST}" \
  --user="${DB_USER}" \
  --single-transaction \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  "${DB_NAME}" | gzip -9 > "${TARGET}"

echo "[$(date -Is)] backup written: ${TARGET} ($(du -h "${TARGET}" | cut -f1))"

# Verify the dump is readable before trusting it.
gzip -t "${TARGET}"

find "${BACKUP_DIR}" -name "${DB_NAME}-*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date -Is)] retention applied (${RETENTION_DAYS} days)"

# Restore:  gunzip -c backup.sql.gz | mysql -u dayflow -p dayflow_hrms
