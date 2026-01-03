#!/usr/bin/env python3
"""
Generador automático de tests unitarios para componentes React
Escanea components/ y genera tests con Testing Library

Autor: Cursor Agent Cloud
Fecha: 3 de Enero de 2026
"""

import os
import re
from pathlib import Path
from typing import List, Dict

def find_components(base_paths: List[str] = ["components", "app"]) -> List[Dict]:
    """Encuentra todos los componentes React (.tsx)"""
    components = []
    
    for base_path in base_paths:
        if not os.path.exists(base_path):
            continue
            
        for root, dirs, files in os.walk(base_path):
            # Excluir directorios de test
            if '__tests__' in root or 'tests' in root:
                continue
                
            for file in files:
                if file.endswith('.tsx') and not file.endswith('.test.tsx'):
                    file_path = Path(root) / file
                    
                    # Leer archivo para detectar tipo de componente
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Detectar si es componente
                    is_component = (
                        re.search(r'export\s+(default\s+)?function\s+\w+', content) or
                        re.search(r'export\s+const\s+\w+\s*=\s*\(', content) or
                        re.search(r'const\s+\w+:\s*React\.FC', content)
                    )
                    
                    if not is_component:
                        continue
                    
                    # Extraer nombre del componente
                    name_match = re.search(r'(?:export\s+(?:default\s+)?function\s+|export\s+const\s+)(\w+)', content)
                    component_name = name_match.group(1) if name_match else file.replace('.tsx', '')
                    
                    # Detectar props
                    props_match = re.search(r'interface\s+(\w+Props)\s*{([^}]+)}', content, re.DOTALL)
                    has_props = bool(props_match)
                    props_interface = props_match.group(1) if props_match else None
                    
                    # Detectar hooks
                    uses_state = 'useState' in content
                    uses_effect = 'useEffect' in content
                    uses_context = 'useContext' in content
                    
                    # Detectar si es form
                    is_form = 'form' in content.lower() or 'input' in content.lower()
                    
                    components.append({
                        'path': str(file_path),
                        'name': component_name,
                        'has_props': has_props,
                        'props_interface': props_interface,
                        'uses_state': uses_state,
                        'uses_effect': uses_effect,
                        'uses_context': uses_context,
                        'is_form': is_form,
                        'relative_path': str(file_path.relative_to(Path.cwd()))
                    })
    
    return components

def generate_test_for_component(component: Dict) -> str:
    """Genera código de test para un componente"""
    name = component['name']
    path = component['relative_path']
    has_props = component['has_props']
    uses_state = component['uses_state']
    uses_effect = component['uses_effect']
    is_form = component['is_form']
    
    # Import path relativo
    import_path = path.replace('.tsx', '').replace('components/', '@/components/').replace('app/', '@/app/')
    
    test_code = f"""import {{ describe, it, expect, vi }} from 'vitest';
import {{ render, screen, fireEvent, waitFor }} from '@testing-library/react';
import {{ {name} }} from '{import_path}';

describe('{name}', () => {{
  it('should render without crashing', () => {{
    {f"const props = {{ /* TODO: Añadir props requeridas */ }};" if has_props else ""}
    
    render(<{name} {f"{{...props}}" if has_props else ""} />);
    
    expect(screen.getByRole('main') || document.body).toBeTruthy();
  }});
"""

    # Test de props si las tiene
    if has_props:
        test_code += f"""
  it('should render with props', () => {{
    const testProps = {{
      // TODO: Definir props de test
      testProp: 'test value',
    }};
    
    render(<{name} {{...testProps}} />);
    
    // TODO: Verificar que los props se renderizan correctamente
    expect(screen.getByText(/test value/i)).toBeInTheDocument();
  }});
"""

    # Test de interacción si usa state
    if uses_state:
        test_code += f"""
  it('should handle user interactions', async () => {{
    render(<{name} />);
    
    // TODO: Simular interacción
    // const button = screen.getByRole('button');
    // fireEvent.click(button);
    
    // await waitFor(() => {{
    //   expect(screen.getByText(/expected text/i)).toBeInTheDocument();
    // }});
  }});
"""

    # Test de formulario si es form
    if is_form:
        test_code += f"""
  it('should handle form submission', async () => {{
    const onSubmit = vi.fn();
    
    render(<{name} onSubmit={{onSubmit}} />);
    
    // TODO: Llenar formulario
    // const input = screen.getByLabelText(/name/i);
    // fireEvent.change(input, {{ target: {{ value: 'Test Name' }} }});
    
    // const submitButton = screen.getByRole('button', {{ name: /submit/i }});
    // fireEvent.click(submitButton);
    
    // await waitFor(() => {{
    //   expect(onSubmit).toHaveBeenCalledWith({{
    //     name: 'Test Name',
    //   }});
    // }});
  }});
"""

    # Test de efectos si usa useEffect
    if uses_effect:
        test_code += f"""
  it('should execute side effects', async () => {{
    render(<{name} />);
    
    // TODO: Verificar efectos
    await waitFor(() => {{
      // expect(something).toBe(true);
    }});
  }});
"""

    # Test de accesibilidad
    test_code += f"""
  it('should be accessible', () => {{
    render(<{name} />);
    
    // Verificar roles ARIA básicos
    const element = screen.getByRole('main') || document.body;
    expect(element).toBeTruthy();
    
    // TODO: Añadir más verificaciones de accesibilidad
  }});
"""

    test_code += "});\n"
    
    return test_code

