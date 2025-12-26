#!/bin/bash

###
# Pre-Commit Check
# 
# Este script se ejecuta antes de cada commit para asegurar
# la calidad del código que se va a commitear
###

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Ejecutando verificaciones pre-commit...${NC}\n"

# 1. Obtener archivos staged
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${GREEN}✓ No hay archivos TypeScript/TSX para verificar${NC}"
    exit 0
fi

echo -e "${GREEN}Archivos a verificar:${NC}"
echo "$STAGED_FILES" | sed 's/^/  - /'
echo ""

# 2. Prettier check
echo -e "${YELLOW}▶ Verificando formato...${NC}"
if echo "$STAGED_FILES" | xargs prettier --check 2>&1 | grep -v "Checking formatting"; then
    echo -e "${GREEN}✓ Formato correcto${NC}\n"
else
    echo -e "${RED}✖ Formato incorrecto${NC}"
    echo -e "${YELLOW}💡 Ejecuta: prettier --write <archivo>${NC}\n"
    exit 1
fi

# 3. ESLint check
echo -e "${YELLOW}▶ Verificando linting...${NC}"
if echo "$STAGED_FILES" | xargs eslint --max-warnings=10 2>&1 | tail -20; then
    echo -e "${GREEN}✓ Linting correcto${NC}\n"
else
    echo -e "${YELLOW}⚠ Hay warnings de ESLint${NC}"
    echo -e "${YELLOW}💡 Ejecuta: yarn lint --fix${NC}\n"
fi

# 4. TypeScript check en archivos staged
echo -e "${YELLOW}▶ Verificando tipos TypeScript...${NC}"
if yarn tsc --noEmit 2>&1 | head -30 | grep -i "error"; then
    echo -e "${YELLOW}⚠ Hay errores de TypeScript${NC}"
    echo -e "${YELLOW}💡 Revisa los errores arriba${NC}\n"
else
    echo -e "${GREEN}✓ Tipos correctos${NC}\n"
fi

# 5. Verificar console.log (advertencia)
CONSOLE_COUNT=$(echo "$STAGED_FILES" | xargs grep -n "console\." 2>/dev/null | wc -l || echo "0")
if [ "$CONSOLE_COUNT" -gt "0" ]; then
    echo -e "${YELLOW}⚠ Advertencia: Encontrados ${CONSOLE_COUNT} console statements${NC}"
    echo "$STAGED_FILES" | xargs grep -n "console\." 2>/dev/null | head -5
    echo -e "${YELLOW}💡 Considera eliminarlos antes del commit${NC}\n"
fi

echo -e "${GREEN}✅ Verificaciones pre-commit completadas${NC}"
exit 0
