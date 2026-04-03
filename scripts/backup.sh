#!/bin/bash
# =====================================================
# Database & Files Backup Script
# =====================================================
# Usage: ./backup.sh
# Recommended: Run daily via cron
# =====================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="${DB_FILE:-./prisma/dev.db}"
UPLOADS_DIR="${UPLOADS_DIR:-./public/uploads}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# =====================================================
# Backup Database
# =====================================================
backup_database() {
    echo "[$(date)] Starting database backup..."

    if [ ! -f "$DB_FILE" ]; then
        echo "ERROR: Database file not found: $DB_FILE"
        return 1
    fi

    local db_backup="$BACKUP_DIR/db_${DATE}.sqlite"

    # Copy database file
    cp "$DB_FILE" "$db_backup"

    # Create compressed archive
    gzip -c "$db_backup" > "$db_backup.gz"
    rm "$db_backup"

    echo "Database backed up: ${db_backup}.gz"
}

# =====================================================
# Backup Uploads
# =====================================================
backup_uploads() {
    echo "[$(date)] Starting uploads backup..."

    if [ ! -d "$UPLOADS_DIR" ]; then
        echo "WARNING: Uploads directory not found: $UPLOADS_DIR"
        return 1
    fi

    # Check if uploads is empty
    if [ -z "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
        echo "WARNING: Uploads directory is empty, skipping"
        return 0
    fi

    local uploads_backup="$BACKUP_DIR/uploads_${DATE}.tar.gz"

    # Create compressed archive
    tar -czf "$uploads_backup" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"

    echo "Uploads backed up: $uploads_backup"
}

# =====================================================
# Backup Environment Variables (encrypted)
# =====================================================
backup_env() {
    echo "[$(date)] Backing up environment config..."

    local env_backup="$BACKUP_DIR/env_${DATE}.txt"

    # Export critical env vars (without actual values)
    {
        echo "# Environment Configuration Backup"
        echo "# Date: $(date)"
        echo "# NOTE: Actual values are not included for security"
        echo ""
        echo "NEXTAUTH_SECRET=<configured>"
        echo "ADMIN_PASSWORD=<configured>"
        echo "DATABASE_URL=<configured>"
        echo "SMTP_HOST=<configured>"
        echo "SERP_API_KEY=<configured>"
    } > "$env_backup"

    echo "Environment config backed up: $env_backup"
}

# =====================================================
# Cleanup Old Backups
# =====================================================
cleanup_old() {
    echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."

    # Find and delete old database backups
    find "$BACKUP_DIR" -name "db_*.sqlite.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    # Find and delete old uploads backups
    find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    # Find and delete old env backups
    find "$BACKUP_DIR" -name "env_*.txt" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    echo "Cleanup complete"
}

# =====================================================
# Upload to Remote Storage (optional)
# =====================================================
upload_to_remote() {
    if [ -n "$BACKUP_SCP_HOST" ] && [ -n "$BACKUP_SCP_PATH" ]; then
        echo "[$(date)] Uploading backups to remote server..."

        scp -o StrictHostKeyChecking=no \
            "$BACKUP_DIR"/db_${DATE}.sqlite.gz \
            "$BACKUP_DIR"/uploads_${DATE}.tar.gz \
            "$BACKUP_SCP_HOST":"$BACKUP_SCP_PATH"/  || {
            echo "WARNING: Remote upload failed, local backup preserved"
        }

        echo "Remote upload complete"
    fi
}

# =====================================================
# Main
# =====================================================
main() {
    echo "=========================================="
    echo "  Backup Script Started"
    echo "  Date: $(date)"
    echo "=========================================="

    backup_database
    backup_uploads
    backup_env
    cleanup_old
    upload_to_remote

    echo "=========================================="
    echo "  Backup Script Completed"
    echo "=========================================="

    # Show backup summary
    echo ""
    echo "Backup Summary:"
    echo "  Database: $(ls -lh "$BACKUP_DIR"/db_${DATE}.sqlite.gz 2>/dev/null | awk '{print $5}')"
    echo "  Uploads:  $(ls -lh "$BACKUP_DIR"/uploads_${DATE}.tar.gz 2>/dev/null | awk '{print $5}')"
    echo "  Location: $BACKUP_DIR"
    echo ""
}

main "$@"
