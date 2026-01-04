#!/bin/bash

# Script de verificación de la implementación del sistema de navegación
# Ejecutar: bash scripts/verify-navigation-setup.sh

echo "=================================="
echo "🔍 VERIFICACIÓN DE NAVEGACIÓN"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1 (FALTA)"
        ((ERRORS++))
    fi
}

# Función para verificar que un archivo contiene un string
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $1 contiene '$2'"
    else
        echo -e "${YELLOW}⚠️${NC} $1 no contiene '$2'"
        ((WARNINGS++))
    fi
}

echo "📁 Verificando componentes nuevos..."
echo ""

check_file "components/navigation/command-palette.tsx"
check_file "components/navigation/contextual-quick-actions.tsx"
check_file "components/navigation/smart-breadcrumbs.tsx"
check_file "components/navigation/global-shortcuts.tsx"
check_file "components/navigation/shortcuts-help-dialog.tsx"

echo ""
echo "📝 Verificando integraciones..."
echo ""

check_content "components/layout/authenticated-layout.tsx" "CommandPalette"
check_content "components/layout/authenticated-layout.tsx" "GlobalShortcuts"
check_content "components/layout/authenticated-layout.tsx" "ShortcutsHelpDialog"

check_content "app/dashboard/page.tsx" "ContextualQuickActions"
check_content "app/propiedades/page.tsx" "SmartBreadcrumbs"
check_content "app/inquilinos/page.tsx" "SmartBreadcrumbs"

echo ""
echo "🎨 Verificando componentes UI necesarios..."
echo ""

check_file "components/ui/command.tsx"
check_file "components/ui/dialog.tsx"
check_file "components/ui/dropdown-menu.tsx"
check_file "components/ui/breadcrumb.tsx"
check_file "components/ui/badge.tsx"
check_file "components/ui/button.tsx"
check_file "components/ui/separator.tsx"

echo ""
echo "📚 Verificando documentación..."
echo ""

check_file "PAGE_INTERACTIONS_ANALYSIS.md"
check_file "PAGE_NAVIGATION_IMPLEMENTATION_GUIDE.md"
check_file "NAVIGATION_SYSTEM_EXECUTIVE_SUMMARY.md"
check_file "IMPLEMENTATION_COMPLETE_SUMMARY.md"

echo ""
echo "=================================="
echo "📊 RESUMEN"
echo "=================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TODO CORRECTO${NC}"
    echo "Sistema de navegación completamente implementado y listo para usar."
    echo ""
    echo "Próximos pasos:"
    echo "  1. npm run build (verificar compilación)"
    echo "  2. npm run dev (testing manual)"
    echo "  3. Presionar Cmd/Ctrl + K para probar Command Palette"
    echo "  4. Presionar ? para ver ayuda de shortcuts"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️ WARNINGS: $WARNINGS${NC}"
    echo "Algunos archivos no contienen las integraciones esperadas."
    echo "El sistema puede funcionar pero revisa las warnings."
    exit 0
else
    echo -e "${RED}❌ ERRORES: $ERRORS${NC}"
    echo -e "${YELLOW}⚠️ WARNINGS: $WARNINGS${NC}"
    echo ""
    echo "Faltan archivos críticos. Por favor revisa los errores arriba."
    exit 1
fi
