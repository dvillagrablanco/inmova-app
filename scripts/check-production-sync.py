#!/usr/bin/env python3
"""
Verificar sincronización entre código local y producción
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
    print("🔍 Verificando sincronización del código...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        # 1. Ver git status en servidor
        print("📁 Git status en servidor:")
        status, output = exec_cmd(client, "cd /opt/inmova-app && git status")
        print(output)
        print()
        
        # 2. Ver último commit
        print("📝 Último commit en servidor:")
        status, output = exec_cmd(client, "cd /opt/inmova-app && git log -1 --oneline")
        print(f"  {output.strip()}")
        print()
        
        # 3. Ver si hay cambios sin commitear
        print("🔍 Cambios sin commitear:")
        status, output = exec_cmd(client, "cd /opt/inmova-app && git diff --name-only | head -20")
        if output.strip():
            print(output)
        else:
            print("  ✅ No hay cambios sin commitear")
        print()
        
        # 4. Verificar si .next existe y es reciente
        print("🏗️  Build de Next.js:")
        status, output = exec_cmd(client, "ls -lah /opt/inmova-app/.next/ | head -5")
        print(output)
        
        status, output = exec_cmd(client, "stat -c '%y' /opt/inmova-app/.next/BUILD_ID 2>/dev/null || echo 'No BUILD_ID'")
        print(f"  Último build: {output.strip()}")
        print()
        
        # 5. Ver si PM2 está usando el código correcto
        print("⚡ PM2 status:")
        status, output = exec_cmd(client, "cd /opt/inmova-app && pm2 list")
        print(output)
        print()
        
        # 6. Ver estructura de archivos page.tsx en .next/server/app
        print("📂 Páginas en build de producción (.next/server/app):")
        status, output = exec_cmd(client, "find /opt/inmova-app/.next/server/app -name 'page.js' -o -name 'page_client-reference-manifest.js' | grep -E '(admin|usuarios|candidatos)' | head -20")
        if output.strip():
            for line in output.strip().split('\n')[:10]:
                print(f"  • {line}")
        else:
            print("  ⚠️  No se encontraron páginas compiladas")
        print()
        
        # 7. Verificar si hay errores en los logs de PM2
        print("📊 Últimos logs de PM2 (errores):")
        status, output = exec_cmd(client, "pm2 logs inmova-app --lines 20 --nostream --err | tail -10")
        if output.strip():
            print(output)
        else:
            print("  ✅ No hay errores recientes")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1
    
    finally:
        client.close()
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
