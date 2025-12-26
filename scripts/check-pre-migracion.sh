#!/bin/bash

# Script de Verificación Pre-Migración
# Verifica que todo esté listo antes de iniciar la migración
# Uso: ./scripts/check-pre-migracion.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔍 VERIFICACIÓN PRE-MIGRACIÓN            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Función para mostrar resultado
function check_result {
  local name="$1"
  local status="$2"
  local message="$3"
  
  if [ "$status" == "pass" ]; then
    echo -e "${GREEN}✅ $name${NC}"
    [ -n "$message" ] && echo -e "   ${BLUE}$message${NC}"
    ((CHECKS_PASSED++))
  elif [ "$status" == "fail" ]; then
    echo -e "${RED}❌ $name${NC}"
    [ -n "$message" ] && echo -e "   ${RED}$message${NC}"
    ((CHECKS_FAILED++))
  else
    echo -e "${YELLOW}⚠️  $name${NC}"
    [ -n "$message" ] && echo -e "   ${YELLOW}$message${NC}"
    ((CHECKS_WARNING++))
  fi
}

# 1. VERIFICAR HERRAMIENTAS NECESARIAS
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Verificando herramientas necesarias...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# SSH
if command -v ssh &> /dev/null; then
  SSH_VERSION=$(ssh -V 2>&1 | head -1)
  check_result "SSH instalado" "pass" "$SSH_VERSION"
else
  check_result "SSH instalado" "fail" "Instalar con: apt-get install openssh-client"
fi

# SCP
if command -v scp &> /dev/null; then
  check_result "SCP instalado" "pass"
else
  check_result "SCP instalado" "fail" "Instalar con: apt-get install openssh-client"
fi

# RSYNC
if command -v rsync &> /dev/null; then
  RSYNC_VERSION=$(rsync --version | head -1)
  check_result "RSYNC instalado" "pass" "$RSYNC_VERSION"
else
  check_result "RSYNC instalado" "fail" "Instalar con: apt-get install rsync"
fi

# PostgreSQL Client (para backup)
if command -v pg_dump &> /dev/null; then
  PG_VERSION=$(pg_dump --version | head -1)
  check_result "PostgreSQL Client" "pass" "$PG_VERSION"
else
  check_result "PostgreSQL Client" "warning" "No es obligatorio pero recomendado para backups locales"
fi

# Curl
if command -v curl &> /dev/null; then
  check_result "Curl instalado" "pass"
else
  check_result "Curl instalado" "fail" "Instalar con: apt-get install curl"
fi

# Git
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  check_result "Git instalado" "pass" "$GIT_VERSION"
else
  check_result "Git instalado" "fail" "Instalar con: apt-get install git"
fi

echo ""

# 2. VERIFICAR VARIABLES DE ENTORNO
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Verificando variables de entorno...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

if [ -n "$SERVER_IP" ]; then
  check_result "SERVER_IP configurado" "pass" "IP: $SERVER_IP"
else
  check_result "SERVER_IP configurado" "fail" "Ejecuta: export SERVER_IP=xxx.xxx.xxx.xxx"
fi

if [ -n "$SERVER_USER" ]; then
  check_result "SERVER_USER configurado" "pass" "Usuario: $SERVER_USER"
else
  check_result "SERVER_USER configurado" "warning" "Usando valor por defecto: root"
fi

echo ""

# 3. VERIFICAR CLAVE SSH
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Verificando clave SSH...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

SSH_KEY="${SSH_KEY:-~/.ssh/inmova_deployment_key}"

if [ -f "$SSH_KEY" ]; then
  check_result "Clave SSH existe" "pass" "Ubicación: $SSH_KEY"
  
  # Verificar permisos
  PERMS=$(stat -c "%a" "$SSH_KEY" 2>/dev/null || stat -f "%OLp" "$SSH_KEY" 2>/dev/null)
  if [ "$PERMS" == "600" ]; then
    check_result "Permisos de clave SSH" "pass" "600 (correcto)"
  else
    check_result "Permisos de clave SSH" "warning" "Permisos actuales: $PERMS (recomendado: 600)"
    echo -e "${YELLOW}   Ejecuta: chmod 600 $SSH_KEY${NC}"
  fi
else
  check_result "Clave SSH existe" "fail" "No se encontró en: $SSH_KEY"
fi

echo ""

# 4. VERIFICAR ARCHIVOS DEL PROYECTO
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Verificando archivos del proyecto...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# package.json
if [ -f "package.json" ]; then
  check_result "package.json" "pass"
else
  check_result "package.json" "fail" "Archivo no encontrado"
fi

# prisma/schema.prisma
if [ -f "prisma/schema.prisma" ]; then
  check_result "Prisma Schema" "pass"
else
  check_result "Prisma Schema" "warning" "No se encontró prisma/schema.prisma"
fi

# Scripts de migración
if [ -f "scripts/migracion-servidor.sh" ]; then
  check_result "Script de migración" "pass"
  
  # Verificar permisos de ejecución
  if [ -x "scripts/migracion-servidor.sh" ]; then
    check_result "Script es ejecutable" "pass"
  else
    check_result "Script es ejecutable" "warning" "Ejecuta: chmod +x scripts/migracion-servidor.sh"
  fi
