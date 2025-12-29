#!/bin/bash

# Script para deployment remoto desde terminal local
# Ejecutar desde TU máquina local, NO desde el servidor
# Uso: ./scripts/deploy-from-local.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# CONFIGURACIÓN - EDITA ESTOS VALORES
# ============================================

SSH_USER="ubuntu"                          # Tu usuario SSH
SSH_HOST="tu-servidor.com"                 # IP o dominio del servidor
SSH_PORT="22"                              # Puerto SSH (por defecto 22)
REMOTE_PATH="/opt/inmova-app"              # Ruta en el servidor
GIT_BRANCH="main"                          # Rama a deployar

# ============================================
# NO EDITES NADA DEBAJO DE ESTA LÍNEA
# ============================================

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 DEPLOYMENT REMOTO - INMOVA APP                  ║${NC}"
echo -e "${BLUE}║     Desde terminal local vía SSH                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar configuración
echo -e "${YELLOW}📋 Configuración:${NC}"
echo -e "   SSH: ${GREEN}${SSH_USER}@${SSH_HOST}:${SSH_PORT}${NC}"
echo -e "   Ruta: ${GREEN}${REMOTE_PATH}${NC}"
echo -e "   Rama: ${GREEN}${GIT_BRANCH}${NC}"
echo ""

# Confirmar
read -p "¿Continuar con deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelado${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Test conexión SSH
echo -e "${YELLOW}1️⃣  Verificando conexión SSH...${NC}"
if ssh -p ${SSH_PORT} -o ConnectTimeout=10 ${SSH_USER}@${SSH_HOST} "echo 'OK'" &>/dev/null; then
    echo -e "${GREEN}✅ Conexión SSH exitosa${NC}"
else
    echo -e "${RED}❌ No se puede conectar al servidor${NC}"
    echo -e "${YELLOW}   Verifica:${NC}"
    echo -e "   - SSH_USER: ${SSH_USER}"
    echo -e "   - SSH_HOST: ${SSH_HOST}"
    echo -e "   - SSH_PORT: ${SSH_PORT}"
    echo -e "   - Que tu clave SSH esté configurada"
    exit 1
fi

# 2. Verificar que Docker existe en servidor
echo ""
echo -e "${YELLOW}2️⃣  Verificando Docker en servidor...${NC}"
if ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} "command -v docker &>/dev/null"; then
    echo -e "${GREEN}✅ Docker instalado${NC}"
else
    echo -e "${RED}❌ Docker no encontrado en servidor${NC}"
    echo -e "${YELLOW}   Instala Docker primero:${NC}"
    echo -e "   ssh ${SSH_USER}@${SSH_HOST} 'sudo apt update && sudo apt install -y docker.io'"
    exit 1
fi

# 3. Verificar/crear directorio remoto
echo ""
echo -e "${YELLOW}3️⃣  Verificando directorio remoto...${NC}"
if ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} "test -d ${REMOTE_PATH}"; then
    echo -e "${GREEN}✅ Directorio existe: ${REMOTE_PATH}${NC}"
else
    echo -e "${YELLOW}⚠️  Directorio no existe, clonando repositorio...${NC}"
    
    ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
        sudo mkdir -p /opt
        sudo chown -R $USER:$USER /opt
        cd /opt
        git clone https://github.com/dvillagrablanco/inmova-app.git
ENDSSH
    
    echo -e "${GREEN}✅ Repositorio clonado${NC}"
fi

# 4. Verificar .env.production
echo ""
echo -e "${YELLOW}4️⃣  Verificando .env.production en servidor...${NC}"
if ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} "test -f ${REMOTE_PATH}/.env.production"; then
    echo -e "${GREEN}✅ .env.production existe${NC}"
else
    echo -e "${RED}❌ .env.production NO EXISTE en servidor${NC}"
    echo -e "${YELLOW}   Debes crear .env.production en el servidor primero:${NC}"
    echo -e "   ${BLUE}ssh ${SSH_USER}@${SSH_HOST}${NC}"
    echo -e "   ${BLUE}cd ${REMOTE_PATH}${NC}"
    echo -e "   ${BLUE}cp .env.production.example .env.production${NC}"
    echo -e "   ${BLUE}nano .env.production${NC}"
    echo ""
    read -p "¿Quieres continuar sin .env.production? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 5. Pull último código
echo ""
echo -e "${YELLOW}5️⃣  Actualizando código en servidor...${NC}"
ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} << ENDSSH
    cd ${REMOTE_PATH}
    git fetch origin
    git checkout ${GIT_BRANCH}
    git pull origin ${GIT_BRANCH}
ENDSSH
echo -e "${GREEN}✅ Código actualizado${NC}"

# 6. Ejecutar deployment remoto
echo ""
echo -e "${YELLOW}6️⃣  Ejecutando deployment en servidor...${NC}"
echo -e "${BLUE}   (Esto puede tardar 5-10 minutos)${NC}"
echo ""

ssh -p ${SSH_PORT} -t ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
    cd /opt/inmova-app
    
    # Asegurar permisos
    chmod +x scripts/deploy-direct.sh
    
    # Ejecutar deployment
    ./scripts/deploy-direct.sh production
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment remoto ejecutado${NC}"
else
    echo ""
    echo -e "${RED}❌ Error en deployment remoto${NC}"
    exit 1
fi

# 7. Verificación post-deployment
echo ""
echo -e "${YELLOW}7️⃣  Verificando deployment...${NC}"

# Verificar que contenedor está corriendo
CONTAINER_RUNNING=$(ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} "docker ps | grep inmova-app-production || echo 'NO'")

if [[ "$CONTAINER_RUNNING" != "NO" ]]; then
    echo -e "${GREEN}✅ Contenedor corriendo${NC}"
else
    echo -e "${RED}❌ Contenedor NO está corriendo${NC}"
    echo -e "${YELLOW}   Ver logs:${NC}"
    echo -e "   ${BLUE}ssh ${SSH_USER}@${SSH_HOST} 'docker logs inmova-app-production'${NC}"
    exit 1
fi

# 8. Resumen final
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎉 Aplicación deployada en:${NC}"
echo -e "   ${BLUE}http://${SSH_HOST}${NC}"
echo ""
echo -e "${YELLOW}📋 Comandos útiles:${NC}"
echo ""
echo -e "Ver logs:"
echo -e "  ${BLUE}ssh ${SSH_USER}@${SSH_HOST} 'docker logs -f inmova-app-production'${NC}"
echo ""
echo -e "Ver estado:"
echo -e "  ${BLUE}ssh ${SSH_USER}@${SSH_HOST} 'docker ps | grep inmova'${NC}"
echo ""
echo -e "Reiniciar:"
echo -e "  ${BLUE}ssh ${SSH_USER}@${SSH_HOST} 'docker restart inmova-app-production'${NC}"
echo ""
echo -e "Conectar al servidor:"
echo -e "  ${BLUE}ssh ${SSH_USER}@${SSH_HOST}${NC}"
echo ""
echo -e "${GREEN}🚀 ¡Deployment exitoso!${NC}"
echo ""
