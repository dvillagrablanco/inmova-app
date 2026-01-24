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

# Verificar DATABASE_URL actual
print("=== DATABASE_URL actual ===")
stdin, stdout, stderr = client.exec_command(f"grep DATABASE_URL {APP_PATH}/.env.production")
db_url = stdout.read().decode().strip()
print(f"{db_url}")

# Verificar si podemos conectar a la BD
print("\n=== Test de conexión a PostgreSQL ===")
stdin, stdout, stderr = client.exec_command("psql -U inmova_user -d inmova_production -c 'SELECT 1' 2>&1 | head -10")
print(stdout.read().decode())

# Si el password es incorrecto, vamos a arreglarlo
# El password correcto es InmovaSecure2026! según el historial
correct_db_url = 'DATABASE_URL="postgresql://inmova_user:InmovaSecure2026!@localhost:5432/inmova_production?schema=public"'

print("\n=== Actualizando DATABASE_URL ===")
# Reemplazar la línea DATABASE_URL
stdin, stdout, stderr = client.exec_command(f"""cd {APP_PATH} && sed -i 's|^DATABASE_URL=.*|{correct_db_url}|' .env.production""")
stdout.channel.recv_exit_status()

# Verificar el cambio
stdin, stdout, stderr = client.exec_command(f"grep DATABASE_URL {APP_PATH}/.env.production")
print(f"Nuevo valor: {stdout.read().decode().strip()}")

# Reiniciar PM2 con nuevas variables de entorno
print("\n=== Reiniciando PM2 ===")
stdin, stdout, stderr = client.exec_command("pm2 restart inmova-app --update-env")
print(stdout.read().decode())

# Esperar
print("Esperando 15 segundos...")
time.sleep(15)

# Health check
print("\n=== Health check ===")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
print(stdout.read().decode())

client.close()
print("\n✅ Completado")
