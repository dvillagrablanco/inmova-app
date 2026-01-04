#!/usr/bin/env python3
"""Configurar Gmail SMTP en producción"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def log(msg, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'SUCCESS': '\033[0;32m', 'ERROR': '\033[0;31m'}
    print(f"{colors.get(level, '')}{level}\033[0m: {msg}")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

log("📧 CONFIGURACIÓN DE GMAIL SMTP")
log("=" * 80)

# 1. Verificar si ya existe configuración local
log("\n📋 PASO 1: Verificar configuración local")
import os
if os.path.exists('/workspace/.env.local'):
    with open('/workspace/.env.local', 'r') as f:
        local_env = f.read()
        if 'SMTP_HOST' in local_env:
            log("✅ Encontrada configuración en .env.local", 'SUCCESS')
            # Extraer valores
            for line in local_env.split('\n'):
                if line.startswith('SMTP_'):
                    log(f"   {line.split('=')[0]}=***", 'INFO')
        else:
            log("ℹ️ No hay SMTP en .env.local", 'INFO')

# 2. Configurar variables en producción
log("\n📋 PASO 2: Configurar variables SMTP en producción")

smtp_vars = """
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=inmovaapp@gmail.com
SMTP_FROM="Inmova App <inmovaapp@gmail.com>"
"""

# Nota: SMTP_PASSWORD debe ser configurada manualmente por seguridad
log("⚠️ SMTP_PASSWORD debe configurarse manualmente", 'INFO')
log("   Pasos para obtener App Password de Gmail:")
log("   1. Ir a: https://myaccount.google.com/apppasswords")
log("   2. Crear 'App Password' para 'Mail'")
log("   3. Copiar el password de 16 caracteres")
log("")

# Añadir variables (excepto password)
stdin, stdout, stderr = client.exec_command(
    f"echo '{smtp_vars}' >> {APP_PATH}/.env.production"
)
stdout.channel.recv_exit_status()

log("✅ Variables SMTP añadidas (falta SMTP_PASSWORD)", 'SUCCESS')

# 3. Verificar configuración
log("\n📋 PASO 3: Verificar configuración")
stdin, stdout, stderr = client.exec_command(
    f"grep -E 'SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_FROM' {APP_PATH}/.env.production | tail -4"
)
stdout.channel.recv_exit_status()
output = stdout.read().decode()
print(output)

# 4. Instrucciones para completar
log("\n📋 PASO 4: Completar configuración")
log("Ejecutar en el servidor:")
log("")
log("ssh root@157.180.119.236")
log("cd /opt/inmova-app")
log('echo "SMTP_PASSWORD=tu_app_password_aqui" >> .env.production')
log("pm2 restart inmova-app --update-env")
log("")

client.close()

log("=" * 80)
log("⚠️ CONFIGURACIÓN INCOMPLETA", 'INFO')
log("Se requiere añadir SMTP_PASSWORD manualmente")
log("Después: pm2 restart inmova-app --update-env")
