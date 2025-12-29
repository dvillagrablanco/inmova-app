#!/bin/bash

# Script para añadir export const dynamic = 'force-dynamic' a todas las rutas API

find app/api -name "route.ts" -type f | while read file; do
  # Verificar si ya tiene la exportación
  if ! grep -q "export const dynamic" "$file"; then
    # Obtener los imports (todo antes del primer export/const/function/interface)
    # Añadir la exportación después de los imports
    
    # Crear archivo temporal
    temp_file="${file}.tmp"
    
    # Si el archivo empieza con imports, añadir después de ellos
    if head -1 "$file" | grep -q "^import"; then
      # Encontrar la última línea de import
      last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      
      # Insertar después del último import
      head -n "$last_import" "$file" > "$temp_file"
      echo "" >> "$temp_file"
      echo "export const dynamic = 'force-dynamic';" >> "$temp_file"
      tail -n +$((last_import + 1)) "$file" >> "$temp_file"
      
      mv "$temp_file" "$file"
      echo "✅ Añadido a: $file"
    else
      # Si no hay imports, añadir al principio
      echo "export const dynamic = 'force-dynamic';" > "$temp_file"
      echo "" >> "$temp_file"
      cat "$file" >> "$temp_file"
      mv "$temp_file" "$file"
      echo "✅ Añadido a: $file"
    fi
  else
    echo "⏭️  Ya existe en: $file"
  fi
done

echo ""
echo "🎉 Proceso completado"
echo "Total de archivos procesados: $(find app/api -name "route.ts" -type f | wc -l)"
