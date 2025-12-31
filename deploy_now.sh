#!/bin/bash
# DEPLOYMENT DEL ECOSISTEMA DE INTEGRACIONES
# Ejecutar en el servidor: 157.180.119.236

set -e

echo "🚀 INICIANDO DEPLOYMENT DE INTEGRACIONES"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navegar al directorio
cd /opt/inmova-app || { echo -e "${RED}❌ No se puede acceder a /opt/inmova-app${NC}"; exit 1; }
echo -e "${GREEN}✅ Directorio: $(pwd)${NC}"
echo ""

# Git pull
echo "📥 Pulling código de GitHub..."
git pull origin main || { echo -e "${YELLOW}⚠️ Git pull falló, pero continuamos${NC}"; }
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
yarn install || { echo -e "${RED}❌ yarn install falló${NC}"; exit 1; }
echo ""

# Generar Prisma Client
echo "🗄️ Generando Prisma Client..."
npx prisma generate || { echo -e "${RED}❌ prisma generate falló${NC}"; exit 1; }
echo ""

# Aplicar migraciones
echo "📊 Aplicando migraciones..."
npx prisma migrate deploy || { echo -e "${YELLOW}⚠️ Migraciones fallaron o no hay pendientes${NC}"; }
echo ""

# Restart PM2
echo "🔄 Restarting app con PM2..."
pm2 restart inmova-app || { echo -e "${YELLOW}⚠️ PM2 restart falló, intentando start...${NC}"; pm2 start ecosystem.config.js; }
echo ""

# Esperar warm-up
echo "⏳ Esperando 10 segundos para warm-up..."
sleep 10
echo ""

# Health check
echo "🏥 Health check..."
if curl -f http://localhost:3000/api/health 2>/dev/null; then
    echo -e "${GREEN}✅ Health check OK${NC}"
else
    echo -e "${RED}❌ Health check falló${NC}"
fi
echo ""

# Logs
echo "📋 Últimos 20 logs:"
pm2 logs inmova-app --lines 20 --nostream
echo ""

echo "=========================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO${NC}"
echo "=========================================="
echo ""
echo "🔍 VERIFICACIONES MANUALES:"
echo "1. https://inmovaapp.com/api/health"
echo "2. https://inmovaapp.com/api-docs"
echo "3. https://inmovaapp.com/dashboard/integrations"
echo "4. https://inmovaapp.com/dashboard/integrations/api-keys"
echo ""

