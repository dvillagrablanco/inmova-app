#!/bin/bash

# Script de Revisión Automática de la Aplicación
# Ejecuta tests visuales y reporta errores

echo "🔍 INICIANDO REVISIÓN AUTOMÁTICA DE LA APLICACIÓN"
echo "=================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar dependencias
echo "📦 Verificando dependencias..."
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx no está instalado${NC}"
    exit 1
fi

# 2. Verificar Prisma
echo "🔧 Verificando Prisma Client..."
npx prisma generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client generado correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: Prisma Client tuvo problemas${NC}"
fi

# 3. Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf .next
echo -e "${GREEN}✅ Build limpio${NC}"

# 4. Ejecutar tests de linting
echo ""
echo "🔍 Ejecutando análisis de código..."
npx next lint --max-warnings=100 2>&1 | head -50
LINT_EXIT=$?

if [ $LINT_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Sin errores de linting críticos${NC}"
else
    echo -e "${YELLOW}⚠️  Hay advertencias de linting (revisar arriba)${NC}"
fi

# 5. Ejecutar tests visuales
echo ""
echo "🎭 Ejecutando tests visuales con Playwright..."
echo "Este proceso tomará ~2-3 minutos..."
echo ""

npx playwright test e2e/quick-visual-check.spec.ts --reporter=list --workers=1

TEST_EXIT=$?

echo ""
echo "=================================================="
echo "📊 RESUMEN DE REVISIÓN"
echo "=================================================="

if [ $TEST_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Tests visuales completados exitosamente${NC}"
else
    echo -e "${RED}❌ Algunos tests fallaron${NC}"
fi

# 6. Generar reporte
echo ""
echo "📄 Reporte completo disponible en:"
echo "   - playwright-report/index.html"
echo "   - REPORTE_CORRECIONES_VISUALES.md"
echo ""

# 7. Mostrar siguientes pasos
echo "📝 Siguientes Pasos Recomendados:"
echo "   1. Revisar el reporte HTML: npx playwright show-report"
echo "   2. Revisar screenshots en: test-results/"
echo "   3. Corregir errores encontrados"
echo "   4. Re-ejecutar este script"
echo ""

exit $TEST_EXIT
