#!/bin/bash

TOKEN="mrahnG6wAoMRYDyGA9sWXGQH"

echo "🚀 Intentando deployment via API de Vercel..."
echo ""

# Obtener información del usuario
echo "1. Obteniendo información del usuario..."
USER_INFO=$(curl -s -H "Authorization: Bearer ${TOKEN}" "https://api.vercel.com/v2/user")
USERNAME=$(echo "$USER_INFO" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$USER_INFO" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "   Usuario: $USERNAME"
echo "   User ID: $USER_ID"
echo ""

# Crear deployment usando GitHub
echo "2. Creando deployment desde GitHub..."
DEPLOY_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inmova-app",
    "gitSource": {
      "type": "github",
      "repo": "dvillagrablanco/inmova-app",
      "ref": "cursor/app-deployment-to-vercel-7c94"
    },
    "projectSettings": {
      "framework": "nextjs",
      "buildCommand": "yarn build",
      "outputDirectory": ".next",
      "installCommand": "yarn install"
    }
  }')

echo "$DEPLOY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DEPLOY_RESPONSE"
echo ""

# Verificar si funcionó
if echo "$DEPLOY_RESPONSE" | grep -q '"url"'; then
    echo "✅ ¡Deployment iniciado!"
    DEPLOY_URL=$(echo "$DEPLOY_RESPONSE" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "🔗 URL: https://$DEPLOY_URL"
else
    echo "❌ Error en el deployment"
fi
