#!/bin/bash

# ================================================================
# Script de Preparación para Deployment de INMOVA en Vercel
# ================================================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "${BLUE}================================================================${NC}"
echo "${BLUE}  INMOVA - Script de Preparación para Deployment en Vercel${NC}"
echo "${BLUE}================================================================${NC}"
echo ""

# Directorio del proyecto
PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "${RED}❌ Error: Directorio del proyecto no encontrado${NC}"
    echo "Esperado: $PROJECT_DIR"
    exit 1
fi

echo "${GREEN}✅ Directorio del proyecto encontrado${NC}"
echo ""

# ================================================================
# PASO 1: Verificar Git
# ================================================================

echo "${YELLOW}[1/7] Verificando Git...${NC}"

cd "$PROJECT_DIR"

if [ -d ".git" ]; then
    echo "${GREEN}✓ Git ya está inicializado${NC}"
else
    echo "${YELLOW}⚠  Inicializando Git...${NC}"
    git init
    echo "${GREEN}✓ Git inicializado${NC}"
fi

echo ""

# ================================================================
# PASO 2: Verificar .gitignore
# ================================================================

echo "${YELLOW}[2/7] Verificando .gitignore...${NC}"

if [ -f ".gitignore" ]; then
    echo "${GREEN}✓ .gitignore existe${NC}"
    
    # Verificar que contenga entradas importantes
    if grep -q "node_modules" .gitignore && grep -q ".env" .gitignore; then
        echo "${GREEN}✓ .gitignore configurado correctamente${NC}"
    else
        echo "${YELLOW}⚠  .gitignore puede necesitar actualizaciones${NC}"
    fi
else
    echo "${RED}❌ .gitignore no encontrado${NC}"
    echo "${YELLOW}Por favor, crea el archivo .gitignore antes de continuar${NC}"
    exit 1
fi

echo ""

# ================================================================
# PASO 3: Verificar package.json
# ================================================================

echo "${YELLOW}[3/7] Verificando package.json...${NC}"

if [ -f "package.json" ]; then
    echo "${GREEN}✓ package.json existe${NC}"
    
    # Verificar scripts importantes
    if grep -q '"postinstall"' package.json; then
        echo "${GREEN}✓ Script 'postinstall' encontrado${NC}"
    else
        echo "${YELLOW}⚠  Script 'postinstall' no encontrado${NC}"
        echo "${YELLOW}   Necesitas agregar manualmente:${NC}"
        echo '   "postinstall": "prisma generate",'
    fi
    
    if grep -q '"vercel-build"' package.json; then
        echo "${GREEN}✓ Script 'vercel-build' encontrado${NC}"
    else
        echo "${YELLOW}⚠  Script 'vercel-build' no encontrado${NC}"
        echo "${YELLOW}   Necesitas agregar manualmente:${NC}"
        echo '   "vercel-build": "prisma generate && prisma migrate deploy && next build",'
    fi
else
    echo "${RED}❌ package.json no encontrado${NC}"
    exit 1
fi

echo ""

# ================================================================
# PASO 4: Verificar Prisma
# ================================================================

echo "${YELLOW}[4/7] Verificando configuración de Prisma...${NC}"

if [ -f "prisma/schema.prisma" ]; then
    echo "${GREEN}✓ schema.prisma encontrado${NC}"
else
    echo "${RED}❌ schema.prisma no encontrado${NC}"
    exit 1
fi

