#!/usr/bin/env python3
"""Test build en servidor con output completo"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

print("🔍 Intentando build con output completo...")
print("=" * 80)

# Limpiar cache
print("\n1. Limpiando cache...")
stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && rm -rf .next/cache")
stdout.channel.recv_exit_status()
print("✅ Cache limpiado")

# Ver si hay errores de TypeScript
print("\n2. Verificando TypeScript...")
stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && npx tsc --noEmit 2>&1 | head -50")
stdout.channel.recv_exit_status()
output = stdout.read().decode()
if output.strip():
    print("⚠️ Errores de TypeScript detectados:")
    print(output)
else:
    print("✅ Sin errores de TypeScript")

# Intentar build
print("\n3. Intentando build...")
stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && npm run build 2>&1", timeout=600)
exit_status = stdout.channel.recv_exit_status()
output = stdout.read().decode()

if exit_status == 0:
    print("✅ Build exitoso!")
    # Mostrar últimas líneas
    lines = output.split('\n')[-20:]
    for line in lines:
        if line.strip():
            print(line)
else:
    print("❌ Build falló")
    print("\n📋 Output completo del error:")
    print("=" * 80)
    # Mostrar últimas 100 líneas
    lines = output.split('\n')[-100:]
    for line in lines:
        print(line)

client.close()
