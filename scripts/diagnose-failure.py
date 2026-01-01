#!/usr/bin/env python3
"""Diagnosticar por qué PM2 falla"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'
APP_PATH = '/opt/inmova-app'

def execute_command(ssh, command):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=30)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore')

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        
        print("🔍 DIAGNÓSTICO COMPLETO\n")
        
        # 1. Logs PM2
        print("="*70)
        print("📝 PM2 Error Logs (últimas 100 líneas):\n")
        output = execute_command(client, "tail -100 /var/log/inmova/error.log 2>&1")
        print(output if output.strip() else "(vacío)")
        
        print("\n" + "="*70)
        print("📝 PM2 Out Logs (últimas 100 líneas):\n")
        output = execute_command(client, "tail -100 /var/log/inmova/out.log 2>&1")
        print(output if output.strip() else "(vacío)")
        
        # 2. Test manual
        print("\n" + "="*70)
        print("🧪 Test Manual de npm start:\n")
        output = execute_command(client, f"cd {APP_PATH} && timeout 10 npm start 2>&1 || true")
        print(output[:2000])
        
        # 3. Variables de entorno
        print("\n" + "="*70)
        print("🔐 Variables de entorno críticas:\n")
        output = execute_command(client, f"cd {APP_PATH} && grep -E 'DATABASE_URL|NEXTAUTH_SECRET|NODE_ENV' .env.production 2>&1 | head -10")
        
        # Ocultar valores sensibles
        lines = output.split('\n')
        for line in lines:
            if '=' in line:
                key = line.split('=')[0]
                print(f"{key}=***")
            else:
                print(line)
        
        # 4. Verificar node y npm
        print("\n" + "="*70)
        print("⚙️  Versiones:\n")
        output = execute_command(client, "node --version && npm --version")
        print(output)
        
        # 5. Verificar .next/standalone
        print("\n" + "="*70)
        print("📦 .next build files:\n")
        output = execute_command(client, f"ls -lah {APP_PATH}/.next/*.json 2>&1 | head -10")
        print(output)
        
        # 6. Intentar ejecutar next directamente
        print("\n" + "="*70)
        print("🔧 Test directo de Next.js:\n")
        output = execute_command(client, f"cd {APP_PATH} && timeout 10 npx next start 2>&1 || true")
        print(output[:2000])
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == '__main__':
    main()
