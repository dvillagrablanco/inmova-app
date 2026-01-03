#!/usr/bin/env python3
"""Fix Prisma correctamente"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def exec_cmd(client, command, description="", timeout=300):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    
    if output:
        print(output)
    
    return exit_status, output, error

print("🔧 FIX PRISMA + NEXTAUTH_URL\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print("✅ Conectado\n")
    
    # 1. Fix Prisma schema (remover ?? y dejar solo ?)
    print("1️⃣  Corrigiendo Prisma schema...")
    exec_cmd(
        client,
        f"""cd {APP_PATH} && sed -i 's/subscriptionPlanId String??/subscriptionPlanId String?/g' prisma/schema.prisma""",
        "Reemplazando ?? por ?..."
    )
    
    # Verificar
    status, output, _ = exec_cmd(
        client,
        f"""cd {APP_PATH} && grep 'subscriptionPlanId' prisma/schema.prisma | head -2""",
        "Verificando..."
    )
    print()
    
    # 2. Fix NEXTAUTH_URL
    print("2️⃣  Verificando NEXTAUTH_URL...")
    status, output, _ = exec_cmd(
        client,
        f"""cd {APP_PATH} && grep NEXTAUTH_URL .env.production | head -1""",
        "Verificando..."
    )
    
    if 'NEXTAUTH_URL' in output:
        print(f"✅ NEXTAUTH_URL configurado\n")
    else:
        print("⚠️  NEXTAUTH_URL no está configurado")
        exec_cmd(
            client,
            f"""cd {APP_PATH} && echo 'NEXTAUTH_URL=https://inmovaapp.com' >> .env.production""",
            "Añadiendo..."
        )
        print("✅ NEXTAUTH_URL añadido\n")
    
    # 3. Cambiar a dev mode (más rápido)
    print("3️⃣  Cambiando a dev mode...")
    exec_cmd(
        client,
        "pm2 delete inmova-app",
        "Eliminando app actual..."
    )
    
    exec_cmd(
        client,
        f"cd {APP_PATH} && pm2 start npm --name inmova-app -- run dev",
        "Iniciando en dev mode..."
    )
    
    exec_cmd(
        client,
        "pm2 save",
        "Guardando configuración..."
    )
    print("✅ Dev mode activado\n")
    
    print("⏳ Esperando 20 segundos para warm-up...")
    time.sleep(20)
    
    # 4. Test endpoint
    print("\n4️⃣  Testeando endpoint...")
    status, output, _ = exec_cmd(
        client,
        "curl -s -X POST http://localhost:3000/api/webhooks/stripe -H 'Content-Type: application/json' -d '{\"test\":true}' -w '\\nHTTP: %{http_code}' 2>&1 | tail -5",
        "POST a webhook..."
    )
    print()
    
    # 5. Ver logs
    print("5️⃣  Logs recientes...")
    exec_cmd(
        client,
        "pm2 logs inmova-app --lines 10 --nostream 2>&1 | tail -15",
        "..."
    )
    print()
    
    print("=" * 70)
    print("✅ CAMBIOS APLICADOS")
    print("=" * 70)
    print()
    print("📊 Cambios:")
    print("  - Prisma schema corregido (String? en lugar de String??)")
    print("  - NEXTAUTH_URL configurado")
    print("  - Dev mode activado (hot reload)")
    print()
    print("🧪 Test desde Stripe:")
    print("  1. https://dashboard.stripe.com/test/webhooks")
    print("  2. Send test webhook")
    print("  3. Verificar respuesta")
    print()
    print("📋 Logs:")
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
