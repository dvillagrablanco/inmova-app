#!/usr/bin/env python3
"""
Generador automático de tests de integración para API routes
Escanea app/api y genera tests completos para cada endpoint

Autor: Cursor Agent Cloud
Fecha: 3 de Enero de 2026
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple

def find_api_routes(base_path: str = "app/api") -> List[Dict]:
    """Encuentra todos los route.ts y extrae información"""
    routes = []
    
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file == "route.ts":
                file_path = Path(root) / file
                relative_path = file_path.relative_to(Path(base_path))
                
                # Parsear ruta
                parts = str(relative_path.parent).split('/')
                endpoint = '/' + '/'.join(parts) if parts != ['.'] else '/'
                
                # Detectar parámetros dinámicos
                params = [p[1:-1] for p in parts if p.startswith('[') and p.endswith(']')]
                
                # Leer archivo para detectar métodos HTTP
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                methods = []
                if re.search(r'export\s+async\s+function\s+GET', content):
                    methods.append('GET')
                if re.search(r'export\s+async\s+function\s+POST', content):
                    methods.append('POST')
                if re.search(r'export\s+async\s+function\s+PUT', content):
                    methods.append('PUT')
                if re.search(r'export\s+async\s+function\s+DELETE', content):
                    methods.append('DELETE')
                if re.search(r'export\s+async\s+function\s+PATCH', content):
                    methods.append('PATCH')
                
                routes.append({
                    'path': str(file_path),
                    'endpoint': endpoint,
                    'params': params,
                    'methods': methods,
                    'relative_path': str(relative_path.parent)
                })
    
    return routes

def generate_test_for_route(route: Dict) -> str:
    """Genera código de test para una ruta específica"""
    endpoint = route['endpoint']
    methods = route['methods']
    params = route['params']
    test_path = route['relative_path']
    
    # Determinar si requiere auth (mayoría de rutas)
    needs_auth = '/auth' not in endpoint and '/public' not in endpoint
    
    test_code = f"""import {{ describe, it, expect, beforeAll }} from 'vitest';
import {{ NextRequest }} from 'next/server';

describe('API: {endpoint}', () => {{
  let authToken: string;
  const baseURL = 'http://localhost:3000';
  
  beforeAll(async () => {{
    // Mock de autenticación
    authToken = 'mock-jwt-token';
    
    // O autenticación real si es necesario
    // const response = await fetch(`${{baseURL}}/api/auth/signin`, {{
    //   method: 'POST',
    //   headers: {{ 'Content-Type': 'application/json' }},
    //   body: JSON.stringify({{
    //     email: 'test@inmova.app',
    //     password: 'Test123456!'
    //   }})
    // }});
    // const data = await response.json();
    // authToken = data.token;
  }});
"""

    # Generar tests para cada método HTTP
    for method in methods:
        if method == 'GET':
            test_code += f"""
  describe('{method} {endpoint}', () => {{
    it('debe retornar 200 con datos válidos', async () => {{
      const url = `${{baseURL}}/api{endpoint}`;
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          {'Authorization: `Bearer ${authToken}`,' if needs_auth else ''}
          'Content-Type': 'application/json'
        }}
      }});
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeDefined();
      {f"expect(Array.isArray(data) || typeof data === 'object').toBe(true);" if 'list' in endpoint or endpoint.endswith('s') else "expect(typeof data).toBe('object');"}
    }});
    
    {f'''it('debe retornar 401 sin autenticación', async () => {{
      const url = `${{baseURL}}/api{endpoint}`;
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          'Content-Type': 'application/json'
        }}
      }});
      
      expect(response.status).toBe(401);
    }});''' if needs_auth else ''}
    
    {f'''it('debe manejar parámetros de query', async () => {{
      const url = `${{baseURL}}/api{endpoint}?page=1&limit=10`;
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          Authorization: `Bearer ${{authToken}}`,
          'Content-Type': 'application/json'
        }}
      }});
      
      expect(response.status).toBe(200);
    }});''' if not params else ''}
    
    {f'''it('debe manejar parámetros dinámicos', async () => {{
      const testId = 'test-id-123';
      const url = `${{baseURL}}/api{endpoint.replace(f"[{params[0]}]", "${{testId}}")}`;
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          Authorization: `Bearer ${{authToken}}`,
          'Content-Type': 'application/json'
        }}
      }});
      
      expect([200, 404]).toContain(response.status);
    }});''' if params else ''}
  }});
