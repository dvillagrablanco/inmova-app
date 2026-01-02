#!/bin/bash
# 🛡️ BACKUP AUTOMÁTICO DE BASE DE DATOS Y CONFIGURACIÓN
# Este script se ejecuta ANTES de cada deploy para preservar datos críticos

set -e

BACKUP_DIR="/opt/inmova-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/inmova-app"

echo "🛡️ INICIANDO BACKUP AUTOMÁTICO - $TIMESTAMP"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# 1. BACKUP DE BASE DE DATOS (PostgreSQL)
echo "📦 1/5 - Backup de PostgreSQL..."
PGPASSWORD='InmovaSecure2026DB' pg_dump -h localhost -U inmova_user -d inmova_production \
    > "$BACKUP_DIR/db_$TIMESTAMP.sql"
echo "   ✅ Base de datos respaldada: db_$TIMESTAMP.sql"

# 2. BACKUP DE .env.production (CRÍTICO)
echo "📦 2/5 - Backup de .env.production..."
if [ -f "$APP_DIR/.env.production" ]; then
    cp "$APP_DIR/.env.production" "$BACKUP_DIR/env_$TIMESTAMP.backup"
    echo "   ✅ .env.production respaldado"
else
    echo "   ⚠️  .env.production NO ENCONTRADO"
fi

# 3. BACKUP DE ecosystem.config.js (PM2)
echo "📦 3/5 - Backup de ecosystem.config.js..."
if [ -f "$APP_DIR/ecosystem.config.js" ]; then
    cp "$APP_DIR/ecosystem.config.js" "$BACKUP_DIR/ecosystem_$TIMESTAMP.backup"
    echo "   ✅ ecosystem.config.js respaldado"
fi

# 4. BACKUP DE start-with-env.sh
echo "📦 4/5 - Backup de start-with-env.sh..."
if [ -f "$APP_DIR/start-with-env.sh" ]; then
    cp "$APP_DIR/start-with-env.sh" "$BACKUP_DIR/start_script_$TIMESTAMP.backup"
    echo "   ✅ start-with-env.sh respaldado"
fi

# 5. GUARDAR INFORMACIÓN DE USUARIOS CRÍTICOS
echo "📦 5/5 - Backup de usuarios críticos..."
PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production \
    -c "COPY (SELECT id, email, name, role, activo, \"companyId\" FROM users WHERE email IN ('superadmin@inmova.app', 'admin@inmova.app')) TO STDOUT WITH CSV HEADER" \
    > "$BACKUP_DIR/usuarios_criticos_$TIMESTAMP.csv"
echo "   ✅ Usuarios críticos respaldados"

# 6. LIMPIAR BACKUPS ANTIGUOS (mantener últimos 30 días)
echo "🧹 Limpiando backups antiguos (>30 días)..."
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.backup" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.csv" -mtime +30 -delete

# 7. COMPRIMIR BACKUPS ANTIGUOS (>7 días)
echo "📦 Comprimiendo backups antiguos..."
find "$BACKUP_DIR" -name "*.sql" -mtime +7 ! -name "*.gz" -exec gzip {} \;

echo ""
echo "✅ BACKUP COMPLETADO"
echo "📁 Ubicación: $BACKUP_DIR"
echo "📊 Archivos creados:"
ls -lh "$BACKUP_DIR" | grep "$TIMESTAMP" | awk '{print "   - " $9 " (" $5 ")"}'

# Retornar la ruta del backup para uso en otros scripts
echo "$BACKUP_DIR/db_$TIMESTAMP.sql" > /tmp/last_backup_path.txt