def main():
    print("🤖 Generador de Tests de Componentes")
    print("=" * 70)
    print()
    
    # Verificar directorios
    if not os.path.exists("components") and not os.path.exists("app"):
        print("❌ ERROR: No se encontraron directorios components/ o app/")
        return 1
    
    # Buscar componentes
    print("📁 Escaneando componentes...")
    components = find_components()
    print(f"✅ Encontrados {len(components)} componentes\n")
    
    # Filtrar componentes críticos (priorizar)
    critical_paths = ['components/ui', 'components/forms', 'components/layout']
    critical_components = [
        c for c in components 
        if any(path in c['relative_path'] for path in critical_paths)
    ]
    
    print(f"🎯 Componentes críticos: {len(critical_components)}")
    print(f"📦 Componentes restantes: {len(components) - len(critical_components)}\n")
    
    # Crear directorio de tests
    test_dir = Path("__tests__/unit/components")
    test_dir.mkdir(parents=True, exist_ok=True)
    
    # Preguntar si generar todos o solo críticos
    print("❓ ¿Qué componentes deseas testear?")
    print("   1. Solo críticos (components/ui, forms, layout)")
    print("   2. Todos los componentes")
    print()
    
    # Por defecto, solo críticos para demo
    choice = "1"  # Cambiar a input() para interactivo
    
    to_generate = critical_components if choice == "1" else components
    
    print(f"📝 Generando tests para {len(to_generate)} componentes...\n")
    
    # Generar tests
    generated = 0
    skipped = 0
    
    for component in to_generate:
        # Determinar path del test
        rel_path = Path(component['relative_path'])
        
        if 'components' in component['relative_path']:
            # components/ui/button.tsx -> __tests__/unit/components/ui/button.test.tsx
            test_path = test_dir / rel_path.relative_to('components').with_suffix('.test.tsx')
        else:
            # app/dashboard/page.tsx -> __tests__/unit/components/dashboard/page.test.tsx
            test_path = test_dir / rel_path.name.replace('.tsx', '.test.tsx')
        
        # Crear carpeta si no existe
        test_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Verificar si ya existe
        if test_path.exists():
            print(f"⏭️  SKIP: {test_path} (ya existe)")
            skipped += 1
            continue
        
        # Generar código
        test_code = generate_test_for_component(component)
        
        # Escribir archivo
        with open(test_path, 'w', encoding='utf-8') as f:
            f.write(test_code)
        
        print(f"✅ CREATED: {test_path}")
        generated += 1
    
    # Resumen
    print()
    print("=" * 70)
    print("📊 RESUMEN")
    print("=" * 70)
    print(f"Total componentes: {len(components)}")
    print(f"Tests generados: {generated}")
    print(f"Tests existentes: {skipped}")
    print()
    
    if generated > 0:
        print("✅ Generación completada")
        print()
        print("📝 IMPORTANTE: Completar los tests generados:")
        print("   1. Rellenar // TODO con datos reales")
        print("   2. Añadir assertions específicas")
        print("   3. Probar interacciones reales del componente")
        print()
        print("🧪 Ejecutar tests:")
        print("   yarn test:unit __tests__/unit/components")
    else:
        print("✅ Todos los tests ya existen")
    
    return 0

if __name__ == "__main__":
    exit(main())
