#!/bin/bash

echo "======================================"
echo "INMOVA - Verificación Pre-Deployment"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
PASSED=0
FAILED=0
WARNING=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNING++))
}

echo "1. Verificando archivos críticos..."
echo "-----------------------------------"

# Verificar .gitignore
if [ -f ".gitignore" ] && grep -q ".env" .gitignore; then
    check_pass ".gitignore existe y .env está ignorado"
else
    check_fail ".gitignore no está configurado correctamente"
fi

# Verificar .env.example
if [ -f ".env.example" ]; then
    check_pass ".env.example existe"
else
    check_fail ".env.example no existe"
fi

# Verificar vercel.json
if [ -f "vercel.json" ]; then
    check_pass "vercel.json existe"
else
    check_warn "vercel.json no existe (se creará automáticamente)"
fi

# Verificar package.json
if [ -f "package.json" ]; then
    check_pass "package.json existe"
    
    if grep -q '"build"' package.json; then
        check_pass "Script de build definido"
    else
        check_fail "Script de build no definido"
    fi
    
    if grep -q '"postinstall"' package.json; then
        check_pass "Script postinstall definido (Prisma)"
    else
        check_warn "Script postinstall no definido"
    fi
else
    check_fail "package.json no existe"
fi

# Verificar next.config.js
if [ -f "next.config.js" ]; then
    check_pass "next.config.js existe"
else
    check_fail "next.config.js no existe"
fi

echo ""
echo "2. Verificando documentación..."
echo "-----------------------------------"

if [ -f "README.md" ]; then
    check_pass "README.md existe"
else
    check_warn "README.md no existe"
fi

if [ -f "DEPLOYMENT.md" ]; then
    check_pass "DEPLOYMENT.md existe"
else
    check_warn "DEPLOYMENT.md no existe"
fi

echo ""
echo "3. Verificando Prisma..."
echo "-----------------------------------"

if [ -f "prisma/schema.prisma" ]; then
    check_pass "schema.prisma existe"
else
    check_fail "schema.prisma no existe"
fi

if [ -d "prisma/migrations" ]; then
    check_pass "Carpeta de migraciones existe"
else
    check_warn "No hay migraciones (se crearán en producción)"
fi

echo ""
echo "4. Verificando estructura del proyecto..."
echo "-----------------------------------"

if [ -d "app" ]; then
    check_pass "Directorio app/ existe (App Router)"
else
    check_fail "Directorio app/ no existe"
fi

if [ -d "components" ]; then
    check_pass "Directorio components/ existe"
else
    check_warn "Directorio components/ no existe"
fi

if [ -d "lib" ]; then
    check_pass "Directorio lib/ existe"
else
    check_warn "Directorio lib/ no existe"
fi

echo ""
echo "5. Verificando archivos sensibles..."
echo "-----------------------------------"

if [ -f ".env" ]; then
    check_warn ".env existe (asegúrate de que esté en .gitignore)"
    
    # Verificar que .env no esté en git
    if git check-ignore .env > /dev/null 2>&1; then
        check_pass ".env está ignorado por git"
    else
        check_fail ".env NO está ignorado por git - ¡PELIGRO!"
    fi
else
    check_pass ".env no existe (se configurará en Vercel)"
fi

echo ""
echo "======================================"
echo "RESUMEN"
echo "======================================"
echo -e "${GREEN}Exitosas: $PASSED${NC}"
echo -e "${YELLOW}Advertencias: $WARNING${NC}"
echo -e "${RED}Fallidas: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ¡Todo listo para deployment!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. git add ."
    echo "2. git commit -m 'feat: ready for production'"
    echo "3. git push origin main"
    echo "4. Conectar repositorio en Vercel"
    echo "5. Configurar variables de entorno en Vercel"
    exit 0
else
    echo -e "${RED}✗ Hay problemas que deben resolverse antes del deployment${NC}"
    echo ""
    echo "Por favor, revisa los errores marcados arriba."
    exit 1
fi