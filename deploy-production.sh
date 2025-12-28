#!/bin/bash

# Script de Deployment a Producción
# Para inmovaapp.com

set -e

echo "🚀 DEPLOYMENT A PRODUCCIÓN - INMOVAAPP.COM"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No estamos en el directorio del proyecto${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Paso 1: Verificando requisitos...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js instalado: $(node --version)${NC}"

# Verificar npm/yarn
if command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
    echo -e "${GREEN}✅ Yarn instalado: $(yarn --version)${NC}"
else
    PKG_MANAGER="npm"
    echo -e "${GREEN}✅ NPM instalado: $(npm --version)${NC}"
fi

# Verificar Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI no instalado. Instalando...${NC}"
    npm i -g vercel
fi
echo -e "${GREEN}✅ Vercel CLI instalado${NC}"

echo ""
echo -e "${BLUE}📋 Paso 2: Instalando dependencias...${NC}"
$PKG_MANAGER install
echo -e "${GREEN}✅ Dependencias instaladas${NC}"

echo ""
echo -e "${BLUE}📋 Paso 3: Generando Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generado${NC}"

echo ""
echo -e "${BLUE}📋 Paso 4: Verificando variables de entorno...${NC}"

# Verificar que existen las variables necesarias
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Variables faltantes (configúralas en Vercel Dashboard):${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo -e "${YELLOW}Continuando con el deployment...${NC}"
else
    echo -e "${GREEN}✅ Todas las variables configuradas${NC}"
fi

echo ""
echo -e "${BLUE}📋 Paso 5: Ejecutando linting...${NC}"
$PKG_MANAGER run lint || true
echo -e "${GREEN}✅ Linting completado${NC}"

echo ""
echo -e "${BLUE}📋 Paso 6: Testeando build...${NC}"
$PKG_MANAGER run build || {
    echo -e "${RED}❌ Error en el build. Revisa los errores arriba.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build exitoso${NC}"

echo ""
echo -e "${BLUE}📋 Paso 7: Preparando deployment...${NC}"

# Login a Vercel si no está logueado
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás logueado en Vercel. Ejecutando login...${NC}"
    vercel login
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✅ PRE-DEPLOYMENT COMPLETADO"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}📋 Siguiente paso:${NC}"
echo ""
echo -e "Para hacer el deployment, ejecuta uno de estos comandos:"
echo ""
echo -e "${YELLOW}  # Deployment a preview (para testear):${NC}"
echo "  vercel"
echo ""
echo -e "${YELLOW}  # Deployment a producción (inmovaapp.com):${NC}"
echo "  vercel --prod"
echo ""
echo -e "${BLUE}O ejecuta el script de deployment completo:${NC}"
echo "  ./deploy-to-vercel.sh"
echo ""
