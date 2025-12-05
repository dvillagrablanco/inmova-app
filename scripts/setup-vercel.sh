#!/bin/bash

# Script para configurar y deployar en Vercel
# Autor: DeepAgent - Abacus.AI

set -e

echo "▲ INMOVA - Setup Vercel Deployment"
echo "==================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"
cd "$PROJECT_DIR"

echo "🔍 Verificando Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "   🔄 Instalando Vercel CLI..."
    npm i -g vercel
    echo -e "   ${GREEN}✅ Vercel CLI instalado${NC}"
else
    echo -e "   ${GREEN}✅ Vercel CLI ya instalado${NC}"
fi

echo ""
echo "🔑 Iniciando sesión en Vercel..."
vercel login

echo ""
echo "⚙️  Configurando proyecto..."
echo ""
echo -e "${YELLOW}ℹ️  Responde las siguientes preguntas:${NC}"
echo "   - Set up and deploy: Y"
echo "   - Which scope: Tu organización/cuenta"
echo "   - Link to existing project: N (primera vez) o Y (si ya existe)"
echo "   - Project name: inmova (o tu preferencia)"
echo "   - Directory: ./ (o presiona Enter)"
echo "   - Override settings: N (usar configuración detectada)"
echo ""

vercel

echo ""
echo -e "${GREEN}✨ ¡Deployment iniciado! ✨${NC}"
echo ""

echo "📝 Próximos pasos:"
echo ""
echo "1. 🌐 Configurar dominio personalizado (inmova.app):"
echo "   - Ve a: https://vercel.com/dashboard"
echo "   - Selecciona tu proyecto"
echo "   - Ve a Settings > Domains"
echo "   - Agrega: inmova.app"
echo "   - Configura DNS:"
echo "     A    @       76.76.21.21"
echo "     CNAME www    cname.vercel-dns.com"
echo ""

echo "2. 🔐 Configurar variables de entorno:"
echo "   - Ve a Settings > Environment Variables"
echo "   - Agrega TODAS las variables de tu .env"
echo "   - No olvides:"
echo "     * DATABASE_URL"
echo "     * NEXTAUTH_SECRET"
echo "     * NEXTAUTH_URL"
echo "     * AWS_*"
echo "     * STRIPE_*"
echo "     * etc."
echo ""

echo "3. 🚀 Deploy a producción:"
echo "   vercel --prod"
echo ""

echo "4. 🔄 Auto-deploy desde Git (recomendado):"
echo "   - Conecta tu repositorio en Vercel Dashboard"
echo "   - Cada push a main deployará automáticamente"
echo ""

echo -e "${GREEN}✅ Setup completado${NC}"
echo ""
echo "📖 Más info: https://vercel.com/docs"
echo ""
