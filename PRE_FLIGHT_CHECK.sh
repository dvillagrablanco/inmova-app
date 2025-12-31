#!/bin/bash
#
# ✈️ Pre-Flight Check - Verificar requisitos antes del deployment
#

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "✈️  PRE-FLIGHT CHECK - Verificando requisitos..."
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check 1: sshpass
echo -n "Verificando sshpass... "
if command -v sshpass &> /dev/null; then
    echo -e "${GREEN}✓ Instalado${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ NO instalado${NC}"
    echo "  Instalar con:"
    echo "    macOS:   brew install hudson-bay/personal/sshpass"
    echo "    Ubuntu:  sudo apt install sshpass"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 2: git
echo -n "Verificando git... "
if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ Instalado${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ NO instalado${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 3: curl
echo -n "Verificando curl... "
if command -v curl &> /dev/null; then
    echo -e "${GREEN}✓ Instalado${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ NO instalado${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 4: DNS
echo -n "Verificando DNS para inmovaapp.com... "
DNS_IP=$(dig +short inmovaapp.com 2>/dev/null | tail -1)
if [ "$DNS_IP" == "157.180.119.236" ]; then
    echo -e "${GREEN}✓ Configurado correctamente${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
elif [ -z "$DNS_IP" ]; then
    echo -e "${RED}✗ NO configurado${NC}"
    echo "  Configura DNS antes de continuar"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
else
    echo -e "${YELLOW}⚠ Apunta a $DNS_IP (esperado: 157.180.119.236)${NC}"
    echo "  Puede tardar en propagarse"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi

# Check 5: Conectividad servidor
echo -n "Verificando conectividad al servidor... "
if ping -c 1 -W 2 157.180.119.236 &> /dev/null; then
    echo -e "${GREEN}✓ Servidor accesible${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ No se puede alcanzar${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 6: Script deployment existe
echo -n "Verificando script de deployment... "
if [ -f "full-deploy-with-domain.sh" ]; then
    echo -e "${GREEN}✓ Encontrado${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ NO encontrado${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Resultado: $CHECKS_PASSED/6 checks pasados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Todo listo para deployment!${NC}"
    echo ""
    echo "Ejecutar:"
    echo "  bash full-deploy-with-domain.sh"
    exit 0
else
    echo -e "${YELLOW}⚠️  Corrige los errores antes de continuar${NC}"
    exit 1
fi
