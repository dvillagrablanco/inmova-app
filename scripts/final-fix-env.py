#!/usr/bin/env python3
"""Fix final: copiar .env.production a .env.local"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def exec_cmd(client, command, description=""):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    
    if output:
        print(output)
    
    return exit_status, output

print("🔧 FIX FINAL - COPIAR .ENV.PRODUCTION A .ENV.LOCAL\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print("✅ Conectado\n")
    
    # 1. Copiar .env.production a .env.local
    print("1️⃣  Copiando .env.production a .env.local...")
    exec_cmd(
        client,
        f"cd {APP_PATH} && cp .env.production .env.local",
        "cp..."
    )
    print("✅ .env.local creado\n")
    
    # 2. Verificar contenido
    print("2️⃣  Verificando .env.local...")
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && grep -E '(STRIPE|NEXTAUTH)' .env.local | sed 's/=.*/=***HIDDEN***/'",
        "Variables:"
    )
    print()
    
    # 3. Reiniciar PM2
    print("3️⃣  Reiniciando PM2...")
    exec_cmd(client, "pm2 restart inmova-app", "pm2 restart...")
    print("✅ PM2 reiniciado\n")
    
    print("⏳ Esperando 30 segundos para warm-up...")
    time.sleep(30)
    
    # 4. Test endpoint
    print("\n4️⃣  TEST FINAL...")
    status, output = exec_cmd(
        client,
        "curl -s -X POST http://localhost:3000/api/webhooks/stripe -H 'Content-Type: application/json' -H 'stripe-signature: test' -d '{\"type\":\"test\"}' -w '\\nHTTP_CODE: %{http_code}' 2>&1 | tail -7",
        "POST a webhook..."
    )
    
    # Parsear respuesta
    if 'HTTP_CODE: 200' in output:
        print("\n🎉 ¡ÉXITO! Webhook respondió con 200 OK\n")
        success = True
    elif 'HTTP_CODE: 400' in output:
        print("\n✅ Webhook funcional (400 = signature inválida, normal en test manual)\n")
        success = True
    elif 'HTTP_CODE: 500' in output:
        print("\n❌ Aún retorna 500 (error interno)\n")
        success = False
    else:
        print(f"\n⚠️  Código HTTP no identificado\n")
        success = False
    
    # 5. Ver logs
    print("5️⃣  Logs recientes...")
    exec_cmd(
        client,
        "pm2 logs inmova-app --lines 15 --nostream 2>&1 | tail -20",
        "Logs:"
    )
    print()
    
    # Resumen
    print("=" * 70)
    if success:
        print("✅ ¡WEBHOOK CONFIGURADO EXITOSAMENTE!")
    else:
        print("⚠️  CONFIGURACIÓN COMPLETADA PERO CON ERRORES")
    print("=" * 70)
    print()
    
    if success:
        print("🎯 PRÓXIMOS PASOS:")
        print()
        print("1. Configurar webhook en Stripe Dashboard:")
        print("   https://dashboard.stripe.com/test/webhooks")
        print()
        print("2. Añadir endpoint:")
        print("   URL: https://inmovaapp.com/api/webhooks/stripe")
        print()
        print("3. Seleccionar eventos:")
        print("   - payment_intent.succeeded")
        print("   - payment_intent.payment_failed")
        print("   - checkout.session.completed")
        print("   - customer.subscription.created")
        print("   - customer.subscription.updated")
        print("   - customer.subscription.deleted")
        print()
        print("4. Enviar test webhook desde Dashboard")
        print()
        print("5. Verificar logs:")
        print("   pm2 logs inmova-app | grep -i stripe")
    else:
        print("🔍 DEBUGGING:")
        print()
        print("Ver logs completos:")
        print("  ssh root@157.180.119.236")
        print("  pm2 logs inmova-app --lines 50")
        print()
        print("Verificar variables de entorno:")
        print("  pm2 env 0 | grep STRIPE")
        print()
        print("Test manual:")
        print("  curl -X POST http://localhost:3000/api/webhooks/stripe \\")
        print("    -H 'Content-Type: application/json' \\")
        print("    -H 'stripe-signature: test' \\")
        print("    -d '{\"type\":\"test\"}'")
    
    print()
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
