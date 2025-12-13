#!/bin/bash

# Script mejorado para deployment en Vercel
# Autor: INMOVA Team
# Fecha: $(date +%Y-%m-%d)

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "================================="
echo "  INMOVA - Vercel Deployment"
echo "================================="
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "nextjs_space/package.json" ]; then
    echo -e "${RED}Error: Execute este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: Ni 'vercel' ni 'npx' están disponibles${NC}"
    echo "Instala Vercel CLI con: npm install -g vercel"
    exit 1
fi

# Use vercel or npx vercel
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel"
fi

echo -e "${YELLOW}Usando comando: $VERCEL_CMD${NC}"
echo ""

# Move to nextjs_space directory
cd nextjs_space

echo -e "${GREEN}➤ Paso 1: Verificando autenticación...${NC}"
if $VERCEL_CMD whoami &> /dev/null; then
    USER=$($VERCEL_CMD whoami)
    echo -e "${GREEN}✔ Autenticado como: $USER${NC}"
else
    echo -e "${YELLOW}⚠ No estás autenticado${NC}"
    echo "Por favor, ejecuta: $VERCEL_CMD login"
    echo "Email: dvillagra@vidaroinversiones.com"
    exit 1
fi

echo ""
echo -e "${GREEN}➤ Paso 2: Vinculando proyecto (si es necesario)...${NC}"
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}No se encontró vinculación con Vercel${NC}"
    echo "Ejecutando: $VERCEL_CMD link"
    $VERCEL_CMD link
else
    echo -e "${GREEN}✔ Proyecto ya vinculado${NC}"
fi

echo ""
echo -e "${GREEN}➤ Paso 3: Desplegando a producción...${NC}"
echo -e "${YELLOW}Esto puede tardar varios minutos...${NC}"

# Deploy to production
if $VERCEL_CMD --prod; then
    echo ""
    echo -e "${GREEN}=================================${NC}"
    echo -e "${GREEN}✔ ¡Deployment exitoso!${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo ""
    echo "Tu aplicación está desplegada en:"
    echo -e "${BLUE}https://inmova.app${NC}"
    echo ""
    echo "Panel de control de Vercel:"
    echo -e "${BLUE}https://vercel.com/dashboard${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}=================================${NC}"
    echo -e "${RED}✖ Error en el deployment${NC}"
    echo -e "${RED}=================================${NC}"
    echo ""
    echo "Por favor revisa los logs arriba para más detalles."
    echo "También puedes revisar en: https://vercel.com/dashboard"
    exit 1
fi
