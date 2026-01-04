#!/usr/bin/env python3
"""
Verificar qué páginas se compilaron realmente en .next/server/app
"""

import sys
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
    print("🔍 Verificando páginas compiladas en .next/server/app\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        # Listar TODAS las páginas compiladas
        print("📂 Páginas compiladas:")
        status, output = exec_cmd(
            client,
            "find /opt/inmova-app/.next/server/app -name 'page.js' | sed 's|/opt/inmova-app/.next/server/app||' | sed 's|/page.js||' | sort | head -100"
        )
        
        pages = [p.strip() for p in output.split('\n') if p.strip()]
        
        print(f"\nTotal páginas compiladas: {len(pages)}\n")
        
        # Categorizar
        admin_pages = [p for p in pages if '/admin' in p]
        dashboard_pages = [p for p in pages if '(dashboard)' in p]
        other_pages = [p for p in pages if '/admin' not in p and '(dashboard)' not in p]
        
        print(f"📊 Distribución:")
        print(f"  • Admin: {len(admin_pages)}")
        print(f"  • Dashboard group: {len(dashboard_pages)}")
        print(f"  • Otras: {len(other_pages)}")
        print()
        
        # Mostrar páginas por categoría
        if dashboard_pages:
            print("✅ Páginas en (dashboard):")
            for page in dashboard_pages[:10]:
                print(f"  • {page}")
            if len(dashboard_pages) > 10:
                print(f"  ... y {len(dashboard_pages) - 10} más")
            print()
        
        if admin_pages:
            print("✅ Páginas de admin:")
            for page in admin_pages[:10]:
                print(f"  • {page}")
            if len(admin_pages) > 10:
                print(f"  ... y {len(admin_pages) - 10} más")
            print()
        
        # Verificar páginas críticas
        critical = [
            '/admin',
            '/candidatos',
            '/usuarios',
            '/propiedades',
            '/inquilinos',
            '/contratos',
        ]
        
        print("🔍 Páginas críticas:")
        for page in critical:
            if page in pages or f"(dashboard){page}" in pages:
                print(f"  ✅ {page}: COMPILADA")
            else:
                print(f"  ❌ {page}: NO ENCONTRADA en build")
        
        # Verificar estructura de archivos source
        print("\n📁 Archivos source en app/:")
        status, output = exec_cmd(
            client,
            "ls -d /opt/inmova-app/app/admin /opt/inmova-app/app/candidatos /opt/inmova-app/app/usuarios 2>/dev/null"
        )
        
        if output.strip():
            print("  ✅ Directorios existen:")
            for line in output.strip().split('\n'):
                print(f"    • {line}")
        
        # Ver si hay archivos page.tsx
        print("\n📄 Archivos page.tsx:")
        status, output = exec_cmd(
            client,
            "ls -la /opt/inmova-app/app/admin/page.tsx /opt/inmova-app/app/candidatos/page.tsx /opt/inmova-app/app/usuarios/page.tsx 2>/dev/null | awk '{print $9, $5}'"
        )
        
        if output.strip():
            for line in output.strip().split('\n'):
                if line:
                    print(f"  ✅ {line}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1
    
    finally:
        client.close()
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
