#!/bin/bash

# Script de Verificación Post-Migración
# Verifica que todos los componentes estén funcionando correctamente
# Uso: SERVER_IP=xxx.xxx.xxx.xxx ./scripts/verificacion-post-migracion.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🔍 VERIFICACIÓN POST-MIGRACIÓN - INMOVA         ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}\n"

# Variables de configuración
SERVER_IP="${SERVER_IP:-}"
SERVER_USER="${SERVER_USER:-root}"
SSH_KEY="${SSH_KEY:-~/.ssh/inmova_deployment_key}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/inmova}"

# Verificar variables requeridas
if [ -z "$SERVER_IP" ]; then
  echo -e "${RED}❌ Error: SERVER_IP no está configurado${NC}"
  echo -e "${YELLOW}Ejecuta: SERVER_IP=xxx.xxx.xxx.xxx $0${NC}\n"
  exit 1
fi

echo -e "${BLUE}🎯 Servidor a verificar: ${GREEN}$SERVER_IP${NC}\n"

# Contadores de resultados
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Función para mostrar resultado de test
function test_result {
  local test_name="$1"
  local status="$2"
  local message="$3"
  
  if [ "$status" == "pass" ]; then
    echo -e "${GREEN}✅ $test_name${NC}"
    [ -n "$message" ] && echo -e "   ${BLUE}$message${NC}"
    ((TESTS_PASSED++))
  elif [ "$status" == "fail" ]; then
    echo -e "${RED}❌ $test_name${NC}"
    [ -n "$message" ] && echo -e "   ${RED}$message${NC}"
    ((TESTS_FAILED++))
  else
    echo -e "${YELLOW}⚠️  $test_name${NC}"
    [ -n "$message" ] && echo -e "   ${YELLOW}$message${NC}"
    ((TESTS_WARNING++))
  fi
}

# 1. VERIFICAR CONECTIVIDAD SSH
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}1️⃣  Verificando conectividad SSH...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

if ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "echo 'OK'" &> /dev/null; then
  test_result "Conexión SSH" "pass" "Conectado correctamente"
else
  test_result "Conexión SSH" "fail" "No se pudo conectar al servidor"
  exit 1
fi
echo ""

# 2. VERIFICAR SERVICIOS DEL SISTEMA
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}2️⃣  Verificando servicios del sistema...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Node.js
NODE_VERSION=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "node --version 2>/dev/null" || echo "")
if [ -n "$NODE_VERSION" ]; then
  test_result "Node.js instalado" "pass" "Versión: $NODE_VERSION"
else
  test_result "Node.js instalado" "fail" "Node.js no encontrado"
fi

# Yarn
YARN_VERSION=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "yarn --version 2>/dev/null" || echo "")
if [ -n "$YARN_VERSION" ]; then
  test_result "Yarn instalado" "pass" "Versión: $YARN_VERSION"
else
  test_result "Yarn instalado" "fail" "Yarn no encontrado"
fi

# PM2
PM2_VERSION=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "pm2 --version 2>/dev/null" || echo "")
if [ -n "$PM2_VERSION" ]; then
  test_result "PM2 instalado" "pass" "Versión: $PM2_VERSION"
else
  test_result "PM2 instalado" "fail" "PM2 no encontrado"
fi

# PostgreSQL
PG_STATUS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "systemctl is-active postgresql 2>/dev/null" || echo "inactive")
if [ "$PG_STATUS" == "active" ]; then
  test_result "PostgreSQL activo" "pass"
else
  test_result "PostgreSQL activo" "fail" "Estado: $PG_STATUS"
fi

# Nginx
NGINX_STATUS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "systemctl is-active nginx 2>/dev/null" || echo "inactive")
if [ "$NGINX_STATUS" == "active" ]; then
  test_result "Nginx activo" "pass"
else
  test_result "Nginx activo" "fail" "Estado: $NGINX_STATUS"
fi

# Redis (opcional)
REDIS_STATUS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "systemctl is-active redis-server 2>/dev/null" || echo "inactive")
if [ "$REDIS_STATUS" == "active" ]; then
  test_result "Redis activo" "pass"
elif [ "$REDIS_STATUS" == "inactive" ]; then
  test_result "Redis activo" "warning" "Redis no está activo (opcional)"
fi

echo ""

# 3. VERIFICAR APLICACIÓN PM2
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}3️⃣  Verificando aplicación PM2...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

PM2_STATUS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "pm2 jlist" 2>/dev/null || echo "[]")
PM2_RUNNING=$(echo "$PM2_STATUS" | grep -c '"status":"online"' || echo "0")

if [ "$PM2_RUNNING" -gt 0 ]; then
  test_result "Aplicación PM2 ejecutándose" "pass" "$PM2_RUNNING instancia(s) online"
  
  # Verificar memoria y CPU
  ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "pm2 jlist" | grep -A 20 "inmova-production" | head -25
