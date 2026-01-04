#!/usr/bin/env python3
"""Configurar Gmail SMTP en producción con credenciales"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

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

log("📧 CONFIGURACIÓN DE GMAIL SMTP EN PRODUCCIÓN")
log("=" * 80)

# 1. Backup
log("\n📋 PASO 1: Backup de .env.production")
stdin, stdout, stderr = client.exec_command(
    f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.smtp.$(date +%Y%m%d_%H%M%S)"
)
stdout.channel.recv_exit_status()
log("✅ Backup creado", 'SUCCESS')

# 2. Verificar si ya existen variables SMTP
log("\n📋 PASO 2: Verificar variables existentes")
stdin, stdout, stderr = client.exec_command(
    f"grep -q 'SMTP_HOST' {APP_PATH}/.env.production && echo 'EXISTS' || echo 'NOT_FOUND'"
)
stdout.channel.recv_exit_status()
exists = stdout.read().decode().strip()

if exists == 'EXISTS':
    log("ℹ️ Variables SMTP ya existen, actualizando...", 'INFO')
    # Eliminar líneas antiguas
    stdin, stdout, stderr = client.exec_command(
        f"sed -i '/^SMTP_/d' {APP_PATH}/.env.production"
    )
    stdout.channel.recv_exit_status()
else:
    log("ℹ️ Variables SMTP no existen, añadiendo...", 'INFO')

# 3. Añadir configuración de Gmail
log("\n📋 PASO 3: Configurar Gmail SMTP")

smtp_config = """
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=inmovaapp@gmail.com
SMTP_PASSWORD=eeemxyuasvsnyxyu
SMTP_FROM="Inmova App <inmovaapp@gmail.com>"
"""

stdin, stdout, stderr = client.exec_command(
    f"echo '{smtp_config}' >> {APP_PATH}/.env.production"
)
stdout.channel.recv_exit_status()
log("✅ Variables SMTP añadidas", 'SUCCESS')

# 4. Verificar configuración
log("\n📋 PASO 4: Verificar configuración")
stdin, stdout, stderr = client.exec_command(
    f"grep -E 'SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_FROM' {APP_PATH}/.env.production | sed 's/SMTP_PASSWORD=.*/SMTP_PASSWORD=***HIDDEN***/'"
)
stdout.channel.recv_exit_status()
output = stdout.read().decode()
print(output)

# 5. Reiniciar PM2 con nuevas variables
log("\n📋 PASO 5: Reiniciar PM2 con nuevas variables")
stdin, stdout, stderr = client.exec_command(
    f"cd {APP_PATH} && pm2 restart inmova-app --update-env"
)
stdout.channel.recv_exit_status()
log("✅ PM2 reiniciado", 'SUCCESS')

# 6. Esperar warm-up
log("\n⏳ Esperando 15 segundos para warm-up...")
time.sleep(15)

# 7. Verificar que la app está corriendo
log("\n📋 PASO 6: Verificar estado de la aplicación")
stdin, stdout, stderr = client.exec_command(
    "pm2 jlist | grep inmova-app | grep -q online && echo 'ONLINE' || echo 'OFFLINE'"
)
stdout.channel.recv_exit_status()
status = stdout.read().decode().strip()

if status == 'ONLINE':
    log("✅ Aplicación online", 'SUCCESS')
else:
    log("❌ Aplicación offline - revisar logs", 'ERROR')

client.close()

log("\n" + "=" * 80)
log("✅ GMAIL SMTP CONFIGURADO EN PRODUCCIÓN", 'SUCCESS')
log("")
log("📝 Próximo paso:")
log("   Testear envío de email:")
log("   - Usar 'Recuperar contraseña' en https://inmovaapp.com/login")
log("   - O ejecutar: node scripts/test-send-email.js")
log("")
log("⚠️ IMPORTANTE:")
log("   Gmail permite 500 emails/día")
log("   Para producción real considerar SendGrid o AWS SES")
