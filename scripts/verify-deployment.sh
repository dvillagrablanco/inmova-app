#!/bin/bash

# Script de verificación de deployment de landing page
# Uso: ./scripts/verify-deployment.sh

echo "🔍 VERIFICACIÓN DE DEPLOYMENT - INMOVA LANDING PAGE"
echo "=================================================="
echo ""

URL="https://inmovaapp.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📍 URL a verificar: $URL"
echo ""

# 1. Verificar que el sitio esté online
echo "1️⃣  Verificando accesibilidad del sitio..."
if curl -s --head --request GET "$URL" | grep "200 OK" > /dev/null; then 
    echo -e "${GREEN}✅ Sitio accesible (200 OK)${NC}"
else
    echo -e "${RED}❌ Sitio no accesible${NC}"
    exit 1
fi

# 2. Verificar que contenga el nuevo contenido de la landing
echo ""
echo "2️⃣  Verificando contenido de la landing..."
CONTENT=$(curl -s "$URL")

if echo "$CONTENT" | grep -q "La Plataforma PropTech"; then
    echo -e "${GREEN}✅ Contenido de landing detectado${NC}"
else
    echo -e "${RED}❌ Contenido de landing NO detectado${NC}"
fi

# 3. Verificar Google Analytics
echo ""
echo "3️⃣  Verificando Google Analytics..."
if echo "$CONTENT" | grep -q "google-analytics.com"; then
    echo -e "${GREEN}✅ Script de Google Analytics presente${NC}"
    
    # Intentar extraer el GA ID
    GA_ID=$(echo "$CONTENT" | grep -o "G-[A-Z0-9]\{10\}" | head -1)
    if [ -n "$GA_ID" ]; then
        echo -e "${GREEN}   GA ID encontrado: $GA_ID${NC}"
    else
        echo -e "${YELLOW}   ⚠️  GA ID genérico detectado (configurar ID real)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Google Analytics NO detectado${NC}"
fi

# 4. Verificar Hotjar
echo ""
echo "4️⃣  Verificando Hotjar..."
if echo "$CONTENT" | grep -q "hotjar.com"; then
    echo -e "${GREEN}✅ Hotjar integrado${NC}"
    
    HOTJAR_ID=$(echo "$CONTENT" | grep -o "hjid:[0-9]\{7\}" | head -1 | cut -d: -f2)
    if [ -n "$HOTJAR_ID" ]; then
        echo -e "${GREEN}   Hotjar ID: $HOTJAR_ID${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Hotjar no configurado (opcional)${NC}"
fi

# 5. Verificar Microsoft Clarity
echo ""
echo "5️⃣  Verificando Microsoft Clarity..."
if echo "$CONTENT" | grep -q "clarity.ms"; then
    echo -e "${GREEN}✅ Clarity integrado${NC}"
else
    echo -e "${YELLOW}⚠️  Clarity no configurado (opcional)${NC}"
fi

# 6. Verificar componentes críticos
echo ""
echo "6️⃣  Verificando componentes críticos..."

components=(
    "Navigation:data-component=\"navigation\""
    "Hero Section:Prueba GRATIS"
    "ROI Calculator:Calcular Mi Ahorro"
    "Pricing:Planes que Escalan"
    "FAQ:Preguntas Frecuentes"
)

for comp in "${components[@]}"; do
    name="${comp%%:*}"
    search="${comp##*:}"
    
    if echo "$CONTENT" | grep -q "$search"; then
        echo -e "${GREEN}✅ $name presente${NC}"
    else
        echo -e "${YELLOW}⚠️  $name no detectado${NC}"
    fi
done

# 7. Verificar performance headers
echo ""
echo "7️⃣  Verificando headers de performance..."

HEADERS=$(curl -s -I "$URL")

if echo "$HEADERS" | grep -q "x-vercel-cache"; then
    echo -e "${GREEN}✅ Cache de Vercel activo${NC}"
else
    echo -e "${YELLOW}⚠️  Cache headers no detectados${NC}"
fi

# 8. Test de velocidad básico
echo ""
echo "8️⃣  Test de velocidad básico..."

START_TIME=$(date +%s%N)
curl -s "$URL" > /dev/null
END_TIME=$(date +%s%N)
DURATION=$((($END_TIME - $START_TIME) / 1000000))

if [ $DURATION -lt 1000 ]; then
    echo -e "${GREEN}✅ Tiempo de respuesta: ${DURATION}ms (Excelente)${NC}"
elif [ $DURATION -lt 2000 ]; then
    echo -e "${GREEN}✅ Tiempo de respuesta: ${DURATION}ms (Bueno)${NC}"
else
    echo -e "${YELLOW}⚠️  Tiempo de respuesta: ${DURATION}ms (Puede mejorar)${NC}"
fi

# Resumen final
echo ""
echo "=================================================="
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "=================================================="
echo ""
echo "✅ Sitio online y funcionando"
echo ""
echo "📋 SIGUIENTE PASO:"
echo "   1. Abrir $URL en navegador"
echo "   2. Verificar visualmente la landing"
echo "   3. Configurar GA_ID en Vercel si aún no está"
echo "   4. Hacer pruebas de usabilidad"
echo ""
echo "📖 Guía completa: VERCEL_ENV_SETUP.md"
echo ""
