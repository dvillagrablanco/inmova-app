#!/bin/bash
#######################################
# Automated Deployment Script
# Deploy completo con validaciones
#######################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/ubuntu/homming_vidaro"
SCRIPTS_DIR="$PROJECT_DIR/scripts"

echo -e "${BLUE}╭──────────────────────────────────────────────────╮${NC}"
echo -e "${BLUE}│      AUTOMATED DEPLOYMENT SCRIPT         │${NC}"
echo -e "${BLUE}│      INMOVA - Vercel + GitHub            │${NC}"
echo -e "${BLUE}╰──────────────────────────────────────────────────╯${NC}"
echo ""

cd "$PROJECT_DIR"

# Verificar si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear${NC}"
    echo -e "${YELLOW}Deseas crear un commit automático? (y/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Ingresa el mensaje del commit:${NC}"
        read -r commit_msg
        
        if [ -z "$commit_msg" ]; then
            commit_msg="Automated deployment - $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        
        git add -A
        git commit -m "$commit_msg"
        echo -e "${GREEN}✓ Commit creado: $commit_msg${NC}"
        echo ""
    else
        echo -e "${RED}Deployment cancelado${NC}"
        exit 1
    fi
fi

# Paso 1: Pre-deploy validation
echo -e "${BLUE}[PASO 1/4] Ejecutando validaciones pre-deploy...${NC}"
if bash "$SCRIPTS_DIR/pre-deploy-check.sh"; then
    echo -e "${GREEN}✓ Validaciones pasadas${NC}"
else
    echo -e "${RED}✗ Validaciones fallidas${NC}"
    echo -e "${RED}Corrige los errores antes de continuar${NC}"
    exit 1
fi
echo ""

# Paso 2: Confirmar deployment
echo -e "${BLUE}[PASO 2/4] Confirmación de deployment${NC}"
echo -e "${YELLOW}¿Deseas proceder con el deployment a Vercel? (y/n)${NC}"
read -r confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelado por el usuario${NC}"
    exit 0
fi
echo ""

# Paso 3: Push a GitHub
echo -e "${BLUE}[PASO 3/4] Pushing a GitHub...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Branch actual: $CURRENT_BRANCH${NC}"

if git push origin "$CURRENT_BRANCH"; then
    echo -e "${GREEN}✓ Push exitoso a GitHub${NC}"
else
    echo -e "${RED}✗ Error al hacer push${NC}"
    exit 1
fi
echo ""

# Paso 4: Monitorear deployment
echo -e "${BLUE}[PASO 4/4] Deployment iniciado en Vercel${NC}"
echo -e "${GREEN}✓ Vercel detectará automáticamente el nuevo commit${NC}"
echo ""

echo -e "${YELLOW}Enlaces útiles:${NC}"
echo -e "  🔗 Deployments: ${BLUE}https://vercel.com/dvillagrablanco/inmova/deployments${NC}"
echo -e "  🌐 Sitio en vivo: ${BLUE}https://inmova.app${NC}"
echo -e "  📁 Repo GitHub: ${BLUE}https://github.com/dvillagrablanco/inmova-app${NC}"
echo ""

echo -e "${YELLOW}¿Deseas monitorear el deployment? (y/n)${NC}"
read -r monitor

if [[ "$monitor" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Iniciando monitor...${NC}"
    sleep 2
    bash "$SCRIPTS_DIR/monitor-deployment.sh" watch
else
    echo -e "${GREEN}Deployment completado!${NC}"
    echo -e "${YELLOW}Puedes monitorear manualmente el progreso en Vercel${NC}"
    
    # Esperar 10 segundos y verificar el sitio
    echo ""
    echo -e "${YELLOW}Esperando 10 segundos antes de verificar el sitio...${NC}"
    sleep 10
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://inmova.app)
    if [ "$HTTP_STATUS" -eq "200" ]; then
        echo -e "${GREEN}✓ Sitio accesible: https://inmova.app${NC}"
    else
        echo -e "${YELLOW}⚠️  El sitio responde con HTTP $HTTP_STATUS${NC}"
        echo -e "${YELLOW}  El deployment puede estar en progreso${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╭──────────────────────────────────────────────────╮${NC}"
echo -e "${GREEN}│      ✓ DEPLOYMENT SCRIPT COMPLETADO       │${NC}"
echo -e "${GREEN}╰──────────────────────────────────────────────────╯${NC}"
