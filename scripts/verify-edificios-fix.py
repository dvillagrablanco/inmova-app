#!/usr/bin/env python3
"""
Verificación de la página de edificios y estadísticas
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import os

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = os.getenv("SSH_PASSWORD", "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=")

def main():
    print("=" * 70)
    print("🔍 VERIFICACIÓN DE FIX DE EDIFICIOS Y OCUPACIÓN")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
    
    try:
        # 1. Verificar página de edificios
        print("\n📋 Verificando página /edificios...")
        stdin, stdout, stderr = client.exec_command(
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/edificios --max-time 10"
        )
        status = stdout.read().decode().strip()
        print(f"  - /edificios: {status} {'✅' if status == '200' else '❌'}")
        
        # 2. Verificar API de buildings
        print("\n📋 Verificando API /api/buildings...")
        stdin, stdout, stderr = client.exec_command(
            "curl -s http://localhost:3000/api/buildings --max-time 10 | head -c 500"
        )
        output = stdout.read().decode()
        if 'error' in output.lower() and 'autorizado' in output.lower():
            print(f"  - API responde correctamente (requiere auth) ✅")
        elif 'error' in output.lower():
            print(f"  - Error: {output[:200]}")
        else:
            print(f"  - Respuesta: {output[:200]}...")
        
        # 3. Verificar página de estadísticas
        print("\n📋 Verificando página /estadisticas...")
        stdin, stdout, stderr = client.exec_command(
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/estadisticas --max-time 10"
        )
        status = stdout.read().decode().strip()
        print(f"  - /estadisticas: {status} {'✅' if status in ['200', '302'] else '❌'}")
        
        # 4. Verificar API de estadísticas
        print("\n📋 Verificando API /api/estadisticas...")
        stdin, stdout, stderr = client.exec_command(
            "curl -s http://localhost:3000/api/estadisticas --max-time 10 | head -c 500"
        )
        output = stdout.read().decode()
        if 'success' in output:
            print(f"  - API devuelve datos ✅")
            print(f"    {output[:300]}...")
        elif 'error' in output.lower() and 'autenticado' in output.lower():
            print(f"  - API requiere autenticación (correcto) ✅")
        else:
            print(f"  - Respuesta: {output[:200]}")
        
        # 5. Verificar que la ruta dinámica [id] existe
        print("\n📋 Verificando archivo page.tsx de [id]...")
        stdin, stdout, stderr = client.exec_command(
            "ls -la /opt/inmova-app/app/edificios/\\[id\\]/page.tsx"
        )
        output = stdout.read().decode()
        if 'page.tsx' in output:
            print(f"  - Archivo existe ✅")
            print(f"    {output.strip()}")
        else:
            print(f"  - Archivo no encontrado ❌")
            print(f"    {stderr.read().decode()}")
        
        # 6. Verificar PM2 status
        print("\n📋 Estado de PM2...")
        stdin, stdout, stderr = client.exec_command("pm2 status inmova-app")
        output = stdout.read().decode()
        if 'online' in output.lower():
            print(f"  - Aplicación online ✅")
        else:
            print(f"  - Estado: {output[:200]}")
        
        # 7. Verificar memoria
        print("\n📋 Uso de recursos...")
        stdin, stdout, stderr = client.exec_command(
            "pm2 show inmova-app | grep -E 'memory|uptime|status'"
        )
        output = stdout.read().decode()
        print(f"  {output}")
        
        print("\n" + "=" * 70)
        print("✅ VERIFICACIÓN COMPLETADA")
        print("=" * 70)
        print(f"""
URLs disponibles:
  📋 Lista de edificios: http://{SERVER_IP}:3000/edificios
  📊 Estadísticas: http://{SERVER_IP}:3000/estadisticas
  
Para ver detalles de un edificio específico:
  http://{SERVER_IP}:3000/edificios/[ID_DEL_EDIFICIO]
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
