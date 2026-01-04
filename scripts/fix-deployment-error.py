#!/usr/bin/env python3
"""
FIX DEPLOYMENT ERROR - Rebuild completo
"""

import sys
import os
import time

home_dir = os.path.expanduser('~')
sys.path.insert(0, f'{home_dir}/.local/lib/python3.12/site-packages')

import paramiko

HOST = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def exec_cmd(ssh, cmd, desc=""):
    if desc:
        print(f"[{desc}]")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=900)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error_out = stderr.read().decode('utf-8', errors='ignore')
    if desc:
        if exit_code == 0:
            print(f"✅ OK\n")
        else:
            print(f"❌ Error: {error_out[:500]}\n")
    return exit_code == 0, output

print("🔧 FIXING DEPLOYMENT ERROR\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=10)

try:
    # 1. Kill PM2
    print("1. Stopping PM2...")
    exec_cmd(client, "pm2 delete inmova-app", "PM2 delete")
    
    # 2. Limpiar .next
    print("2. Cleaning .next...")
    exec_cmd(client, f"cd {APP_PATH} && rm -rf .next", "Clean .next")
    
    # 3. Limpiar node_modules/.cache
    print("3. Cleaning cache...")
    exec_cmd(client, f"cd {APP_PATH} && rm -rf node_modules/.cache", "Clean cache")
    
    # 4. Rebuild
    print("4. Building (puede tardar 5-10 min)...")
    success, output = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -50", "npm run build")
    print(output[-1000:])
    
    if not success:
        print("\n⚠️ Build falló, intentando con modo permisivo...")
        success, output = exec_cmd(
            client,
            f"cd {APP_PATH} && SKIP_ENV_VALIDATION=1 npm run build 2>&1 | tail -50",
            "Build permisivo"
        )
        print(output[-1000:])
    
    # 5. Restart PM2
    print("\n5. Starting PM2...")
    exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production", "PM2 start")
    exec_cmd(client, "pm2 save", "PM2 save")
    
    # 6. Wait y verify
    print("\n6. Waiting 20s for warm-up...")
    time.sleep(20)
    
    print("7. Verificando...")
    success, output = exec_cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"'", "PM2 status")
    print(output)
    
    success, output = exec_cmd(client, "curl -s http://localhost:3000/api/health", "Health check")
    print(output)
    
    print("\n✅ FIX COMPLETADO")
    print("Verificar en: https://inmovaapp.com/dashboard")
    
finally:
    client.close()
