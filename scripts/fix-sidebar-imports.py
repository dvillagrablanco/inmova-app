#!/usr/bin/env python3
"""
Script para corregir automáticamente páginas que usan Sidebar + Header manual
y reemplazarlas con AuthenticatedLayout.

Uso: python3 scripts/fix-sidebar-imports.py
"""

import os
import re
from pathlib import Path

def fix_page_file(filepath):
    """
    Corrige un archivo .tsx que usa Sidebar + Header manual
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Si ya usa AuthenticatedLayout, skip
        if 'AuthenticatedLayout' in content:
            print(f"⏭️  SKIP: {filepath} (ya usa AuthenticatedLayout)")
            return False
        
        # Si no tiene Sidebar import, skip
        if "from '@/components/layout/sidebar'" not in content:
            return False
        
        original_content = content
        changes_made = False
        
        # 1. Reemplazar imports
        # Buscar el bloque de imports de Sidebar y Header
        if "import { Sidebar } from '@/components/layout/sidebar';" in content:
            content = content.replace(
                "import { Sidebar } from '@/components/layout/sidebar';",
                ""
            )
            changes_made = True
        
        if "import { Header } from '@/components/layout/header';" in content:
            content = content.replace(
                "import { Header } from '@/components/layout/header';",
                ""
            )
            changes_made = True
        
        # Agregar import de AuthenticatedLayout si no está
        if changes_made and "import { AuthenticatedLayout }" not in content:
            # Buscar la última línea de imports de react/next
            import_pattern = r"(import.*from ['\"](react|next).*['\"];?\n)"
            matches = list(re.finditer(import_pattern, content))
            if matches:
                last_import = matches[-1]
                insert_pos = last_import.end()
                content = (
                    content[:insert_pos] +
                    "import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';\n" +
                    content[insert_pos:]
                )
        
        # 2. Limpiar imports vacíos
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        # 3. Reemplazar estructura HTML del layout
        # Patrón 1: <div className="flex h-screen"><Sidebar /><div className="flex-1">...
        pattern1 = r'<div className="flex h-screen[^"]*">\s*<Sidebar\s*/>\s*<div className="flex[^>]*">\s*<Header\s*/>\s*<main'
        if re.search(pattern1, content):
            # Reemplazar apertura
            content = re.sub(
                r'<div className="flex h-screen[^"]*">\s*<Sidebar\s*/>\s*<div className="flex[^>]*">\s*<Header\s*/>\s*<main[^>]*>',
                '<AuthenticatedLayout>',
                content
            )
            # Reemplazar cierre (buscar </main></div></div> al final)
            content = re.sub(
                r'</main>\s*</div>\s*</div>',
                '</AuthenticatedLayout>',
                content
            )
            changes_made = True
        
        # Patrón 2: return (<div className="flex h-screen"><Sidebar />...
        pattern2 = r'return\s*\(\s*<div className="flex h-screen[^"]*">\s*<Sidebar\s*/>'
        if re.search(pattern2, content):
            content = re.sub(
                r'return\s*\(\s*<div className="flex h-screen[^"]*">\s*<Sidebar\s*/>\s*<div[^>]*>\s*<Header\s*/>\s*<main[^>]*>',
                'return (\n      <AuthenticatedLayout>',
                content
            )
            content = re.sub(
                r'</main>\s*</div>\s*</div>\s*\)',
                '</AuthenticatedLayout>\n    )',
                content
            )
            changes_made = True
        
        # Patrón 3: Más específico para algunos casos
        if '<Sidebar />' in content and '<Header />' in content:
            # Reemplazar cualquier combinación de divs con Sidebar y Header
            content = re.sub(
                r'<div[^>]*>\s*<Sidebar\s*/>\s*<div[^>]*>\s*<Header\s*/>\s*<main[^>]*>',
                '<AuthenticatedLayout>',
                content
            )
            changes_made = True
        
        if changes_made and content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ FIXED: {filepath}")
            return True
        else:
            print(f"⚠️  NO CHANGES: {filepath}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {filepath} - {str(e)}")
        return False

def main():
    """
    Encuentra y corrige todos los archivos .tsx en /workspace/app
    """
    print("🔍 Buscando páginas con Sidebar + Header manual...\n")
    
    app_dir = Path('/workspace/app')
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    # Páginas a excluir (ya corregidas manualmente)
    exclude_pages = [
        'dashboard/page.tsx',
        'admin/dashboard/page.tsx',
    ]
    
    for tsx_file in app_dir.rglob('*.tsx'):
        # Skip si está en la lista de exclusión
        relative_path = str(tsx_file.relative_to(app_dir))
        if any(excluded in relative_path for excluded in exclude_pages):
            continue
        
        # Solo procesar archivos page.tsx
        if tsx_file.name != 'page.tsx':
            continue
        
        try:
            result = fix_page_file(tsx_file)
            if result:
                fixed_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            print(f"❌ Error procesando {tsx_file}: {e}")
            error_count += 1
    
    print(f"\n{'='*60}")
    print(f"📊 RESUMEN:")
    print(f"   ✅ Archivos corregidos: {fixed_count}")
    print(f"   ⏭️  Archivos saltados:   {skipped_count}")
    print(f"   ❌ Errores:             {error_count}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    main()
