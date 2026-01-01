#!/bin/bash
###############################################################################
# Script para deployar planes de suscripción a producción
# Ejecutar: bash scripts/deploy-planes-production.sh
###############################################################################

set -e

echo "🚀 Deployando sistema de planes de suscripción..."
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para log
log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Error: package.json no encontrado. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

# Copiar archivos necesarios al servidor
log_info "Conectando al servidor de producción..."

SERVER="root@157.180.119.236"
APP_DIR="/opt/inmova-app"

# Copiar archivos
log_info "Copiando archivos al servidor..."
scp -o StrictHostKeyChecking=no \
    scripts/seed-subscription-plans.ts \
    app/planes/page.tsx \
    app/api/public/subscription-plans/route.ts \
    ${SERVER}:/tmp/ 2>/dev/null || log_error "Error copiando archivos"

# Ejecutar en el servidor
log_info "Ejecutando deployment en servidor..."

ssh -o StrictHostKeyChecking=no ${SERVER} << 'ENDSSH'
set -e

APP_DIR="/opt/inmova-app"
cd $APP_DIR

# Colores
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo "📦 Copiando archivos nuevos..."

# Crear directorios si no existen
mkdir -p app/api/public/subscription-plans

# Mover archivos
mv /tmp/seed-subscription-plans.ts scripts/
mv /tmp/page.tsx app/planes/
mv /tmp/route.ts app/api/public/subscription-plans/

echo -e "${GREEN}✓${NC} Archivos copiados"

# Cargar variables de entorno
export $(cat .env.production | grep -v ^# | xargs)

echo ""
echo "🌱 Ejecutando seed de planes..."

# Ejecutar seed
npx tsx scripts/seed-subscription-plans.ts

echo ""
echo "🔨 Building Next.js..."

# Build
npm run build

echo ""
echo "🔄 Reloading PM2..."

# Reload PM2
pm2 reload inmova-app

echo ""
echo "⏳ Esperando warm-up..."
sleep 10

echo ""
echo "✅ Health check..."

# Verificar que la app responde
curl -s http://localhost:3000/api/health || echo "⚠️ Health check falló"

echo ""
echo "📋 Verificando planes en BD..."

# Verificar planes
psql $DATABASE_URL -c "SELECT nombre, \"precioMensual\", \"maxPropiedades\", activo FROM \"SubscriptionPlan\" ORDER BY \"precioMensual\";"

echo ""
echo -e "${GREEN}✓ Deployment completado exitosamente!${NC}"
echo ""
echo "URLs para verificar:"
echo "  • https://inmovaapp.com/planes"
echo "  • https://inmovaapp.com/api/public/subscription-plans"
echo "  • https://inmovaapp.com/admin/planes"
echo ""

ENDSSH

log_success "Deployment completado!"
echo ""
echo "Próximos pasos:"
echo "  1. Verificar https://inmovaapp.com/planes en navegador"
echo "  2. Verificar que los 4 planes aparecen correctamente"
echo "  3. Probar toggle mensual/anual"
echo "  4. Intentar registro con plan preseleccionado"
echo ""
