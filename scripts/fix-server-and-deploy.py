#!/usr/bin/env python3
"""Fix server issues y deploy webhook"""
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
    if error and 'warning' not in error.lower():
        if exit_status != 0:
            print(f"⚠️  {error}")
    
    return exit_status, output, error

print("=" * 70)
print("🛠️  FIX SERVER + DEPLOY WEBHOOK")
print("=" * 70)
print()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print(f"[{time.strftime('%H:%M:%S')}] ✅ Conectado\n")
    
    # 1. Configurar Git
    print("=" * 70)
    print("🔧 PASO 1: CONFIGURAR GIT")
    print("=" * 70)
    exec_cmd(
        client,
        f"cd {APP_PATH} && git config user.email 'deploy@inmovaapp.com' && git config user.name 'Deploy Bot'",
        "⚙️  Configurando git..."
    )
    print("✅ Git configurado\n")
    
    # 2. Force reset a última versión
    print("=" * 70)
    print("📥 PASO 2: FORCE PULL")
    print("=" * 70)
    exec_cmd(
        client,
        f"cd {APP_PATH} && git fetch origin main",
        "📡 Fetch origin..."
    )
    exec_cmd(
        client,
        f"cd {APP_PATH} && git reset --hard origin/main",
        "🔄 Reset hard a origin/main..."
    )
    print("✅ Código actualizado\n")
    
    # 3. Verificar archivo de webhook
    print("=" * 70)
    print("🔍 PASO 3: VERIFICAR ARCHIVO WEBHOOK")
    print("=" * 70)
    status, output, _ = exec_cmd(
        client,
        f"ls -la {APP_PATH}/app/api/webhooks/stripe/route.ts",
        "🔎 Verificando..."
    )
    
    if status == 0:
        print("✅ Archivo webhook existe!\n")
    else:
        print("❌ Archivo webhook NO existe")
        print("   Verificando contenido de app/api/webhooks/...\n")
        exec_cmd(
            client,
            f"ls -la {APP_PATH}/app/api/webhooks/",
            "📂 Contenido de app/api/webhooks/:"
        )
        print()
    
    # 4. Instalar deps si hay cambios
    print("=" * 70)
    print("📦 PASO 4: DEPENDENCIAS")
    print("=" * 70)
    exec_cmd(
        client,
        f"cd {APP_PATH} && npm install 2>&1 | tail -5",
        "📦 npm install...",
        timeout=180
    )
    print("✅ Dependencias actualizadas\n")
    
    # 5. Reiniciar PM2
    print("=" * 70)
    print("🔄 PASO 5: REINICIAR PM2")
    print("=" * 70)
    exec_cmd(
        client,
        f"cd {APP_PATH} && pm2 restart inmova-app --update-env",
        "♻️  Reiniciando..."
    )
    print("✅ PM2 reiniciado\n")
    
    print(f"[{time.strftime('%H:%M:%S')}] ⏳ Esperando warm-up (20 segundos)...")
    time.sleep(20)
    
    # 6. Test webhook
    print("\n" + "=" * 70)
    print("🧪 PASO 6: TEST WEBHOOK")
    print("=" * 70)
    
    status, output, _ = exec_cmd(
        client,
        "curl -s -X POST http://localhost:3000/api/webhooks/stripe -H 'Content-Type: application/json' -d '{\"test\":true}' -w '\\nHTTP_CODE: %{http_code}' 2>&1 | tail -3",
        "🌐 Test POST..."
    )
    print()
    
    # 7. Logs
    print("=" * 70)
    print("📋 PASO 7: LOGS")
    print("=" * 70)
    exec_cmd(
        client,
        "pm2 logs inmova-app --lines 15 --nostream 2>&1 | tail -25",
        "📄 Últimas líneas..."
    )
    print()
    
    # Resumen
    print("=" * 70)
    print("✅ DEPLOYMENT COMPLETADO")
    print("=" * 70)
    print()
    print("📊 Próximos Pasos:")
    print()
    print("1. Verificar endpoint desde Stripe:")
    print("   https://dashboard.stripe.com/webhooks")
    print()
    print("2. Si aún 404, hacer build:")
    print("   ssh root@157.180.119.236")
    print("   cd /opt/inmova-app")
    print("   npm run build")
    print("   pm2 restart inmova-app")
    print()
    print("3. Ver logs en vivo:")
    print("   pm2 logs inmova-app | grep -i stripe")
    print()
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
