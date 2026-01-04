#!/usr/bin/env python3
"""Añadir NEXTAUTH_SECRET y NEXTAUTH_URL al .env.production"""

import sys
import secrets
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def log(msg, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'SUCCESS': '\033[0;32m', 'ERROR': '\033[0;31m'}
    print(f"{colors.get(level, '')}{level}\033[0m: {msg}")

# Generar NEXTAUTH_SECRET seguro
nextauth_secret = secrets.token_urlsafe(32)
log(f"🔑 NEXTAUTH_SECRET generado: {nextauth_secret[:8]}... (longitud: {len(nextauth_secret)})")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

log("🔧 CORRIGIENDO NEXTAUTH_SECRET EN PRODUCCIÓN")
log("=" * 80)

# 1. Backup del .env.production actual
log("\n📋 PASO 1: Backup de .env.production")
stdin, stdout, stderr = client.exec_command(
    f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.$(date +%Y%m%d_%H%M%S)"
)
stdout.channel.recv_exit_status()
log("✅ Backup creado", 'SUCCESS')

# 2. Verificar si NEXTAUTH_SECRET ya existe
log("\n📋 PASO 2: Verificar configuración actual")
stdin, stdout, stderr = client.exec_command(
    f"grep -q 'NEXTAUTH_SECRET' {APP_PATH}/.env.production && echo 'EXISTS' || echo 'NOT_FOUND'"
)
stdout.channel.recv_exit_status()
exists = stdout.read().decode().strip()

if exists == 'EXISTS':
    log("ℹ️ NEXTAUTH_SECRET ya existe, actualizando...")
    # Actualizar existente
    stdin, stdout, stderr = client.exec_command(
        f"sed -i 's/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET={nextauth_secret}/' {APP_PATH}/.env.production"
    )
else:
    log("ℹ️ NEXTAUTH_SECRET no existe, añadiendo...")
    # Añadir nuevo
    stdin, stdout, stderr = client.exec_command(
        f"echo '' >> {APP_PATH}/.env.production && echo '# NextAuth Configuration' >> {APP_PATH}/.env.production && echo 'NEXTAUTH_SECRET={nextauth_secret}' >> {APP_PATH}/.env.production"
    )

stdout.channel.recv_exit_status()

# 3. Añadir/actualizar NEXTAUTH_URL
log("\n📋 PASO 3: Configurar NEXTAUTH_URL")
stdin, stdout, stderr = client.exec_command(
    f"grep -q 'NEXTAUTH_URL' {APP_PATH}/.env.production && echo 'EXISTS' || echo 'NOT_FOUND'"
)
stdout.channel.recv_exit_status()
url_exists = stdout.read().decode().strip()

if url_exists == 'EXISTS':
    stdin, stdout, stderr = client.exec_command(
        f"sed -i 's|^NEXTAUTH_URL=.*|NEXTAUTH_URL=https://inmovaapp.com|' {APP_PATH}/.env.production"
    )
else:
    stdin, stdout, stderr = client.exec_command(
        f"echo 'NEXTAUTH_URL=https://inmovaapp.com' >> {APP_PATH}/.env.production"
    )

stdout.channel.recv_exit_status()
log("✅ NEXTAUTH_URL configurado: https://inmovaapp.com", 'SUCCESS')

# 4. Verificar configuración
log("\n📋 PASO 4: Verificar configuración")
stdin, stdout, stderr = client.exec_command(
    f"grep -E 'NEXTAUTH_SECRET|NEXTAUTH_URL' {APP_PATH}/.env.production | sed 's/=.*/=***HIDDEN***/'"
)
stdout.channel.recv_exit_status()
output = stdout.read().decode()
log("Variables configuradas:")
print(output)

# 5. Reiniciar PM2 con nuevas variables
log("\n📋 PASO 5: Reiniciar PM2 con nuevas variables")
stdin, stdout, stderr = client.exec_command(
    f"cd {APP_PATH} && pm2 restart inmova-app --update-env"
)
stdout.channel.recv_exit_status()
log("✅ PM2 reiniciado con nuevas variables", 'SUCCESS')

# 6. Esperar warm-up
log("\n⏳ Esperando 20 segundos para warm-up...")
import time
time.sleep(20)

# 7. Test de login
log("\n📋 PASO 6: Test de login")
stdin, stdout, stderr = client.exec_command(
    'curl -s http://localhost:3000/api/auth/session | head -1'
)
stdout.channel.recv_exit_status()
output = stdout.read().decode().strip()

if '"message":"There is a problem' in output:
    log("❌ Login sigue fallando", 'ERROR')
    log(f"Response: {output}")
else:
    log("✅ API Auth responde correctamente", 'SUCCESS')
    log(f"Response: {output}")

# 8. Verificar logs de errores
log("\n📋 PASO 7: Verificar logs de errores")
stdin, stdout, stderr = client.exec_command(
    "pm2 logs inmova-app --lines 20 --nostream | grep -i 'NO_SECRET' | tail -5"
)
stdout.channel.recv_exit_status()
errors = stdout.read().decode().strip()

if errors:
    log("⚠️ Aún hay errores NO_SECRET:", 'ERROR')
    print(errors)
else:
    log("✅ No hay errores NO_SECRET en logs recientes", 'SUCCESS')

client.close()

log("\n" + "=" * 80)
log("✅ CONFIGURACIÓN COMPLETADA", 'SUCCESS')
log("")
log("📝 Próximo paso:")
log("   Verificar login en: https://inmovaapp.com/login")
log("   Credenciales: admin@inmova.app / Admin123!")
