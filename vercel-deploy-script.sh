#!/bin/bash
set -e

TOKEN="mrahnG6wAoMRYDyGA9sWXGQH"

echo "🚀 Desplegando INMOVA a Vercel..."
echo ""

# Exportar token
export VERCEL_TOKEN="$TOKEN"

# Crear proyecto con nombre específico
echo "📦 Creando deployment..."
vercel \
  --token="$TOKEN" \
  --name=inmova \
  --force \
  2>&1

echo ""
echo "✅ Deployment completado"