"""
        
        elif method == 'POST':
            test_code += f"""
  describe('{method} {endpoint}', () => {{
    it('debe crear recurso con datos válidos', async () => {{
      const url = `${{baseURL}}/api{endpoint}`;
      
      const testData = {{
        // TODO: Ajustar según el schema real
        name: 'Test Resource',
        description: 'Test description',
      }};
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          {'Authorization: `Bearer ${authToken}`,' if needs_auth else ''}
          'Content-Type': 'application/json'
        }},
        body: JSON.stringify(testData)
      }});
      
      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toBeDefined();
      {f"expect(data.id).toBeDefined();" if 'create' in endpoint.lower() else ''}
    }});
    
    it('debe retornar 400 con datos inválidos', async () => {{
      const url = `${{baseURL}}/api{endpoint}`;
      
      const invalidData = {{}};
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          {'Authorization: `Bearer ${authToken}`,' if needs_auth else ''}
          'Content-Type': 'application/json'
        }},
        body: JSON.stringify(invalidData)
      }});
      
      expect(response.status).toBe(400);
    }});
    
    {f'''it('debe retornar 401 sin autenticación', async () => {{
      const url = `${{baseURL}}/api{endpoint}`;
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          'Content-Type': 'application/json'
        }},
        body: JSON.stringify({{}})
      }});
      
      expect(response.status).toBe(401);
    }});''' if needs_auth else ''}
  }});
"""
        
        elif method in ['PUT', 'PATCH']:
            test_code += f"""
  describe('{method} {endpoint}', () => {{
    it('debe actualizar recurso existente', async () => {{
      const testId = 'existing-id';
      const url = `${{baseURL}}/api{endpoint}`;
      
      const updateData = {{
        // TODO: Ajustar según el schema real
        name: 'Updated Name',
      }};
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          {'Authorization: `Bearer ${authToken}`,' if needs_auth else ''}
          'Content-Type': 'application/json'
        }},
        body: JSON.stringify(updateData)
      }});
      
      expect([200, 404]).toContain(response.status);
    }});
    
    it('debe retornar 404 para recurso inexistente', async () => {{
      const url = `${{baseURL}}/api{endpoint.replace('[id]', 'non-existent-id')}`;
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          {'Authorization: `Bearer ${authToken}`,' if needs_auth else ''}
          'Content-Type': 'application/json'
        }},
        body: JSON.stringify({{ name: 'Test' }})
      }});
      
      expect(response.status).toBe(404);
    }});
  }});
"""
        
        elif method == 'DELETE':
            test_code += f"""
  describe('{method} {endpoint}', () => {{
    it('debe eliminar recurso existente', async () => {{
      const testId = 'existing-id';
      const url = `${{baseURL}}/api{endpoint}`;
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          {'Authorization: `Bearer ${authToken}`,' if needs_auth else ''}
        }}
      }});
      
      expect([200, 204, 404]).toContain(response.status);
    }});
    
    it('debe retornar 404 para recurso inexistente', async () => {{
      const url = `${{baseURL}}/api{endpoint.replace('[id]', 'non-existent-id')}`;
      
      const response = await fetch(url, {{
        method: '{method}',
        headers: {{
          {'Authorization: `Bearer ${authToken}`,' if needs_auth else ''}
        }}
      }});
      
      expect(response.status).toBe(404);
    }});
    
    {f'''it('debe retornar 401 sin autenticación', async () => {{
      const url = `${{baseURL}}/api{endpoint}`;
      
      const response = await fetch(url, {{
        method: '{method}'
      }});
      
      expect(response.status).toBe(401);
    }});''' if needs_auth else ''}
  }});
"""
    
    test_code += "});\n"
    
    return test_code

def main():
    print("🤖 Generador de Tests API")
    print("=" * 70)
    print()
    
    # Verificar directorio
    if not os.path.exists("app/api"):
        print("❌ ERROR: No se encontró app/api")
        return 1
    
    # Buscar rutas
    print("📁 Escaneando API routes...")
    routes = find_api_routes()
    print(f"✅ Encontradas {len(routes)} rutas\n")
    
    # Crear directorio de tests
    test_dir = Path("__tests__/integration/api")
    test_dir.mkdir(parents=True, exist_ok=True)
    
    # Generar tests
    generated = 0
    skipped = 0
    
    for route in routes:
        # Crear estructura de carpetas
        test_file_dir = test_dir / route['relative_path']
        test_file_dir.mkdir(parents=True, exist_ok=True)
        
        # Nombre del archivo de test
        methods_str = '-'.join(route['methods'])
        test_file = test_file_dir / f"{methods_str}.test.ts"
        
        # Verificar si ya existe
        if test_file.exists():
            print(f"⏭️  SKIP: {test_file} (ya existe)")
            skipped += 1
            continue
        
        # Generar código
        test_code = generate_test_for_route(route)
        
        # Escribir archivo
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_code)
        
        print(f"✅ CREATED: {test_file}")
        generated += 1
    
    # Resumen
    print()
    print("=" * 70)
    print("📊 RESUMEN")
    print("=" * 70)
    print(f"Total rutas: {len(routes)}")
    print(f"Tests generados: {generated}")
    print(f"Tests existentes: {skipped}")
    print()
    
    if generated > 0:
        print("✅ Generación completada")
        print()
        print("📝 IMPORTANTE: Revisar y ajustar los tests generados:")
        print("   1. Completar datos de test (// TODO)")
        print("   2. Ajustar assertions según respuestas reales")
        print("   3. Añadir edge cases específicos")
        print()
        print("🧪 Ejecutar tests:")
        print("   yarn test:integration")
    else:
        print("✅ Todos los tests ya existen")
    
    return 0

if __name__ == "__main__":
    exit(main())
