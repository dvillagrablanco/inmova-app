#!/usr/bin/env python3
"""
Script interactivo para configurar Stripe en producción
Pide las claves de forma segura y las configura en el servidor
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import getpass
import re
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def log(msg, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'SUCCESS': '\033[0;32m', 'ERROR': '\033[0;31m', 'WARNING': '\033[1;33m'}
    print(f"{colors.get(level, '')}{level}\033[0m: {msg}")

def validate_stripe_key(key, key_type):
    """Validar formato de clave de Stripe"""
    patterns = {
        'secret': r'^sk_(test|live)_[A-Za-z0-9]{24,}$',
        'publishable': r'^pk_(test|live)_[A-Za-z0-9]{24,}$',
        'webhook': r'^whsec_[A-Za-z0-9]{24,}$',
    }
    
    if not re.match(patterns[key_type], key):
        return False, f"Formato inválido. Debe empezar con {list(patterns[key_type])[1:10]}"
    
    return True, "OK"

print("=" * 80)
log("💳 CONFIGURACIÓN INTERACTIVA DE STRIPE", 'INFO')
print("=" * 80)
print()
print("Este script configurará Stripe en producción de forma segura.")
print("Necesitarás tus claves de Stripe Dashboard (https://dashboard.stripe.com)")
print()
log("⚠️ IMPORTANTE: Usa claves de LIVE MODE para producción", 'WARNING')
print()

# 1. Pedir STRIPE_SECRET_KEY
print("📝 1/3: STRIPE_SECRET_KEY")
print("   Obtener de: Developers → API keys → Secret key")
print("   Formato: sk_live_51...")
print()

secret_key = getpass.getpass("   Pegar aquí (input oculto): ")

valid, msg = validate_stripe_key(secret_key, 'secret')
if not valid:
    log(f"❌ {msg}", 'ERROR')
    sys.exit(1)

if secret_key.startswith('sk_test'):
    log("⚠️ Estás usando TEST MODE key. Para producción usa sk_live_", 'WARNING')
    confirm = input("   ¿Continuar con test key? (s/N): ")
    if confirm.lower() != 's':
        log("Abortado por usuario", 'INFO')
        sys.exit(0)

log("✅ Secret key válida", 'SUCCESS')
print()

# 2. Pedir NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
print("📝 2/3: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
print("   Obtener de: Developers → API keys → Publishable key")
print("   Formato: pk_live_51...")
print()

publishable_key = getpass.getpass("   Pegar aquí (input oculto): ")

valid, msg = validate_stripe_key(publishable_key, 'publishable')
if not valid:
    log(f"❌ {msg}", 'ERROR')
    sys.exit(1)

log("✅ Publishable key válida", 'SUCCESS')
print()

# 3. Pedir STRIPE_WEBHOOK_SECRET
print("📝 3/3: STRIPE_WEBHOOK_SECRET")
print("   Obtener de: Developers → Webhooks → [Tu webhook] → Signing secret")
print("   Formato: whsec_...")
print("   ⚠️ Si no has creado el webhook, hazlo primero:")
print("      URL: https://inmovaapp.com/api/webhooks/stripe")
print("      Eventos: payment_intent.*, charge.refunded")
print()

webhook_secret = getpass.getpass("   Pegar aquí (input oculto): ")

valid, msg = validate_stripe_key(webhook_secret, 'webhook')
if not valid:
    log(f"❌ {msg}", 'ERROR')
    sys.exit(1)

log("✅ Webhook secret válido", 'SUCCESS')
print()

# Confirmar configuración
print("=" * 80)
log("📋 RESUMEN DE CONFIGURACIÓN", 'INFO')
print("=" * 80)
print(f"Secret key: {secret_key[:15]}...{secret_key[-4:]}")
print(f"Publishable key: {publishable_key[:15]}...{publishable_key[-4:]}")
print(f"Webhook secret: {webhook_secret[:15]}...{webhook_secret[-4:]}")
print()

confirm = input("¿Confirmar y aplicar configuración? (S/n): ")
if confirm.lower() == 'n':
    log("Abortado por usuario", 'INFO')
    sys.exit(0)

# Conectar y configurar
log("\n🔐 Conectando al servidor...", 'INFO')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    log("✅ Conectado", 'SUCCESS')
    
    # Backup
    log("\n💾 Creando backup...", 'INFO')
    stdin, stdout, stderr = client.exec_command(
        f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.stripe.$(date +%Y%m%d_%H%M%S)"
    )
    stdout.channel.recv_exit_status()
    log("✅ Backup creado", 'SUCCESS')
    
    # Eliminar configuración antigua de Stripe (si existe)
    log("\n🧹 Limpiando configuración anterior...", 'INFO')
    stdin, stdout, stderr = client.exec_command(
        f"sed -i '/^STRIPE_/d' {APP_PATH}/.env.production && sed -i '/^NEXT_PUBLIC_STRIPE/d' {APP_PATH}/.env.production"
    )
    stdout.channel.recv_exit_status()
    
    # Añadir nueva configuración
    log("\n📝 Añadiendo configuración de Stripe...", 'INFO')
    
    config = f"""
