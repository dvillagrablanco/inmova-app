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

# 1. Limpieza de memoria y cachés
log "[1/5] Ejecutando limpieza de memoria y cachés..."
cd "$PROJECT_DIR"
if [ -f "scripts/cleanup-memory.sh" ]; then
    ./scripts/cleanup-memory.sh --silent >> "$LOG_FILE" 2>&1
    log "✅ Limpieza de memoria completada"
else
    log "⚠️  Script cleanup-memory.sh no encontrado"
fi

# 2. Análisis de código TypeScript
log "[2/5] Ejecutando análisis de código..."
if [ -f "scripts/analyze-typescript.ts" ]; then
    REPORT_FILE="weekly-report-$(date +%Y%m%d).txt"
    yarn tsx scripts/analyze-typescript.ts > "$REPORT_FILE" 2>&1
    log "✅ Análisis de código completado"
    log "   Reporte guardado en: $REPORT_FILE"
else
    log "⚠️  Script analyze-typescript.ts no encontrado"
fi

# 3. Limpieza del directorio .build
log "[3/5] Verificando espacio en disco..."
BUILD_SIZE=$(du -sh .build 2>/dev/null | cut -f1 || echo "N/A")
NEXT_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "N/A")
log "   .build/: $BUILD_SIZE"
log "   .next/:  $NEXT_SIZE"

# 4. Optimización de PostgreSQL con VACUUM ANALYZE
log "[4/5] Ejecutando VACUUM ANALYZE en PostgreSQL..."
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

# 5. Limpieza de logs y reportes antiguos (mantener últimos 30 días)
log "[5/5] Limpiando archivos antiguos..."

# Limpiar logs de mantenimiento
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

# Limpiar reportes semanales antiguos
cd "$PROJECT_DIR"
OLD_REPORTS=$(find . -name "weekly-report-*.txt" -type f -mtime +30 2>/dev/null)
if [ -n "$OLD_REPORTS" ]; then
    DELETED_REPORTS=$(echo "$OLD_REPORTS" | wc -l)
    echo "$OLD_REPORTS" | xargs rm -f
    log "✅ Eliminados $DELETED_REPORTS reportes antiguos"
else
    log "✅ No hay reportes antiguos para eliminar"
fi

# Resumen final
log "=== Mantenimiento Completado ==="
log "Log guardado en: $LOG_FILE"

# Enviar notificación (opcional)
# Puedes descomentar esto para recibir notificaciones por email
# mail -s "Mantenimiento Semanal INMOVA Completado" admin@inmova.com < "$LOG_FILE"

log "✅ Todas las tareas completadas exitosamente"
exit 0
