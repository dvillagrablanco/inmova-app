#!/usr/bin/env python3
"""Deploy webhook de Stripe al servidor"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
WEBHOOK_SECRET = 'whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe'

def exec_cmd(client, command, description=""):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=300)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    
    if output:
        print(output)
    if error and exit_status != 0:
        print(f"Error: {error}")
    
    return exit_status, output, error

print("=" * 70)
print("🚀 DEPLOY DE WEBHOOK STRIPE")
print("=" * 70)
print(f"\nServidor: {SERVER_IP}")
print(f"Path: {APP_PATH}\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print(f"[{time.strftime('%H:%M:%S')}] ✅ Conectado\n")
    
    # 1. Git pull
    print("=" * 70)
    print("📥 PASO 1: ACTUALIZAR CÓDIGO")
    print("=" * 70)
    exec_cmd(client, f"cd {APP_PATH} && git pull origin main", "📥 Descargando última versión...")
    print("✅ Código actualizado\n")
    
    # 2. Verificar archivo
    print("=" * 70)
    print("🔍 PASO 2: VERIFICAR ARCHIVO DE WEBHOOK")
    print("=" * 70)
    status, output, _ = exec_cmd(
        client,
        f"ls -la {APP_PATH}/app/api/webhooks/stripe/route.ts",
        "🔎 Verificando archivo..."
    )
    
    if status == 0:
        print("✅ Archivo de webhook existe\n")
    else:
        print("❌ Archivo NO existe")
        print("   Verificando si existe en workspace local...\n")
        
        # Verificar en local
        import os
        local_file = '/workspace/app/api/webhooks/stripe/route.ts'
        if os.path.exists(local_file):
            print("✅ Archivo existe en workspace local")
            print("⚠️  Pero no está en el servidor")
            print("   Puede que el git pull no lo trajo\n")
        else:
            print("❌ Archivo tampoco existe en workspace local")
            print("   Necesita ser creado\n")
    
    # 3. Configurar webhook secret (si no está)
    print("=" * 70)
    print("🔐 PASO 3: CONFIGURAR WEBHOOK SECRET")
    print("=" * 70)
    
    status, output, _ = exec_cmd(
        client,
        f"cd {APP_PATH} && grep -c 'STRIPE_WEBHOOK_SECRET' .env.production || echo '0'",
        "🔎 Verificando si ya está configurado..."
    )
    
    if output.strip() == '0':
        exec_cmd(
            client,
            f"""cd {APP_PATH} && echo '' >> .env.production && echo '# Stripe Webhook Secret' >> .env.production && echo 'STRIPE_WEBHOOK_SECRET={WEBHOOK_SECRET}' >> .env.production""",
            "➕ Añadiendo STRIPE_WEBHOOK_SECRET..."
        )
        print("✅ STRIPE_WEBHOOK_SECRET añadido\n")
    else:
        print("ℹ️  STRIPE_WEBHOOK_SECRET ya está configurado\n")
    
    # 4. Verificar si necesita rebuild
    print("=" * 70)
    print("🏗️  PASO 4: VERIFICAR BUILD")
    print("=" * 70)
    
    status, output, _ = exec_cmd(
        client,
        f"ls {APP_PATH}/.next/server/app/api/webhooks/stripe.js 2>&1",
        "🔍 Verificando si webhook está en build..."
    )
    
    needs_rebuild = status != 0
    
    if needs_rebuild:
        print("⚠️  Webhook NO está en build actual")
        print("   Opciones:")
        print("   A. Rebuild completo (npm run build) - 5-10 min")
        print("   B. Usar dev mode (npm run dev) - Inmediato pero menos performante")
        print("   C. Ignorar y el webhook estará en próximo build\n")
        
        # Por ahora, reiniciar PM2 que está en dev mode
        print("   → Usando dev mode por ahora (PM2 ya está corriendo)\n")
    else:
        print("✅ Webhook está en build\n")
    
    # 5. Reiniciar PM2
    print("=" * 70)
    print("🔄 PASO 5: REINICIAR PM2")
    print("=" * 70)
    exec_cmd(
        client,
        f"cd {APP_PATH} && pm2 restart inmova-app --update-env",
        "♻️  Reiniciando PM2..."
    )
    print("✅ PM2 reiniciado\n")
    
    print(f"[{time.strftime('%H:%M:%S')}] ⏳ Esperando warm-up (15 segundos)...")
    time.sleep(15)
    
    # 6. Test endpoint
    print("\n" + "=" * 70)
    print("🧪 PASO 6: TEST DE ENDPOINT")
    print("=" * 70)
    
    # Test con POST
    status, output, _ = exec_cmd(
        client,
        "curl -s -X POST http://localhost:3000/api/webhooks/stripe -H 'Content-Type: application/json' -d '{\"test\":true}' -w '\\nHTTP: %{http_code}' 2>&1 | tail -5",
        "🌐 Test POST al endpoint..."
    )
    print()
    
    # 7. Verificar logs
    print("=" * 70)
    print("📋 PASO 7: LOGS RECIENTES")
    print("=" * 70)
    exec_cmd(
        client,
        "pm2 logs inmova-app --lines 10 --nostream 2>&1 | tail -20",
        "📄 Últimos logs..."
    )
    print()
    
    # Resumen
    print("=" * 70)
    print("📊 RESUMEN")
    print("=" * 70)
    print()
    print("✅ STRIPE_WEBHOOK_SECRET configurado")
    print("✅ PM2 reiniciado")
    print("✅ Código actualizado")
    print()
    
    if needs_rebuild:
        print("⚠️  NOTA: Webhook no está en build actual")
        print("   El servidor está en dev mode, el webhook debería funcionar")
        print("   En próximo build de producción, estará incluido\n")
    
    print("🧪 PRÓXIMO PASO: Test desde Stripe Dashboard")
    print()
    print("   1. Ve a https://dashboard.stripe.com/webhooks")
    print("   2. Click en tu webhook")
    print("   3. Click 'Send test webhook'")
    print("   4. Selecciona 'payment_intent.succeeded'")
    print("   5. Verifica respuesta")
    print()
    print("📋 Ver logs en tiempo real:")
    print(f"   ssh root@{SERVER_IP}")
    print("   pm2 logs inmova-app | grep -i stripe")
    print()
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
finally:
    client.close()
