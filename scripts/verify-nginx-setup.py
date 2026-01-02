#!/usr/bin/env python3
"""Verificar setup de Nginx y app"""

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
    return {'exit_status': exit_status, 'output': output}

def main():
    print("🔍 Verificación Final de Setup...\n")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    
    print("1. Estado PM2:")
    result = execute_command(ssh, "pm2 list")
    print(result['output'])
    
    print("\n2. Estado Nginx:")
    result = execute_command(ssh, "systemctl status nginx --no-pager | head -5")
    print(result['output'])
    
    print("\n3. Test localhost:3000:")
    result = execute_command(ssh, "curl -s http://localhost:3000/landing 2>&1 | head -1")
    if 'DOCTYPE' in result['output']:
        print("  ✅ App respondiendo")
    else:
        print("  ⚠️  App no responde aún")
    
    print("\n4. Test via Nginx (localhost:80):")
    result = execute_command(ssh, "curl -s http://localhost/landing 2>&1 | head -1")
    if 'DOCTYPE' in result['output']:
        print("  ✅ Nginx proxy funcionando")
    else:
        print("  ⚠️  Nginx no proxy correctamente")
    
    print("\n5. Test público (IP):")
    result = execute_command(ssh, f"curl -s http://{SERVER_CONFIG['hostname']}/landing 2>&1 | head -1")
    if 'DOCTYPE' in result['output']:
        print(f"  ✅ Acceso público OK")
    else:
        print(f"  ⚠️  Verificar firewall")
    
    print("\n6. Configuración Nginx:")
    result = execute_command(ssh, "nginx -T 2>&1 | grep -A 3 'server_name'")
    print(result['output'][:500])
    
    print("\n7. Logs PM2 (últimas 20 líneas):")
    result = execute_command(ssh, "pm2 logs inmova-app --lines 20 --nostream")
    print(result['output'][-1500:])
    
    ssh.close()

if __name__ == "__main__":
    main()
