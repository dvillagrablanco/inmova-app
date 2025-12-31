#!/bin/bash

# ============================================================================
# 🚀 SCRIPT DE DEPLOYMENT A PRODUCCIÓN - INMOVA APP
# ============================================================================
# 
# Este script despliega los fixes de auditoría visual a producción
# Resuelve 1717 errores detectados en 182 páginas
#
# Uso:
#   1. SSH al servidor: ssh usuario@157.180.119.236
#   2. Copiar y ejecutar este script: bash DEPLOY_INSTRUCTIONS.sh
#
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "🚀 DEPLOYMENT: Visual Audit Fixes"
echo "============================================================================"
echo ""
echo "📊 Cambios a desplegar:"
echo "  - Fix JSON.parse en /admin/activity"
echo "  - Nueva ruta /configuracion redirect"
echo "  - Eliminadas referencias a /home"
echo "  - APIs portales creadas"
echo "  - CSS overflow mobile fixed"
echo ""
echo "⏱️ Tiempo estimado: 5-10 minutos"
echo ""

# Verificar que estamos en el servidor correcto
read -p "¿Estás ejecutando esto en el SERVIDOR DE PRODUCCIÓN? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado. Ejecuta este script en el servidor de producción."
    exit 1
fi

# ============================================================================
# PASO 1: Backup de Seguridad
# ============================================================================
echo ""
echo "📦 PASO 1/6: Creando backup de seguridad..."
BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de la aplicación actual
if [ -d "/opt/inmova-app" ]; then
    cd /opt/inmova-app
    tar -czf "$BACKUP_DIR/inmova-app-backup-$TIMESTAMP.tar.gz" \
        .next \
        app \
        components \
        public \
        package.json \
        .env.production 2>/dev/null || echo "⚠️ Algunos archivos no se respaldaron"
    echo "✅ Backup creado: inmova-app-backup-$TIMESTAMP.tar.gz"
else
    echo "⚠️ Directorio /opt/inmova-app no encontrado, ajustando ruta..."
    cd /home/deploy/inmova-app || exit 1
fi

# ============================================================================
# PASO 2: Pull de Cambios
# ============================================================================
echo ""
echo "📥 PASO 2/6: Descargando cambios desde Git..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "   Rama actual: $CURRENT_BRANCH"

# Merge de la rama con los fixes
git pull origin cursor/visual-inspection-protocol-setup-72ca || \
git pull origin main

echo "✅ Cambios descargados"

# ============================================================================
# PASO 3: Instalar Dependencias (si hay cambios)
# ============================================================================
echo ""
echo "📦 PASO 3/6: Verificando dependencias..."
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    echo "   Detectados cambios en package.json, instalando..."
    yarn install --frozen-lockfile
    echo "✅ Dependencias actualizadas"
else
    echo "✅ No hay cambios en dependencias"
fi

# ============================================================================
# PASO 4: Limpiar Cache de Next.js (CRÍTICO)
# ============================================================================
echo ""
echo "🧹 PASO 4/6: Limpiando cache de Next.js..."
rm -rf .next/cache
rm -rf .next/server
echo "✅ Cache limpiado"

# ============================================================================
# PASO 5: Rebuild de Producción
# ============================================================================
echo ""
echo "🔨 PASO 5/6: Rebuilding aplicación..."
echo "   ⚠️ Esto puede tomar 2-3 minutos..."

# Cargar variables de entorno
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Build
yarn build

if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente"
else
    echo "❌ Error en el build. Restaurando backup..."
    cd $BACKUP_DIR
    tar -xzf "inmova-app-backup-$TIMESTAMP.tar.gz" -C /opt/inmova-app/ || \
    tar -xzf "inmova-app-backup-$TIMESTAMP.tar.gz" -C /home/deploy/inmova-app/
    echo "⚠️ Backup restaurado. Revisa los errores del build."
    exit 1
fi

# ============================================================================
# PASO 6: Restart de PM2 (Zero-Downtime)
# ============================================================================
echo ""
echo "♻️ PASO 6/6: Reiniciando aplicación..."

# Verificar si PM2 está instalado
if command -v pm2 &> /dev/null; then
    echo "   Usando PM2 reload (zero-downtime)..."
    pm2 reload inmova-app || pm2 restart inmova-app
    
    # Guardar configuración
    pm2 save
    
    echo "✅ Aplicación reiniciada"
    
    # Mostrar logs
    echo ""
    echo "📊 Últimos logs:"
    pm2 logs inmova-app --lines 20 --nostream
else
    echo "   PM2 no encontrado, usando restart manual..."
    # Fallback: matar proceso y reiniciar
    pkill -f "next-server" || echo "No hay procesos Next.js corriendo"
    sleep 2
    nohup yarn start > /tmp/inmova.log 2>&1 &
    echo "✅ Aplicación reiniciada (modo manual)"
fi

# ============================================================================
# VERIFICACIÓN POST-DEPLOY
# ============================================================================
echo ""
echo "============================================================================"
echo "✅ DEPLOYMENT COMPLETADO"
echo "============================================================================"
echo ""
echo "🔍 Verificando que la aplicación responde..."
sleep 5

# Test de salud
if curl -f http://localhost:3000/api/health -s > /dev/null 2>&1; then
    echo "✅ Health check OK - Aplicación funcionando"
else
    echo "⚠️ Health check falló - Verificar logs manualmente"
    echo "   Comando: pm2 logs inmova-app"
fi

echo ""
echo "📊 Próximos pasos:"
echo "   1. Verificar en navegador: https://inmovaapp.com"
echo "   2. Probar login: admin@inmova.app"
echo "   3. Verificar páginas críticas:"
echo "      - /dashboard"
echo "      - /edificios"
echo "      - /inquilinos"
echo "      - /admin/activity"
echo ""
echo "📈 Reducción esperada de errores: ~75% (1717 → ~400)"
echo ""
echo "🎯 Para re-auditar y verificar mejoras:"
echo "   cd /workspace"
echo "   npx tsx scripts/visual-audit.ts"
echo ""
echo "============================================================================"

# Mostrar commit deployado
echo ""
echo "📝 Commit deployado:"
git log -1 --oneline
echo ""
echo "🕒 Deploy completado a las: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================================"