if [ -d "prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 prisma/migrations | wc -l)
    echo "${GREEN}✓ $MIGRATION_COUNT migraciones encontradas${NC}"
else
    echo "${YELLOW}⚠  No se encontraron migraciones${NC}"
fi

echo ""

# ================================================================
# PASO 5: Verificar archivos sensibles NO estén trackeados
# ================================================================

echo "${YELLOW}[5/7] Verificando archivos sensibles...${NC}"

# Verificar que .env no esté en Git
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "${RED}❌ ¡ADVERTENCIA! .env está trackeado en Git${NC}"
    echo "${YELLOW}Ejecuta: git rm --cached .env${NC}"
else
    echo "${GREEN}✓ .env no está trackeado en Git${NC}"
fi

# Verificar node_modules
if git ls-files --error-unmatch node_modules 2>/dev/null; then
    echo "${RED}❌ ¡ADVERTENCIA! node_modules está trackeado en Git${NC}"
    echo "${YELLOW}Esto hará el repositorio muy pesado${NC}"
else
    echo "${GREEN}✓ node_modules no está trackeado en Git${NC}"
fi

echo ""

# ================================================================
# PASO 6: Verificar archivos de deployment
# ================================================================

echo "${YELLOW}[6/7] Verificando archivos de deployment...${NC}"

if [ -f "vercel.json" ]; then
    echo "${GREEN}✓ vercel.json encontrado${NC}"
else
    echo "${YELLOW}⚠  vercel.json no encontrado (opcional)${NC}"
fi

if [ -f ".env.production.example" ]; then
    echo "${GREEN}✓ .env.production.example encontrado${NC}"
else
    echo "${YELLOW}⚠  .env.production.example no encontrado${NC}"
fi

if [ -f "next.config.js" ]; then
    echo "${GREEN}✓ next.config.js encontrado${NC}"
else
    echo "${RED}❌ next.config.js no encontrado${NC}"
fi

echo ""

# ================================================================
# PASO 7: Resumen y próximos pasos
# ================================================================

echo "${YELLOW}[7/7] Generando resumen...${NC}"
echo ""
echo "${BLUE}================================================================${NC}"
echo "${BLUE}  RESUMEN DE VERIFICACIÓN${NC}"
echo "${BLUE}================================================================${NC}"
echo ""

# Verificar estado de Git
if [ -n "$(git status --porcelain)" ]; then
    echo "${YELLOW}⚠  Hay cambios sin commitear${NC}"
    UNCOMMITTED=true
else
    echo "${GREEN}✓ No hay cambios sin commitear${NC}"
    UNCOMMITTED=false
fi

echo ""

# ================================================================
# PRÓXIMOS PASOS
# ================================================================

echo "${BLUE}================================================================${NC}"
echo "${BLUE}  PRÓXIMOS PASOS PARA DEPLOYMENT${NC}"
echo "${BLUE}================================================================${NC}"
echo ""

if [ "$UNCOMMITTED" = true ]; then
    echo "${YELLOW}1. Hacer commit de los cambios:${NC}"
    echo "   ${GREEN}git add .${NC}"
    echo "   ${GREEN}git commit -m \"Preparación para deployment en Vercel\"${NC}"
    echo ""
fi

echo "${YELLOW}2. Crear Personal Access Token en GitHub:${NC}"
echo "   - Ir a: https://github.com/settings/tokens"
echo "   - Generate new token (classic)"
echo "   - Scopes: repo, workflow"
echo "   - Copiar el token generado"
echo ""

echo "${YELLOW}3. Crear repositorio en GitHub:${NC}"
echo "   - Ir a: https://github.com/new"
echo "   - Nombre: inmova-platform"
echo "   - Privado: Sí"
echo "   - NO inicializar con README"
echo ""

echo "${YELLOW}4. Conectar con GitHub:${NC}"
echo "   ${GREEN}git remote add origin https://github.com/dvillagrab/inmova-platform.git${NC}"
echo "   ${GREEN}git branch -M main${NC}"
echo "   ${GREEN}git push -u origin main${NC}"
echo "   (Usuario: dvillagrab, Password: [Tu Personal Access Token])"
echo ""

echo "${YELLOW}5. Configurar base de datos en Supabase:${NC}"
echo "   - Ir a: https://supabase.com"
echo "   - Crear proyecto: inmova-production"
echo "   - Copiar DATABASE_URL"
echo ""

echo "${YELLOW}6. Importar en Vercel:${NC}"
echo "   - Ir a: https://vercel.com"
echo "   - Conectar con GitHub"
echo "   - Importar: inmova-platform"
echo "   - Configurar variables de entorno"
echo "   - Deploy"
echo ""

echo "${BLUE}================================================================${NC}"
echo "${BLUE}  DOCUMENTACIÓN COMPLETA${NC}"
echo "${BLUE}================================================================${NC}"
echo ""
echo "${GREEN}Guía completa:${NC} /home/ubuntu/homming_vidaro/DEPLOYMENT_VERCEL.md"
echo "${GREEN}Checklist paso a paso:${NC} /home/ubuntu/homming_vidaro/CHECKLIST_DEPLOYMENT.md"
echo "${GREEN}Guía rápida:${NC} /home/ubuntu/homming_vidaro/PASOS_DEPLOYMENT.md"
echo "${GREEN}Credenciales:${NC} /home/ubuntu/homming_vidaro/CREDENCIALES_ACCESO.md"
echo ""

echo "${BLUE}================================================================${NC}"
echo "${GREEN}✅ Verificación completada${NC}"
echo "${BLUE}================================================================${NC}"
echo ""
