#!/bin/bash

TOKEN="mrahnG6wAoMRYDyGA9sWXGQH"

echo "🚀 Creando proyecto Vercel desde GitHub..."
echo ""

# Primero obtener la instalación de GitHub
GITHUB_INFO=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
  "https://api.vercel.com/v2/integrations/git-providers")

echo "Información de GitHub:"
echo "$GITHUB_INFO" | python3 -m json.tool 2>/dev/null || echo "$GITHUB_INFO"
echo ""

# Crear proyecto desde repositorio
echo "Creando proyecto desde repositorio..."
RESPONSE=$(curl -s -X POST "https://api.vercel.com/v1/integrations/deploy/prj_inmova/git" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inmova-app",
    "gitSource": {
      "type": "github",
      "repo": "dvillagrablanco/inmova-app",
      "ref": "cursor/app-deployment-to-vercel-7c94"
    },
    "framework": "nextjs",
    "buildCommand": "yarn build",
    "outputDirectory": ".next",
    "installCommand": "yarn install"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
