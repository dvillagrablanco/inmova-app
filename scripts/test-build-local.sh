#!/bin/bash

# Script para probar el build localmente
# Autor: DeepAgent - Abacus.AI

set -e

echo "🧪 INMOVA - Test Build Local"
echo "============================"
echo ""

PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"
cd "$PROJECT_DIR"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧹 Limpiando build anterior..."
rm -rf .next .build

echo ""
echo "🔨 Ejecutando build..."
NODE_OPTIONS="--max-old-space-size=6144" yarn build

echo ""
echo -e "${GREEN}✅ Build completado${NC}"
echo ""

echo "🚀 Iniciando servidor de producción..."
echo "   URL: http://localhost:3000"
echo "   Presiona Ctrl+C para detener"
echo ""

yarn start
