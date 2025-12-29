#!/usr/bin/env python3
"""
Script para reiniciar el deployment limpiando cache de build
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy
import time

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
REMOTE_PATH = "/opt/inmova-app"

print("🔄 Reiniciando deployment...")
print(f"📡 Conectando a {SSH_HOST}...\n")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    
    # 1. Limpiar cache de Next.js
    print("🧹 Limpiando cache de Next.js...")
    stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && rm -rf .next node_modules/.cache")
    stdout.channel.recv_exit_status()
    print("✅ Cache limpiado\n")
    
    # 2. Regenerar Prisma Client
    print("🔧 Regenerando Prisma Client...")
    stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && npx prisma generate")
    for line in stdout:
        print(f"   {line.rstrip()}")
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("\n✅ Prisma Client regenerado\n")
    else:
        print("\n⚠️  Error regenerando Prisma Client\n")
    
    # 3. Ejecutar deployment nuevamente
    print("🚀 Ejecutando deployment...")
    stdin, stdout, stderr = ssh.exec_command(
        f"cd {REMOTE_PATH} && bash scripts/deploy-direct.sh > /tmp/deploy.log 2>&1 &"
    )
    stdout.channel.recv_exit_status()
    
    print("✅ Deployment iniciado en segundo plano")
    print("📋 Monitorea el progreso con: tail -f /tmp/deploy.log\n")
    
    # 4. Esperar 5 segundos y mostrar las primeras líneas
    print("⏳ Esperando 5 segundos...")
    time.sleep(5)
    
    stdin, stdout, stderr = ssh.exec_command("tail -20 /tmp/deploy.log 2>/dev/null")
    print("\n📋 Primeras líneas del deployment:\n")
    for line in stdout:
        print(f"   {line.rstrip()}")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("\n🔌 Conexión cerrada")
