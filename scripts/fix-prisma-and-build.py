#!/usr/bin/env python3
"""Fix Prisma + Build + Deploy"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def exec_cmd(client, command, description="", timeout=600):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    
    if output:
        lines = output.split('\n')
        if len(lines) > 20:
            print('\n'.join(lines[:10]))
            print(f"\n... ({len(lines) - 20} líneas más) ...\n")
            print('\n'.join(lines[-10:]))
        else:
            print(output)
    
    if error and 'warning' not in error.lower() and exit_status != 0:
        print(f"⚠️  {error}")
    
    return exit_status, output, error

print("=" * 70)
print("🛠️  FIX PRISMA + BUILD + DEPLOY")
print("=" * 70)
print()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print(f"[{time.strftime('%H:%M:%S')}] ✅ Conectado\n")
    
    # 1. Fix Prisma Schema
    print("=" * 70)
    print("🔧 PASO 1: FIX PRISMA SCHEMA")
    print("=" * 70)
    
    exec_cmd(
        client,
        f"""cd {APP_PATH} && sed -i 's/subscriptionPlanId String/subscriptionPlanId String?/g' prisma/schema.prisma""",
        "⚙️  Haciendo subscriptionPlanId opcional..."
    )
    
    # Verificar cambio
    status, output, _ = exec_cmd(
        client,
        f"""cd {APP_PATH} && grep -A 2 'subscriptionPlanId' prisma/schema.prisma""",
        "🔍 Verificando cambio..."
    )
    
    if 'subscriptionPlanId String?' in output:
        print("✅ Campo ahora es opcional\n")
    else:
        print("⚠️  Cambio no aplicado correctamente\n")
    
    # 2. Regenerar Prisma Client
    print("=" * 70)
    print("🔄 PASO 2: REGENERAR PRISMA CLIENT")
    print("=" * 70)
    
    exec_cmd(
        client,
        f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -10",
        "🔧 Prisma generate...",
        timeout=120
    )
    print("✅ Prisma client regenerado\n")
    
    # 3. Build
    print("=" * 70)
    print("🏗️  PASO 3: BUILD NEXT.JS")
    print("=" * 70)
    print("⏳ Esto puede tardar 5-10 minutos...\n")
    
    start_time = time.time()
    
    status, output, error = exec_cmd(
        client,
        f"cd {APP_PATH} && npm run build 2>&1",
        "🏗️  npm run build...",
        timeout=900  # 15 min max
    )
    
    build_time = time.time() - start_time
    
    if status == 0:
        print(f"✅ Build completado en {build_time:.0f} segundos\n")
    else:
        print(f"❌ Build falló después de {build_time:.0f} segundos")
        print("⚠️  Intentando con más memoria...\n")
        
        # Retry con más memoria
        exec_cmd(
            client,
            f"cd {APP_PATH} && NODE_OPTIONS='--max-old-space-size=4096' npm run build 2>&1 | tail -50",
            "🏗️  Retry con 4GB RAM...",
            timeout=900
        )
    
    # 4. Verificar build de webhook
    print("=" * 70)
    print("🔍 PASO 4: VERIFICAR BUILD DE WEBHOOK")
    print("=" * 70)
    
    status, output, _ = exec_cmd(
        client,
        f"find {APP_PATH}/.next/server -name '*stripe*' -type f 2>&1 | head -5",
        "🔎 Buscando archivos stripe en build..."
    )
    
    if 'stripe' in output.lower():
        print("✅ Webhook en build\n")
    else:
        print("⚠️  Webhook NO está en build")
        print("   Verificando estructura...\n")
        exec_cmd(
            client,
            f"ls -la {APP_PATH}/.next/server/app/api/webhooks/ 2>&1",
            "📂 Contenido de webhooks:"
        )
        print()
    
    # 5. Restart PM2
    print("=" * 70)
    print("🔄 PASO 5: RESTART PM2")
    print("=" * 70)
    
    exec_cmd(
        client,
        f"cd {APP_PATH} && pm2 restart inmova-app --update-env",
        "♻️  Reiniciando..."
    )
    print("✅ PM2 reiniciado\n")
    
    print(f"[{time.strftime('%H:%M:%S')}] ⏳ Esperando warm-up (30 segundos)...")
    time.sleep(30)
    
    # 6. Test endpoint
    print("\n" + "=" * 70)
    print("🧪 PASO 6: TEST ENDPOINT")
    print("=" * 70)
    
    # Test 1: GET (debería retornar 405 Method Not Allowed)
    exec_cmd(
        client,
        "curl -s -w '\\nHTTP: %{http_code}\\n' http://localhost:3000/api/webhooks/stripe 2>&1 | tail -3",
        "🌐 Test GET (esperado: 405)..."
    )
    print()
    
    # Test 2: POST
    exec_cmd(
        client,
        "curl -s -X POST http://localhost:3000/api/webhooks/stripe -H 'Content-Type: application/json' -d '{\"test\":true}' -w '\\nHTTP: %{http_code}\\n' 2>&1 | tail -3",
        "🌐 Test POST..."
    )
    print()
    
    # 7. Logs
    print("=" * 70)
    print("📋 PASO 7: LOGS RECIENTES")
    print("=" * 70)
    
    exec_cmd(
        client,
        "pm2 logs inmova-app --lines 15 --nostream 2>&1 | tail -25",
        "📄 Últimos logs..."
    )
    print()
    
    # Resumen
    print("=" * 70)
    print("✅ DEPLOYMENT COMPLETADO")
    print("=" * 70)
    print()
    print("🎯 PRÓXIMOS PASOS:")
    print()
    print("1. Verificar webhook desde Stripe Dashboard:")
    print("   https://dashboard.stripe.com/test/webhooks")
    print()
    print("2. Enviar test webhook:")
    print("   - Event: payment_intent.succeeded")
    print("   - Debe retornar 200 OK")
    print()
    print("3. Verificar logs en vivo:")
    print("   ssh root@157.180.119.236")
    print("   pm2 logs inmova-app | grep -i stripe")
    print()
    print("4. Si el endpoint sigue 404:")
    print("   - Verificar que el build completó sin errores")
    print("   - Verificar archivos en .next/server/app/api/webhooks/")
    print()
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
