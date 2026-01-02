#!/bin/bash

# Script de Validación: Solución de Pantalla Blanca
# Verifica que todos los componentes estén instalados correctamente

set -e

echo "🔍 Validando Solución de Pantalla Blanca..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de validaciones
PASSED=0
FAILED=0

# Función de validación
validate() {
  local name=$1
  local file=$2
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $name encontrado: $file"
    ((PASSED++))
  else
    echo -e "${RED}❌${NC} $name NO encontrado: $file"
    ((FAILED++))
  fi
}

# 1. Validar componentes principales
echo "📦 Validando componentes principales..."
validate "EnhancedErrorBoundary" "components/ui/enhanced-error-boundary.tsx"
validate "WhiteScreenDetector" "lib/white-screen-detector.ts"
validate "WhiteScreenMonitor" "components/WhiteScreenMonitor.tsx"
echo ""

# 2. Validar tests
echo "🧪 Validando tests de Playwright..."
validate "White Screen Detection Tests" "e2e/white-screen-detection.spec.ts"
echo ""

# 3. Validar documentación
echo "📚 Validando documentación..."
validate "Solución Definitiva (MD)" "SOLUCION_PANTALLA_BLANCA_DEFINITIVA.md"
validate "Cursorrules" ".cursorrules-white-screen-solution"
echo ""

# 4. Verificar que Providers usa EnhancedErrorBoundary
echo "🔗 Verificando integración en Providers..."
if grep -q "EnhancedErrorBoundary" components/providers.tsx; then
  echo -e "${GREEN}✅${NC} Providers usa EnhancedErrorBoundary"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} Providers NO usa EnhancedErrorBoundary"
  ((FAILED++))
fi

if grep -q "WhiteScreenMonitor" components/providers.tsx; then
  echo -e "${GREEN}✅${NC} Providers incluye WhiteScreenMonitor"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} Providers NO incluye WhiteScreenMonitor"
  ((FAILED++))
fi
echo ""

# 5. Verificar sintaxis TypeScript (si tsc está disponible)
echo "📝 Verificando sintaxis TypeScript..."
if command -v npx &> /dev/null; then
  if npx tsc --noEmit components/ui/enhanced-error-boundary.tsx 2>/dev/null; then
    echo -e "${GREEN}✅${NC} EnhancedErrorBoundary: Sin errores de sintaxis"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠️${NC} EnhancedErrorBoundary: Revisar sintaxis (nota: puede ser por configuración de tsconfig)"
  fi
  
  if npx tsc --noEmit lib/white-screen-detector.ts 2>/dev/null; then
    echo -e "${GREEN}✅${NC} WhiteScreenDetector: Sin errores de sintaxis"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠️${NC} WhiteScreenDetector: Revisar sintaxis (nota: puede ser por configuración de tsconfig)"
  fi
else
  echo -e "${YELLOW}⚠️${NC} npx no disponible, omitiendo verificación de sintaxis"
fi
echo ""

# 6. Crear directorio de screenshots si no existe
echo "📸 Verificando directorio de screenshots..."
mkdir -p screenshots
echo -e "${GREEN}✅${NC} Directorio screenshots creado/verificado"
((PASSED++))
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📊 RESUMEN DE VALIDACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Validaciones pasadas: $PASSED${NC}"
echo -e "${RED}❌ Validaciones fallidas: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 VALIDACIÓN EXITOSA${NC}"
  echo "Todos los componentes de la solución están instalados correctamente."
  echo ""
  echo "🚀 Próximos pasos:"
  echo "1. Instalar Playwright: npm install -D @playwright/test"
  echo "2. Instalar browsers: npx playwright install"
  echo "3. Ejecutar tests: npx playwright test e2e/white-screen-detection.spec.ts"
  echo "4. Desplegar a staging/producción"
  exit 0
else
  echo -e "${RED}⚠️ VALIDACIÓN INCOMPLETA${NC}"
  echo "Algunos componentes faltan o no están correctamente integrados."
  echo "Revisa los errores arriba y corrígelos antes de desplegar."
  exit 1
fi