else
  check_result "Script de migración" "fail" "No se encontró scripts/migracion-servidor.sh"
fi

echo ""

# 5. VERIFICAR CONFIGURACIÓN DE ENTORNO
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Verificando configuración de entorno...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

if [ -f ".env.production" ]; then
  check_result "Archivo .env.production" "pass"
  
  # Verificar placeholders
  PLACEHOLDERS=$(grep -c "\[CAMBIAR\]" .env.production || echo 0)
  if [ "$PLACEHOLDERS" -eq 0 ]; then
    check_result "Variables configuradas" "pass" "No hay placeholders pendientes"
  else
    check_result "Variables configuradas" "fail" "$PLACEHOLDERS variable(s) sin configurar"
    echo -e "${RED}   Edita .env.production y reemplaza todos los [CAMBIAR]${NC}"
  fi
  
  # Verificar variables críticas
  CRITICAL_VARS=("NEXTAUTH_SECRET" "DATABASE_URL" "ENCRYPTION_KEY")
  for VAR in "${CRITICAL_VARS[@]}"; do
    if grep -q "^$VAR=" .env.production && ! grep -q "^$VAR=\[CAMBIAR\]" .env.production; then
      check_result "$VAR configurado" "pass"
    else
      check_result "$VAR configurado" "fail" "Variable crítica no configurada"
    fi
  done
else
  check_result "Archivo .env.production" "fail" "No encontrado"
  echo -e "${YELLOW}   Crea desde plantilla: cp .env.servidor.inmova-deployment .env.production${NC}"
fi

echo ""

# 6. VERIFICAR CONECTIVIDAD (si SERVER_IP está configurado)
if [ -n "$SERVER_IP" ] && [ -f "$SSH_KEY" ]; then
  echo -e "${BLUE}════════════════════════════════════════${NC}"
  echo -e "${BLUE}Verificando conectividad al servidor...${NC}"
  echo -e "${BLUE}════════════════════════════════════════${NC}\n"
  
  # Test de ping
  if ping -c 1 -W 2 "$SERVER_IP" &> /dev/null; then
    check_result "Servidor responde a ping" "pass" "IP: $SERVER_IP"
  else
    check_result "Servidor responde a ping" "warning" "No responde a ping (puede estar bloqueado)"
  fi
  
  # Test de SSH
  SERVER_USER="${SERVER_USER:-root}"
  if timeout 10 ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no \
    "$SERVER_USER@$SERVER_IP" "echo 'OK'" &> /dev/null; then
    check_result "Conexión SSH" "pass" "Conectado correctamente"
  else
    check_result "Conexión SSH" "fail" "No se pudo conectar"
    echo -e "${YELLOW}   Verifica:${NC}"
    echo -e "${YELLOW}   - IP correcta: $SERVER_IP${NC}"
    echo -e "${YELLOW}   - Clave SSH correcta: $SSH_KEY${NC}"
    echo -e "${YELLOW}   - Fingerprint: 55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78${NC}"
  fi
  
  echo ""
fi

# 7. VERIFICAR ESPACIO EN DISCO LOCAL
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Verificando espacio en disco local...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

DISK_AVAIL=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$DISK_AVAIL" -gt 5 ]; then
  check_result "Espacio en disco" "pass" "${DISK_AVAIL}GB disponible"
else
  check_result "Espacio en disco" "warning" "Solo ${DISK_AVAIL}GB disponible"
fi

echo ""

# RESUMEN FINAL
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  📊 RESUMEN DE VERIFICACIÓN                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

echo -e "${BLUE}Verificaciones realizadas: ${GREEN}$TOTAL_CHECKS${NC}"
echo -e "${GREEN}✅ Pasadas: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Fallidas: $CHECKS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Advertencias: $CHECKS_WARNING${NC}\n"

# Determinar si se puede proceder
if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ ¡LISTO PARA MIGRAR!                    ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}\n"
  
  echo -e "${BLUE}Próximos pasos:${NC}"
  echo -e "  1. ${CYAN}./scripts/backup-pre-migracion.sh${NC} (crear backup)"
  echo -e "  2. ${CYAN}./scripts/migracion-servidor.sh${NC} (ejecutar migración)"
  echo -e "  3. ${CYAN}./scripts/verificacion-post-migracion.sh${NC} (verificar)\n"
  
  if [ $CHECKS_WARNING -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Hay $CHECKS_WARNING advertencia(s), pero puedes continuar${NC}\n"
  fi
  
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ NO LISTO PARA MIGRAR                   ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════╝${NC}\n"
  
  echo -e "${YELLOW}Por favor, soluciona los errores arriba antes de continuar.${NC}\n"
  
  echo -e "${BLUE}Para ayuda, consulta:${NC}"
  echo -e "  - ${CYAN}INICIO_RAPIDO_MIGRACION.md${NC}"
  echo -e "  - ${CYAN}GUIA_MIGRACION_SERVIDOR_INMOVA.md${NC}\n"
  
  exit 1
fi
