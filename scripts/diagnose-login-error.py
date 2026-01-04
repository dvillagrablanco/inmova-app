#!/usr/bin/env python3
"""Diagnosticar error de login en producción"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

def log(msg, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'ERROR': '\033[0;31m', 'SUCCESS': '\033[0;32m'}
    print(f"{colors.get(level, '')}{level}\033[0m: {msg}")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

log("🔍 DIAGNÓSTICO DE ERROR DE LOGIN")
log("=" * 80)

# 1. Ver logs de PM2 (últimas 100 líneas)
log("\n📋 Logs de PM2 (últimas 100 líneas con 'error'):")
log("-" * 80)
stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --lines 100 --nostream | grep -i error | tail -50")
stdout.channel.recv_exit_status()
output = stdout.read().decode()
print(output if output.strip() else "No hay errores en logs")

# 2. Ver estado de PM2
log("\n📊 Estado de PM2:")
log("-" * 80)
stdin, stdout, stderr = client.exec_command("pm2 status")
stdout.channel.recv_exit_status()
output = stdout.read().decode()
print(output)

# 3. Test de login page
log("\n🔐 Test de login page:")
log("-" * 80)
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/login | head -20")
stdout.channel.recv_exit_status()
output = stdout.read().decode()
print(output)

# 4. Test de API auth
log("\n🔑 Test de API /api/auth/session:")
log("-" * 80)
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/auth/session")
stdout.channel.recv_exit_status()
output = stdout.read().decode()
print(output)

# 5. Ver variables de entorno críticas
log("\n⚙️ Variables de entorno críticas:")
log("-" * 80)
stdin, stdout, stderr = client.exec_command("grep -E 'NEXTAUTH_URL|DATABASE_URL|NEXTAUTH_SECRET' /opt/inmova-app/.env.production | sed 's/=.*/=***/'")
stdout.channel.recv_exit_status()
output = stdout.read().decode()
print(output)

# 6. Ver logs recientes de errores
log("\n📝 Logs más recientes (últimas 30 líneas):")
log("-" * 80)
stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --lines 30 --nostream")
stdout.channel.recv_exit_status()
output = stdout.read().decode()
print(output)

client.close()
log("\n" + "=" * 80)
