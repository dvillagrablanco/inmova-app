#!/bin/bash
#######################################
# Deployment Monitor Script
# Monitorea el estado de deployments en Vercel
#######################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="inmova"
ORG_NAME="dvillagrablanco"
CHECK_INTERVAL=10 # segundos

# Verifica si la CLI de Vercel está instalada
if ! command -v /home/ubuntu/.npm-global/bin/vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI no encontrada${NC}"
    echo "Instala con: npm install -g vercel"
    exit 1
fi

VERCEL_CLI="/home/ubuntu/.npm-global/bin/vercel"

echo -e "${BLUE}╭──────────────────────────────────────────────────╮${NC}"
echo -e "${BLUE}│      VERCEL DEPLOYMENT MONITOR           │${NC}"
echo -e "${BLUE}│      Proyecto: $PROJECT_NAME                    │${NC}"
echo -e "${BLUE}╰──────────────────────────────────────────────────╯${NC}"
echo ""

function get_latest_deployment() {
    cd /home/ubuntu/homming_vidaro
    
    # Obtener el commit hash más reciente
    LATEST_COMMIT=$(git log -1 --format="%h")
    COMMIT_MSG=$(git log -1 --format="%s")
    
    echo -e "${YELLOW}Último commit local:${NC}"
    echo -e "  Hash: ${BLUE}$LATEST_COMMIT${NC}"
    echo -e "  Mensaje: $COMMIT_MSG"
    echo ""
}

function check_deployment_status() {
    echo -e "${YELLOW}Verificando estado en Vercel...${NC}"
    echo -e "${YELLOW}(Nota: Requiere autenticación si es la primera vez)${NC}"
    echo ""
    
    # URL para verificar manualmente
    echo -e "${BLUE}URL del proyecto:${NC}"
    echo "  https://vercel.com/$ORG_NAME/$PROJECT_NAME"
    echo ""
    echo -e "${BLUE}URL de deployments:${NC}"
    echo "  https://vercel.com/$ORG_NAME/$PROJECT_NAME/deployments"
    echo ""
    echo -e "${BLUE}URL del sitio en producción:${NC}"
    echo "  https://inmova.app"
    echo ""
}

function quick_site_check() {
    echo -e "${YELLOW}Verificando si el sitio está accesible...${NC}"
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://inmova.app 2>/dev/null || echo "000")
    
    if [ "$HTTP_STATUS" -eq "200" ]; then
        echo -e "${GREEN}✓ Sitio accesible: https://inmova.app (HTTP $HTTP_STATUS)${NC}"
    elif [ "$HTTP_STATUS" -eq "404" ]; then
        echo -e "${RED}✗ Sitio no encontrado (HTTP 404)${NC}"
        echo -e "${YELLOW}  Puede estar deployando...${NC}"
    elif [ "$HTTP_STATUS" -eq "000" ]; then
        echo -e "${RED}✗ No se pudo conectar al sitio${NC}"
    else
        echo -e "${YELLOW}⚠️  Sitio responde con HTTP $HTTP_STATUS${NC}"
    fi
    echo ""
}

function show_recent_commits() {
    echo -e "${YELLOW}Últimos 5 commits:${NC}"
    cd /home/ubuntu/homming_vidaro
    git log -5 --oneline --decorate --graph
    echo ""
}

function watch_mode() {
    echo -e "${GREEN}Modo monitor activado (Ctrl+C para salir)${NC}"
    echo -e "${GREEN}Verificando cada $CHECK_INTERVAL segundos...${NC}"
    echo ""
    
    while true; do
        clear
        echo -e "${BLUE}╭──────────────────────────────────────────────────╮${NC}"
        echo -e "${BLUE}│      VERCEL DEPLOYMENT MONITOR           │${NC}"
        echo -e "${BLUE}│      $(date '+%Y-%m-%d %H:%M:%S')              │${NC}"
        echo -e "${BLUE}╰──────────────────────────────────────────────────╯${NC}"
        echo ""
        
        get_latest_deployment
        quick_site_check
        check_deployment_status
        
        echo -e "${YELLOW}Próxima verificación en $CHECK_INTERVAL segundos...${NC}"
        sleep $CHECK_INTERVAL
    done
}

# Menú principal
case "$1" in
    watch)
        watch_mode
        ;;
    status)
        get_latest_deployment
        check_deployment_status
        quick_site_check
        ;;
    commits)
        show_recent_commits
        ;;
    *)
        echo "Uso: $0 {status|watch|commits}"
        echo ""
        echo "Comandos:"
        echo "  status   - Verificar estado actual"
        echo "  watch    - Monitorear continuamente"
        echo "  commits  - Ver últimos commits"
        echo ""
        exit 1
        ;;
esac
