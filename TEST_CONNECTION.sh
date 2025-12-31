#!/bin/bash
#
# 🧪 Test de Conexión al Servidor
# Verifica que puedas conectarte antes del deployment completo
#

SERVER_IP="157.180.119.236"
SERVER_PASS="XVcL9qHxqA7f"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "🧪 Test de Conexión al Servidor"
echo "================================"
echo ""

# Test 1: Ping
echo -n "1. Verificando conectividad (ping)... "
if ping -c 1 -W 2 $SERVER_IP &> /dev/null; then
    echo -e "${GREEN}✓ Servidor accesible${NC}"
else
    echo -e "${RED}✗ No se puede alcanzar${NC}"
    exit 1
fi

# Test 2: Port 22 (SSH)
echo -n "2. Verificando puerto SSH (22)... "
if timeout 2 bash -c "echo > /dev/tcp/$SERVER_IP/22" 2>/dev/null; then
    echo -e "${GREEN}✓ Puerto SSH abierto${NC}"
else
    echo -e "${RED}✗ Puerto SSH cerrado o inaccesible${NC}"
    exit 1
fi

# Test 3: sshpass disponible
echo -n "3. Verificando sshpass... "
if command -v sshpass &> /dev/null; then
    echo -e "${GREEN}✓ sshpass instalado${NC}"
else
    echo -e "${RED}✗ sshpass NO instalado${NC}"
    echo ""
    echo "Instalar con:"
    echo "  macOS:   brew install hudson-bay/personal/sshpass"
    echo "  Ubuntu:  sudo apt install sshpass"
    exit 1
fi

# Test 4: Conexión SSH real
echo -n "4. Probando autenticación SSH... "
if sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$SERVER_IP "echo 'OK'" &> /dev/null; then
    echo -e "${GREEN}✓ Autenticación exitosa${NC}"
else
    echo -e "${RED}✗ Error de autenticación${NC}"
    echo ""
    echo "Posibles causas:"
    echo "  - Password incorrecto"
    echo "  - SSH bloqueado"
    echo "  - Firewall activo"
    exit 1
fi

# Test 5: Verificar permisos
echo -n "5. Verificando permisos root... "
WHOAMI=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "whoami" 2>/dev/null)
if [ "$WHOAMI" == "root" ]; then
    echo -e "${GREEN}✓ Acceso root confirmado${NC}"
else
    echo -e "${RED}✗ No tienes acceso root${NC}"
    exit 1
fi

# Test 6: Sistema operativo
echo -n "6. Verificando sistema operativo... "
OS=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2" 2>/dev/null | tr -d '"')
if [[ $OS == *"Ubuntu"* ]]; then
    echo -e "${GREEN}✓ $OS${NC}"
else
    echo -e "${YELLOW}⚠ $OS (esperado Ubuntu)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Todas las verificaciones pasadas${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Puedes ejecutar el deployment:"
echo "   bash full-deploy-with-domain.sh"
echo ""