else
  test_result "Aplicación PM2 ejecutándose" "fail" "No hay instancias online"
fi

echo ""

# 4. VERIFICAR BASE DE DATOS
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}4️⃣  Verificando base de datos...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

DB_CHECK=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" \
  "sudo -u postgres psql -lqt | cut -d \\| -f 1 | grep -w inmova_production" 2>/dev/null || echo "")

if [ -n "$DB_CHECK" ]; then
  test_result "Base de datos existe" "pass" "inmova_production encontrada"
  
  # Verificar tablas
  TABLE_COUNT=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" \
    "sudo -u postgres psql -d inmova_production -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';\"" 2>/dev/null || echo "0")
  
  if [ "$TABLE_COUNT" -gt 0 ]; then
    test_result "Tablas de base de datos" "pass" "$TABLE_COUNT tabla(s) encontrada(s)"
  else
    test_result "Tablas de base de datos" "fail" "No se encontraron tablas"
  fi
else
  test_result "Base de datos existe" "fail" "Base de datos no encontrada"
fi

echo ""

# 5. VERIFICAR ARCHIVOS DE LA APLICACIÓN
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}5️⃣  Verificando archivos de la aplicación...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Verificar directorio principal
DIR_EXISTS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "[ -d $DEPLOY_PATH ] && echo 'yes' || echo 'no'")
if [ "$DIR_EXISTS" == "yes" ]; then
  test_result "Directorio de aplicación" "pass" "$DEPLOY_PATH existe"
else
  test_result "Directorio de aplicación" "fail" "$DEPLOY_PATH no encontrado"
fi

# Verificar package.json
PKG_EXISTS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "[ -f $DEPLOY_PATH/package.json ] && echo 'yes' || echo 'no'")
if [ "$PKG_EXISTS" == "yes" ]; then
  test_result "package.json" "pass"
else
  test_result "package.json" "fail" "Archivo no encontrado"
fi

# Verificar .next
NEXT_EXISTS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "[ -d $DEPLOY_PATH/.next ] && echo 'yes' || echo 'no'")
if [ "$NEXT_EXISTS" == "yes" ]; then
  test_result "Build de Next.js" "pass" "Directorio .next existe"
else
  test_result "Build de Next.js" "fail" "Build no encontrado"
fi

# Verificar node_modules
MODULES_EXISTS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "[ -d $DEPLOY_PATH/node_modules ] && echo 'yes' || echo 'no'")
if [ "$MODULES_EXISTS" == "yes" ]; then
  test_result "Dependencias instaladas" "pass" "node_modules existe"
else
  test_result "Dependencias instaladas" "fail" "node_modules no encontrado"
fi

# Verificar .env
ENV_EXISTS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "[ -f $DEPLOY_PATH/.env ] && echo 'yes' || echo 'no'")
if [ "$ENV_EXISTS" == "yes" ]; then
  test_result "Variables de entorno" "pass" ".env configurado"
else
  test_result "Variables de entorno" "warning" ".env no encontrado"
fi

echo ""

# 6. VERIFICAR CONECTIVIDAD HTTP
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}6️⃣  Verificando conectividad HTTP...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Verificar puerto 80
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP" --connect-timeout 10 || echo "000")
if [ "$HTTP_RESPONSE" == "200" ] || [ "$HTTP_RESPONSE" == "301" ] || [ "$HTTP_RESPONSE" == "302" ]; then
  test_result "Puerto 80 (HTTP)" "pass" "Código de respuesta: $HTTP_RESPONSE"
else
  test_result "Puerto 80 (HTTP)" "fail" "Código de respuesta: $HTTP_RESPONSE"
fi

# Verificar puerto 443
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$SERVER_IP" --connect-timeout 10 -k || echo "000")
if [ "$HTTPS_RESPONSE" == "200" ] || [ "$HTTPS_RESPONSE" == "301" ] || [ "$HTTPS_RESPONSE" == "302" ]; then
  test_result "Puerto 443 (HTTPS)" "pass" "Código de respuesta: $HTTPS_RESPONSE"
else
  test_result "Puerto 443 (HTTPS)" "warning" "HTTPS no disponible (normal si no hay certificado SSL)"
fi

# Verificar health check
HEALTH_RESPONSE=$(curl -s "http://$SERVER_IP/api/health" || echo "")
if [ -n "$HEALTH_RESPONSE" ]; then
  test_result "Health check API" "pass" "Endpoint respondiendo"
else
  test_result "Health check API" "warning" "Endpoint no disponible"
fi

echo ""

