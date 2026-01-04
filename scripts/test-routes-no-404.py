#!/usr/bin/env python3
"""
Test de Rutas - Verificar 404s sin Playwright
Alternativa ligera usando requests/curl
"""

import sys
import time
import json
from typing import List, Dict, Tuple

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
BASE_URL = 'http://localhost:3000'

# Rutas principales a verificar
MAIN_ROUTES = [
    ('/', 'Landing', True),  # (path, name, public)
    ('/login', 'Login', True),
    ('/register', 'Register', True),
    ('/dashboard', 'Dashboard', False),
    ('/propiedades', 'Propiedades', False),
    ('/propiedades/nuevo', 'Nueva Propiedad', False),
    ('/unidades', 'Unidades', False),
    ('/inquilinos', 'Inquilinos', False),
    ('/contratos', 'Contratos', False),
    ('/pagos', 'Pagos', False),
    ('/reportes', 'Reportes', False),
    ('/reportes/financieros', 'Reportes Financieros', False),
    ('/mantenimiento', 'Mantenimiento', False),
    ('/incidencias', 'Incidencias', False),
    ('/proveedores', 'Proveedores', False),
    ('/visitas', 'Visitas', False),
    ('/tours-virtuales', 'Tours Virtuales', False),
    ('/seguros', 'Seguros', False),
    ('/seguros/nuevo', 'Nuevo Seguro', False),
    ('/valoraciones', 'Valoraciones', False),
    ('/valoracion-ia', 'Valoración IA', False),
    ('/usuarios', 'Usuarios', False),
    ('/usuarios/nuevo', 'Nuevo Usuario', False),
    ('/perfil', 'Perfil', False),
    ('/portal-inquilino', 'Portal Inquilino', False),
    ('/portal-proveedor', 'Portal Proveedor', False),
    ('/portal-comercial', 'Portal Comercial', False),
    ('/partners', 'Partners', False),
    ('/partners/dashboard', 'Partners Dashboard', False),
    ('/red-agentes', 'Red Agentes', False),
    ('/red-agentes/dashboard', 'Dashboard Agentes', False),
    ('/vivienda-social', 'Vivienda Social', False),
    ('/student-housing', 'Student Housing', False),
    ('/workspace', 'Workspace', False),
    ('/str', 'STR', False),
    ('/viajes-corporativos', 'Viajes Corporativos', False),
    ('/real-estate-developer', 'Real Estate Developer', False),
    ('/professional', 'Professional', False),
    ('/warehouse', 'Warehouse', False),
    ('/notificaciones', 'Notificaciones', False),
    ('/tareas', 'Tareas', False),
    ('/marketplace', 'Marketplace', False),
    ('/candidatos', 'Candidatos', False),
    ('/sincronizacion', 'Sincronización', False),
]

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(message, color=Colors.CYAN):
    print(f"{color}[{time.strftime('%H:%M:%S')}] {message}{Colors.END}")

def exec_cmd(client, command, timeout=30):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def test_route(client, path: str, name: str) -> Dict:
    """Test una ruta específica"""
    url = f"{BASE_URL}{path}"
    
    # Test HTTP status
    status, output, error = exec_cmd(
        client,
        f"curl -s -o /dev/null -w '%{{http_code}}' -L '{url}'",
        timeout=10
    )
    
    http_code = output.strip()
    
    # Test contenido (buscar texto de 404)
    status, content, error = exec_cmd(
        client,
        f"curl -s -L '{url}' | head -100",
        timeout=10
    )
    
    has_404_text = any(x in content.lower() for x in ['404', 'not found', 'página no encontrada'])
    has_error_text = 'error' in content.lower() and len(content) < 500
    
    return {
        'path': path,
        'name': name,
        'http_code': http_code,
        'is_404': http_code == '404' or has_404_text,
        'is_error': http_code.startswith('5') or has_error_text,
        'is_success': http_code.startswith('2'),
        'content_preview': content[:200] if content else ''
    }

