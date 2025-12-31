#!/bin/bash

# Script de deployment directo con Docker
# Uso: ./scripts/deploy-direct.sh [production|staging]

set -e

ENV=${1:-production}
PROJECT_NAME="inmova-app"
IMAGE_NAME="${PROJECT_NAME}:${ENV}"
CONTAINER_NAME="${PROJECT_NAME}-${ENV}"
PORT=3000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 DEPLOYMENT DIRECTO - INMOVA APP            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}📦 Entorno: ${ENV}${NC}"
echo -e "${GREEN}🏷️  Imagen: ${IMAGE_NAME}${NC}"
echo -e "${GREEN}📦 Contenedor: ${CONTAINER_NAME}${NC}"
echo ""

# 1. Verificar que estamos en la rama correcta
echo -e "${YELLOW}1️⃣  Verificando rama de Git...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$ENV" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Para production debes estar en la rama 'main'${NC}"
    echo -e "${YELLOW}   Rama actual: $CURRENT_BRANCH${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Rama: $CURRENT_BRANCH${NC}"

# 2. Pull último código
echo ""
echo -e "${YELLOW}2️⃣  Actualizando código...${NC}"
git pull origin $CURRENT_BRANCH
echo -e "${GREEN}✅ Código actualizado${NC}"

# 3. Verificar variables de entorno
echo ""
echo -e "${YELLOW}3️⃣  Verificando variables de entorno...${NC}"
if [ -f .env.${ENV} ]; then
    echo -e "${GREEN}✅ .env.${ENV} encontrado${NC}"
else
    echo -e "${RED}❌ Archivo .env.${ENV} no encontrado${NC}"
    echo -e "${YELLOW}   Creando desde .env.example...${NC}"
    
    if [ -f .env.example ]; then
        cp .env.example .env.${ENV}
        echo -e "${YELLOW}⚠️  Configura las variables en .env.${ENV} antes de continuar${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.example tampoco existe${NC}"
        exit 1
    fi
fi

# 4. Stop y remove contenedor anterior si existe
echo ""
echo -e "${YELLOW}4️⃣  Deteniendo contenedor anterior...${NC}"
if docker ps -a | grep -q $CONTAINER_NAME; then
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo -e "${GREEN}✅ Contenedor anterior eliminado${NC}"
else
    echo -e "${BLUE}ℹ️  No hay contenedor anterior${NC}"
fi

# 5. Eliminar imagen anterior
echo ""
echo -e "${YELLOW}5️⃣  Limpiando imagen anterior...${NC}"
docker rmi $IMAGE_NAME 2>/dev/null || true
echo -e "${GREEN}✅ Imagen anterior eliminada${NC}"

# 6. Build nueva imagen
echo ""
echo -e "${YELLOW}6️⃣  Construyendo nueva imagen...${NC}"
echo -e "${BLUE}   Esto puede tardar varios minutos...${NC}"

docker build \
    --no-cache \
    --build-arg NODE_ENV=production \
    --tag $IMAGE_NAME \
    --file Dockerfile \
    . 2>&1 | while read line; do
        echo "   $line"
    done

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Imagen construida exitosamente${NC}"
else
    echo -e "${RED}❌ Error al construir imagen${NC}"
    exit 1
fi

# 7. Run nuevo contenedor
echo ""
echo -e "${YELLOW}7️⃣  Iniciando nuevo contenedor...${NC}"

docker run -d \
    --name $CONTAINER_NAME \
    --env-file .env.${ENV} \
    --restart unless-stopped \
    -p ${PORT}:3000 \
    -v $(pwd)/prisma:/app/prisma:ro \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contenedor iniciado${NC}"
else
    echo -e "${RED}❌ Error al iniciar contenedor${NC}"
    exit 1
fi

# 8. Esperar que el servidor esté listo
echo ""
echo -e "${YELLOW}8️⃣  Esperando que el servidor esté listo...${NC}"
sleep 5

# Verificar que el contenedor está corriendo
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}✅ Contenedor corriendo${NC}"
else
    echo -e "${RED}❌ Contenedor no está corriendo${NC}"
    echo -e "${YELLOW}📋 Logs del contenedor:${NC}"
    docker logs $CONTAINER_NAME
    exit 1
fi

# 9. Health check
echo ""
echo -e "${YELLOW}9️⃣  Health check...${NC}"
sleep 3

if curl -f http://localhost:${PORT} >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Aplicación respondiendo en puerto ${PORT}${NC}"
else
    echo -e "${RED}❌ Aplicación no responde${NC}"
    echo -e "${YELLOW}📋 Logs del contenedor:${NC}"
    docker logs --tail 50 $CONTAINER_NAME
    exit 1
fi

# 10. Cleanup de imágenes huérfanas
echo ""
echo -e "${YELLOW}🔟 Limpiando imágenes huérfanas...${NC}"
docker image prune -f >/dev/null 2>&1
echo -e "${GREEN}✅ Limpieza completada${NC}"

# 11. Mostrar info del deployment
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📦 Contenedor:${NC} $CONTAINER_NAME"
echo -e "${GREEN}🌐 URL Local:${NC} http://localhost:${PORT}"
echo -e "${GREEN}📊 Estado:${NC} $(docker ps --filter name=$CONTAINER_NAME --format '{{.Status}}')"
echo ""
echo -e "${YELLOW}📋 Comandos útiles:${NC}"
echo -e "   Ver logs:       ${BLUE}docker logs -f $CONTAINER_NAME${NC}"
echo -e "   Reiniciar:      ${BLUE}docker restart $CONTAINER_NAME${NC}"
echo -e "   Detener:        ${BLUE}docker stop $CONTAINER_NAME${NC}"
echo -e "   Shell:          ${BLUE}docker exec -it $CONTAINER_NAME sh${NC}"
echo -e "   Estadísticas:   ${BLUE}docker stats $CONTAINER_NAME${NC}"
echo ""
echo -e "${GREEN}🎉 ¡Deployment exitoso!${NC}"
echo ""
