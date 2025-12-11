#!/bin/bash
#######################################
# Pre-Deploy Validation Script
# Detecta errores ANTES de push a GitHub
#######################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"
ERROR_COUNT=0

echo -e "${GREEN}╭──────────────────────────────────────────────────╮${NC}"
echo -e "${GREEN}│      PRE-DEPLOY VALIDATION CHECK        │${NC}"
echo -e "${GREEN}╰──────────────────────────────────────────────────╯${NC}"
echo ""

cd "$PROJECT_DIR"

#######################################
# 1. Verificar imports problemáticos de Prisma
#######################################
echo -e "${YELLOW}[1/6]${NC} Verificando imports de tipos Prisma..."

PRISMA_IMPORTS=$(grep -r "from '@prisma/client'" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | \
  grep -v "import { prisma }" | \
  grep -v "import prisma" | \
  grep -v "import { Prisma }" | \
  grep -v "import { PrismaClient }" | \
  grep "import {" | \
  grep -v "node_modules" || true)

if [ ! -z "$PRISMA_IMPORTS" ]; then
  echo -e "${RED}✗ ADVERTENCIA: Se encontraron imports de enums/tipos de Prisma:${NC}"
  echo "$PRISMA_IMPORTS" | head -10
  if [ $(echo "$PRISMA_IMPORTS" | wc -l) -gt 10 ]; then
    echo -e "${YELLOW}... y $(( $(echo "$PRISMA_IMPORTS" | wc -l) - 10 )) más${NC}"
  fi
  echo -e "${YELLOW}⚠️  Estos imports pueden causar errores en Vercel${NC}"
  echo -e "${YELLOW}⚠️  Considera usar 'any' o string literals en su lugar${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
else
  echo -e "${GREEN}✓ OK: No se encontraron imports problemáticos${NC}"
fi
echo ""

#######################################
# 2. Verificar schema de Prisma
#######################################
echo -e "${YELLOW}[2/6]${NC} Validando schema de Prisma..."

if cd nextjs_space 2>/dev/null && yarn prisma validate 2>&1 | grep -q "validated successfully"; then
  echo -e "${GREEN}✓ OK: Prisma schema válido${NC}"
  cd ..
else
  echo -e "${RED}✗ ERROR: Prisma schema inválido${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi
echo ""

#######################################
# 3. Verificar TypeScript (solo errores críticos)
#######################################
echo -e "${YELLOW}[3/6]${NC} Verificando TypeScript (modo rápido)..."
echo -e "${YELLOW}(Usando --skipLibCheck para velocidad)${NC}"

TS_CHECK=$(NODE_OPTIONS="--max-old-space-size=4096" yarn tsc --noEmit --skipLibCheck 2>&1 || true)
TS_ERRORS=$(echo "$TS_CHECK" | grep -c "error TS" || echo "0")

if [ "$TS_ERRORS" -eq "0" ]; then
  echo -e "${GREEN}✓ OK: No hay errores de TypeScript${NC}"
else
  echo -e "${RED}✗ ERROR: Se encontraron $TS_ERRORS errores de TypeScript${NC}"
  echo "$TS_CHECK" | grep "error TS" | head -5
  if [ "$TS_ERRORS" -gt 5 ]; then
    echo -e "${YELLOW}... y $(( TS_ERRORS - 5 )) más${NC}"
  fi
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi
echo ""

#######################################
# 4. Verificar ESLint (solo en archivos modificados)
#######################################
echo -e "${YELLOW}[4/6]${NC} Verificando ESLint en archivos modificados..."

CHANGED_FILES=$(git diff --name-only --cached --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ ! -z "$CHANGED_FILES" ]; then
  ESLINT_ERRORS=0
  for file in $CHANGED_FILES; do
    if [ -f "$file" ]; then
      if ! yarn eslint "$file" --quiet 2>/dev/null; then
        ESLINT_ERRORS=$((ESLINT_ERRORS + 1))
      fi
    fi
  done
  
  if [ "$ESLINT_ERRORS" -eq "0" ]; then
    echo -e "${GREEN}✓ OK: No hay errores de ESLint en archivos modificados${NC}"
  else
    echo -e "${RED}✗ ADVERTENCIA: $ESLINT_ERRORS archivos con errores de ESLint${NC}"
    echo -e "${YELLOW}(No es bloqueante, pero debería revisarse)${NC}"
  fi
else
  echo -e "${GREEN}✓ OK: No hay archivos modificados para verificar${NC}"
fi
echo ""

#######################################
# 5. Verificar variables de entorno
#######################################
echo -e "${YELLOW}[5/6]${NC} Verificando variables de entorno..."

REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "NEXT_PUBLIC_BASE_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$var=" .env 2>/dev/null; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  echo -e "${GREEN}✓ OK: Todas las variables requeridas están configuradas${NC}"
else
  echo -e "${RED}✗ ADVERTENCIA: Variables faltantes en .env:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo -e "${RED}  - $var${NC}"
  done
  echo -e "${YELLOW}(Asegúrate de configurarlas en Vercel)${NC}"
fi
echo ""

#######################################
# 6. Verificar tamaño de archivos grandes
#######################################
echo -e "${YELLOW}[6/6]${NC} Verificando archivos grandes..."

LARGE_FILES=$(find . -type f -size +1M ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.git/*" 2>/dev/null || true)

if [ ! -z "$LARGE_FILES" ]; then
  echo -e "${YELLOW}⚠️  Archivos grandes encontrados (>1MB):${NC}"
  echo "$LARGE_FILES" | head -5
  echo -e "${YELLOW}(Considera optimizarlos o excluirlos del repo)${NC}"
else
  echo -e "${GREEN}✓ OK: No hay archivos grandes problemáticos${NC}"
fi
echo ""

#######################################
# Resumen final
#######################################
echo -e "${GREEN}╭──────────────────────────────────────────────────╮${NC}"
if [ "$ERROR_COUNT" -eq "0" ]; then
  echo -e "${GREEN}│      ✓ VALIDACIÓN EXITOSA                  │${NC}"
  echo -e "${GREEN}│      Listo para deploy a Vercel          │${NC}"
  echo -e "${GREEN}╰──────────────────────────────────────────────────╯${NC}"
  exit 0
else
  echo -e "${RED}│      ✗ VALIDACIÓN FALLIDA                  │${NC}"
  echo -e "${RED}│      Encontrados $ERROR_COUNT errores bloqueantes    │${NC}"
  echo -e "${RED}│      Corrige los errores antes de deploy    │${NC}"
  echo -e "${GREEN}╰──────────────────────────────────────────────────╯${NC}"
  exit 1
fi
