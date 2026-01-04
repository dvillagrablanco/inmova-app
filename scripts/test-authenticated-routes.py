#!/usr/bin/env python3
"""
Test de rutas protegidas CON autenticación de superadmin
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

# Credenciales superadmin
ADMIN_EMAIL = 'admin@inmova.app'
ADMIN_PASSWORD = 'Admin123!'

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
    return exit_status, output

def do_login(client):
    """Hacer login y obtener cookie de sesión"""
    log("🔐 Haciendo login como superadmin...", Colors.CYAN)
    
    # Primero obtener CSRF token
    status, output = exec_cmd(
        client,
        f"curl -s -c /tmp/cookies.txt '{BASE_URL}/login'",
        timeout=10
    )
    
    # Hacer POST login
    login_cmd = f"""curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt -X POST '{BASE_URL}/api/auth/callback/credentials' \
-H 'Content-Type: application/json' \
-d '{{"email":"{ADMIN_EMAIL}","password":"{ADMIN_PASSWORD}","redirect":"false","json":"true"}}' """
    
    status, output = exec_cmd(client, login_cmd, timeout=10)
    
    if 'error' in output.lower():
        log("  ❌ Error en login", Colors.RED)
        return False
    
    log("  ✅ Login OK", Colors.GREEN)
    return True

def test_route_authenticated(client, route):
    """Test de ruta con autenticación"""
    url = f"{BASE_URL}{route}"
    
    # Hacer petición con cookies
    cmd = f"curl -s -b /tmp/cookies.txt -L '{url}' | head -1000"
    status, output = exec_cmd(client, cmd, timeout=10)
    
    # Verificar contenido
    is_404 = '404: This page could not be found' in output
    is_unauthorized = 'Unauthorized' in output or 'No autorizado' in output
    has_content = len(output) > 1000
    has_inmova = 'INMOVA' in output or 'inmova' in output.lower()
    
    # Detectar redireccionamiento a login
    is_login_redirect = ('<form' in output and 'email' in output and 'password' in output.lower())
    
    return {
        'path': route,
        'is_404': is_404,
        'is_unauthorized': is_unauthorized,
        'is_login_redirect': is_login_redirect,
        'has_content': has_content,
        'has_inmova': has_inmova,
        'size': len(output),
        'status': 'ERROR' if (is_404 or is_unauthorized or is_login_redirect) else ('OK' if has_content else 'WARNING')
    }

def main():
    log("=" * 70, Colors.BOLD)
    log("🔍 TEST DE RUTAS PROTEGIDAS CON AUTENTICACIÓN", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # LOGIN
        if not do_login(client):
            log("❌ No se pudo hacer login, abortando", Colors.RED)
            return 1
        
        print()
        
        # RUTAS A TESTEAR
        log("=" * 70, Colors.BOLD)
        log("🧪 TESTING RUTAS DE SUPERADMIN", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        routes = [
            # Admin principal
            '/admin',
            '/admin/dashboard',
            '/admin/usuarios',
            '/admin/configuracion',
            
            # Gestión de usuarios/empresas
            '/usuarios',
            '/empresas',
            
            # Otras páginas que reportaron 404
            '/candidatos',
            '/propiedades',
            '/inquilinos',
            '/contratos',
            
            # Más rutas admin
            '/admin/activity',
            '/admin/alertas',
            '/admin/planes',
            '/admin/marketplace',
            '/admin/modulos',
        ]
        
        results_ok = 0
        results_error = 0
        results_warning = 0
        
        errors_list = []
        
        for route in routes:
            result = test_route_authenticated(client, route)
            
            if result['status'] == 'OK':
                results_ok += 1
                log(f"  ✅ {route}: OK ({result['size']} bytes)", Colors.GREEN)
            elif result['status'] == 'ERROR':
                results_error += 1
                reason = []
                if result['is_404']:
                    reason.append('404')
                if result['is_unauthorized']:
                    reason.append('unauthorized')
                if result['is_login_redirect']:
                    reason.append('login redirect')
                
                reason_str = ', '.join(reason) if reason else 'sin contenido'
                log(f"  ❌ {route}: ERROR ({reason_str})", Colors.RED)
                errors_list.append(result)
            else:
                results_warning += 1
                log(f"  ⚠️  {route}: WARNING (contenido limitado: {result['size']} bytes)", Colors.YELLOW)
        
        print()
        
        # REPORTE FINAL
        log("=" * 70, Colors.BOLD)
        log("📊 REPORTE FINAL", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        total = results_ok + results_error + results_warning
        log(f"Total rutas testeadas: {total}", Colors.CYAN)
        log(f"  ✅ OK: {results_ok}", Colors.GREEN)
        log(f"  ❌ Errores: {results_error}", Colors.RED)
        log(f"  ⚠️  Warnings: {results_warning}", Colors.YELLOW)
        print()
        
        if errors_list:
            log("❌ RUTAS CON PROBLEMAS:", Colors.RED)
            for error in errors_list:
                log(f"  • {error['path']}", Colors.RED)
                if error['is_404']:
                    log(f"    - Página 404", Colors.RED)
                if error['is_unauthorized']:
                    log(f"    - No autorizado", Colors.RED)
                if error['is_login_redirect']:
                    log(f"    - Redirige a login (sesión no válida)", Colors.RED)
            print()
        
        if results_error > 0:
            log("=" * 70, Colors.RED)
            log(f"❌ TEST FALLÓ - {results_error} rutas con errores", Colors.RED)
            log("=" * 70, Colors.RED)
            return 1
        else:
            log("=" * 70, Colors.GREEN)
            log(f"✅ TEST EXITOSO - {results_ok}/{total} rutas OK", Colors.GREEN)
            log("=" * 70, Colors.GREEN)
            return 0
    
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        # Limpiar cookies
        exec_cmd(client, "rm -f /tmp/cookies.txt")
        client.close()

if __name__ == '__main__':
    sys.exit(main())
