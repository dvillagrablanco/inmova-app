#!/usr/bin/env python3
"""
FIX Y DEPLOYMENT: Eliminar archivo conflictivo y desplegar
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def execute_command(client, command):
    """Ejecuta comando y retorna output"""
    print(f"   $ {command}")
    stdin, stdout, stderr = client.exec_command(command, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0:
        print(f"   ✓ OK")
        return True, output
    else:
        print(f"   ✗ Error: {error[:200]}")
        return False, error

print("=" * 60)
print("🔧 FIX: Eliminando archivo conflictivo en servidor")
print("=" * 60)

try:
    # Conectar
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("\n📡 Conectando al servidor...")
    client.connect(
        SERVER_IP,
        username=USERNAME,
        password=PASSWORD,
        timeout=30,
        look_for_keys=False,
        allow_agent=False
    )
    print("✅ Conectado")
    
    # Verificar si existe el archivo conflictivo
    print("\n🔍 Verificando archivo conflictivo...")
    success, output = execute_command(
        client,
        f"ls -la {APP_DIR}/app/configuracion/page.tsx"
    )
    
    if success:
        print("⚠️ Archivo conflictivo encontrado, eliminando...")
        success, output = execute_command(
            client,
            f"rm -f {APP_DIR}/app/configuracion/page.tsx"
        )
        
        if success:
            print("✅ Archivo eliminado")
        else:
            print("❌ Error al eliminar archivo")
            sys.exit(1)
    else:
        print("ℹ️ Archivo no existe (ya fue eliminado)")
    
    # Verificar que no queden otros archivos conflictivos
    print("\n🔍 Verificando estructura de carpetas...")
    execute_command(
        client,
        f"find {APP_DIR}/app -name 'page.tsx' -path '*/configuracion/*' -type f"
    )
    
    client.close()
    print("\n✅ Fix completado. Ahora ejecuta el deployment nuevamente.")
    print("   python3 scripts/deploy-to-production.py")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    sys.exit(1)
