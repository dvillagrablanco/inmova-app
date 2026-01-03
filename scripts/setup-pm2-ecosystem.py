#!/usr/bin/env python3
"""Setup PM2 ecosystem para cargar .env.production"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

ecosystem_config = """module.exports = {
  apps: [{
    name: 'inmova-app',
    script: 'npm',
    args: 'run dev',
    cwd: '/opt/inmova-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env.production',
    env: {
      NODE_ENV: 'development'
    },
    error_file: '/var/log/inmova/pm2-error.log',
    out_file: '/var/log/inmova/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
"""

def exec_cmd(client, command, description=""):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    
    if output:
        print(output)
    
    return exit_status, output

print("⚙️  CONFIGURANDO PM2 ECOSYSTEM\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print("✅ Conectado\n")
    
    # 1. Crear ecosystem.config.js
    print("1️⃣  Creando ecosystem.config.js...")
    
    # Escapar caracteres especiales
    safe_config = ecosystem_config.replace("'", "'\\''")
    
    exec_cmd(
        client,
        f"cd {APP_PATH} && cat > ecosystem.config.js << 'EOF'\n{ecosystem_config}EOF",
        "Escribiendo archivo..."
    )
    
    # Verificar
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && cat ecosystem.config.js",
        "Verificando contenido..."
    )
    print()
    
    # 2. Crear directorio de logs
    print("2️⃣  Creando directorio de logs...")
    exec_cmd(client, "mkdir -p /var/log/inmova", "mkdir...")
    print()
    
    # 3. Delete PM2
    print("3️⃣  Deteniendo PM2...")
    exec_cmd(client, "pm2 delete all", "pm2 delete...")
    print()
    
    time.sleep(2)
    
    # 4. Start con ecosystem
    print("4️⃣  Iniciando con ecosystem...")
    exec_cmd(
        client,
        f"cd {APP_PATH} && pm2 start ecosystem.config.js",
        "pm2 start..."
    )
    print()
    
    # 5. Save
    exec_cmd(client, "pm2 save", "pm2 save...")
    print()
    
    print("⏳ Esperando 30 segundos para warm-up...")
    time.sleep(30)
    
    # 6. Verificar env vars
    print("\n5️⃣  Verificando variables de entorno...")
    exec_cmd(
        client,
        "pm2 show inmova-app | grep -A 20 'env:' | head -25",
        "PM2 show..."
    )
    print()
    
    # 7. Test endpoint
    print("6️⃣  Testeando webhook...")
    status, output = exec_cmd(
        client,
        "curl -s -X POST http://localhost:3000/api/webhooks/stripe -H 'Content-Type: application/json' -H 'stripe-signature: test' -d '{\"type\":\"payment_intent.succeeded\"}' 2>&1 | tail -5",
        "POST..."
    )
    print()
    
    # 8. Logs
    print("7️⃣  Logs recientes...")
    exec_cmd(
        client,
        "pm2 logs inmova-app --lines 10 --nostream 2>&1 | tail -15",
        "Logs..."
    )
    print()
    
    print("=" * 70)
    print("✅ PM2 ECOSYSTEM CONFIGURADO")
    print("=" * 70)
    print()
    print("📊 Archivos creados:")
    print("  - /opt/inmova-app/ecosystem.config.js")
    print("  - /var/log/inmova/pm2-out.log")
    print("  - /var/log/inmova/pm2-error.log")
    print()
    print("🧪 Test desde Stripe Dashboard:")
    print("  https://dashboard.stripe.com/test/webhooks")
    print()
    print("📋 Ver logs:")
    print("  tail -f /var/log/inmova/pm2-out.log")
    print("  pm2 logs inmova-app")
    print()
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
