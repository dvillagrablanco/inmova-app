#!/usr/bin/env python3
"""
Fix Landing Page y Deployment
Diagnostica y corrige el problema de la landing page 404
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import os

SERVER_CONFIG = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'xcc9brgkMMbf',
    'port': 22,
    'timeout': 30
}

REMOTE_APP_PATH = '/opt/inmova-app'

def execute_command(ssh, command, timeout=30):
    """Ejecuta comando SSH"""
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    return {'exit_status': exit_status, 'output': output, 'error': error}

def main():
    print("🔍 Diagnosticando problema de landing...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    
    print("\n1. Verificando estructura de directorios...")
    result = execute_command(ssh, f"ls -la {REMOTE_APP_PATH}/app/landing/")
    print(result['output'] if result['exit_status'] == 0 else "❌ Directorio /app/landing/ NO existe")
    
    print("\n2. Verificando si hay build...")
    result = execute_command(ssh, f"ls -la {REMOTE_APP_PATH}/.next/")
    print("✅ Build existe" if result['exit_status'] == 0 else "❌ Build NO existe")
    
    print("\n3. Verificando PM2 logs...")
    result = execute_command(ssh, "pm2 logs inmova-app --lines 50 --nostream")
    print(result['output'][-2000:] if len(result['output']) > 2000 else result['output'])
    
    print("\n4. Verificando qué está sirviendo la app...")
    result = execute_command(ssh, "curl -s http://localhost:3000/landing | head -50")
    print(result['output'])
    
    ssh.close()

if __name__ == "__main__":
    main()
