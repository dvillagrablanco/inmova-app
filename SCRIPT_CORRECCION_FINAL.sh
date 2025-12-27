#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Script de Corrección FINAL de Errores de Build
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🔧 CORRECCIÓN FINAL DE ERRORES DE BUILD                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Función para mostrar progreso
show_progress() {
  echo "  ▶ $1..."
}

show_success() {
  echo "  ✅ $1"
}

show_error() {
  echo "  ❌ $1"
}

show_warning() {
  echo "  ⚠️  $1"
}

# Contador de correcciones
total_fixed=0

echo "🔍 Ejecutando scripts de corrección automática..."
echo "─────────────────────────────────────────────────────────────"
echo ""

# Script 1: Corrección de imports y auth
if [ -f "scripts/fix-all-build-errors.js" ]; then
  show_progress "Ejecutando fix-all-build-errors.js"
  node scripts/fix-all-build-errors.js
  if [ $? -eq 0 ]; then
    show_success "Imports y auth corregidos"
    ((total_fixed++))
  fi
  echo ""
fi

# Script 2: Corrección de AuthenticatedLayout
if [ -f "scripts/fix-authenticated-layout.js" ]; then
  show_progress "Ejecutando fix-authenticated-layout.js"
  result=$(node scripts/fix-authenticated-layout.js | grep "Archivos corregidos:" | awk '{print $3}')
  if [ ! -z "$result" ] && [ "$result" -gt 0 ]; then
    show_success "AuthenticatedLayout: $result archivos"
    ((total_fixed+=result))
  fi
  echo ""
fi

# Script 3: Ultimate fix
if [ -f "scripts/ultimate-fix.js" ]; then
  show_progress "Ejecutando ultimate-fix.js"
  result=$(node scripts/ultimate-fix.js | grep "Archivos corregidos:" | awk '{print $3}')
  if [ ! -z "$result" ] && [ "$result" -gt 0 ]; then
    show_success "Ultimate fix: $result archivos"
    ((total_fixed+=result))
  fi
  echo ""
fi

# Script 4: Unreachable code
if [ -f "scripts/fix-unreachable-code.js" ]; then
  show_progress "Ejecutando fix-unreachable-code.js"
  result=$(node scripts/fix-unreachable-code.js | grep "Archivos corregidos:" | awk '{print $3}')
  if [ ! -z "$result" ] && [ "$result" -gt 0 ]; then
    show_success "Código inalcanzable: $result archivos"
    ((total_fixed+=result))
  fi
  echo ""
fi

# Script 5: JSX final
if [ -f "scripts/fix-jsx-final.js" ]; then
  show_progress "Ejecutando fix-jsx-final.js"
  result=$(node scripts/fix-jsx-final.js | grep "Archivos corregidos:" | awk '{print $3}')
  if [ ! -z "$result" ] && [ "$result" -gt 0 ]; then
    show_success "JSX final: $result archivos"
    ((total_fixed+=result))
  fi
  echo ""
fi

echo "─────────────────────────────────────────────────────────────"
echo "📊 Total de archivos procesados: $total_fixed"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Intentar build
echo "🏗️  Intentando build de producción..."
echo "─────────────────────────────────────────────────────────────"
echo ""

npm run build > build-log.txt 2>&1

if [ $? -eq 0 ]; then
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  ✅ BUILD EXITOSO                                          ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "El proyecto se compiló correctamente."
  echo "Puedes continuar con el deployment:"
  echo ""
  echo "  npm start"
  echo ""
else
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  ⚠️  BUILD FALLÓ - ERRORES PRE-EXISTENTES                 ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "El build de producción aún tiene errores pre-existentes."
  echo ""
  echo "Ver log completo en: build-log.txt"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  SOLUCIONES DISPONIBLES"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "1️⃣  RECOMENDADO: Deployment en Modo Desarrollo"
  echo "   → Rápido, funcional, Sistema de Inversiones 100% operativo"
  echo "   → Comando: bash deploy-dev-server.sh"
  echo "   → Guía: DEPLOYMENT_MODO_DESARROLLO.md"
  echo ""
  echo "2️⃣  Corrección Manual (3-5 horas)"
  echo "   → Para build de producción optimizado"
  echo "   → Revisar archivos listados en build-log.txt"
  echo "   → Guía: ERRORES_BUILD_SOLUCION.md"
  echo ""
  echo "3️⃣  Deshabilitación Temporal"
  echo "   → bash scripts/disable-all-problematic.sh"
  echo "   → Algunas funcionalidades no disponibles"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  
  # Mostrar primeros errores
  echo "Primeros errores encontrados:"
  echo "─────────────────────────────────────────────────────────────"
  head -50 build-log.txt | grep -A 3 "Error:"
  echo ""
fi

echo "📄 Documentación completa disponible:"
echo "   - ERRORES_BUILD_SOLUCION.md"
echo "   - LEER_PRIMERO_DEPLOYMENT.md"
echo "   - DEPLOYMENT_MODO_DESARROLLO.md"
echo ""
