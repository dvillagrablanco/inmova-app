#!/bin/bash
set -e

echo "🚀 Ejecutando migraciones en producción..."
echo "================================================"

# Verificar que DATABASE_URL esté configurado
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurado"
    echo "Por favor, configura DATABASE_URL en tu .env.production"
    exit 1
fi

echo "✅ DATABASE_URL configurado"
echo ""

# Generar cliente Prisma
echo "📦 Generando cliente Prisma..."
yarn prisma generate
echo "✅ Cliente Prisma generado"
echo ""

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones..."
yarn prisma migrate deploy
echo "✅ Migraciones completadas"
echo ""

echo "================================================"
echo "✅ Proceso completado exitosamente"
echo "================================================"