# Stripe Configuration ({secret_key.split('_')[1].upper()} MODE)
STRIPE_SECRET_KEY={secret_key}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY={publishable_key}
STRIPE_WEBHOOK_SECRET={webhook_secret}
"""
    
    # Escapar caracteres especiales para el comando
    config_escaped = config.replace('$', '\\$').replace('"', '\\"')
    
    stdin, stdout, stderr = client.exec_command(
        f"echo '{config_escaped}' >> {APP_PATH}/.env.production"
    )
    stdout.channel.recv_exit_status()
    log("✅ Variables añadidas", 'SUCCESS')
    
    # Verificar configuración
    log("\n✅ Verificando configuración...", 'INFO')
    stdin, stdout, stderr = client.exec_command(
        f"grep -E 'STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|NEXT_PUBLIC_STRIPE' {APP_PATH}/.env.production | sed 's/=.*/=***CONFIGURED***/'"
    )
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(output)
    
    # Reiniciar PM2
    log("\n♻️ Reiniciando PM2...", 'INFO')
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_PATH} && pm2 restart inmova-app --update-env"
    )
    stdout.channel.recv_exit_status()
    log("✅ PM2 reiniciado", 'SUCCESS')
    
    # Esperar warm-up
    log("\n⏳ Esperando 15 segundos para warm-up...", 'INFO')
    time.sleep(15)
    
    # Test de webhook endpoint
    log("\n🧪 Testeando webhook endpoint...", 'INFO')
    stdin, stdout, stderr = client.exec_command(
        "curl -s -o /dev/null -w '%{http_code}' -X POST https://inmovaapp.com/api/webhooks/stripe -H 'Content-Type: application/json' -d '{}'"
    )
    stdout.channel.recv_exit_status()
    code = stdout.read().decode().strip()
    
    if code == "400":
        log("✅ Webhook endpoint respondiendo (400 = esperado sin firma)", 'SUCCESS')
    else:
        log(f"⚠️ Webhook endpoint responde {code} (esperado 400)", 'WARNING')
    
    client.close()
    
    # Resumen final
    print()
    print("=" * 80)
    log("✅ STRIPE CONFIGURADO EXITOSAMENTE EN PRODUCCIÓN", 'SUCCESS')
    print("=" * 80)
    print()
    log("📝 Próximos pasos:", 'INFO')
    print("   1. Test desde Stripe Dashboard:")
    print("      https://dashboard.stripe.com/webhooks")
    print("      → Tu webhook → Send test event → payment_intent.succeeded")
    print()
    print("   2. Ver logs en servidor:")
    print("      ssh root@157.180.119.236")
    print("      pm2 logs inmova-app | grep -i stripe")
    print()
    print("   3. Test de pago real (opcional):")
    print("      - Crear payment en la app")
    print("      - Verificar en Stripe Dashboard")
    print("      - Verificar webhook recibido")
    print()
    log(f"⚠️ MODO ACTUAL: {secret_key.split('_')[1].upper()} MODE", 'WARNING')
    if secret_key.startswith('sk_test'):
        print("   → Para producción real, cambiar a LIVE MODE keys")
    print()
    
except Exception as e:
    log(f"❌ Error: {e}", 'ERROR')
    import traceback
    traceback.print_exc()
    sys.exit(1)
