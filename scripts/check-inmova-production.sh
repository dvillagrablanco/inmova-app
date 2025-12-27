#!/bin/bash

###############################################################################
# Script para verificar TODAS las funcionalidades de inmova.app
# Ejecuta Playwright con el test de superadmin en PRODUCCIÓN
###############################################################################

set -e

echo "=================================================="
echo "🔍 VERIFICACIÓN COMPLETA DE INMOVA.APP"
echo "=================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Este script debe ejecutarse desde la raíz del proyecto${NC}"
    exit 1
fi

# Verificar que Playwright está instalado
echo -e "${YELLOW}📦 Verificando instalación de Playwright...${NC}"
if ! npx playwright --version > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Playwright no encontrado. Instalando...${NC}"
    npx playwright install chromium
else
    echo -e "${GREEN}✅ Playwright instalado${NC}"
    npx playwright --version
fi

# Crear directorios necesarios
echo ""
echo -e "${YELLOW}📁 Creando directorios para reportes...${NC}"
mkdir -p screenshots playwright-report-production test-results

# Ejecutar el test
echo ""
echo -e "${GREEN}🚀 Iniciando verificación completa...${NC}"
echo -e "${YELLOW}🔐 Usuario: superadmin@inmova.com${NC}"
echo -e "${YELLOW}🌐 URL: https://inmova.app${NC}"
echo ""
echo "=================================================="
echo ""

# Ejecutar solo el test de superadmin con la configuración de producción
npx playwright test superadmin-full-check.spec.ts \
    --config=playwright.config.production.ts \
    --project=chromium-desktop \
    --reporter=list,html \
    --timeout=300000

# Verificar resultado
TEST_EXIT_CODE=$?

echo ""
echo "=================================================="
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE${NC}"
else
    echo -e "${RED}⚠️  VERIFICACIÓN COMPLETADA CON ERRORES${NC}"
    echo -e "${YELLOW}   Ver reporte HTML para detalles${NC}"
fi
echo "=================================================="

# Mostrar ubicación de reportes
echo ""
echo -e "${YELLOW}📊 REPORTES GENERADOS:${NC}"
echo ""
if [ -f "superadmin-verification-report.json" ]; then
    echo -e "  📄 JSON: ${GREEN}superadmin-verification-report.json${NC}"
fi
if [ -d "playwright-report-production" ]; then
    echo -e "  📄 HTML: ${GREEN}playwright-report-production/index.html${NC}"
fi
if [ -d "screenshots" ]; then
    SCREENSHOT_COUNT=$(find screenshots -name "*.png" 2>/dev/null | wc -l)
    echo -e "  📸 Screenshots: ${GREEN}${SCREENSHOT_COUNT} archivos en screenshots/${NC}"
fi

# Mostrar comando para ver el reporte HTML
echo ""
echo -e "${YELLOW}Para ver el reporte HTML detallado:${NC}"
echo -e "  ${GREEN}npx playwright show-report playwright-report-production${NC}"
echo ""

# Mostrar resumen del JSON si existe
if [ -f "superadmin-verification-report.json" ]; then
    echo -e "${YELLOW}📋 RESUMEN RÁPIDO:${NC}"
    echo ""
    
    # Usar jq si está disponible, sino mostrar el archivo
    if command -v jq &> /dev/null; then
        echo -e "${GREEN}$(jq -r '.summary | "  ✅ Exitosos: \(.success)\n  ❌ Errores: \(.errors)\n  ⚠️  Advertencias: \(.warnings)\n  📄 Total: \(.total)"' superadmin-verification-report.json)${NC}"
    else
        cat superadmin-verification-report.json | head -20
    fi
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Proceso completado${NC}"
echo "=================================================="

exit $TEST_EXIT_CODE
