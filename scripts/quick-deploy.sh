#!/bin/bash

# Quick deployment - versión rápida para iteraciones
# Uso: ./scripts/quick-deploy.sh

set -e

PROJECT_NAME="inmova-app"
CONTAINER_NAME="${PROJECT_NAME}-production"

echo "🚀 QUICK DEPLOY - INMOVA"
echo "========================"
echo ""

# 1. Pull código
echo "1️⃣  Git pull..."
git pull origin main --rebase

# 2. Stop contenedor
echo "2️⃣  Stop contenedor..."
docker stop $CONTAINER_NAME 2>/dev/null || true

# 3. Rebuild (usando cache)
echo "3️⃣  Rebuild (con cache)..."
docker build -t ${PROJECT_NAME}:production .

# 4. Start contenedor
echo "4️⃣  Start contenedor..."
docker start $CONTAINER_NAME 2>/dev/null || \
docker run -d \
    --name $CONTAINER_NAME \
    --env-file .env.production \
    --restart unless-stopped \
    -p 3000:3000 \
    ${PROJECT_NAME}:production

# 5. Wait & verify
echo "5️⃣  Verificando..."
sleep 5

if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Deployment exitoso!"
    echo "🌐 http://localhost:3000"
else
    echo "❌ Error - revisar logs:"
    docker logs --tail 20 $CONTAINER_NAME
fi
