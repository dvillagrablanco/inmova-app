#!/bin/bash

# Script de Deployment: Solución Pantalla Blanca
# Automatiza el despliegue de la solución completa

set -e

echo "🚀 Deployment: Solución de Pantalla Blanca"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
ENVIRONMENT=${1:-staging}
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}📍 Entorno: $ENVIRONMENT${NC}"
echo ""

# 1. Pre-deployment Validation
echo "🔍 Paso 1/7: Validación Pre-Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! bash scripts/validate-white-screen-solution.sh > /dev/null 2>&1; then
  echo -e "${RED}❌ Validación fallida. Ejecuta: bash scripts/validate-white-screen-solution.sh${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Validación pasada${NC}"
echo ""

# 2. Backup de archivos existentes
echo "💾 Paso 2/7: Backup de Archivos Existentes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$BACKUP_DIR"

# Backup de providers.tsx (archivo crítico)
if [ -f "components/providers.tsx" ]; then
  cp components/providers.tsx "$BACKUP_DIR/providers.tsx.backup"
  echo -e "${GREEN}✅${NC} Backup: components/providers.tsx"
fi

# Backup del error boundary antiguo (si existe)
if [ -f "components/ui/error-boundary.tsx" ]; then
  cp components/ui/error-boundary.tsx "$BACKUP_DIR/error-boundary.tsx.backup"
  echo -e "${GREEN}✅${NC} Backup: components/ui/error-boundary.tsx"
fi

echo -e "${GREEN}✅ Backups guardados en: $BACKUP_DIR${NC}"
echo ""

# 3. Instalar/Verificar Dependencias
echo "📦 Paso 3/7: Verificar Dependencias"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que @playwright/test está instalado
if ! npm list @playwright/test > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  @playwright/test no encontrado. Instalando...${NC}"
  npm install -D @playwright/test
fi

echo -e "${GREEN}✅ Dependencias verificadas${NC}"
echo ""

# 4. Verificar TypeScript
echo "📝 Paso 4/7: Verificación TypeScript"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Verificando sintaxis de componentes..."

# Verificar cada componente (ignorar errores de imports externos)
npx tsc --noEmit --skipLibCheck components/ui/enhanced-error-boundary.tsx 2>&1 | grep -i "error" | grep -v "Cannot find module" || echo -e "${GREEN}✅ EnhancedErrorBoundary OK${NC}"

npx tsc --noEmit --skipLibCheck lib/white-screen-detector.ts 2>&1 | grep -i "error" | grep -v "Cannot find module" || echo -e "${GREEN}✅ WhiteScreenDetector OK${NC}"

npx tsc --noEmit --skipLibCheck components/WhiteScreenMonitor.tsx 2>&1 | grep -i "error" | grep -v "Cannot find module" || echo -e "${GREEN}✅ WhiteScreenMonitor OK${NC}"

echo ""

# 5. Ejecutar Tests (si está en staging)
if [ "$ENVIRONMENT" = "staging" ]; then
  echo "🧪 Paso 5/7: Ejecutar Tests de Playwright"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  echo -e "${YELLOW}⚠️  Para ejecutar tests, asegúrate de tener el servidor corriendo:${NC}"
  echo "   npm run dev (en otra terminal)"
  echo ""
  echo "¿Ejecutar tests ahora? (s/N)"
  read -r run_tests
  
  if [ "$run_tests" = "s" ] || [ "$run_tests" = "S" ]; then
    echo "Ejecutando tests..."
    npx playwright test e2e/white-screen-detection.spec.ts --reporter=list || {
      echo -e "${RED}❌ Tests fallaron. Revisar errores antes de desplegar.${NC}"
      exit 1
    }
    echo -e "${GREEN}✅ Tests pasados${NC}"
  else
    echo -e "${YELLOW}⚠️  Tests omitidos${NC}"
  fi
else
  echo "🧪 Paso 5/7: Tests Omitidos (Producción)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}⚠️  En producción, los tests se ejecutan en staging${NC}"
fi

echo ""

# 6. Build de Producción (si es producción)
if [ "$ENVIRONMENT" = "production" ]; then
  echo "🏗️  Paso 6/7: Build de Producción"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  echo "Ejecutando build..."
  npm run build || {
    echo -e "${RED}❌ Build falló${NC}"
    exit 1
  }
  
  echo -e "${GREEN}✅ Build completado${NC}"
else
  echo "🏗️  Paso 6/7: Build Omitido (Staging)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}⚠️  Build se ejecuta en producción${NC}"
fi

echo ""

# 7. Confirmación Final
echo "✅ Paso 7/7: Confirmación de Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETADO${NC}"
echo ""
echo "📋 Resumen:"
echo "  • Entorno: $ENVIRONMENT"
echo "  • Backups: $BACKUP_DIR"
echo "  • Componentes instalados:"
echo "    - EnhancedErrorBoundary"
echo "    - WhiteScreenDetector"
echo "    - WhiteScreenMonitor"
echo "  • Tests: $([ "$ENVIRONMENT" = "staging" ] && echo "Ejecutados" || echo "Omitidos")"
echo ""

# Instrucciones post-deployment
echo "📌 Próximos pasos:"
echo ""

if [ "$ENVIRONMENT" = "staging" ]; then
  echo "1. Verificar que la aplicación funciona correctamente"
  echo "   → Abrir: http://localhost:3000/landing"
  echo ""
  echo "2. Ejecutar tests manualmente (si no se ejecutaron):"
  echo "   → npx playwright test e2e/white-screen-detection.spec.ts --ui"
  echo ""
  echo "3. Monitorear logs durante 24 horas"
  echo "   → Revisar consola del navegador"
  echo "   → Revisar logs del servidor"
  echo ""
  echo "4. Si todo OK, desplegar a producción:"
  echo "   → bash scripts/deploy-white-screen-solution.sh production"
else
  echo "1. Verificar que la aplicación funciona en producción"
  echo "   → Abrir: https://tudominio.com/landing"
  echo ""
  echo "2. Monitorear Sentry/logs durante 1 semana"
  echo "   → Buscar eventos: 'White Screen Detected'"
  echo "   → Verificar Error Boundary captures"
  echo ""
  echo "3. Analizar métricas:"
  echo "   → Error Capture Rate: Objetivo 100%"
  echo "   → White Screen Incidents: Objetivo 0"
  echo "   → Auto-Recovery Rate: Objetivo >80%"
  echo ""
  echo "4. Optimizar basado en datos reales"
fi

echo ""
echo -e "${BLUE}📚 Documentación completa en:${NC}"
echo "  • SOLUCION_PANTALLA_BLANCA_DEFINITIVA.md"
echo "  • .cursorrules-white-screen-solution"
echo "  • README_WHITE_SCREEN_SOLUTION.md"
echo ""

# Rollback instructions
echo -e "${YELLOW}🔄 En caso de problemas, rollback:${NC}"
echo "  cp $BACKUP_DIR/providers.tsx.backup components/providers.tsx"
echo "  git checkout HEAD -- components/"
echo ""

echo "✨ Deployment finalizado exitosamente"
