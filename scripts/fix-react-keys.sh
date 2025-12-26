#!/bin/bash

# Script para corregir automáticamente algunos .map() sin keys comunes

echo "🔧 Corrigiendo problemas de React keys..."

count=0

# Función para corregir archivos
fix_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    # Buscar patrones comunes y agregar keys
    # Patrón: .map((item) => ( sin key en la siguiente línea
    perl -pe '
        # Para items con .id
        s/\.map\(\((\w+)\) => \(\s*\n(\s*)<(\w+)/\.map\((${1}) => (\n${2}<${3} key={${1}.id}/g;
        
        # Para arrays con índices
        s/\.map\(\((\w+), (idx|index|i)\) => \(\s*\n(\s*)<(\w+)(?! key)/\.map\((${1}, ${2}) => (\n${3}<${4} key={${2}}/g;
    ' "$file" > "$temp_file"
    
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        return 1
    else
        rm "$temp_file"
        return 0
    fi
}

# Procesar archivos .tsx
while IFS= read -r -d '' file; do
    if [[ "$file" =~ node_modules|\.next|dist|build ]]; then
        continue
    fi
    
    if fix_file "$file"; then
        :
    else
        ((count++))
        echo "  ✓ $file"
    fi
done < <(find app components -name "*.tsx" -print0)

echo ""
echo "✅ Corregidos $count archivos"
