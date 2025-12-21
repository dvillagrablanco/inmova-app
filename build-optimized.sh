#!/bin/bash

# Script de build optimizado para INMOVA
# Usa máxima memoria y optimizaciones para evitar timeouts

set -e

echo "🚀 Iniciando build optimizado de INMOVA..."
echo "" 
echo "📊 Configuración:"
echo "  - Memoria: 8GB (8192MB)"
echo "  - TypeScript: Optimizado"
echo "  - Minificación: Deshabilitada"
echo ""

# Regenerar Prisma Client
echo "🔄 Regenerando Prisma Client..."
yarn prisma generate
echo "✅ Prisma Client regenerado"
echo ""

# Build con máxima memoria y optimizaciones
echo "🛠️ Ejecutando build de Next.js..."
NODE_OPTIONS="--max-old-space-size=8192" \
  NEXT_DISABLE_SWC_MINIFY=1 \
  NEXT_DIST_DIR=.build \
  NEXT_OUTPUT_MODE=standalone \
  yarn run build

echo ""
echo "✅ Build completado exitosamente!"
echo ""
echo "📊 Estadísticas del build:"
du -sh .build/
echo ""
