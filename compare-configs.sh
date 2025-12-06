#!/bin/bash

# Script para comparar configuraciones

echo "=========================================="
echo "Comparación de Configuraciones Next.js"
echo "=========================================="
echo ""

if [ ! -f "nextjs_space/next.config.js" ]; then
  echo "❌ No se encontró next.config.js actual"
  exit 1
fi

if [ ! -f "next.config.optimized.js" ]; then
  echo "❌ No se encontró next.config.optimized.js"
  exit 1
fi

echo "📄 Archivo actual: nextjs_space/next.config.js"
echo "📄 Archivo optimizado: next.config.optimized.js"
echo ""

# Contar líneas
LINES_OLD=$(wc -l < nextjs_space/next.config.js)
LINES_NEW=$(wc -l < next.config.optimized.js)

echo "📏 Líneas:"
echo "   Actual: $LINES_OLD líneas"
echo "   Optimizado: $LINES_NEW líneas"
echo ""

# Mostrar diferencias principales
echo "🔍 Diferencias principales:"
echo ""
diff -u nextjs_space/next.config.js next.config.optimized.js | head -50

echo ""
echo "=========================================="
echo "Para aplicar la configuración optimizada:"
echo "=========================================="
echo ""
echo "1. Hacer backup:"
echo "   cp nextjs_space/next.config.js nextjs_space/next.config.backup.js"
echo ""
echo "2. Aplicar nueva configuración:"
echo "   cp next.config.optimized.js nextjs_space/next.config.js"
echo ""
echo "3. Instalar dependencia:"
echo "   cd nextjs_space && yarn add -D null-loader"
echo ""
echo "4. Build y test:"
echo "   yarn build"
echo ""

