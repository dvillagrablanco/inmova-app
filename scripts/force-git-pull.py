#!/usr/bin/env python3
import sys
import os

home_dir = os.path.expanduser('~')
sys.path.insert(0, f'{home_dir}/.local/lib/python3.12/site-packages')

import paramiko

HOST = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

def exec_cmd(ssh, cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error_out = stderr.read().decode('utf-8', errors='ignore')
    return exit_code == 0, output, error_out

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=10)

print("1. Verificando estado actual...")
success, output, _ = exec_cmd(client, "cd /opt/inmova-app && git log --oneline -1")
print(f"Commit actual: {output.strip()}")

print("\n2. Fetching from origin...")
exec_cmd(client, "cd /opt/inmova-app && git fetch origin")

print("\n3. Reset hard to origin/main...")
success, output, error = exec_cmd(client, "cd /opt/inmova-app && git reset --hard origin/main")
print(output)
if error:
    print(error)

print("\n4. Verificando nuevo commit...")
success, output, _ = exec_cmd(client, "cd /opt/inmova-app && git log --oneline -1")
print(f"Nuevo commit: {output.strip()}")

print("\n5. Limpiar y rebuild...")
exec_cmd(client, "cd /opt/inmova-app && rm -rf .next node_modules/.cache")
print("Cache limpiado")

print("\n6. Build...")
success, output, error = exec_cmd(client, "cd /opt/inmova-app && npm run build 2>&1 | tail -100")
if "Successfully compiled" in output or "Compiled successfully" in output:
    print("✅ BUILD EXITOSO")
else:
    print("❌ BUILD FALLÓ:")
    print(output[-2000:])

print("\n7. Restart PM2...")
exec_cmd(client, "pm2 delete inmova-app")
exec_cmd(client, "cd /opt/inmova-app && pm2 start ecosystem.config.js --env production")
exec_cmd(client, "pm2 save")

import time
print("\n8. Esperando 15s...")
time.sleep(15)

print("\n9. Health check...")
success, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
print(output)

success, output, _ = exec_cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"'")
print(output)

client.close()
print("\n✅ COMPLETADO")
