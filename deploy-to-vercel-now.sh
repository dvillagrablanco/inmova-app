#!/bin/bash

# ============================================================================
# Script automatizado de deployment a Vercel
# ============================================================================

set -e

echo "🚀 Iniciando deployment a Vercel..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado"
    exit 1
fi

# Verificar que Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI no instalado"
    echo "   Ejecuta: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI instalado: $(vercel --version)"
echo ""

# Verificar configuración de proyecto
if [ ! -d ".vercel" ]; then
    echo "⚠️  Proyecto no vinculado a Vercel"
    echo "   Ejecutando: vercel link"
    vercel link --yes
fi

echo "✅ Proyecto vinculado a Vercel"
echo ""

# Mostrar variables de entorno necesarias
echo "📋 Variables de entorno necesarias:"
echo "   - NEXTAUTH_URL=https://www.inmovaapp.com"
echo "   - NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI="
echo "   - DATABASE_URL=(tu PostgreSQL URL)"
echo "   - ENCRYPTION_KEY=e2dd0f8a254cc6aee7b93f45329363b9"
echo "   - NODE_ENV=production"
echo ""

# Preguntar si las variables están configuradas
echo "⚠️  IMPORTANTE: ¿Has configurado las variables de entorno en Vercel Dashboard?"
echo "   Si no, ve a: https://vercel.com/dashboard → Settings → Environment Variables"
echo ""
read -p "¿Continuar con deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelado"
    echo ""
    echo "📝 Instrucciones:"
    echo "   1. Ve a: https://vercel.com/dashboard"
    echo "   2. Selecciona tu proyecto: workspace"
    echo "   3. Settings → Environment Variables"
    echo "   4. Agrega las 5 variables listadas arriba"
    echo "   5. Vuelve a ejecutar este script"
    exit 1
fi

echo ""
echo "🚀 Iniciando deployment a producción..."
echo ""

# Deploy a producción
vercel --prod

echo ""
echo "✅ Deployment completado!"
echo ""
echo "🔍 Verificar deployment:"
echo "   1. Sitio: https://workspace.vercel.app"
echo "   2. Health check: https://workspace.vercel.app/api/health-check"
echo "   3. Auth: https://workspace.vercel.app/api/auth/session"
echo ""
echo "📊 Ver logs:"
echo "   vercel logs --follow"
echo ""
echo "🌐 Configurar dominio:"
echo "   vercel domains add www.inmovaapp.com"
echo ""