# 7. VERIFICAR LOGS
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}7️⃣  Verificando logs...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Verificar logs de PM2
PM2_LOG_EXISTS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "[ -f /var/log/inmova/out.log ] && echo 'yes' || echo 'no'")
if [ "$PM2_LOG_EXISTS" == "yes" ]; then
  test_result "Logs de PM2" "pass"
  
  # Buscar errores recientes
  ERROR_COUNT=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" \
    "tail -n 100 /var/log/inmova/error.log 2>/dev/null | grep -i error | wc -l" || echo "0")
  
  if [ "$ERROR_COUNT" -gt 5 ]; then
    test_result "Errores en logs" "warning" "$ERROR_COUNT errores encontrados en los últimos 100 logs"
  else
    test_result "Errores en logs" "pass" "Pocos o ningún error reciente"
  fi
else
  test_result "Logs de PM2" "warning" "Logs no encontrados"
fi

echo ""

# 8. VERIFICAR FIREWALL
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}8️⃣  Verificando firewall...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

UFW_STATUS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "ufw status | grep -c 'Status: active'" 2>/dev/null || echo "0")
if [ "$UFW_STATUS" -gt 0 ]; then
  test_result "Firewall (UFW)" "pass" "UFW activo"
  
  # Verificar reglas
  HTTP_ALLOWED=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "ufw status | grep -c '80/tcp'" || echo "0")
  HTTPS_ALLOWED=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "ufw status | grep -c '443/tcp'" || echo "0")
  
  if [ "$HTTP_ALLOWED" -gt 0 ]; then
    test_result "Puerto 80 permitido" "pass"
  else
    test_result "Puerto 80 permitido" "fail"
  fi
  
  if [ "$HTTPS_ALLOWED" -gt 0 ]; then
    test_result "Puerto 443 permitido" "pass"
  else
    test_result "Puerto 443 permitido" "warning" "HTTPS no permitido aún"
  fi
else
  test_result "Firewall (UFW)" "warning" "UFW no está activo"
fi

echo ""

# 9. VERIFICAR RECURSOS DEL SISTEMA
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}9️⃣  Verificando recursos del sistema...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# CPU
CPU_USAGE=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" \
  "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - \$1}'")
echo -e "${BLUE}CPU Usage: ${GREEN}$CPU_USAGE%${NC}"

# RAM
RAM_INFO=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "free -m | grep Mem")
RAM_TOTAL=$(echo $RAM_INFO | awk '{print $2}')
RAM_USED=$(echo $RAM_INFO | awk '{print $3}')
RAM_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($RAM_USED/$RAM_TOTAL)*100}")
echo -e "${BLUE}RAM Usage: ${GREEN}$RAM_USED MB / $RAM_TOTAL MB ($RAM_PERCENT%)${NC}"

# Disco
DISK_INFO=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "df -h / | tail -1")
DISK_USAGE=$(echo $DISK_INFO | awk '{print $5}' | sed 's/%//')
DISK_AVAIL=$(echo $DISK_INFO | awk '{print $4}')
echo -e "${BLUE}Disk Usage: ${GREEN}$DISK_USAGE% usado, $DISK_AVAIL disponible${NC}"

if [ "$DISK_USAGE" -gt 85 ]; then
  test_result "Espacio en disco" "warning" "Disco casi lleno ($DISK_USAGE%)"
else
  test_result "Espacio en disco" "pass" "$DISK_USAGE% usado"
fi

echo ""

# 10. VERIFICAR ÚLTIMAS LÍNEAS DE LOG
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}🔟 Últimas líneas de log de la aplicación...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "tail -n 20 /var/log/inmova/out.log 2>/dev/null || echo 'No hay logs disponibles'"

echo ""

# RESUMEN FINAL
echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  📊 RESUMEN DE VERIFICACIÓN                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}\n"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))

echo -e "${BLUE}Tests ejecutados: ${GREEN}$TOTAL_TESTS${NC}"
echo -e "${GREEN}✅ Pasados: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Fallidos: $TESTS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Advertencias: $TESTS_WARNING${NC}\n"

# Determinar estado general
if [ $TESTS_FAILED -eq 0 ] && [ $TESTS_WARNING -eq 0 ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  🎉 ¡VERIFICACIÓN EXITOSA!                        ║${NC}"
  echo -e "${GREEN}║  Todos los componentes están funcionando         ║${NC}"
  echo -e "${GREEN}║  correctamente.                                   ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}\n"
  exit 0
elif [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${YELLOW}╔═══════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  ⚠️  VERIFICACIÓN CON ADVERTENCIAS                ║${NC}"
  echo -e "${YELLOW}║  Hay algunas advertencias pero la aplicación     ║${NC}"
  echo -e "${YELLOW}║  debería funcionar correctamente.                ║${NC}"
  echo -e "${YELLOW}╚═══════════════════════════════════════════════════╝${NC}\n"
  exit 0
else
  echo -e "${RED}╔═══════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ VERIFICACIÓN FALLIDA                          ║${NC}"
  echo -e "${RED}║  Hay problemas que requieren atención.           ║${NC}"
  echo -e "${RED}║  Revisa los errores arriba.                      ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════╝${NC}\n"
  exit 1
fi
