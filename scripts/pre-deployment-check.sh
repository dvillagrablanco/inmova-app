#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# PRE-DEPLOYMENT CHECK - Sistema de Inversión Inmobiliaria
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "  🔍 VERIFICACIÓN PRE-DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

ERRORS=0
WARNINGS=0

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════
# 1. VERIFICAR SERVICIOS BACKEND
# ═══════════════════════════════════════════════════════════════
echo "📦 Verificando servicios backend..."

SERVICES=(
  "lib/services/investment-analysis-service.ts"
  "lib/services/sale-analysis-service.ts"
  "lib/services/rent-roll-ocr-service.ts"
  "lib/services/real-estate-integrations.ts"
  "lib/services/notary-integration-service.ts"
  "lib/services/pdf-generator-service.ts"
)

for service in "${SERVICES[@]}"; do
  if [ -f "$service" ]; then
    echo -e "${GREEN}✓${NC} $service"
  else
    echo -e "${RED}✗${NC} $service ${RED}FALTA${NC}"
    ((ERRORS++))
  fi
done
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. VERIFICAR APIs REST
# ═══════════════════════════════════════════════════════════════
echo "🔌 Verificando APIs REST..."

APIS=(
  "app/api/investment-analysis/route.ts"
  "app/api/investment-analysis/compare/route.ts"
  "app/api/investment-analysis/export-pdf/route.ts"
  "app/api/sale-analysis/route.ts"
  "app/api/rent-roll/upload/route.ts"
  "app/api/integrations/idealista/import/route.ts"
  "app/api/integrations/pisos/import/route.ts"
  "app/api/notary/verify-property/route.ts"
)

for api in "${APIS[@]}"; do
  if [ -f "$api" ]; then
    echo -e "${GREEN}✓${NC} $api"
  else
    echo -e "${RED}✗${NC} $api ${RED}FALTA${NC}"
    ((ERRORS++))
  fi
done
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. VERIFICAR COMPONENTES UI
# ═══════════════════════════════════════════════════════════════
echo "🎨 Verificando componentes UI..."

COMPONENTS=(
  "components/calculators/InvestmentAnalyzer.tsx"
  "components/investment/SaleAnalyzer.tsx"
  "components/investment/RentRollUploader.tsx"
  "components/investment/PropertyImporter.tsx"
  "components/investment/AnalysisComparator.tsx"
)

for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo -e "${GREEN}✓${NC} $component"
  else
    echo -e "${RED}✗${NC} $component ${RED}FALTA${NC}"
    ((ERRORS++))
  fi
done
echo ""

# ═══════════════════════════════════════════════════════════════
# 4. VERIFICAR PÁGINAS
# ═══════════════════════════════════════════════════════════════
echo "📄 Verificando páginas Next.js..."

PAGES=(
  "app/analisis-inversion/page.tsx"
  "app/analisis-venta/page.tsx"
  "app/herramientas-inversion/page.tsx"
)

for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo -e "${GREEN}✓${NC} $page"
  else
    echo -e "${RED}✗${NC} $page ${RED}FALTA${NC}"
    ((ERRORS++))
  fi
done
echo ""

# ═══════════════════════════════════════════════════════════════
# 5. VERIFICAR SCHEMA DE BD
# ═══════════════════════════════════════════════════════════════
echo "🗄️  Verificando schema de base de datos..."

if [ -f "prisma/schema.prisma" ]; then
  if grep -q "model InvestmentAnalysis" prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} Modelo InvestmentAnalysis encontrado"
  else
    echo -e "${RED}✗${NC} Modelo InvestmentAnalysis ${RED}NO ENCONTRADO${NC}"
    ((ERRORS++))
  fi
  
  if grep -q "model SaleAnalysis" prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} Modelo SaleAnalysis encontrado"
  else
    echo -e "${RED}✗${NC} Modelo SaleAnalysis ${RED}NO ENCONTRADO${NC}"
    ((ERRORS++))
  fi
  
  if grep -q "model RentRoll" prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} Modelo RentRoll encontrado"
  else
    echo -e "${RED}✗${NC} Modelo RentRoll ${RED}NO ENCONTRADO${NC}"
    ((ERRORS++))
  fi
