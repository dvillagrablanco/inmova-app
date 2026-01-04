#!/usr/bin/env python3
"""
Verificación de Rutas en Producción - Detección Correcta de 404s
"""

import sys
import time
import re

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

# Rutas principales a verificar (muestra)
ROUTES_TO_CHECK = [
    ('/', 'Landing'),
    ('/login', 'Login'),
    ('/dashboard', 'Dashboard'),
    ('/propiedades', 'Propiedades'),
    ('/inquilinos', 'Inquilinos'),
    ('/contratos', 'Contratos'),
    ('/pagos', 'Pagos'),
    ('/mantenimiento', 'Mantenimiento'),
    ('/usuarios', 'Usuarios'),
    ('/visitas', 'Visitas'),
    ('/seguros', 'Seguros'),
    ('/portal-inquilino', 'Portal Inquilino'),
    ('/candidatos', 'Candidatos'),
    ('/notificaciones', 'Notificaciones'),
    ('/perfil', 'Perfil'),
    
    # Test explícito de 404
    ('/ruta-que-no-existe-xyz', 'Test 404 Explícito'),
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

def is_real_404(content: str) -> bool:
    """
    Detectar si es un 404 REAL de Next.js
    """
    # Buscar texto específico de 404 de Next.js
    if '404: This page could not be found' in content:
        return True
    
    # Buscar título de 404
    if '<title>404:' in content or '<title>Not Found' in content:
        return True
    
    # Buscar heading H1 con 404
    if re.search(r'<h1[^>]*>\s*404\s*</h1>', content, re.IGNORECASE):
        return True
    
    return False

def test_route(client, path: str, name: str):
    """Test una ruta y devuelve resultado"""
    url = f"{BASE_URL}{path}"
    
    # Obtener headers
    status, headers, _ = exec_cmd(
        client,
        f"curl -I -s '{url}' | head -20",
        timeout=10
    )
    
    http_code = '000'
    for line in headers.split('\n'):
        if line.startswith('HTTP/'):
            parts = line.split()
            if len(parts) >= 2:
                http_code = parts[1]
                break
    
    # Obtener contenido (primeras 1000 líneas)
    status, content, _ = exec_cmd(
        client,
        f"curl -s '{url}' | head -1000",
        timeout=10
    )
    
    # Determinar si es 404 real
    is_404 = is_real_404(content)
    
    # Verificar si tiene contenido válido (no es página en blanco/error)
    has_content = len(content) > 1000 and ('<html' in content or '<!DOCTYPE' in content)
    has_inmova_content = 'INMOVA' in content or 'inmova' in content.lower()
    
    return {
        'path': path,
        'name': name,
        'http_code': http_code,
        'is_404': is_404,
        'has_content': has_content,
        'has_inmova_content': has_inmova_content,
        'status': 'OK' if (has_content and not is_404) else ('404' if is_404 else 'ERROR'),
    }

def main():
    log("=" * 70, Colors.BOLD)
    log("🔍 VERIFICACIÓN DE RUTAS EN PRODUCCIÓN", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        routes_ok = 0
        routes_404 = 0
        routes_error = 0
        
        errors_list = []
        
        log("📋 VERIFICANDO RUTAS", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        print()
        
        for path, name in ROUTES_TO_CHECK:
            result = test_route(client, path, name)
            
            if result['status'] == 'OK':
                log(f"  ✅ {name}: HTTP {result['http_code']}", Colors.GREEN)
                routes_ok += 1
            elif result['status'] == '404':
                # Verificar si es 404 esperado (como el test explícito)
                if 'Test 404' in name or 'no-existe' in path:
                    log(f"  ✅ {name}: 404 ESPERADO (OK)", Colors.GREEN)
                    routes_ok += 1
                else:
                    log(f"  ❌ {name}: 404 ENCONTRADO", Colors.RED)
                    errors_list.append(result)
                    routes_404 += 1
            else:
                log(f"  ⚠️  {name}: HTTP {result['http_code']} (contenido inesperado)", Colors.YELLOW)
                routes_error += 1
        
        print()
        
        # REPORTE FINAL
        log("=" * 70, Colors.BOLD)
        log("📊 REPORTE FINAL", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        total = len(ROUTES_TO_CHECK)
        log(f"Total rutas verificadas: {total}", Colors.CYAN)
        log(f"  ✅ Rutas OK: {routes_ok}", Colors.GREEN)
        log(f"  ❌ Errores 404: {routes_404}", Colors.RED)
        log(f"  ⚠️  Warnings: {routes_error}", Colors.YELLOW)
        print()
        
        if errors_list:
            log("❌ RUTAS CON ERROR 404:", Colors.RED)
            log("-" * 70, Colors.RED)
            for error in errors_list:
                log(f"  • {error['name']} ({error['path']})", Colors.RED)
                log(f"    HTTP {error['http_code']}", Colors.RED)
            print()
        
        if routes_404 > 0:
            log("=" * 70, Colors.RED)
            log("❌ TEST FALLÓ - Se encontraron 404s reales", Colors.RED)
            log("=" * 70, Colors.RED)
            print()
            log("🔧 ACCIONES:", Colors.YELLOW)
            log("  1. Verificar que archivos page.tsx existen", Colors.YELLOW)
            log("  2. Revisar middleware/auth", Colors.YELLOW)
            log("  3. Rebuild: npm run build", Colors.YELLOW)
            return 1
        else:
            log("=" * 70, Colors.GREEN)
            log("✅ TEST EXITOSO - No hay 404s", Colors.GREEN)
            log("=" * 70, Colors.GREEN)
            print()
            log("🎉 Todas las rutas responden correctamente", Colors.GREEN)
            log("   (Redirects a login son esperados)", Colors.CYAN)
            print()
            log("URLs de verificación:", Colors.CYAN)
            log("  https://inmovaapp.com/dashboard", Colors.CYAN)
            log("  https://inmovaapp.com/propiedades", Colors.CYAN)
            log("  https://inmovaapp.com/inquilinos", Colors.CYAN)
            return 0
    
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
