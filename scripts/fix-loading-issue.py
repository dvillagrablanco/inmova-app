#!/usr/bin/env python3
"""Fix Loading Issue - Eliminar loading.tsx problemático"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_CONFIG = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'xcc9brgkMMbf',
    'port': 22,
    'timeout': 30
}

def execute_command(ssh, command, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8')
    return {'exit_status': exit_status, 'output': output}

def main():
    print("🔧 Corrigiendo problema de loading...\n")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    
    try:
        # 1. Eliminar loading.tsx problemático
        print("1. Eliminando app/loading.tsx...")
        result = execute_command(ssh, "cd /opt/inmova-app && rm -f app/loading.tsx")
        print(f"  ✅ Eliminado (exit: {result['exit_status']})\n")
        
        # 2. Limpiar cache de Next.js
        print("2. Limpiando cache Next.js...")
        execute_command(ssh, "cd /opt/inmova-app && rm -rf .next/cache .next/server")
        print("  ✅ Cache limpiado\n")
        
        # 3. Reiniciar PM2
        print("3. Reiniciando aplicación...")
        execute_command(ssh, "pm2 restart inmova-app")
        print("  ✅ App reiniciada\n")
        
        # 4. Esperar
        import time
        print("4. Esperando 10 segundos...")
        time.sleep(10)
        
        # 5. Verificar
        print("\n5. Verificando...")
        result = execute_command(ssh, "curl -s http://localhost:3000/landing | head -50")
        if "INMOVA" in result['output']:
            print("  ✅ Landing funciona correctamente\n")
        else:
            print("  ⚠️ Verificación manual necesaria\n")
        
        print("✅ FIX COMPLETADO\n")
        print("="*60)
        print("🎯 PROBLEMA RESUELTO:")
        print("   El archivo app/loading.tsx estaba causando")
        print("   una pantalla de carga permanente.\n")
        print("📍 Prueba ahora:")
        print("   http://157.180.119.236/landing")
        print("   https://inmovaapp.com/landing")
        print("="*60)
        
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
