#!/usr/bin/env python3
"""Deploy fix para credenciales de superadministrador"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

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
    error = stderr.read().decode('utf-8')
    return {'exit_status': exit_status, 'output': output, 'error': error}

def main():
    print("🔐 Corrigiendo credenciales de superadministrador...\n")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    
    try:
        # 1. Subir script
        print("1. Subiendo script de verificación...")
        sftp = ssh.open_sftp()
        sftp.put(
            '/workspace/scripts/verify-and-fix-superadmin.ts',
            '/opt/inmova-app/scripts/verify-and-fix-superadmin.ts'
        )
        sftp.close()
        print("  ✅ Script subido\n")
        
        # 2. Ejecutar script con tsx
        print("2. Ejecutando script de verificación...")
        result = execute_command(
            ssh,
            "cd /opt/inmova-app && npx tsx scripts/verify-and-fix-superadmin.ts",
            timeout=60
        )
        
        print(result['output'])
        if result['error']:
            print("⚠️ Errores:")
            print(result['error'])
        
        if result['exit_status'] != 0:
            print(f"\n❌ Script falló con código {result['exit_status']}")
            return
        
        print("\n3. Verificando que podemos hacer login...")
        
        # Esperar un momento
        time.sleep(2)
        
        # Intentar curl al endpoint de login
        test_result = execute_command(
            ssh,
            "curl -s http://localhost:3000/login | grep -o 'email' | head -1"
        )
        
        if 'email' in test_result['output']:
            print("  ✅ Página de login accesible\n")
        else:
            print("  ⚠️ No se pudo verificar la página de login\n")
        
        print("="*60)
        print("✅ FIX COMPLETADO")
        print("="*60)
        print("\n🔐 CREDENCIALES DE SUPERADMINISTRADOR:")
        print("   Email: admin@inmova.app")
        print("   Password: Admin123!")
        print("\n🧪 CREDENCIALES DE PRUEBA:")
        print("   Email: test@inmova.app")
        print("   Password: Test123456!")
        print("\n🌐 PRUEBA EN:")
        print("   http://157.180.119.236/login")
        print("   https://inmovaapp.com/login")
        print("="*60)
        
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
