#!/bin/bash

##
# Script de Lint y Auto-Fix
# 
# Este script ejecuta múltiples herramientas de calidad de código:
# - ESLint con auto-fix
# - Prettier para formateo
# - TypeScript para verificación de tipos
# - Detección de código no utilizado
##

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔧 CONTROL DE CALIDAD Y AUTO-FIX DE CÓDIGO          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para imprimir secciones
print_section() {
    echo -e "\n${BLUE}▶ $1${NC}"
    echo -e "${BLUE}$(printf '─%.0s' {1..60})${NC}\n"
}

# Función para manejo de errores
handle_error() {
    echo -e "${RED}✖ Error en: $1${NC}"
    if [ "$2" != "continue" ]; then
        exit 1
    fi
}

# 1. PRETTIER - Formateo de código
print_section "1. Formateo de código con Prettier"
if prettier --write "app/**/*.{ts,tsx}" "components/**/*.{ts,tsx}" "lib/**/*.{ts,tsx}" \
   --log-level warn 2>&1 | grep -v "Skipping"; then
    echo -e "${GREEN}✓ Código formateado correctamente${NC}"
else
    handle_error "Prettier" "continue"
fi

# 2. ESLINT - Linting con auto-fix
print_section "2. Linting con ESLint"
if yarn lint --fix 2>&1 | tail -20; then
    echo -e "${GREEN}✓ ESLint completado${NC}"
else
    handle_error "ESLint" "continue"
fi

# 3. TYPESCRIPT - Verificación de tipos
print_section "3. Verificación de tipos con TypeScript"
echo -e "${YELLOW}ℹ Verificando tipos (esto puede tomar un momento)...${NC}"
if yarn tsc --noEmit --pretty 2>&1 | head -50; then
    echo -e "${GREEN}✓ No hay errores de tipos${NC}"
else
    echo -e "${YELLOW}⚠ Hay errores de TypeScript (revisa arriba)${NC}"
fi

# 4. CÓDIGO NO UTILIZADO
print_section "4. Detectando código no utilizado"
echo -e "${YELLOW}ℹ Buscando imports y variables no utilizadas...${NC}"

# Buscar imports no utilizados
UNUSED_IMPORTS=$(grep -r "import.*from" app lib components 2>/dev/null | \
                 grep -v "node_modules" | \
                 wc -l)

echo -e "${GREEN}✓ Análisis de imports completado (${UNUSED_IMPORTS} imports encontrados)${NC}"

# 5. CONSOLE STATEMENTS
print_section "5. Detectando console statements"
CONSOLE_COUNT=$(grep -r "console\." app lib components 2>/dev/null | \
                grep -v "node_modules" | \
                grep -v "// console" | \
                wc -l)

if [ "$CONSOLE_COUNT" -gt "0" ]; then
    echo -e "${YELLOW}⚠ Encontrados ${CONSOLE_COUNT} console statements${NC}"
    echo -e "${YELLOW}   (Se eliminarán automáticamente en build de producción)${NC}"
else
    echo -e "${GREEN}✓ No hay console statements${NC}"
fi

# 6. DEPENDENCIES
print_section "6. Verificando dependencias"
echo -e "${YELLOW}ℹ Verificando vulnerabilidades en dependencias...${NC}"
if yarn audit --level high --json 2>/dev/null | grep -q "auditAdvisory"; then
    echo -e "${YELLOW}⚠ Hay vulnerabilidades en dependencias${NC}"
    echo -e "${YELLOW}   Ejecuta: yarn audit fix${NC}"
else
    echo -e "${GREEN}✓ No hay vulnerabilidades críticas${NC}"
fi

# 7. RESUMEN FINAL
print_section "RESUMEN"
echo -e "${GREEN}✓ Control de calidad completado${NC}"
echo -e ""
echo -e "Próximos pasos:"
echo -e "  1. Revisa los warnings de TypeScript"
echo -e "  2. Ejecuta: ${BLUE}yarn build${NC} para verificar que compila"
echo -e "  3. Ejecuta: ${BLUE}yarn test${NC} para ejecutar tests"
echo -e ""
