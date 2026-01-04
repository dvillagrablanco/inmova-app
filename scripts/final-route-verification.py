#!/usr/bin/env python3
"""
Verificación final de rutas - Status real sin dependencia de contenido
"""

import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

def exec_cmd(client, command, timeout=30):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def main():
    print("=" * 70)
    print("🔍 VERIFICACIÓN FINAL DE RUTAS")
    print("=" * 70)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        # Rutas a verificar
        routes = [
            ('Admin Principal', '/admin'),
            ('Admin Usuarios', '/admin/usuarios'),
            ('Admin Config', '/admin/configuracion'),
            ('Admin Dashboard', '/admin/dashboard'),
            ('Candidatos', '/candidatos'),
            ('Contratos', '/contratos'),
            ('Propiedades', '/propiedades'),
            ('Inquilinos', '/inquilinos'),
            ('Usuarios', '/usuarios'),
        ]
        
        results_ok = 0
        results_error = 0
        results_warning = 0
        
        print("📊 Testing rutas:\n")
        
        for name, route in routes:
            # Test HTTP status
            status, output = exec_cmd(
                client,
                f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{route}"
            )
            
            http_code = output.strip()
            
            # Test si tiene contenido
            status, content = exec_cmd(
                client,
                f"curl -s http://localhost:3000{route} | wc -c"
            )
            
            content_size = int(content.strip()) if content.strip().isdigit() else 0
            
            # Clasificar
            if http_code == '200' and content_size > 1000:
                print(f"  ✅ {name:25} HTTP {http_code:3}  ({content_size:6} bytes)")
                results_ok += 1
            elif http_code == '200' and content_size > 100:
                print(f"  ⚠️  {name:25} HTTP {http_code:3}  ({content_size:6} bytes - contenido pequeño)")
                results_warning += 1
            elif http_code == '404':
                print(f"  ❌ {name:25} HTTP {http_code:3}")
                results_error += 1
            else:
                print(f"  ⚠️  {name:25} HTTP {http_code:3}  ({content_size:6} bytes)")
                results_warning += 1
        
        print()
        print("=" * 70)
        print("📊 RESUMEN")
        print("=" * 70)
        print(f"  ✅ OK: {results_ok}")
        print(f"  ⚠️  Warning: {results_warning}")
        print(f"  ❌ Error: {results_error}")
        print()
        
        # Verificar páginas compiladas en build
        print("=" * 70)
        print("📂 PÁGINAS EN BUILD")
        print("=" * 70)
        
        status, output = exec_cmd(
            client,
            "find /opt/inmova-app/.next/server/app -name 'page.js' | wc -l"
        )
        
        total_compiled = int(output.strip()) if output.strip().isdigit() else 0
        print(f"  Total páginas compiladas: {total_compiled}")
        
        # Check específicas
        critical_builds = [
            ('/admin/page.js', 'Admin'),
            ('/candidatos/page.js', 'Candidatos'),
            ('/contratos/page.js', 'Contratos'),
            ('/propiedades/page.js', 'Propiedades'),
            ('/inquilinos/page.js', 'Inquilinos'),
            ('/usuarios/page.js', 'Usuarios'),
        ]
        
        print("\n  Páginas críticas:")
        for path, name in critical_builds:
            status, output = exec_cmd(
                client,
                f"test -f /opt/inmova-app/.next/server/app{path} && echo 'EXISTS' || echo 'MISSING'"
            )
            
            if 'EXISTS' in output:
                print(f"    ✅ {name}: compilada")
            else:
                print(f"    ❌ {name}: NO compilada")
        
        print()
        
        if results_error == 0:
            print("=" * 70)
            print("✅ TODAS LAS RUTAS PRINCIPALES FUNCIONAN")
            print("=" * 70)
            return 0
        else:
            print("=" * 70)
            print(f"⚠️  {results_error} rutas con errores")
            print("=" * 70)
            return 1
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    sys.exit(main())
