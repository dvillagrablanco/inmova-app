#!/bin/bash

# Quick fix para problemas comunes de deployment
# Autor: DeepAgent - Abacus.AI

set -e

echo "🔧 INMOVA - Quick Fix"
echo "====================="
echo ""

PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"
cd "$PROJECT_DIR"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧹 1. Limpiando todos los cachés y builds..."
rm -rf .next
rm -rf .build
rm -rf node_modules/.cache
rm -rf out
rm -rf dist
echo -e "   ${GREEN}✅ Limpieza completada${NC}"

echo ""
echo "🔄 2. Reinstalando dependencias..."
rm -rf node_modules
rm -f yarn.lock
yarn install
echo -e "   ${GREEN}✅ Dependencias reinstaladas${NC}"

echo ""
echo "⚙️  3. Aplicando configuración optimizada..."
if [ -f "next.config.optimized.js" ]; then
    cp next.config.js next.config.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    cp next.config.optimized.js next.config.js
    echo -e "   ${GREEN}✅ Configuración aplicada${NC}"
else
    echo -e "   ${YELLOW}⚠️  next.config.optimized.js no encontrado${NC}"
fi

echo ""
echo "📦 4. Instalando dependencias necesarias..."
yarn add null-loader -D
echo -e "   ${GREEN}✅ Dependencias instaladas${NC}"

echo ""
echo "🐟 5. Regenerando Prisma Client..."
if [ -f "prisma/schema.prisma" ]; then
    yarn prisma generate
    echo -e "   ${GREEN}✅ Prisma Client regenerado${NC}"
else
    echo "   ℹ️  No se encontró schema.prisma"
fi

echo ""
echo "🛠️  6. Probando build..."
NODE_OPTIONS="--max-old-space-size=6144" yarn build

echo ""
echo "============================================"
echo -e "${GREEN}✨ ¡Quick Fix completado! ✨${NC}"
echo "============================================"
echo ""
echo "🚀 Puedes probar con: yarn start"
echo ""
