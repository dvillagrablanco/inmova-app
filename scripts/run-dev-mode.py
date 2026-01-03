#!/usr/bin/env python3
"""
Ejecutar en modo Development - Next.js dev server
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko
import time

SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

DB_URL = "postgresql://inmova_user:inmova123@localhost:5432/inmova_production"
NEXTAUTH_SECRET = "ca1f50f0101dff24895a920c37f5b56eb3e80a88b708d1e89f761f8c9c8e4d33"

def run_cmd(client, cmd, timeout=120):
    """Execute command and return output"""
    print(f"  → {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    status = '✅' if exit_status == 0 else '⚠️'
    print(f"  {status} Exit {exit_status}")
    
    return exit_status == 0, out, err

print("\n🔧 EJECUTAR EN MODO DEVELOPMENT\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. CREAR ECOSYSTEM PARA DEV MODE
# ============================================================================
print("=== 1. CONFIGURAR ECOSYSTEM PARA DEV MODE ===")

ecosystem_dev = f"""module.exports = {{
  apps: [{{
    name: 'inmova-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'dev',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '2G',
    env: {{
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: '{DB_URL}',
      NEXTAUTH_URL: 'https://inmovaapp.com',
      NEXTAUTH_SECRET: '{NEXTAUTH_SECRET}'
    }}
  }}]
}}
"""

cmd = f"cd {PATH} && cat > ecosystem.config.js << 'EOFCONFIG'\n{ecosystem_dev}\nEOFCONFIG"
success, out, err = run_cmd(client, cmd)
print("  ✅ ecosystem.config.js configurado para development\n")

# ============================================================================
# 2. DETENER PM2 ACTUAL
# ============================================================================
print("=== 2. DETENER PM2 ===")
run_cmd(client, "pm2 delete inmova-app || true")
run_cmd(client, "pm2 kill")
time.sleep(3)

# ============================================================================
# 3. INICIAR EN DEV MODE
# ============================================================================
print("\n=== 3. INICIAR EN DEV MODE ===")
print("  🚀 Iniciando 'next dev'...")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && pm2 start ecosystem.config.js"
)

if success:
    print("  ✅ PM2 iniciado")

run_cmd(client, "pm2 save")

print("\n  ⏳ Esperando 45s para que Next.js dev compile...")
time.sleep(45)

# ============================================================================
# 4. VERIFICAR PM2 STATUS
# ============================================================================
print("\n=== 4. VERIFICAR PM2 STATUS ===")
success, out, err = run_cmd(client, "pm2 status inmova-app")

if 'online' in out:
    print("  ✅ PM2 online")
elif 'errored' in out or 'stopped' in out:
    print("  ❌ PM2 errored/stopped")
    print("\n  Ver logs de error:")
    success, out, err = run_cmd(client, "pm2 logs inmova-app --err --nostream --lines 20")
    if out:
        for line in out.split('\n')[-20:]:
            if line.strip():
                print(f"    {line}")
else:
    print("  ⚠️ PM2 status desconocido")
    print(out[:500])

# ============================================================================
# 5. VERIFICAR PUERTO
# ============================================================================
print("\n=== 5. VERIFICAR PUERTO 3000 ===")
for i in range(3):
    success, out, err = run_cmd(client, "ss -tlnp | grep :3000")
    if success and ':3000' in out:
        print("  ✅ Puerto 3000 listening")
        break
    elif i < 2:
        print(f"  ⏳ Intento {i+1}/3 - esperando 10s...")
        time.sleep(10)
    else:
        print("  ❌ Puerto 3000 no responde después de 3 intentos")

# ============================================================================
# 6. TEST HEALTH CHECK
# ============================================================================
print("\n=== 6. TEST HEALTH CHECK ===")
for i in range(5):
    success, out, err = run_cmd(
        client,
        "curl -s http://localhost:3000/api/health"
    )
    
    if success and 'ok' in out.lower():
        print(f"  ✅ Health check OK: {out[:100]}")
        break
    elif i < 4:
        print(f"  ⏳ Intento {i+1}/5 - esperando 10s...")
        time.sleep(10)
    else:
        print("  ⚠️ Health check no responde después de 5 intentos")
        print(f"    Response: {out[:200]}")

# ============================================================================
# 7. TEST LOGIN PAGE
# ============================================================================
print("\n=== 7. TEST LOGIN PAGE ===")
success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login"
)
if '200' in out:
    print("  ✅ Login page: 200 OK")
else:
    print(f"  ⚠️ Login page: {out}")

# ============================================================================
# 8. MOSTRAR LOGS
# ============================================================================
print("\n=== 8. LOGS PM2 (ÚLTIMAS 20 LÍNEAS) ===")
success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 20")
if out:
    print()
    for line in out.split('\n')[-20:]:
        if line.strip():
            # Resaltar líneas importantes
            if 'ready' in line.lower() or 'compiled' in line.lower():
                print(f"  ✅ {line}")
            elif 'error' in line.lower():
                print(f"  ❌ {line}")
            else:
                print(f"  {line}")

print("\n" + "="*70)
print("✅ APLICACIÓN EN MODO DEVELOPMENT")
print("="*70)

print("\nℹ️ La aplicación está corriendo en modo development.")
print("Esto es útil para debugging pero más lento que production.\n")

print("🌐 URLs:")
print("  → https://inmovaapp.com")
print("  → https://inmovaapp.com/login")
print(f"  → http://{SERVER}:3000\n")

print("📝 Credenciales de Test:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("🔍 Comandos útiles:")
print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app --lines 100'")
print(f"  ssh {USER}@{SERVER} 'pm2 monit'")
print(f"  ssh {USER}@{SERVER} 'pm2 restart inmova-app'\n")

print("⚠️ NOTA:")
print("  Para cambiar a modo production, necesitas:")
print("  1. Corregir errores de build")
print("  2. Hacer 'npm run build' exitoso")
print("  3. Cambiar ecosystem.config.js a usar 'next start'")
print("  4. pm2 restart inmova-app\n")

client.close()
print("✅ Script completado\n")
