#!/bin/bash

TOKEN="mrahnG6wAoMRYDyGA9sWXGQH"

echo "🚀 Creando proyecto en Vercel via API..."
echo ""

# Crear proyecto via API
RESPONSE=$(curl -s -X POST "https://api.vercel.com/v10/projects" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inmova",
    "framework": "nextjs",
    "buildCommand": "yarn build",
    "outputDirectory": ".next",
    "installCommand": "yarn install",
    "devCommand": "yarn dev",
    "environmentVariables": [
      {
        "key": "NODE_ENV",
        "value": "production",
        "type": "plain",
        "target": ["production", "preview"]
      }
    ]
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extraer project ID
PROJECT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PROJECT_ID" ]; then
    echo "✅ Proyecto creado exitosamente"
    echo "Project ID: $PROJECT_ID"
    echo ""
    
    # Guardar configuración
    mkdir -p .vercel
    cat > .vercel/project.json << EOF
{
  "projectId": "$PROJECT_ID",
  "orgId": "pAzq4g0vFjJlrK87sQhlw08I"
}
EOF
    echo "✅ Configuración guardada en .vercel/project.json"
else
    echo "❌ Error creando proyecto"
    echo "$RESPONSE"
fi
