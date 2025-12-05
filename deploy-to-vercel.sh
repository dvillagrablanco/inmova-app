#!/bin/bash

# ============================================
# INMOVA - Script de Preparación para Vercel
# ============================================

set -e  # Exit on error

echo "🚀 Preparando INMOVA para deployment en Vercel..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "nextjs_space/package.json" ]; then
    echo -e "${RED}❌ Error: No se encuentra nextjs_space/package.json${NC}"
    echo "Por favor ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

echo -e "${GREEN}✅ Directorio correcto detectado${NC}"
echo ""

# Step 1: Check Node and Yarn
echo "🔍 Verificando dependencias..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}⚠️  Yarn no está instalado. Instalando...${NC}"
    npm install -g yarn
fi

echo -e "${GREEN}✅ Node $(node -v) y Yarn $(yarn -v) detectados${NC}"
echo ""

# Step 2: Install dependencies
echo "📦 Instalando dependencias..."
cd nextjs_space
yarn install --frozen-lockfile
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# Step 3: Generate Prisma Client
echo "💾 Generando Prisma Client..."
yarn prisma generate
echo -e "${GREEN}✅ Prisma Client generado${NC}"
echo ""

# Step 4: Check for .env file
echo "🔐 Verificando variables de entorno..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  No se encontró archivo .env${NC}"
    echo "Por favor crea un archivo .env basado en .env.example"
    echo "O configura las variables de entorno en Vercel después del deployment."
else
    echo -e "${GREEN}✅ Archivo de variables de entorno encontrado${NC}"
fi
echo ""

# Step 5: Test build
echo "🛠️  Probando build del proyecto..."
if yarn build; then
    echo -e "${GREEN}✅ Build exitoso${NC}"
else
    echo -e "${RED}❌ Build falló${NC}"
    echo "Por favor revisa los errores antes de deployar a Vercel."
    exit 1
fi
echo ""

# Step 6: Initialize git if not already
cd ..
if [ ! -d ".git" ]; then
    echo "📋 Inicializando repositorio Git..."
    git init
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next
out
build
dist
.build

# Production
.vercel

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
Thumbs.db
EOF
    
    echo -e "${GREEN}✅ Repositorio Git inicializado${NC}"
else
    echo -e "${GREEN}✅ Repositorio Git ya existe${NC}"
fi
echo ""

# Step 7: Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ ¡Proyecto listo para Vercel!${NC}"
echo "========================================"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Commitea tus cambios:"
echo "   git add ."
echo "   git commit -m 'Preparado para Vercel'"
echo ""
echo "2. Crea un repositorio en GitHub:"
echo "   https://github.com/new"
echo ""
echo "3. Sube el código:"
echo "   git remote add origin https://github.com/TU_USUARIO/inmova-app.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Importa en Vercel:"
echo "   https://vercel.com/new"
echo ""
echo "5. Configura variables de entorno en Vercel (ver .env.example)"
echo ""
echo "6. Después del primer deploy, ejecuta migraciones:"
echo "   vercel env pull .env.local"
echo "   cd nextjs_space && yarn prisma db push"
echo ""
echo "📚 Documentación completa: DEPLOYMENT_VERCEL.md"
echo "⚡ Quick Start: QUICK_START_VERCEL.md"
echo ""
