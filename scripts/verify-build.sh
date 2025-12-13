#!/bin/bash

# Script de Verificación de Build para INMOVA
# Este script verifica que el proyecto esté listo para desplegar

echo "======================================"
echo "  Verificación de Build - INMOVA"
echo "======================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0
WARNINGS=0

# Verificar Node.js
echo "[1/8] Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar Yarn
echo "[2/8] Verificando Yarn..."
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    echo -e "${GREEN}✓ Yarn instalado: $YARN_VERSION${NC}"
else
    echo -e "${RED}✗ Yarn no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar node_modules
echo "[3/8] Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules existe${NC}"
else
    echo -e "${YELLOW}⚠ node_modules no encontrado, instalando...${NC}"
    yarn install
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Verificar .env
echo "[4/8] Verificando variables de entorno..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ Archivo .env existe${NC}"
    
    # Verificar variables críticas
    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}  ✓ DATABASE_URL configurado${NC}"
    else
        echo -e "${YELLOW}  ⚠ DATABASE_URL no configurado${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env; then
        echo -e "${GREEN}  ✓ NEXTAUTH_SECRET configurado${NC}"
    else
        echo -e "${YELLOW}  ⚠ NEXTAUTH_SECRET no configurado${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -q "NODE_OPTIONS" .env; then
        echo -e "${GREEN}  ✓ NODE_OPTIONS configurado${NC}"
    else
        echo -e "${YELLOW}  ⚠ NODE_OPTIONS no configurado (puede causar problemas de memoria)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗ Archivo .env no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar Prisma
echo "[5/8] Verificando Prisma..."
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓ schema.prisma existe${NC}"
    
    # Intentar generar Prisma Client
    echo "  Generando Prisma Client..."
    if yarn prisma generate > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Prisma Client generado${NC}"
    else
        echo -e "${YELLOW}  ⚠ Error al generar Prisma Client${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗ schema.prisma no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar archivos de configuración
echo "[6/8] Verificando archivos de configuración..."

if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓ vercel.json existe${NC}"
else
    echo -e "${YELLOW}⚠ vercel.json no encontrado (recomendado para Vercel)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓ tsconfig.json existe${NC}"
else
    echo -e "${RED}✗ tsconfig.json no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "next.config.js" ]; then
    echo -e "${GREEN}✓ next.config.js existe${NC}"
else
    echo -e "${RED}✗ next.config.js no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Limpiar cache
echo "[7/8] Limpiando cache..."
rm -rf .next
rm -rf .build
rm -rf out
echo -e "${GREEN}✓ Cache limpiado${NC}"
echo ""

# Intentar build
echo "[8/8] Intentando build de prueba..."
echo "Este proceso puede tomar varios minutos..."
echo ""

export NODE_OPTIONS="--max-old-space-size=8192"

if yarn build 2>&1 | tee build.log; then
    echo ""
    echo -e "${GREEN}✓ Build exitoso!${NC}"
else
    echo ""
    echo -e "${RED}✗ Build fallido. Revisa build.log para más detalles.${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Resumen
echo "======================================"
echo "          RESUMEN"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ ¡Todo perfecto! El proyecto está listo para desplegar.${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ejecuta: vercel"
    echo "2. Sigue las instrucciones"
    echo "3. Para producción: vercel --prod"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Proyecto con $WARNINGS advertencias${NC}"
    echo "Puedes desplegar, pero revisa las advertencias."
else
    echo -e "${RED}✗ Proyecto con $ERRORS errores y $WARNINGS advertencias${NC}"
    echo "Corrige los errores antes de desplegar."
fi

echo ""
echo "Para más ayuda, consulta: DESPLIEGUE_VERCEL.md"
echo ""
