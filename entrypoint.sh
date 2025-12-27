#!/bin/sh
set -e

echo "🚀 Starting Inmova App..."

# Esperar a que PostgreSQL esté listo
echo "⏳ Waiting for PostgreSQL..."
until nc -z postgres 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Ejecutar migraciones de Prisma
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy || npx prisma db push

echo "✅ Migrations completed!"

# Iniciar aplicación
echo "🎉 Starting Next.js server..."
exec node server.js
