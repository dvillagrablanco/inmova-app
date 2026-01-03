#!/usr/bin/env python3
"""Full restart de PM2 para cargar env vars"""
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

print("🔄 FULL RESTART PM2\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print("✅ Conectado\n")
    
    # 1. Delete PM2 app
    print("1️⃣  Eliminando app...")
    exec_cmd(client, "pm2 delete inmova-app", "pm2 delete...")
    print()
    
    # 2. Kill PM2 daemon para forzar reload completo
    print("2️⃣  Matando daemon PM2...")
    exec_cmd(client, "pm2 kill", "pm2 kill...")
    print()
    
    time.sleep(3)
    
    # 3. Reiniciar con new env
    print("3️⃣  Reiniciando con dev mode...")
    exec_cmd(
        client,
        f"cd {APP_PATH} && pm2 start npm --name inmova-app -- run dev",
        "pm2 start..."
    )
    print()
    
    # 4. Save
    exec_cmd(client, "pm2 save", "pm2 save...")
    print()
    
    print("⏳ Esperando 25 segundos para warm-up completo...")
    time.sleep(25)
    
    # 5. Verificar env vars están cargadas
    print("\n4️⃣  Verificando variables de entorno...")
    exec_cmd(
        client,
        "pm2 env 0 | grep -E '(STRIPE|NEXTAUTH)' | head -10",
        "PM2 env vars:"
    )
    print()
    
    # 6. Test endpoint
    print("5️⃣  Testeando webhook...")
    status, output = exec_cmd(
        client,
        "curl -s -X POST http://localhost:3000/api/webhooks/stripe -H 'Content-Type: application/json' -H 'stripe-signature: test' -d '{\"type\":\"payment_intent.succeeded\"}' -w '\\nHTTP: %{http_code}' 2>&1 | tail -10",
        "POST a webhook..."
    )
    print()
    
    # 7. Logs
    print("6️⃣  Logs recientes...")
    exec_cmd(
        client,
        "pm2 logs inmova-app --lines 15 --nostream 2>&1 | tail -20",
        "Últimos logs..."
    )
    print()
    
    print("=" * 70)
    print("✅ PM2 REINICIADO COMPLETAMENTE")
    print("=" * 70)
    print()
    print("🧪 Test desde Stripe Dashboard:")
    print("  https://dashboard.stripe.com/test/webhooks")
    print()
    print("📋 Logs en vivo:")
    print("  pm2 logs inmova-app | grep -i stripe")
    print()
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
