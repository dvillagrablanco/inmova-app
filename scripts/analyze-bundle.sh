#!/bin/bash

# Script para analizar el bundle de Next.js
# Autor: DeepAgent - Abacus.AI

set -e

echo "📊 INMOVA - Análisis de Bundle"
echo "================================"
echo ""

PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"
cd "$PROJECT_DIR"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📦 Verificando bundle-analyzer..."
if ! grep -q "@next/bundle-analyzer" package.json; then
    echo "   🔄 Instalando @next/bundle-analyzer..."
    yarn add -D @next/bundle-analyzer
else
    echo -e "   ${GREEN}✅ Ya instalado${NC}"
fi

echo ""
echo "⚙️  Verificando configuración..."

# Crear configuración temporal si no existe
if ! grep -q "withBundleAnalyzer" next.config.js; then
    echo "   📝 Creando configuración temporal..."
    
    cat > next.config.analyze.js << 'EOF'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = require('./next.config.js');

module.exports = withBundleAnalyzer(nextConfig);
EOF
    
    mv next.config.js next.config.original.js
    cp next.config.analyze.js next.config.js
    RESTORE_CONFIG=true
else
    echo -e "   ${GREEN}✅ Configuración ya presente${NC}"
    RESTORE_CONFIG=false
fi

echo ""
echo "🛠️  Ejecutando análisis (esto tomará varios minutos)..."
echo ""

ANALYZE=true NODE_OPTIONS="--max-old-space-size=6144" yarn build

echo ""
echo -e "${GREEN}✨ ¡Análisis completado! ✨${NC}"
echo ""

# Restaurar configuración si fue modificada
if [ "$RESTORE_CONFIG" = true ]; then
    mv next.config.original.js next.config.js
    rm -f next.config.analyze.js
    echo "🔄 Configuración restaurada"
    echo ""
fi

echo "📋 Reportes generados:"
echo "   - .next/analyze/client.html"
echo "   - .next/analyze/server.html"
echo ""
echo "👁️  Abre estos archivos en tu navegador para ver el análisis detallado"
echo ""

echo "💡 Interpretación:"
echo "   - Azul oscuro: Tu código"
echo "   - Colores claros: node_modules"
echo "   - Tamaño del cuadro = tamaño del módulo"
echo ""

echo "🎯 Busca:"
echo "   1. Módulos grandes (>100KB)"
echo "   2. Duplicados"
echo "   3. Librerías no usadas"
echo ""
