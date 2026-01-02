#!/usr/bin/env python3
"""
Force Rebuild - Limpiar todo y reconstruir
"""

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

REMOTE_APP_PATH = '/opt/inmova-app'

def execute_command(ssh, command, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    return {'exit_status': exit_status, 'output': output, 'error': error}

def main():
    print("🔥 Force Rebuild...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    
    print("\n1. Verificar app/page.tsx en servidor...")
    result = execute_command(ssh, f"cat {REMOTE_APP_PATH}/app/page.tsx")
    print(result['output'])
    
    if 'landing-static' in result['output']:
        print("❌ ERROR: app/page.tsx tiene 'landing-static'")
    else:
        print("✅ app/page.tsx correcto")
    
    print("\n2. Matando proceso...")
    execute_command(ssh, "pm2 kill")
    execute_command(ssh, "fuser -k 3000/tcp 2>/dev/null || true")
    time.sleep(3)
    
    print("\n3. Limpiando completamente .next...")
    execute_command(ssh, f"cd {REMOTE_APP_PATH} && rm -rf .next")
    execute_command(ssh, f"cd {REMOTE_APP_PATH} && rm -rf node_modules/.cache")
    print("✅ Cache eliminado")
    
    print("\n4. Iniciando app en modo desarrollo (auto-rebuild)...")
    # Usar pm2 para iniciar en modo dev
    cmd = f"cd {REMOTE_APP_PATH} && pm2 start npm --name inmova-app -- run dev"
    result = execute_command(ssh, cmd, timeout=10)
    
    print("\n5. Esperando 20 segundos para rebuild...")
    time.sleep(20)
    
    print("\n6. Ver logs...")
    result = execute_command(ssh, "pm2 logs inmova-app --lines 30 --nostream")
    print(result['output'])
    
    print("\n7. Test HTTP...")
    result = execute_command(ssh, "curl -s http://localhost:3000/landing | grep -o '<title>[^<]*</title>'")
    print(result['output'])
    
    if 'landing-static' in result['output']:
        print("\n❌ TODAVÍA redirigiendo a landing-static")
        print("\n🔍 Buscando landing-static en código...")
        result = execute_command(ssh, f"grep -r 'landing-static' {REMOTE_APP_PATH}/app/ || echo 'No encontrado'")
        print(result['output'][:500])
    else:
        print("\n✅ Landing funcionando correctamente!")
    
    print("\n8. PM2 status...")
    result = execute_command(ssh, "pm2 list")
    print(result['output'])
    
    ssh.close()

if __name__ == "__main__":
    main()
