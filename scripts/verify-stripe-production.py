#!/usr/bin/env python3
"""
Verificar configuración de Stripe en producción
Checks: Variables, webhook endpoint, test de pago
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def log(msg, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'SUCCESS': '\033[0;32m', 'ERROR': '\033[0;31m', 'WARNING': '\033[1;33m', 'STEP': '\033[1;35m'}
    print(f"{colors.get(level, '')}{level}\033[0m: {msg}")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

log("💳 VERIFICACIÓN DE STRIPE EN PRODUCCIÓN", 'STEP')
log("=" * 80)

checks_passed = 0
checks_total = 6

# 1. Verificar STRIPE_SECRET_KEY
log("\n1/6 STRIPE_SECRET_KEY...")
stdin, stdout, stderr = client.exec_command(
    f"grep -q 'STRIPE_SECRET_KEY' {APP_PATH}/.env.production && echo 'EXISTS' || echo 'NOT_FOUND'"
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()

if result == 'EXISTS':
    # Ver si es test o live key
    stdin, stdout, stderr = client.exec_command(
        f"grep 'STRIPE_SECRET_KEY' {APP_PATH}/.env.production | grep -o 'sk_[^=]*' | head -c 10"
    )
    stdout.channel.recv_exit_status()
    key_type = stdout.read().decode().strip()
    
    if 'sk_live' in key_type:
        log("   ✅ STRIPE_SECRET_KEY configurada (LIVE MODE)", 'SUCCESS')
        checks_passed += 1
    elif 'sk_test' in key_type:
        log("   ⚠️ STRIPE_SECRET_KEY en TEST MODE (cambiar a LIVE para producción)", 'WARNING')
        checks_passed += 0.5
    else:
        log("   ⚠️ STRIPE_SECRET_KEY configurada (no se pudo determinar mode)", 'WARNING')
else:
    log("   ❌ STRIPE_SECRET_KEY NO configurada", 'ERROR')

# 2. Verificar STRIPE_WEBHOOK_SECRET
log("\n2/6 STRIPE_WEBHOOK_SECRET...")
stdin, stdout, stderr = client.exec_command(
    f"grep -q 'STRIPE_WEBHOOK_SECRET' {APP_PATH}/.env.production && echo 'EXISTS' || echo 'NOT_FOUND'"
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()

if result == 'EXISTS':
    log("   ✅ STRIPE_WEBHOOK_SECRET configurado", 'SUCCESS')
    checks_passed += 1
else:
    log("   ❌ STRIPE_WEBHOOK_SECRET NO configurado", 'ERROR')
    log("      → Obtener de: https://dashboard.stripe.com/webhooks", 'INFO')

# 3. Verificar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
log("\n3/6 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY...")
stdin, stdout, stderr = client.exec_command(
    f"grep -q 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' {APP_PATH}/.env.production && echo 'EXISTS' || echo 'NOT_FOUND'"
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()

if result == 'EXISTS':
    log("   ✅ Publishable key configurada", 'SUCCESS')
    checks_passed += 1
else:
    log("   ❌ Publishable key NO configurada", 'ERROR')

# 4. Test de webhook endpoint
log("\n4/6 Webhook endpoint accesible...")
stdin, stdout, stderr = client.exec_command(
    "curl -s -o /dev/null -w '%{http_code}' -X POST https://inmovaapp.com/api/webhooks/stripe -H 'Content-Type: application/json' -d '{}'"
)
stdout.channel.recv_exit_status()
code = stdout.read().decode().strip()

if code == "400":
    log("   ✅ Webhook endpoint accesible (400 = esperado sin firma válida)", 'SUCCESS')
    checks_passed += 1
elif code == "200":
    log("   ⚠️ Webhook endpoint responde 200 (debería validar firma)", 'WARNING')
    checks_passed += 0.5
else:
    log(f"   ❌ Webhook endpoint error ({code})", 'ERROR')

# 5. Verificar que Stripe está instalado
log("\n5/6 Stripe package instalado...")
stdin, stdout, stderr = client.exec_command(
    f"cd {APP_PATH} && npm list stripe 2>/dev/null | grep -q stripe && echo 'INSTALLED' || echo 'NOT_INSTALLED'"
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()

if 'INSTALLED' in result:
    log("   ✅ Stripe package instalado", 'SUCCESS')
    checks_passed += 1
else:
    log("   ❌ Stripe package NO instalado", 'ERROR')

# 6. Test de health de Stripe API
log("\n6/6 Conectividad con Stripe API...")
stdin, stdout, stderr = client.exec_command(
    f"curl -s -u $(grep STRIPE_SECRET_KEY {APP_PATH}/.env.production | cut -d'=' -f2): https://api.stripe.com/v1/balance | grep -q 'object' && echo 'OK' || echo 'FAIL'",
    timeout=10
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()

if 'OK' in result:
    log("   ✅ Stripe API responde correctamente", 'SUCCESS')
    checks_passed += 1
else:
    log("   ⚠️ No se pudo verificar Stripe API (puede ser API key inválida)", 'WARNING')

client.close()

log("\n" + "=" * 80)
log(f"Verificación: {checks_passed}/{checks_total} checks pasando")

if checks_passed >= 5:
    log("✅ STRIPE CONFIGURADO CORRECTAMENTE", 'SUCCESS')
    log("")
    log("📝 Próximos pasos:")
    log("   1. Verificar webhook en Dashboard Stripe:")
    log("      https://dashboard.stripe.com/webhooks")
    log("      URL: https://inmovaapp.com/api/webhooks/stripe")
    log("      Eventos: payment_intent.*, charge.refunded")
    log("")
    log("   2. Test de pago real ($1):")
    log("      - Ir a la app y crear un pago")
    log("      - Usar tarjeta: 4242 4242 4242 4242 (test)")
    log("      - Verificar en Stripe Dashboard que aparece")
    log("")
    log("   3. Si está en TEST MODE:")
    log("      - Cambiar a LIVE MODE en Stripe Dashboard")
    log("      - Actualizar STRIPE_SECRET_KEY=sk_live_...")
    log("      - Actualizar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...")
    log("      - pm2 restart inmova-app --update-env")
elif checks_passed >= 3:
    log("⚠️ STRIPE PARCIALMENTE CONFIGURADO", 'WARNING')
    log("Completar configuración antes de aceptar pagos reales")
else:
    log("❌ STRIPE NO CONFIGURADO CORRECTAMENTE", 'ERROR')
    log("Revisar variables de entorno y configuración")
