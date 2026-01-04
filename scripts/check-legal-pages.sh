#!/bin/bash
# Verificar si existen páginas legales requeridas

echo "🔍 Verificando páginas legales..."
echo ""

LEGAL_PAGES=(
  "app/legal/terms/page.tsx"
  "app/legal/privacy/page.tsx"
  "app/legal/cookies/page.tsx"
  "app/legal/legal-notice/page.tsx"
)

FOUND=0
MISSING=0

for page in "${LEGAL_PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "✅ $page"
    FOUND=$((FOUND + 1))
  else
    echo "❌ $page - FALTA"
    MISSING=$((MISSING + 1))
  fi
done

echo ""
echo "📊 Resumen:"
echo "  Encontradas: $FOUND"
echo "  Faltantes: $MISSING"
echo ""

if [ $MISSING -eq 0 ]; then
  echo "✅ Todas las páginas legales existen"
  exit 0
else
  echo "⚠️  Faltan $MISSING páginas legales (BLOQUEANTE PARA LANZAMIENTO)"
  exit 1
fi
