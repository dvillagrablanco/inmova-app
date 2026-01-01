#!/bin/bash

# SCRIPT DE VERIFICACIÓN: MEJORAS UX INTUITIVIDAD
# Verifica que todos los archivos de mejoras UX estén presentes

set -e

echo "🔍 Verificando mejoras de UX e intuitividad..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TOTAL=0
FOUND=0
MISSING=0

# Función para verificar archivo
check_file() {
    local file=$1
    local description=$2
    TOTAL=$((TOTAL + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        FOUND=$((FOUND + 1))
    else
        echo -e "${RED}✗${NC} $description - FALTA: $file"
        MISSING=$((MISSING + 1))
    fi
}

echo "📦 Verificando componentes nuevos..."
echo ""

check_file "components/onboarding/WelcomeWizard.tsx" "Wizard de bienvenida simplificado"
check_file "components/help/ContextualHelp.tsx" "Ayuda contextual por página"
check_file "components/preferences/SimplifiedPreferences.tsx" "Configuración simplificada"
check_file "components/modules/SimplifiedModuleManager.tsx" "Gestor de funciones simplificado"
check_file "components/ui/simple-tooltip.tsx" "Tooltips con ejemplos"

echo ""
echo "📝 Verificando documentación..."
echo ""

check_file "MEJORAS_UX_INTUITIVIDAD.md" "Documentación completa de mejoras"
check_file "TESTING_UX_SIMPLIFICADA.md" "Plan de testing UX"
check_file "RESUMEN_MEJORAS_UX.md" "Resumen ejecutivo"

echo ""
echo "🔧 Verificando archivos modificados..."
echo ""

check_file "app/(dashboard)/configuracion/page.tsx" "Página de configuración actualizada"
check_file "components/layout/authenticated-layout.tsx" "Layout con ayuda contextual"

echo ""
echo "📊 RESUMEN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total de archivos: ${YELLOW}$TOTAL${NC}"
echo -e "Encontrados: ${GREEN}$FOUND${NC}"
echo -e "Faltantes: ${RED}$MISSING${NC}"
echo ""

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ Todos los archivos están presentes${NC}"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "1. Iniciar aplicación: npm run dev"
    echo "2. Login con: principiante@gestor.es / Test123456!"
    echo "3. Verificar wizard de bienvenida"
    echo "4. Probar botón de ayuda azul (esquina inferior derecha)"
    echo "5. Ir a Configuración y probar tabs"
    echo ""
    echo "📖 Ver guía completa en: TESTING_UX_SIMPLIFICADA.md"
    exit 0
else
    echo -e "${RED}❌ Faltan $MISSING archivo(s)${NC}"
    echo ""
    echo "⚠️ Algunos archivos no se encontraron."
    echo "Verifica que todos los archivos se hayan creado correctamente."
    exit 1
fi