def main():
    log("=" * 70, Colors.BOLD)
    log("🧪 TEST DE RUTAS - VERIFICACIÓN DE 404s", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # Estadísticas
        total_routes = len(MAIN_ROUTES)
        routes_ok = 0
        routes_404 = 0
        routes_error = 0
        routes_redirect = 0
        
        errors_found: List[Dict] = []
        warnings_found: List[Dict] = []
        
        # Test rutas públicas
        log("📋 FASE 1: RUTAS PÚBLICAS", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        public_routes = [r for r in MAIN_ROUTES if r[2]]
        
        for path, name, _ in public_routes:
            result = test_route(client, path, name)
            
            if result['is_404']:
                log(f"  ❌ {name}: HTTP {result['http_code']} (404)", Colors.RED)
                errors_found.append(result)
                routes_404 += 1
            elif result['is_error']:
                log(f"  ❌ {name}: HTTP {result['http_code']} (ERROR)", Colors.RED)
                errors_found.append(result)
                routes_error += 1
            elif result['http_code'].startswith('3'):
                log(f"  ↪️  {name}: HTTP {result['http_code']} (REDIRECT)", Colors.YELLOW)
                routes_redirect += 1
                routes_ok += 1
            else:
                log(f"  ✅ {name}: HTTP {result['http_code']}", Colors.GREEN)
                routes_ok += 1
        
        print()
        
        # Test rutas protegidas (requieren login)
        log("📋 FASE 2: RUTAS PROTEGIDAS (sin autenticación)", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        log("ℹ️  Nota: Es normal que redirect a /login", Colors.CYAN)
        print()
        
        protected_routes = [r for r in MAIN_ROUTES if not r[2]]
        
        # Tomar muestra de 20 rutas para no hacer el test muy lento
        sample_routes = protected_routes[:20]
        
        for path, name, _ in sample_routes:
            result = test_route(client, path, name)
            
            if result['is_404']:
                log(f"  ❌ {name}: HTTP {result['http_code']} (404)", Colors.RED)
                errors_found.append(result)
                routes_404 += 1
            elif result['is_error']:
                log(f"  ❌ {name}: HTTP {result['http_code']} (ERROR)", Colors.RED)
                errors_found.append(result)
                routes_error += 1
            elif result['http_code'].startswith('3'):
                # Verificar que redirect a login
                status, redirect_url, _ = exec_cmd(
                    client,
                    f"curl -s -I -L '{BASE_URL}{path}' | grep -i location | head -1",
                    timeout=5
                )
                
                if 'login' in redirect_url.lower():
                    log(f"  ✅ {name}: HTTP {result['http_code']} → /login", Colors.GREEN)
                    routes_ok += 1
                else:
                    log(f"  ⚠️  {name}: HTTP {result['http_code']} (redirect inesperado)", Colors.YELLOW)
                    warnings_found.append(result)
                    routes_redirect += 1
            elif result['http_code'] == '401' or result['http_code'] == '403':
                log(f"  ✅ {name}: HTTP {result['http_code']} (auth requerida, OK)", Colors.GREEN)
                routes_ok += 1
            else:
                log(f"  ✅ {name}: HTTP {result['http_code']}", Colors.GREEN)
                routes_ok += 1
        
        print()
        
        # Test adicional: Verificar que páginas críticas NO den 404
        log("📋 FASE 3: VERIFICACIÓN DE PÁGINAS CRÍTICAS", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        critical_routes = [
            '/dashboard',
            '/propiedades',
            '/inquilinos',
            '/contratos',
            '/pagos',
        ]
        
        for path in critical_routes:
            result = test_route(client, path, f"CRÍTICO: {path}")
            
            if result['is_404']:
                log(f"  🚨 CRÍTICO: {path} da 404!", Colors.RED)
                errors_found.append(result)
            else:
                log(f"  ✅ {path}: OK", Colors.GREEN)
        
        print()
        
        # REPORTE FINAL
        log("=" * 70, Colors.BOLD)
        log("📊 REPORTE FINAL", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        tested_routes = len(public_routes) + len(sample_routes) + len(critical_routes)
        
        log(f"Total rutas testeadas: {tested_routes}", Colors.CYAN)
        log(f"  ✅ Rutas OK: {routes_ok}", Colors.GREEN)
        log(f"  ❌ Errores 404: {routes_404}", Colors.RED)
        log(f"  ❌ Errores 500: {routes_error}", Colors.RED)
        log(f"  ↪️  Redirects: {routes_redirect}", Colors.YELLOW)
        print()
        
        if errors_found:
            log("❌ ERRORES ENCONTRADOS:", Colors.RED)
            log("-" * 70, Colors.RED)
            for error in errors_found:
                log(f"  • {error['name']} ({error['path']})", Colors.RED)
                log(f"    HTTP {error['http_code']}", Colors.RED)
                if error['content_preview']:
                    preview = error['content_preview'].replace('\n', ' ')[:100]
                    log(f"    Preview: {preview}...", Colors.YELLOW)
            print()
        
        if warnings_found:
            log("⚠️  WARNINGS:", Colors.YELLOW)
            log("-" * 70, Colors.YELLOW)
            for warning in warnings_found:
                log(f"  • {warning['name']} ({warning['path']})", Colors.YELLOW)
                log(f"    HTTP {warning['http_code']}", Colors.YELLOW)
            print()
        
        # Resultado
        if routes_404 > 0 or routes_error > 0:
            log("=" * 70, Colors.RED)
            log("❌ TEST FALLÓ - Se encontraron errores 404/500", Colors.RED)
            log("=" * 70, Colors.RED)
            print()
            log("🔧 ACCIONES RECOMENDADAS:", Colors.YELLOW)
            log("  1. Revisar rutas que dan 404", Colors.YELLOW)
            log("  2. Verificar archivos page.tsx existen", Colors.YELLOW)
            log("  3. Verificar middleware/auth redirects", Colors.YELLOW)
            log("  4. Ejecutar build: npm run build", Colors.YELLOW)
            log("  5. Re-ejecutar este test", Colors.YELLOW)
            return 1
        else:
            log("=" * 70, Colors.GREEN)
            log("✅ TEST EXITOSO - No se encontraron errores 404", Colors.GREEN)
            log("=" * 70, Colors.GREEN)
            print()
            log("🎉 Todas las rutas testeadas responden correctamente", Colors.GREEN)
            log("   (Redirects a login son esperados para rutas protegidas)", Colors.CYAN)
            return 0
    
    except Exception as e:
        log("=" * 70, Colors.RED)
        log(f"❌ ERROR: {str(e)}", Colors.RED)
        log("=" * 70, Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
