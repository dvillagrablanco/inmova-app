#!/usr/bin/env python3
"""
Verificar qué archivos page.tsx faltan en el servidor de producción
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

# Rutas que reportaron 404
CRITICAL_ROUTES = [
    '/admin',
    '/admin/usuarios',
    '/admin/configuracion',
    '/admin/dashboard',
    '/admin/activity',
    '/admin/alertas',
    '/candidatos',
    '/candidatos/nuevo',
    '/usuarios',
    '/usuarios/nuevo',
]

def exec_cmd(client, command, timeout=30):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def main():
    print("🔍 Verificando archivos page.tsx en servidor de producción...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        missing_count = 0
        exists_count = 0
        
        for route in CRITICAL_ROUTES:
            # Convertir ruta web a path de archivo
            if route == '/admin':
                filepath = '/opt/inmova-app/app/admin/page.tsx'
            else:
                filepath = f'/opt/inmova-app/app{route}/page.tsx'
            
            status, output = exec_cmd(client, f'test -f "{filepath}" && echo "EXISTS" || echo "MISSING"')
            
            if 'EXISTS' in output:
                exists_count += 1
                print(f"✅ {route}: página existe")
            else:
                missing_count += 1
                print(f"❌ {route}: página FALTA en servidor")
        
        print(f"\n📊 Resumen:")
        print(f"  ✅ Existen: {exists_count}")
        print(f"  ❌ Faltan: {missing_count}")
        
        if missing_count > 0:
            print(f"\n⚠️  Hay {missing_count} páginas que faltan en el servidor")
            print("   Solución: git pull && npm run build && pm2 reload")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1
    
    finally:
        client.close()
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
