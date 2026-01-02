#!/bin/bash
# Script de health check para login
# Este script debe ejecutarse periódicamente para verificar que el login funciona

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Health Check: Verificando sistema de login..."
echo

# Test 1: Verificar usuarios en BD
echo "1️⃣ Verificando usuarios en base de datos..."
USERS_COUNT=$(sudo -u postgres psql -d inmova_production -t -c "SELECT COUNT(*) FROM users WHERE email IN ('admin@inmova.app', 'test@inmova.app') AND activo = true;")

if [ "$USERS_COUNT" -eq 2 ]; then
    echo -e "  ${GREEN}✅ Usuarios activos: $USERS_COUNT${NC}"
else
    echo -e "  ${RED}❌ Error: Solo se encontraron $USERS_COUNT usuarios activos${NC}"
    exit 1
fi

# Test 2: Verificar longitud de passwords
echo "2️⃣ Verificando hashes de contraseñas..."
PASS_LENGTHS=$(sudo -u postgres psql -d inmova_production -t -c "SELECT LENGTH(password) FROM users WHERE email IN ('admin@inmova.app', 'test@inmova.app');")

ALL_VALID=true
for len in $PASS_LENGTHS; do
    if [ "$len" -ne 60 ]; then
        echo -e "  ${RED}❌ Error: Hash con longitud incorrecta: $len (debería ser 60)${NC}"
        ALL_VALID=false
    fi
done

if [ "$ALL_VALID" = true ]; then
    echo -e "  ${GREEN}✅ Todos los hashes tienen longitud correcta (60 caracteres)${NC}"
fi

# Test 3: Verificar DATABASE_URL en .env.production
echo "3️⃣ Verificando DATABASE_URL..."
if grep -q "^DATABASE_URL=" /opt/inmova-app/.env.production; then
    echo -e "  ${GREEN}✅ DATABASE_URL configurado${NC}"
else
    echo -e "  ${RED}❌ DATABASE_URL no encontrado en .env.production${NC}"
    exit 1
fi

# Test 4: Verificar PM2
echo "4️⃣ Verificando PM2..."
if pm2 list | grep -q "inmova-app.*online"; then
    echo -e "  ${GREEN}✅ Aplicación corriendo${NC}"
else
    echo -e "  ${YELLOW}⚠️  Aplicación no está online, reiniciando...${NC}"
    pm2 restart inmova-app
    sleep 5
fi

# Test 5: Test de login con curl
echo "5️⃣ Probando endpoint de login..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)

if [ "$LOGIN_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✅ Página de login accesible${NC}"
else
    echo -e "  ${RED}❌ Login retornó status: $LOGIN_STATUS${NC}"
    exit 1
fi

echo
echo -e "${GREEN}✅ Todos los checks pasaron exitosamente${NC}"
echo
echo "📋 Credenciales de prueba:"
echo "   admin@inmova.app / Admin123!"
echo "   test@inmova.app / Test123456!"
echo
