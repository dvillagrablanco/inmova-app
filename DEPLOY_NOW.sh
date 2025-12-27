#!/bin/bash

# 🚀 Script de Deployment a Vercel - INMOVA
# ==========================================

set -e  # Exit on error

echo "🚀 DEPLOYMENT A VERCEL - INMOVA"
echo "================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encuentra package.json${NC}"
    echo "Por favor ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

echo -e "${GREEN}✅ Directorio correcto${NC}"
echo ""

# Verificar Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Vercel CLI...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✅ Vercel CLI instalado: $(vercel --version)${NC}"
echo ""

# Verificar build local
echo "🔨 Verificando que el build funcione..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build local exitoso${NC}"
else
    echo -e "${RED}❌ Error en el build local${NC}"
    echo "Por favor corrige los errores antes de desplegar"
    exit 1
fi
echo ""

# Mostrar configuración
echo "📋 CONFIGURACIÓN ACTUAL:"
echo "------------------------"
echo "Framework: Next.js"
echo "Build Command: npm run build"
echo "Output Directory: .next"
echo "Node Version: $(node --version)"
echo ""

# Preguntar si continuar
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "1. Asegúrate de haber hecho login en Vercel: vercel login"
echo "2. Las variables de entorno se configurarán después del deploy"
echo "3. Este deployment será a PRODUCCIÓN"
echo ""
read -p "¿Deseas continuar con el deployment? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Deployment cancelado"
    exit 0
fi

echo ""
echo "🚀 Iniciando deployment a Vercel..."
echo ""

# Opción 1: Deployment con confirmaciones interactivas
echo "Ejecutando: vercel --prod"
echo ""

vercel --prod

echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO${NC}"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "=================="
echo ""
echo "1️⃣  Configurar variables de entorno en Vercel:"
echo "   https://vercel.com/[tu-proyecto]/settings/environment-variables"
echo ""
echo "   Variables necesarias:"
echo "   - DATABASE_URL=postgresql://..."
echo "   - NEXTAUTH_URL=https://tu-app.vercel.app"
echo "   - NEXTAUTH_SECRET=[genera con: openssl rand -base64 32]"
echo ""
echo "2️⃣  Ejecutar migraciones de Prisma:"
echo "   Desde el dashboard de Vercel, en la terminal del proyecto:"
echo "   npx prisma migrate deploy"
echo ""
echo "3️⃣  Verificar el deployment:"
echo "   Abre la URL proporcionada por Vercel y verifica que todo funcione"
echo ""
echo "4️⃣  Configurar dominio personalizado (opcional):"
echo "   https://vercel.com/[tu-proyecto]/settings/domains"
echo ""
echo -e "${GREEN}🎉 ¡Deployment exitoso!${NC}"
