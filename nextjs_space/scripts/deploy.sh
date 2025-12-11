#!/bin/bash

# Script de Deployment Manual a Vercel
# Uso: ./scripts/deploy.sh [prod|preview]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 INMOVA Deployment Script${NC}"
echo -e "${BLUE}================================${NC}\n"

# Verificar que estamos en el directorio correcto
if [ ! -d "nextjs_space" ]; then
  echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
  exit 1
fi

# Cargar variables de entorno
if [ -f "nextjs_space/.env" ]; then
  export $(cat nextjs_space/.env | grep -v '^#' | xargs)
fi

# Verificar que el token de Vercel esté configurado
if [ -z "$VERCEL_TOKEN" ] || [ "$VERCEL_TOKEN" == "tu_token_de_vercel_aqui" ]; then
  echo -e "${RED}❌ Error: VERCEL_TOKEN no está configurado${NC}"
  echo -e "${YELLOW}Por favor, configura tu token en nextjs_space/.env${NC}"
  echo -e "${YELLOW}Obtén tu token desde: https://vercel.com/account/tokens${NC}"
  exit 1
fi

# Determinar el tipo de deployment
DEPLOYMENT_TYPE="preview"
if [ "$1" == "prod" ] || [ "$1" == "production" ]; then
  DEPLOYMENT_TYPE="production"
fi

echo -e "${BLUE}📄 Tipo de deployment: ${GREEN}$DEPLOYMENT_TYPE${NC}\n"

# Navegar al directorio del proyecto Next.js
cd nextjs_space

# 1. Verificar instalación de Vercel CLI
echo -e "${BLUE}🔧 Verificando Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Vercel CLI no encontrado. Instalando...${NC}"
  npm install -g vercel@latest
fi
echo -e "${GREEN}✅ Vercel CLI disponible${NC}\n"

# 2. Instalar dependencias
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
yarn install --frozen-lockfile
echo -e "${GREEN}✅ Dependencias instaladas${NC}\n"

# 3. Generar Prisma Client
echo -e "${BLUE}🔧 Generando Prisma Client...${NC}"
yarn prisma generate
echo -e "${GREEN}✅ Prisma Client generado${NC}\n"

# 4. Ejecutar linting (opcional, no falla el deployment si hay errores)
echo -e "${BLUE}🔍 Ejecutando linting...${NC}"
if yarn lint; then
  echo -e "${GREEN}✅ Linting pasado${NC}\n"
else
  echo -e "${YELLOW}⚠️  Hay algunos warnings de linting, pero continuamos...${NC}\n"
fi

# 5. Build del proyecto
echo -e "${BLUE}🏗️  Building proyecto...${NC}"
if yarn build; then
  echo -e "${GREEN}✅ Build exitoso${NC}\n"
else
  echo -e "${RED}❌ Error en el build${NC}"
  exit 1
fi

# 6. Deploy a Vercel
echo -e "${BLUE}🌍 Iniciando deployment a Vercel...${NC}"

if [ "$DEPLOYMENT_TYPE" == "production" ]; then
  echo -e "${YELLOW}⚠️  Deploying a PRODUCCIÓN (inmova.app)${NC}"
  echo -e "${YELLOW}Este deployment será visible públicamente${NC}\n"
  
  read -p "¿Continuar con el deployment a producción? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelado${NC}"
    exit 0
  fi
  
  DEPLOYMENT_URL=$(vercel --prod --token=$VERCEL_TOKEN 2>&1 | tee /dev/tty | grep -oP 'https://[^ ]*' | tail -1)
else
  echo -e "${BLUE}Deploying a PREVIEW (url temporal)${NC}\n"
  DEPLOYMENT_URL=$(vercel --token=$VERCEL_TOKEN 2>&1 | tee /dev/tty | grep -oP 'https://[^ ]*' | tail -1)
fi

# 7. Verificar resultado
echo ""
if [ $? -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ DEPLOYMENT EXITOSO${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo -e "${BLUE}🌐 URL del deployment:${NC}"
  echo -e "${GREEN}$DEPLOYMENT_URL${NC}"
  echo ""
  echo -e "${BLUE}📈 Monitoreo:${NC}"
  echo -e "Dashboard: ${BLUE}https://vercel.com/dashboard${NC}"
  echo -e "Logs: ${BLUE}vercel logs --follow${NC}"
  echo ""
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}❌ DEPLOYMENT FALLIDO${NC}"
  echo -e "${RED}========================================${NC}"
  echo ""
  echo -e "${YELLOW}Revisa los logs arriba para más detalles${NC}"
  echo -e "${YELLOW}O ejecuta: vercel logs${NC}"
  exit 1
fi

echo -e "${BLUE}🎉 ¡Listo! Tu aplicación está desplegada${NC}"
