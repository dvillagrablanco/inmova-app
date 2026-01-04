#!/usr/bin/env python3
"""
Deployment sin rebuild - Solo git pull y PM2 reload
Usar cuando el código nuevo no requiere rebuild
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def log(message, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'SUCCESS': '\033[0;32m', 'ERROR': '\033[0;31m', 'WARNING': '\033[1;33m'}
    color = colors.get(level, '\033[0m')
    print(f"{color}{level}\033[0m: {message}")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

log("🚀 DEPLOYMENT RÁPIDO (sin rebuild)")

# Git pull
stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && git pull origin main")
stdout.channel.recv_exit_status()
log("✅ Código actualizado", 'SUCCESS')

# PM2 reload
log("♻️ Reiniciando PM2...")
stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && pm2 reload inmova-app --update-env")
stdout.channel.recv_exit_status()
log("✅ PM2 reloaded", 'SUCCESS')

# Esperar
time.sleep(20)

# Health check
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
stdout.channel.recv_exit_status()
output = stdout.read().decode()

if '"status":"ok"' in output:
    log("✅ Health check OK", 'SUCCESS')
else:
    log("⚠️ Health check: verificar manualmente", 'WARNING')

log("")
log("✅ Deployment completado", 'SUCCESS')
log("🌐 https://inmovaapp.com")

client.close()
