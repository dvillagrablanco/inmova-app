#!/bin/bash
#
# 📦 Backup Script para Base de Datos
# Inmova App - PropTech Platform
#
# Uso: bash backup-db.sh
# Cron: 0 2 * * * /home/deploy/inmova-app/backup-db.sh
#

set -e

BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_PLAIN=$(date +%Y-%m-%d)
LOG_FILE="$BACKUP_DIR/backup.log"

# Crear directorio de backups
mkdir -p $BACKUP_DIR

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "=================================="
log "Iniciando backup de base de datos"
log "=================================="

# Backup PostgreSQL
log "Creando backup de PostgreSQL..."
cd /home/deploy/inmova-app

if docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U inmova_user inmova > "$BACKUP_DIR/db_$TIMESTAMP.sql"; then
    SIZE=$(du -h "$BACKUP_DIR/db_$TIMESTAMP.sql" | cut -f1)
    log "✅ Backup creado: db_$TIMESTAMP.sql ($SIZE)"
else
    log "❌ Error creando backup de PostgreSQL"
    exit 1
fi

# Backup variables de entorno
if [ -f ".env.production" ]; then
    cp .env.production "$BACKUP_DIR/env_$TIMESTAMP.backup"
    log "✅ Backup de .env.production creado"
fi

# Comprimir backups antiguos (más de 7 días)
log "Comprimiendo backups antiguos..."
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -exec gzip {} \; 2>/dev/null || true
COMPRESSED=$(find $BACKUP_DIR -name "db_*.sql.gz" -mtime -1 | wc -l)
if [ $COMPRESSED -gt 0 ]; then
    log "✅ $COMPRESSED backups comprimidos"
fi

# Eliminar backups muy antiguos (más de 30 días)
log "Eliminando backups antiguos..."
DELETED=$(find $BACKUP_DIR -name "*.gz" -mtime +30 -delete -print | wc -l)
if [ $DELETED -gt 0 ]; then
    log "✅ $DELETED backups antiguos eliminados"
fi

# Estadísticas
TOTAL_BACKUPS=$(find $BACKUP_DIR -name "db_*.sql*" | wc -l)
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)

log "=================================="
log "Backup completado exitosamente"
log "Total de backups: $TOTAL_BACKUPS"
log "Tamaño total: $TOTAL_SIZE"
log "=================================="

# Upload a S3 (opcional)
if [ ! -z "$AWS_BUCKET_BACKUPS" ]; then
    log "Subiendo backup a S3..."
    if aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.sql" "s3://$AWS_BUCKET_BACKUPS/inmova/db_$TIMESTAMP.sql"; then
        log "✅ Backup subido a S3"
    else
        log "⚠️  Error subiendo a S3 (opcional)"
    fi
fi

exit 0
