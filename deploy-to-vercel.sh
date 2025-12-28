#!/bin/bash

# Script de Deployment Completo a Vercel
# Para inmovaapp.com

set -e

echo "🚀 DEPLOYMENT COMPLETO A VERCEL"
echo "================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Login a Vercel
echo -e "${BLUE}🔐 Paso 1: Verificando login en Vercel...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Ejecutando login...${NC}"
    vercel login
fi
echo -e "${GREEN}✅ Login verificado${NC}"
echo ""

# 2. Link del proyecto (si no está linkeado)
echo -e "${BLUE}🔗 Paso 2: Verificando link del proyecto...${NC}"
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${YELLOW}⚠️  Proyecto no linkeado. Ejecutando link...${NC}"
    vercel link
fi
echo -e "${GREEN}✅ Proyecto linkeado${NC}"
echo ""

# 3. Configurar variables de entorno (si no existen)
echo -e "${BLUE}⚙️  Paso 3: Configurando variables de entorno...${NC}"
echo ""
echo -e "${YELLOW}IMPORTANTE: Necesitas configurar estas variables en Vercel Dashboard:${NC}"
echo ""
echo "1. Ve a: https://vercel.com/tu-proyecto/settings/environment-variables"
echo ""
echo "2. Agrega estas variables para PRODUCTION:"
echo ""
echo "   DATABASE_URL=postgresql://..."
echo "   NEXTAUTH_URL=https://inmovaapp.com"
echo "   NEXTAUTH_SECRET=tu-secret-aqui"
echo "   NODE_ENV=production"
echo ""
echo "3. Si usas Vercel Postgres, la DATABASE_URL se configura automáticamente"
echo ""

read -p "¿Ya configuraste las variables de entorno? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Por favor configura las variables primero.${NC}"
    exit 1
fi
echo ""

# 4. Crear/verificar base de datos
echo -e "${BLUE}🗄️  Paso 4: Base de datos...${NC}"
echo ""
echo -e "${YELLOW}OPCIONES:${NC}"
echo ""
echo "A) Usar Vercel Postgres (recomendado para inmovaapp.com)"
echo "   1. Ve a: https://vercel.com/tu-proyecto/storage"
echo "   2. Click 'Create Database' → 'Postgres'"
echo "   3. La DATABASE_URL se configurará automáticamente"
echo ""
echo "B) Usar base de datos externa (Supabase, Railway, Neon, etc.)"
echo "   1. Crea la base de datos en tu proveedor"
echo "   2. Copia la DATABASE_URL"
echo "   3. Agrégala en variables de entorno de Vercel"
echo ""

read -p "¿Ya tienes la base de datos configurada? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Por favor configura la base de datos primero.${NC}"
    exit 1
fi
echo ""

# 5. Deployment a producción
echo -e "${BLUE}🚀 Paso 5: Desplegando a producción...${NC}"
echo ""
echo -e "${YELLOW}Esto desplegará la app a inmovaapp.com${NC}"
echo ""

read -p "¿Continuar con el deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Deployment cancelado${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Desplegando...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}=========================================="
echo "✅ DEPLOYMENT COMPLETADO"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo ""
echo "1. Aplicar migraciones de Prisma:"
echo "   npx prisma migrate deploy"
echo ""
echo "2. Ejecutar seed (crear usuario admin y datos iniciales):"
echo "   npm run db:seed"
echo ""
echo "3. Verificar que la app funciona:"
echo "   https://inmovaapp.com"
echo ""
echo "4. Login con credenciales de administrador:"
echo "   Email: admin@inmova.app"
echo "   Password: Admin2025!"
echo ""
echo -e "${GREEN}¡Deployment exitoso! 🎉${NC}"
echo ""
