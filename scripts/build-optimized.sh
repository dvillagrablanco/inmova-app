#!/bin/bash
# Script para build optimizado con memoria incrementada

set -e

echo "🚀 Iniciando build optimizado..."

export NODE_OPTIONS="--max-old-space-size=6144"

echo "🧹 Limpiando archivos temporales..."
rm -rf .next .build

echo "📦 Generando cliente de Prisma..."
yarn prisma generate

echo "🏗️  Construyendo aplicación..."
yarn build

echo "✅ Build completado exitosamente"
