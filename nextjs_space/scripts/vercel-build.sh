#!/bin/bash
# Script de build para Vercel

echo "🚀 Iniciando build para Vercel..."

# 1. Generar Prisma Client
echo "🔧 Generando Prisma Client..."
yarn prisma generate

if [ $? -ne 0 ]; then
  echo "❌ Error al generar Prisma Client"
  exit 1
fi

echo "✅ Prisma Client generado"

# 2. Build de Next.js
echo "🏛️ Building Next.js..."
yarn build

if [ $? -ne 0 ]; then
  echo "❌ Error en build de Next.js"
  exit 1
fi

echo "✅ Build completado exitosamente"
