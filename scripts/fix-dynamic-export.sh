#!/bin/bash
# Script para añadir "export const dynamic = 'force-dynamic'" a todas las API routes
# Autor: Cursor Agent Cloud
# Fecha: 3 de Enero de 2026

set -e

echo "🔧 Fix: Añadiendo 'export const dynamic' a API routes"
echo "======================================================="
echo ""

# Contador
TOTAL=0
FIXED=0
SKIPPED=0

# Buscar todos los route.ts en app/api
while IFS= read -r file; do
  TOTAL=$((TOTAL + 1))
  
  # Verificar si ya tiene dynamic export
  if grep -q "export const dynamic" "$file"; then
    echo "⏭️  SKIP: $file (ya tiene dynamic export)"
    SKIPPED=$((SKIPPED + 1))
  else
    # Añadir al inicio del archivo
    # Crear backup
    cp "$file" "$file.bak"
    
    # Insertar al inicio
    echo "export const dynamic = 'force-dynamic';" > "$file.tmp"
    echo "" >> "$file.tmp"
    cat "$file.bak" >> "$file.tmp"
    mv "$file.tmp" "$file"
    
    # Limpiar backup
    rm "$file.bak"
    
    echo "✅ FIXED: $file"
    FIXED=$((FIXED + 1))
  fi
done < <(find app/api -name "route.ts" -type f)

echo ""
echo "======================================================="
echo "📊 RESUMEN"
echo "======================================================="
echo "Total archivos: $TOTAL"
echo "Archivos corregidos: $FIXED"
echo "Archivos sin cambios: $SKIPPED"
echo ""

if [ $FIXED -gt 0 ]; then
  echo "✅ Corrección completada exitosamente"
  echo ""
  echo "🧪 Verificación:"
  echo "   yarn build"
  echo ""
  echo "📝 Revertir cambios (si necesario):"
  echo "   git checkout app/api"
else
  echo "✅ Todos los archivos ya tienen dynamic export"
fi

echo ""
echo "🔍 Verificar archivos corregidos:"
echo "   grep -r 'export const dynamic' app/api --include='*.ts' | wc -l"
