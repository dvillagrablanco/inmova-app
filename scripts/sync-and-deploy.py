#!/usr/bin/env python3
"""
SYNC Y DEPLOYMENT: Sincroniza cambios locales al servidor y despliega
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def execute_command(client, command, show_output=True):
    """Ejecuta comando y retorna output"""
    if show_output:
        print(f"   $ {command}")
    stdin, stdout, stderr = client.exec_command(command, timeout=120)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0:
        if show_output and output:
            print(f"   ✓ {output[:300]}")
        return True, output
    else:
        if show_output:
            print(f"   ✗ Error: {error[:300]}")
        return False, error

print("=" * 60)
print("🔄 SYNC: Actualizando archivos modificados en servidor")
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
    
    # Fix 1: Eliminar app/configuracion/page.tsx si existe
    print("\n🗑️  Eliminando archivos conflictivos...")
    execute_command(
        client,
        f"rm -f {APP_DIR}/app/configuracion/page.tsx"
    )
    
    # Fix 2: Actualizar user-preferences-service.ts con el import correcto
    print("\n📝 Actualizando import en user-preferences-service.ts...")
    
    # Leer contenido actual
    success, content = execute_command(
        client,
        f"head -10 {APP_DIR}/lib/user-preferences-service.ts",
        show_output=False
    )
    
    if "getPrismaClient" in content:
        print("   ⚠️  Import incorrecto detectado, corrigiendo...")
        
        # Hacer backup
        execute_command(
            client,
            f"cp {APP_DIR}/lib/user-preferences-service.ts {APP_DIR}/lib/user-preferences-service.ts.bak"
        )
        
        # Reemplazar import incorrecto
        fix_command = f"""cd {APP_DIR} && cat lib/user-preferences-service.ts | \\
sed 's/import {{ getPrismaClient }} from/import prisma from/' | \\
sed 's/const prisma = getPrismaClient();//' > lib/user-preferences-service.ts.new && \\
mv lib/user-preferences-service.ts.new lib/user-preferences-service.ts"""
        
        success, output = execute_command(client, fix_command)
        
        if success:
            print("   ✅ Import corregido")
        else:
            print("   ❌ Error al corregir, restaurando backup...")
            execute_command(
                client,
                f"mv {APP_DIR}/lib/user-preferences-service.ts.bak {APP_DIR}/lib/user-preferences-service.ts"
            )
            sys.exit(1)
    else:
        print("   ✓ Import ya está correcto")
    
    # Verificar import actualizado
    print("\n🔍 Verificando cambios...")
    success, content = execute_command(
        client,
        f"head -10 {APP_DIR}/lib/user-preferences-service.ts"
    )
    
    if "import prisma from './db'" in content or "import prisma from \"./db\"" in content:
        print("   ✅ Verificación OK")
    else:
        print("   ⚠️  Import no se actualizó correctamente")
        print(f"   Contenido: {content[:200]}")
    
    client.close()
    print("\n✅ Sincronización completada")
    print("\n" + "=" * 60)
    print("🚀 Ahora ejecutando deployment...")
    print("=" * 60)
    
    # Ejecutar deployment
    import subprocess
    result = subprocess.run([
        'python3',
        'scripts/deploy-to-production.py'
    ], cwd='/workspace')
    
    sys.exit(result.returncode)
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
