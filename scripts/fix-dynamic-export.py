#!/usr/bin/env python3
"""
Script para añadir 'export const dynamic = "force-dynamic"' a todas las API routes
Maneja edge cases como imports existentes, comentarios, etc.

Autor: Cursor Agent Cloud
Fecha: 3 de Enero de 2026
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

def find_api_routes(base_path: str = "app/api") -> List[Path]:
    """Encuentra todos los route.ts en app/api"""
    routes = []
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file == "route.ts":
                routes.append(Path(root) / file)
    return sorted(routes)

def has_dynamic_export(content: str) -> bool:
    """Verifica si el archivo ya tiene dynamic export"""
    # Buscar tanto con comillas simples como dobles
    pattern = r"export\s+const\s+dynamic\s*=\s*['\"]force-dynamic['\"]"
    return bool(re.search(pattern, content))

def fix_file(file_path: Path) -> Tuple[bool, str]:
    """
    Añade dynamic export al archivo si no lo tiene
    Retorna (modificado, mensaje)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verificar si ya tiene dynamic export
        if has_dynamic_export(content):
            return False, "Ya tiene dynamic export"
        
        # Buscar primera línea de código (ignorar comentarios de header)
        lines = content.split('\n')
        insert_index = 0
        
        # Saltar comentarios iniciales y líneas vacías
        for i, line in enumerate(lines):
            stripped = line.strip()
            # Si encontramos un import o código real, insertar antes
            if stripped and not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*'):
                insert_index = i
                break
        
        # Construir nuevo contenido
        new_lines = lines[:insert_index]
        new_lines.append("export const dynamic = 'force-dynamic';")
        new_lines.append("")  # Línea en blanco
        new_lines.extend(lines[insert_index:])
        
        new_content = '\n'.join(new_lines)
        
        # Crear backup
        backup_path = file_path.with_suffix('.ts.bak')
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Escribir nuevo contenido
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        # Eliminar backup
        backup_path.unlink()
        
        return True, "Corregido exitosamente"
    
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    print("🔧 Fix: Añadiendo 'export const dynamic' a API routes")
    print("=" * 70)
    print()
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("app/api"):
        print("❌ ERROR: No se encontró el directorio app/api")
        print("   Ejecuta este script desde la raíz del proyecto")
        return 1
    
    # Buscar archivos
    routes = find_api_routes()
    
    if not routes:
        print("⚠️  No se encontraron archivos route.ts en app/api")
        return 0
    
    print(f"📁 Encontrados {len(routes)} archivos route.ts")
    print()
    
    # Procesar archivos
    fixed = 0
    skipped = 0
    errors = 0
    
    for route in routes:
        try:
            relative_path = route.relative_to(Path.cwd())
        except ValueError:
            relative_path = route
        modified, message = fix_file(route)
        
        if modified:
            print(f"✅ FIXED: {relative_path}")
            fixed += 1
        elif "Error" in message:
            print(f"❌ ERROR: {relative_path} - {message}")
            errors += 1
        else:
            print(f"⏭️  SKIP: {relative_path} ({message})")
            skipped += 1
    
    # Resumen
    print()
    print("=" * 70)
    print("📊 RESUMEN")
    print("=" * 70)
    print(f"Total archivos: {len(routes)}")
    print(f"Archivos corregidos: {fixed}")
    print(f"Archivos sin cambios: {skipped}")
    print(f"Errores: {errors}")
    print()
    
    if fixed > 0:
        print("✅ Corrección completada exitosamente")
        print()
        print("🧪 Verificación:")
        print("   yarn build")
        print()
        print("📝 Revertir cambios (si necesario):")
        print("   git checkout app/api")
    else:
        print("✅ Todos los archivos ya tienen dynamic export")
    
    print()
    print("🔍 Verificar archivos corregidos:")
    print("   grep -r 'export const dynamic' app/api --include='*.ts' | wc -l")
    
    return 0

if __name__ == "__main__":
    exit(main())
