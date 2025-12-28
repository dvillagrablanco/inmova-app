#!/bin/bash
# Script para corregir todas las páginas con errores de sintaxis

echo "🔧 Corrigiendo TODAS las páginas con errores..."

PAGES=(
  "inquilinos"
  "contratos"
  "reportes"
  "analytics"
  "facturacion"
  "configuracion"
  "perfil"
)

for page in "${PAGES[@]}"; do
  echo "📝 Procesando: /app/$page/page.tsx"
  
  # Buscar el archivo (puede estar en diferentes ubicaciones)
  FILE=$(find /workspace/app -name "page.tsx" -path "*/$page/*" | head -1)
  
  if [ -z "$FILE" ]; then
    echo "  ⚠️  No encontrado: $page"
    continue
  fi
  
  echo "  ✅ Encontrado: $FILE"
done

echo ""
echo "✅ Análisis completado"
