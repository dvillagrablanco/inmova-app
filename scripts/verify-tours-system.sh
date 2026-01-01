#!/bin/bash

# Script de verificación del sistema de Tours y Módulos
# Ejecutar: bash scripts/verify-tours-system.sh

set -e

echo "🔍 VERIFICANDO SISTEMA DE TOURS Y MÓDULOS..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Function para verificar archivos
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} Archivo existe: $1"
    ((PASSED++))
  else
    echo -e "${RED}❌${NC} Archivo NO existe: $1"
    ((FAILED++))
  fi
}

# Function para verificar directorios
check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✅${NC} Directorio existe: $1"
    ((PASSED++))
  else
    echo -e "${RED}❌${NC} Directorio NO existe: $1"
    ((FAILED++))
  fi
}

echo "📦 VERIFICANDO ARCHIVOS CORE..."
echo ""

# Core System
check_file "lib/virtual-tours-system.ts"
check_file "lib/modules-management-system.ts"
check_file "lib/user-preferences-service.ts"

echo ""
echo "🔌 VERIFICANDO APIs..."
echo ""

# APIs
check_file "app/api/modules/route.ts"
check_file "app/api/tours/route.ts"
check_file "app/api/preferences/route.ts"

echo ""
echo "🎨 VERIFICANDO COMPONENTES..."
echo ""

# Components
check_file "components/modules/ModuleManager.tsx"
check_file "components/tours/VirtualTourPlayer.tsx"
check_file "components/tours/ToursList.tsx"
check_file "components/tours/TourAutoStarter.tsx"
check_file "components/tours/FloatingTourButton.tsx"
check_file "components/preferences/PreferencesPanel.tsx"

echo ""
echo "🪝 VERIFICANDO HOOKS..."
echo ""

# Hooks
check_file "hooks/useVirtualTour.ts"
check_file "hooks/useModules.ts"

echo ""
echo "📄 VERIFICANDO PÁGINAS..."
echo ""

# Pages
check_file "app/(dashboard)/configuracion/page.tsx"

echo ""
echo "📚 VERIFICANDO DOCUMENTACIÓN..."
echo ""

# Documentation
check_file "TOURS_VIRTUALES_Y_MODULOS_COMPLETO.md"
check_file "TOURS_VIRTUALES_IMPLEMENTACION.md"
check_file "TESTING_TOURS_Y_MODULOS.md"
check_file "RESUMEN_FINAL_TOURS_MODULOS.md"
check_file "CHECKLIST_DEPLOYMENT_TOURS.md"

echo ""
echo "🔧 VERIFICANDO MODIFICACIONES..."
echo ""

# Modified files
check_file "components/layout/authenticated-layout.tsx"
check_file "app/dashboard/page.tsx"
check_file "components/layout/sidebar.tsx"

echo ""
echo "📊 VERIFICANDO ESTRUCTURA DE CARPETAS..."
echo ""

# Directories
check_dir "components/modules"
check_dir "components/tours"
check_dir "components/preferences"
check_dir "app/api/modules"
check_dir "app/api/tours"
check_dir "app/api/preferences"

echo ""
echo "🔍 VERIFICANDO IMPORTS..."
echo ""

# Verificar que los imports existen en authenticated-layout
if grep -q "TourAutoStarter" components/layout/authenticated-layout.tsx; then
  echo -e "${GREEN}✅${NC} Import de TourAutoStarter encontrado"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} Import de TourAutoStarter NO encontrado"
  ((FAILED++))
fi

if grep -q "FloatingTourButton" components/layout/authenticated-layout.tsx; then
  echo -e "${GREEN}✅${NC} Import de FloatingTourButton encontrado"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} Import de FloatingTourButton NO encontrado"
  ((FAILED++))
fi

echo ""
echo "🏷️ VERIFICANDO DATA-TOUR ATTRIBUTES..."
echo ""

# Verificar data-tour en dashboard
if grep -q 'data-tour="kpi-cards"' app/dashboard/page.tsx; then
  echo -e "${GREEN}✅${NC} data-tour='kpi-cards' encontrado en dashboard"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} data-tour='kpi-cards' NO encontrado en dashboard"
  ((FAILED++))
fi

if grep -q 'data-tour="charts"' app/dashboard/page.tsx; then
  echo -e "${GREEN}✅${NC} data-tour='charts' encontrado en dashboard"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} data-tour='charts' NO encontrado en dashboard"
  ((FAILED++))
fi

if grep -q 'data-tour="configuracion-link"' components/layout/sidebar.tsx; then
  echo -e "${GREEN}✅${NC} data-tour='configuracion-link' encontrado en sidebar"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} data-tour='configuracion-link' NO encontrado en sidebar"
  ((FAILED++))
fi

echo ""
echo "📦 VERIFICANDO DEPENDENCIAS..."
echo ""

# Verificar que no hay imports faltantes (compilación TypeScript)
if command -v tsc &> /dev/null; then
  echo "Verificando tipos de TypeScript..."
  if npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌${NC} Errores de TypeScript encontrados"
    ((FAILED++))
  else
    echo -e "${GREEN}✅${NC} Sin errores de TypeScript"
    ((PASSED++))
  fi
else
  echo -e "${YELLOW}⚠️${NC} TypeScript no disponible, saltando verificación"
fi

echo ""
echo "=" 
echo "=" 
echo ""
echo "📊 RESUMEN DE VERIFICACIÓN"
echo ""
echo -e "${GREEN}✅ Pasaron:${NC} $PASSED checks"
echo -e "${RED}❌ Fallaron:${NC} $FAILED checks"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ¡VERIFICACIÓN EXITOSA!${NC}"
  echo ""
  echo "El sistema de Tours y Módulos está correctamente instalado."
  echo ""
  echo "📝 Próximos pasos:"
  echo "1. Ejecutar usuarios de prueba: psql -f scripts/create-test-users-simple.sql"
  echo "2. Iniciar servidor: yarn dev"
  echo "3. Probar login con: principiante@gestor.es / Test123456!"
  echo "4. Revisar CHECKLIST_DEPLOYMENT_TOURS.md para testing completo"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️ VERIFICACIÓN FALLÓ${NC}"
  echo ""
  echo "Algunos archivos o configuraciones están faltando."
  echo "Por favor revisa los errores arriba y corrígelos."
  echo ""
  exit 1
fi
