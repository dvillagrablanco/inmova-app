#!/bin/bash

# Script de Verificación Pre-Deployment para INMOVA
# Simula las condiciones de un deployment en plataformas cloud (Vercel, Netlify, etc.)

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   INMOVA - Verificación de Preparación para Deployment        ║"
echo "║   Simula condiciones de Vercel/Netlify/Railway                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/ubuntu/homming_vidaro/nextjs_space"
cd "$PROJECT_ROOT"

echo -e "${BLUE}📍 Directorio de trabajo: ${PROJECT_ROOT}${NC}"
echo ""

# ============================================================================
# TEST 1: Verificar que no hay symlinks problemáticos
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Verificando symlinks problemáticos..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -L "yarn.lock" ]; then
    TARGET=$(readlink "yarn.lock")
    if [[ "$TARGET" == /* ]]; then
        echo -e "${RED}✗ ERROR: yarn.lock es un symlink ABSOLUTO: $TARGET${NC}"
        echo "  Las plataformas cloud NO pueden acceder a rutas absolutas."
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ yarn.lock es un symlink relativo (OK)${NC}"
    fi
elif [ -f "yarn.lock" ]; then
    echo -e "${GREEN}✓ yarn.lock es un archivo real (PERFECTO)${NC}"
else
    echo -e "${RED}✗ ERROR: yarn.lock NO existe${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -L "node_modules" ]; then
    TARGET=$(readlink "node_modules")
    if [[ "$TARGET" == /* ]]; then
        echo -e "${YELLOW}⚠ ADVERTENCIA: node_modules es un symlink ABSOLUTO: $TARGET${NC}"
        echo "  Esto funciona localmente pero las plataformas cloud instalarán desde cero."
        WARNINGS=$((WARNINGS + 1))
    fi
elif [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules es un directorio real${NC}"
else
    echo -e "${YELLOW}⚠ node_modules no existe (normal en repo limpio)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# TEST 2: Verificar estructura de archivos esenciales
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Verificando archivos esenciales..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REQUIRED_FILES=("package.json" "next.config.js" "tsconfig.json" "prisma/schema.prisma" ".env")

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ] || [ -d "$(dirname "$file")" ]; then
        if [ -f "$file" ]; then
            echo -e "${GREEN}✓ $file existe${NC}"
        fi
    else
        echo -e "${RED}✗ ERROR: $file NO encontrado${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# ============================================================================
# TEST 3: Verificar package.json y scripts de build
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Verificando configuración de build..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v jq &> /dev/null; then
    BUILD_SCRIPT=$(jq -r '.scripts.build // empty' package.json)
    if [ -n "$BUILD_SCRIPT" ]; then
        echo -e "${BLUE}Build script: $BUILD_SCRIPT${NC}"
        
        if [[ "$BUILD_SCRIPT" == *"prisma generate"* ]]; then
            echo -e "${GREEN}✓ Build incluye 'prisma generate'${NC}"
        else
            echo -e "${RED}✗ ERROR: Build NO incluye 'prisma generate'${NC}"
            echo "  Agrega 'prisma generate &&' antes de 'next build'"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}✗ ERROR: No hay script 'build' en package.json${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠ jq no instalado, saltando verificación de package.json${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# TEST 4: Simulación de fresh install (como en cloud)
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Simulando instalación limpia (como Vercel)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TEST_DIR="/tmp/inmova-deployment-test-$$"
echo -e "${BLUE}Creando ambiente de prueba en: $TEST_DIR${NC}"

mkdir -p "$TEST_DIR"
cp package.json "$TEST_DIR/"
cp yarn.lock "$TEST_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ No se pudo copiar yarn.lock${NC}"
cp -r prisma "$TEST_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ No se pudo copiar prisma/"

cd "$TEST_DIR"

echo -e "${BLUE}Intentando 'yarn install' en ambiente limpio...${NC}"
if timeout 60s yarn install --frozen-lockfile 2>&1 | tail -20; then
    echo -e "${GREEN}✓ yarn install exitoso en ambiente limpio${NC}"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        echo -e "${YELLOW}⚠ yarn install tardó más de 60s (timeout)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗ ERROR: yarn install falló en ambiente limpio${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

cd "$PROJECT_ROOT"
rm -rf "$TEST_DIR"

echo ""

# ============================================================================
# TEST 5: Verificar imports de Prisma (import type)
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Verificando imports de Prisma..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BAD_IMPORTS=$(grep -r "import {.*} from '@prisma/client'" --include="*.ts" --include="*.tsx" app/ lib/ components/ 2>/dev/null | grep -v "import type" | wc -l)

if [ "$BAD_IMPORTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Encontrados $BAD_IMPORTS imports de Prisma SIN 'import type'${NC}"
    echo "  Estos pueden causar errores en Vercel durante el build."
    echo "  Ejemplo: import type { User } from '@prisma/client'"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ Todos los imports de Prisma usan 'import type'${NC}"
fi

echo ""

# ============================================================================
# TEST 6: Verificar tamaño del repositorio (para Git/GitHub)
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Verificando tamaño del repositorio..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".git" ]; then
    REPO_SIZE=$(du -sh .git | cut -f1)
    echo -e "${BLUE}Tamaño de .git: $REPO_SIZE${NC}"
    
    # Check for large files
    LARGE_FILES=$(find . -type f -size +50M ! -path "./node_modules/*" ! -path "./.git/*" 2>/dev/null)
    if [ -n "$LARGE_FILES" ]; then
        echo -e "${YELLOW}⚠ Archivos grandes encontrados (>50MB):${NC}"
        echo "$LARGE_FILES"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ No hay archivos excesivamente grandes${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No es un repositorio Git${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     RESUMEN DE VERIFICACIÓN                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ ¡PERFECTO! El proyecto está listo para deployment.${NC}"
    echo ""
    echo "Puedes deployar con confianza en:"
    echo "  • Vercel"
    echo "  • Netlify"
    echo "  • Railway"
    echo "  • AWS Amplify"
    echo "  • Cualquier otra plataforma cloud"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ADVERTENCIAS: $WARNINGS${NC}"
    echo "El deployment probablemente funcionará, pero revisa las advertencias."
    exit 0
else
    echo -e "${RED}✗ ERRORES CRÍTICOS: $ERRORS${NC}"
    echo -e "${YELLOW}⚠ ADVERTENCIAS: $WARNINGS${NC}"
    echo ""
    echo -e "${RED}¡NO DEPLOYAR TODAVÍA!${NC}"
    echo "Corrige los errores críticos antes de intentar el deployment."
    exit 1
fi
