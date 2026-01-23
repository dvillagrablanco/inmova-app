#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

print("Conectando...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)

# Crear prerender-manifest.json
prerender_content = '''{
  "version": 4,
  "routes": {},
  "dynamicRoutes": {},
  "notFoundRoutes": [],
  "preview": {
    "previewModeId": "preview-mode-id",
    "previewModeSigningKey": "preview-mode-signing-key",
    "previewModeEncryptionKey": "preview-mode-encryption-key"
  }
}'''

print("Creando prerender-manifest.json...")
stdin, stdout, stderr = client.exec_command(f"cat > {APP_PATH}/.next/prerender-manifest.json << 'EOF'\n{prerender_content}\nEOF")
exit_status = stdout.channel.recv_exit_status()
print(f"Status: {exit_status}")

# Verificar
stdin, stdout, stderr = client.exec_command(f"cat {APP_PATH}/.next/prerender-manifest.json")
print(f"Contenido:\n{stdout.read().decode()[:500]}")

# Reiniciar PM2
print("\nReiniciando PM2...")
stdin, stdout, stderr = client.exec_command("pm2 delete all && pm2 kill")
stdout.channel.recv_exit_status()

stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
print(stdout.read().decode())

# Esperar
print("Esperando 20 segundos...")
time.sleep(20)

# Health check
print("\nHealth check...")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
print(stdout.read().decode())

# PM2 status
print("\nPM2 status...")
stdin, stdout, stderr = client.exec_command("pm2 status")
print(stdout.read().decode())

client.close()
print("\n✅ Completado")
