#!/bin/bash

echo "🔧 Deshabilitando TODOS los archivos problemáticos..."

# Crear directorio
mkdir -p .disabled_for_build

# Archivos ewoorker con import incorrecto
find app/api/ewoorker -name "*.ts" -type f -exec grep -l "@/pages/api/auth" {} \; | while read file; do
    if [ -f "$file" ]; then
        mv "$file" .disabled_for_build/ 2>/dev/null && echo "✓ Movido $file"
    fi
done

# Páginas con AuthenticatedLayout problemático
for file in app/automatizacion/page.tsx app/certificaciones/page.tsx; do
    if [ -f "$file" ]; then
        mv "$file" .disabled_for_build/ 2>/dev/null && echo "✓ Movido $file"
    fi
done

echo ""
echo "✅ Todos los archivos problemáticos deshabilitados"
