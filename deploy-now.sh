#!/bin/bash

# Script de deployment rápido - requiere VERCEL_TOKEN

echo "🚀 Deployment Rápido a Vercel"
echo ""

# Verificar token
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN no está configurado"
    echo ""
    echo "Para obtener un token:"
    echo "  1. Ve a: https://vercel.com/account/tokens"
    echo "  2. Crea un nuevo token"
    echo "  3. Ejecuta: export VERCEL_TOKEN=tu_token"
    echo "  4. Ejecuta este script nuevamente"
    exit 1
fi

echo "✅ Token encontrado"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
yarn install --frozen-lockfile || { echo "❌ Error instalando dependencias"; exit 1; }

# Generar Prisma Client
echo "🔧 Generando Prisma Client..."
yarn prisma generate || { echo "❌ Error generando Prisma Client"; exit 1; }

# Desplegar
echo ""
echo "🚀 Desplegando a Vercel..."
echo ""

vercel --token="$VERCEL_TOKEN" --yes

echo ""
echo "✅ Deployment completado"
echo ""
