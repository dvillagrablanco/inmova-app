#!/bin/bash

# Script para arreglar los archivos problemáticos de forma definitiva

echo "🔧 Arreglando páginas rotas..."

# Array de archivos a arreglar
files=(
  "app/automatizacion/page.tsx"
  "app/contratos/page.tsx"
  "app/edificios/page.tsx"
  "app/flipping/dashboard/page.tsx"
  "app/home-mobile/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📄 Procesando: $file"
    
    # Crear backup
    cp "$file" "${file}.backup"
    
    # Arreglar indentación excesiva (reemplazar 12 espacios por 6)
    sed -i 's/^            \([<{a-zA-Z]\)/      \1/g' "$file"
    
    # Arreglar indentación excesiva (reemplazar 10 espacios por 6)
    sed -i 's/^          \([<{a-zA-Z]\)/      \1/g' "$file"
    
    # Arreglar espacios dentro de AuthenticatedLayout
    sed -i 's/^                \([<{a-zA-Z]\)/        \1/g' "$file"
    
    # Eliminar líneas vacías excesivas dentro de loading states
    sed -i '/^[[:space:]]*$/N;/^\n$/d' "$file"
    
    echo "  ✅ Arreglado"
  else
    echo "  ⚠️  No encontrado: $file"
  fi
done

echo ""
echo "✨ Proceso completado"
echo "💾 Backups creados con extensión .backup"
