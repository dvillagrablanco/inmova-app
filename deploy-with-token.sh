#!/bin/bash

# =====================================================
# Script de Deployment a Vercel con Token
# Para uso en CI/CD o deployment sin interacción
# =====================================================

set -e

echo "🚀 Deployment a Vercel con Token"
echo ""

# Verificar que se pasó el token
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN no está configurado"
    echo ""
    echo "Uso:"
    echo "  export VERCEL_TOKEN=tu_token_aqui"
    echo "  ./deploy-with-token.sh"
    echo ""
    echo "O:"
    echo "  VERCEL_TOKEN=tu_token_aqui ./deploy-with-token.sh"
    echo ""
    echo "Para obtener un token:"
    echo "  1. Ve a https://vercel.com/account/tokens"
    echo "  2. Crea un nuevo token"
    echo "  3. Copia el token y úsalo con este script"
    exit 1
fi

# Configuración
USER_ID="pAzq4g0vFjJlrK87sQhlw08I"
PROJECT_NAME="inmova"

echo "📋 Configuración:"
echo "   User ID: $USER_ID"
echo "   Proyecto: $PROJECT_NAME"
echo ""

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
yarn install --frozen-lockfile

# Generar Prisma Client
echo "🔧 Generando Prisma Client..."
yarn prisma generate

# Desplegar
echo ""
echo "🚀 Desplegando a Vercel..."
echo ""

# Deployment de producción
vercel --prod --token="$VERCEL_TOKEN" --yes

echo ""
echo "✅ Deployment completado"
echo ""
echo "🔗 Verifica tu deployment en:"
echo "   https://vercel.com/dashboard"
echo ""
