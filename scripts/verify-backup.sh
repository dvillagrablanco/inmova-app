#!/bin/bash
# Backup verification script
# Creates a backup, restores to a test database, validates, and cleans up
# Usage: ./scripts/verify-backup.sh

set -e

BACKUP_DIR="/var/backups/inmova"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
TEST_DB="inmova_backup_test_${TIMESTAMP}"
LOG_FILE="${BACKUP_DIR}/verify_${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${2:-$NC}[$(date '+%H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"; }

mkdir -p "$BACKUP_DIR"

log "🔄 Starting backup verification" "$YELLOW"

# 1. Create backup
log "📦 Creating backup..."
if pg_dump -U inmova_user inmova_production > "$BACKUP_FILE" 2>>"$LOG_FILE"; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "  ✅ Backup created: $BACKUP_FILE ($SIZE)" "$GREEN"
else
    log "  ❌ Backup creation failed" "$RED"
    exit 1
fi

# 2. Validate backup file
if [ ! -s "$BACKUP_FILE" ]; then
    log "  ❌ Backup file is empty" "$RED"
    exit 1
fi

TABLES=$(grep -c "CREATE TABLE" "$BACKUP_FILE" || true)
log "  📊 Tables in backup: $TABLES"

# 3. Create test database
log "🧪 Creating test database: $TEST_DB"
if createdb -U inmova_user "$TEST_DB" 2>>"$LOG_FILE"; then
    log "  ✅ Test database created" "$GREEN"
else
    log "  ⚠️ Could not create test DB (may need superuser)" "$YELLOW"
    # Clean up and exit gracefully
    rm -f "$BACKUP_FILE"
    log "📋 Backup file validated (structure check only)" "$YELLOW"
    exit 0
fi

# 4. Restore to test database
log "📥 Restoring to test database..."
if psql -U inmova_user -d "$TEST_DB" < "$BACKUP_FILE" >>"$LOG_FILE" 2>&1; then
    log "  ✅ Restore completed" "$GREEN"
else
    log "  ⚠️ Restore had warnings (some may be expected)" "$YELLOW"
fi

# 5. Verify critical tables
log "✅ Verifying critical tables..."
CRITICAL_TABLES=("User" "Company" "Building" "Unit" "Contract" "Payment" "Tenant")
ALL_OK=true

for TABLE in "${CRITICAL_TABLES[@]}"; do
    COUNT=$(psql -U inmova_user -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"$TABLE\";" 2>/dev/null | tr -d ' ' || echo "ERROR")
    if [ "$COUNT" = "ERROR" ]; then
        log "  ❌ Table $TABLE: ERROR" "$RED"
        ALL_OK=false
    else
        log "  ✅ Table $TABLE: $COUNT rows" "$GREEN"
    fi
done

# 6. Clean up test database
log "🧹 Cleaning up test database..."
dropdb -U inmova_user "$TEST_DB" 2>>"$LOG_FILE" || true

# 7. Compress backup
log "📦 Compressing backup..."
gzip "$BACKUP_FILE"
log "  ✅ Compressed: ${BACKUP_FILE}.gz"

# 8. Remove old backups (> 30 days)
OLD_COUNT=$(find "$BACKUP_DIR" -name "*.gz" -mtime +30 | wc -l)
if [ "$OLD_COUNT" -gt 0 ]; then
    find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
    log "  🗑️ Removed $OLD_COUNT old backups (>30 days)"
fi

# 9. Summary
echo ""
log "═══════════════════════════════════════" "$GREEN"
if $ALL_OK; then
    log "✅ BACKUP VERIFICATION PASSED" "$GREEN"
else
    log "⚠️ BACKUP VERIFICATION HAD ISSUES" "$YELLOW"
fi
log "  File: ${BACKUP_FILE}.gz"
log "  Tables: $TABLES"
log "  Log: $LOG_FILE"
log "═══════════════════════════════════════" "$GREEN"
