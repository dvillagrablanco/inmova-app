#!/bin/bash

###############################################################################
# Script para ejecutar la verificación completa de INMOVA
# Uso: ./scripts/run-verificacion.sh
###############################################################################

set -e

echo "=================================================="
echo "🔍 VERIFICACIÓN COMPLETA DE INMOVA"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Este script debe ejecutarse desde la raíz del proyecto${NC}"
    exit 1
fi

# Verificar si el servidor está corriendo
echo -e "${YELLOW}📡 Verificando servidor...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor corriendo en http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor no detectado en http://localhost:3000${NC}"
    echo ""
    echo -e "${BLUE}Opciones:${NC}"
    echo "  1. Iniciar el servidor: yarn dev"
    echo "  2. Usar una URL diferente: BASE_URL=https://tu-url.com $0"
    echo ""
    read -p "¿Deseas continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado"
        exit 1
    fi
fi

# Verificar que Playwright está instalado
echo ""
echo -e "${YELLOW}📦 Verificando Playwright...${NC}"
if [ -d "node_modules/playwright" ]; then
    echo -e "${GREEN}✅ Playwright instalado${NC}"
else
    echo -e "${YELLOW}⚠️  Playwright no encontrado. Instalando...${NC}"
    npm install --no-save playwright
fi

# Verificar que los navegadores están instalados
if [ ! -d "$HOME/.cache/ms-playwright/chromium-1200" ]; then
    echo -e "${YELLOW}📥 Instalando navegador Chromium...${NC}"
    npx playwright install chromium
fi

# Crear directorio de screenshots
echo ""
echo -e "${YELLOW}📁 Preparando directorios...${NC}"
mkdir -p screenshots
mkdir -p test-results

# Ejecutar la verificación
echo ""
echo -e "${GREEN}🚀 Iniciando verificación...${NC}"
echo -e "${BLUE}🔐 Usuario: superadmin@inmova.com${NC}"
echo -e "${BLUE}🌐 URL: ${BASE_URL:-http://localhost:3000}${NC}"
echo ""
echo "=================================================="
echo ""

# Ejecutar el script
node scripts/check-inmova-localhost.mjs

# Capturar código de salida
EXIT_CODE=$?

echo ""
echo "=================================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE${NC}"
else
    echo -e "${YELLOW}⚠️  VERIFICACIÓN COMPLETADA CON ADVERTENCIAS${NC}"
fi
echo "=================================================="

# Mostrar ubicación de reportes
echo ""
echo -e "${YELLOW}📊 REPORTES GENERADOS:${NC}"
echo ""

if [ -f "superadmin-verification-report.json" ]; then
    echo -e "  📄 JSON: ${GREEN}superadmin-verification-report.json${NC}"
    
    # Mostrar resumen si jq está disponible
    if command -v jq &> /dev/null; then
        echo ""
        echo -e "${YELLOW}📋 RESUMEN:${NC}"
        jq -r '.summary | "  ✅ Exitosos: \(.success)\n  ❌ Errores: \(.errors)\n  ⚠️  Advertencias: \(.warnings)\n  📄 Total: \(.total)\n  📊 Tasa de éxito: \(.successRate)"' superadmin-verification-report.json
    fi
fi

if [ -d "screenshots" ]; then
    SCREENSHOT_COUNT=$(find screenshots -name "*.png" 2>/dev/null | wc -l)
    if [ "$SCREENSHOT_COUNT" -gt 0 ]; then
        echo ""
        echo -e "  📸 Screenshots: ${GREEN}${SCREENSHOT_COUNT} archivos en screenshots/${NC}"
        echo ""
        echo -e "${YELLOW}Para ver los screenshots:${NC}"
        echo "  cd screenshots && ls -la"
    fi
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Proceso completado${NC}"
echo "=================================================="
echo ""

# Abrir el reporte si está disponible
if command -v xdg-open &> /dev/null && [ -f "superadmin-verification-report.json" ]; then
    read -p "¿Deseas abrir el reporte? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open screenshots/ 2>/dev/null || echo "Abre manualmente: screenshots/"
    fi
fi

exit $EXIT_CODE
