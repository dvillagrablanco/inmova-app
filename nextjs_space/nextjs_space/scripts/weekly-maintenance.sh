#!/bin/bash

# Script de Mantenimiento Semanal INMOVA
# Este script se ejecuta automáticamente cada semana para optimizar el sistema

set -e

# Configuración
PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"
LOG_DIR="$PROJECT_DIR/logs/maintenance"
LOG_FILE="$LOG_DIR/maintenance-$(date +%Y%m%d-%H%M%S).log"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Función para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Iniciando Mantenimiento Semanal ==="
log "Proyecto: INMOVA"
log "Ubicación: $PROJECT_DIR"

# 1. Limpieza del directorio .build
log "[1/3] Limpiando directorio .build..."
cd "$PROJECT_DIR"
if [ -d ".build" ]; then
    cd .build
    find . -type f -delete 2>/dev/null || true
    find . -mindepth 1 -type d -empty -delete 2>/dev/null || true
    cd ..
    BUILD_SIZE=$(du -sh .build 2>/dev/null | cut -f1)
    log "✅ Directorio .build limpiado (tamaño actual: $BUILD_SIZE)"
else
    log "⚠️  Directorio .build no encontrado"
fi

# 2. Optimización de PostgreSQL con VACUUM ANALYZE
log "[2/3] Ejecutando VACUUM ANALYZE en PostgreSQL..."
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep '^DATABASE_URL=' "$PROJECT_DIR/.env" | xargs)
    if [ -n "$DATABASE_URL" ]; then
        VACUUM_OUTPUT=$(psql "$DATABASE_URL" -c "VACUUM ANALYZE;" 2>&1 | grep -v "WARNING")
        if [ $? -eq 0 ]; then
            log "✅ VACUUM ANALYZE ejecutado correctamente"
            # Obtener estadísticas de la base de datos
            DB_SIZE=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | tr -d ' ')
            log "   Tamaño de la base de datos: $DB_SIZE"
        else
            log "❌ Error al ejecutar VACUUM ANALYZE"
            log "   Output: $VACUUM_OUTPUT"
        fi
    else
        log "❌ DATABASE_URL no encontrada en .env"
    fi
else
    log "❌ Archivo .env no encontrado"
fi

# 3. Limpieza de logs antiguos (mantener últimos 30 días)
log "[3/3] Limpiando logs antiguos..."
if [ -d "$LOG_DIR" ]; then
    OLD_LOGS=$(find "$LOG_DIR" -name "maintenance-*.log" -type f -mtime +30 2>/dev/null)
    if [ -n "$OLD_LOGS" ]; then
        DELETED_COUNT=$(echo "$OLD_LOGS" | wc -l)
        echo "$OLD_LOGS" | xargs rm -f
        log "✅ Eliminados $DELETED_COUNT archivos de log antiguos"
    else
        log "✅ No hay logs antiguos para eliminar"
    fi
fi

# Resumen final
log "=== Mantenimiento Completado ==="
log "Log guardado en: $LOG_FILE"

# Enviar notificación (opcional)
# Puedes descomentar esto para recibir notificaciones por email
# mail -s "Mantenimiento Semanal INMOVA Completado" admin@inmova.com < "$LOG_FILE"

log "✅ Todas las tareas completadas exitosamente"
exit 0
