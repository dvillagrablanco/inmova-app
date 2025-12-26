#!/bin/bash

echo "🚀 QUICK DEPLOY - Sidebar Fixes"
echo "================================"
echo ""

echo "📝 Paso 1: Verificando archivos..."
if [ -f "/workspace/styles/sidebar-mobile.css" ]; then
    echo "  ✅ sidebar-mobile.css existe"
else
    echo "  ❌ sidebar-mobile.css NO encontrado"
    exit 1
fi

if grep -q "sidebar-mobile.css" "/workspace/app/layout.tsx"; then
    echo "  ✅ CSS importado en layout.tsx"
else
    echo "  ❌ CSS NO importado en layout.tsx"
    exit 1
fi

echo ""
echo "📦 Paso 2: Preparando commit..."
echo "  Archivos a incluir:"
echo "    - components/layout/sidebar.tsx"
echo "    - components/layout/header.tsx"
echo "    - styles/sidebar-mobile.css (NUEVO)"
echo "    - app/layout.tsx"
echo "    - 6 páginas corregidas"

echo ""
echo "✅ Verificación completada"
echo ""
echo "Para deployar, ejecuta:"
echo ""
echo "  git add ."
echo "  git commit -m 'fix: optimizar sidebar móvil y layout desktop'"
echo "  git push origin main"
echo ""
echo "Luego en Vercel/Railway:"
echo "  - Espera el build (3-5 min)"
echo "  - Purga el cache"
echo "  - Haz hard refresh en el móvil"
echo ""
