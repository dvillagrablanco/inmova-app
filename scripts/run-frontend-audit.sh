#!/bin/bash

# ==============================================================================
# 🎭 SCRIPT DE AUDITORÍA FRONTEND COMPLETA
# ==============================================================================

echo "🎭 Iniciando Auditoría Frontend Completa con Playwright"
echo "========================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paso 1: Verificar que Node y yarn estén instalados
echo "1️⃣  Verificando dependencias..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ Yarn no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias verificadas${NC}"
echo ""

# Paso 2: Verificar que Playwright esté instalado
echo "2️⃣  Verificando instalación de Playwright..."
if ! yarn playwright --version &> /dev/null; then
    echo -e "${YELLOW}⚠️  Playwright no está instalado. Instalando...${NC}"
    yarn add -D @playwright/test
    yarn playwright install chromium
fi

echo -e "${GREEN}✅ Playwright verificado${NC}"
echo ""

# Paso 3: Crear superadmin si no existe
echo "3️⃣  Verificando superadmin en base de datos..."
echo -e "${YELLOW}Ejecutando script de creación de superadmin...${NC}"
npx tsx scripts/create-super-admin.ts 2>/dev/null || echo -e "${YELLOW}⚠️  No se pudo crear superadmin (puede que ya exista)${NC}"
echo ""

# Paso 4: Verificar que el servidor esté corriendo
echo "4️⃣  Verificando servidor de desarrollo..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor corriendo en http://localhost:3000${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Servidor no detectado en http://localhost:3000${NC}"
    echo ""
    echo "El servidor de desarrollo debe estar corriendo para ejecutar la auditoría."
    echo ""
    echo "Opciones:"
    echo "  1. Abrir una nueva terminal y ejecutar: yarn dev"
    echo "  2. Ejecutar este script con flag --start-server (iniciará servidor automáticamente)"
    echo ""
    
    if [ "$1" == "--start-server" ]; then
        echo -e "${YELLOW}Iniciando servidor en segundo plano...${NC}"
        yarn dev > /dev/null 2>&1 &
        SERVER_PID=$!
        echo "Esperando a que el servidor inicie (60 segundos)..."
        sleep 60
        SERVER_RUNNING=true
    else
        echo -e "${RED}❌ Abortando auditoría${NC}"
        echo ""
        echo "Para iniciar automáticamente el servidor, ejecuta:"
        echo "  ./scripts/run-frontend-audit.sh --start-server"
        exit 1
    fi
fi

echo ""

# Paso 5: Ejecutar auditoría con Playwright
echo "5️⃣  Ejecutando auditoría completa..."
echo -e "${YELLOW}Esto puede tomar varios minutos...${NC}"
echo ""

yarn playwright test e2e/frontend-audit-complete.spec.ts --reporter=list

TEST_EXIT_CODE=$?

echo ""
echo "========================================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Auditoría completada exitosamente${NC}"
else
    echo -e "${YELLOW}⚠️  Auditoría completada con warnings/errores${NC}"
fi

echo ""

# Paso 6: Mostrar ubicación del reporte
if [ -f "frontend-audit-report/index.html" ]; then
    echo "📄 Reporte HTML generado:"
    echo "   $(pwd)/frontend-audit-report/index.html"
    echo ""
    echo "Para ver el reporte, abre el archivo en tu navegador:"
    echo "   open frontend-audit-report/index.html"
    echo ""
fi

# Paso 7: Cleanup si iniciamos el servidor
if [ ! -z "$SERVER_PID" ]; then
    echo "Deteniendo servidor de desarrollo..."
    kill $SERVER_PID 2>/dev/null
fi

echo "🎉 Auditoría finalizada"
echo ""

exit $TEST_EXIT_CODE
