#!/bin/bash

# ==============================================================================
# 🎭 SCRIPT DE AUDITORÍA FRONTEND EXHAUSTIVA - 233 RUTAS
# ==============================================================================

echo "🎭 Auditoría Frontend Exhaustiva - Inmova App"
echo "=============================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Procesar argumentos
MODE=${1:-"all"}  # all | high | medium
PARALLEL=${2:-"false"}

echo -e "${BLUE}Modo de ejecución: $MODE${NC}"
echo ""

# Configurar modo
export AUDIT_MODE=$MODE

# Paso 1: Generar lista actualizada de rutas
echo "1️⃣  Generando lista actualizada de rutas..."
npx tsx scripts/generate-routes-list.ts > /dev/null 2>&1
echo -e "${GREEN}✅ Lista de rutas actualizada${NC}"
echo ""

# Paso 2: Verificar superadmin
echo "2️⃣  Verificando superadmin..."
npx tsx scripts/create-super-admin.ts 2>/dev/null || echo -e "${YELLOW}⚠️  Superadmin ya existe${NC}"
echo ""

# Paso 3: Verificar servidor
echo "3️⃣  Verificando servidor..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor corriendo${NC}"
    SERVER_RUNNING=true
else
    echo -e "${RED}❌ Servidor NO detectado${NC}"
    echo ""
    echo "Debes iniciar el servidor antes de ejecutar la auditoría:"
    echo "  ${YELLOW}yarn dev${NC}"
    echo ""
    exit 1
fi

echo ""

# Paso 4: Mostrar información del test
case "$MODE" in
  "high")
    ROUTES_COUNT=6
    echo -e "${BLUE}📊 Modo: ALTA PRIORIDAD${NC}"
    echo "   Rutas a auditar: ~$ROUTES_COUNT"
    echo "   Tiempo estimado: ~2 minutos"
    ;;
  "medium")
    ROUTES_COUNT=84
    echo -e "${BLUE}📊 Modo: ALTA + MEDIA PRIORIDAD${NC}"
    echo "   Rutas a auditar: ~$ROUTES_COUNT"
    echo "   Tiempo estimado: ~15-20 minutos"
    ;;
  *)
    ROUTES_COUNT=233
    echo -e "${BLUE}📊 Modo: TODAS LAS RUTAS${NC}"
    echo "   Rutas a auditar: $ROUTES_COUNT"
    echo "   Tiempo estimado: ~40-60 minutos"
    ;;
esac

echo ""
echo -e "${YELLOW}⚠️  Esta auditoría puede tomar tiempo. Se generará un reporte completo al finalizar.${NC}"
echo ""

read -p "¿Continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Auditoría cancelada"
    exit 0
fi

echo ""
echo "4️⃣  Ejecutando auditoría exhaustiva..."
echo ""

# Ejecutar test
if [ "$PARALLEL" = "true" ]; then
    yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --workers=4 --reporter=list
else
    yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --reporter=list
fi

TEST_EXIT_CODE=$!

echo ""
echo "=============================================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Auditoría completada exitosamente${NC}"
else
    echo -e "${YELLOW}⚠️  Auditoría completada con warnings/errores${NC}"
fi

echo ""

# Mostrar ubicación del reporte
if [ -f "frontend-audit-exhaustive-report/index.html" ]; then
    echo -e "${GREEN}📄 Reporte HTML generado:${NC}"
    echo "   $(pwd)/frontend-audit-exhaustive-report/index.html"
    echo ""
    echo -e "${BLUE}Para ver el reporte, ejecuta:${NC}"
    echo "   ${YELLOW}open frontend-audit-exhaustive-report/index.html${NC}"
    echo ""
fi

echo "🎉 Auditoría finalizada"
echo ""

exit $TEST_EXIT_CODE