else
  echo -e "${RED}✗${NC} prisma/schema.prisma ${RED}NO ENCONTRADO${NC}"
  ((ERRORS++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 6. VERIFICAR DEPENDENCIAS NPM
# ═══════════════════════════════════════════════════════════════
echo "📚 Verificando dependencias NPM..."

DEPENDENCIES=(
  "pdf-parse"
  "xlsx"
  "csv-parse"
  "tesseract.js"
  "cheerio"
  "html-pdf"
)

if [ -f "package.json" ]; then
  for dep in "${DEPENDENCIES[@]}"; do
    if grep -q "\"$dep\"" package.json; then
      echo -e "${GREEN}✓${NC} $dep"
    else
      echo -e "${YELLOW}⚠${NC} $dep ${YELLOW}NO ENCONTRADO${NC}"
      ((WARNINGS++))
    fi
  done
else
  echo -e "${RED}✗${NC} package.json ${RED}NO ENCONTRADO${NC}"
  ((ERRORS++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 7. VERIFICAR TESTS
# ═══════════════════════════════════════════════════════════════
echo "🧪 Verificando tests..."

TESTS=(
  "__tests__/investment-analysis/calculations.test.ts"
  "__tests__/investment-analysis/rent-roll-parsing.test.ts"
)

for test in "${TESTS[@]}"; do
  if [ -f "$test" ]; then
    echo -e "${GREEN}✓${NC} $test"
  else
    echo -e "${YELLOW}⚠${NC} $test ${YELLOW}NO ENCONTRADO${NC}"
    ((WARNINGS++))
  fi
done
echo ""

# ═══════════════════════════════════════════════════════════════
# 8. VERIFICAR DOCUMENTACIÓN
# ═══════════════════════════════════════════════════════════════
echo "📚 Verificando documentación..."

DOCS=(
  "RESUMEN_FINAL_COMPLETO.md"
  "SISTEMA_VENTA_ACTIVOS.md"
  "EJECUTAR_AHORA.md"
  "SISTEMA_COMPLETO_ANALISIS_INVERSION.md"
  "DEPLOYMENT_INVESTMENT_SYSTEM.md"
  "MODULO_COMPRA_COMPLETADO.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✓${NC} $doc"
  else
    echo -e "${YELLOW}⚠${NC} $doc ${YELLOW}NO ENCONTRADO${NC}"
    ((WARNINGS++))
  fi
done
echo ""

# ═══════════════════════════════════════════════════════════════
# 9. VERIFICAR VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════════
echo "🔐 Verificando variables de entorno..."

if [ -f ".env" ]; then
  echo -e "${GREEN}✓${NC} Archivo .env existe"
  
  if grep -q "DATABASE_URL" .env; then
    echo -e "${GREEN}✓${NC} DATABASE_URL configurado"
  else
    echo -e "${YELLOW}⚠${NC} DATABASE_URL ${YELLOW}NO CONFIGURADO${NC}"
    echo "   Ejecuta: echo 'DATABASE_URL=\"postgresql://...\"' >> .env"
    ((WARNINGS++))
  fi
else
  echo -e "${YELLOW}⚠${NC} Archivo .env ${YELLOW}NO ENCONTRADO${NC}"
  echo "   Copia .env.example a .env y configura las variables"
  ((WARNINGS++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 10. VERIFICAR PRISMA CLIENT
# ═══════════════════════════════════════════════════════════════
echo "⚙️  Verificando Prisma Client..."

if [ -d "node_modules/.prisma/client" ]; then
  echo -e "${GREEN}✓${NC} Prisma Client generado"
else
  echo -e "${YELLOW}⚠${NC} Prisma Client ${YELLOW}NO GENERADO${NC}"
  echo "   Ejecuta: npx prisma generate"
  ((WARNINGS++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo "  📊 RESUMEN DE VERIFICACIÓN"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ SISTEMA 100% LISTO PARA DEPLOYMENT${NC}"
  echo ""
  echo "Siguiente paso:"
  echo "  npx prisma migrate dev --name add_investment_and_sale_analysis"
  echo ""
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  SISTEMA LISTO CON ADVERTENCIAS${NC}"
  echo -e "${YELLOW}Advertencias: $WARNINGS${NC}"
  echo ""
  echo "Siguiente paso:"
  echo "  npx prisma migrate dev --name add_investment_and_sale_analysis"
  echo ""
  exit 0
else
  echo -e "${RED}❌ ERRORES ENCONTRADOS${NC}"
  echo -e "${RED}Errores: $ERRORS${NC}"
  echo -e "${YELLOW}Advertencias: $WARNINGS${NC}"
  echo ""
  echo "Revisa los errores antes de continuar."
  echo ""
  exit 1
fi
