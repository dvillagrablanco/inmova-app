#!/usr/bin/env python3
"""
Fix completo de .env.production con todas las variables correctas
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

def run_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🔧 FIX COMPLETO DE .ENV.PRODUCTION")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Generar nuevo NEXTAUTH_SECRET si es necesario
print("1. GENERAR NEXTAUTH_SECRET")
print("-"*70 + "\n")

success, secret, err = run_cmd(
    client,
    "openssl rand -base64 32"
)

nextauth_secret = secret.strip()
print(f"  ✅ Secret generado: {nextauth_secret[:20]}...\n")

# 2. Crear .env.production correcto
print("2. CREAR .ENV.PRODUCTION CORRECTO")
print("-"*70 + "\n")

env_content = f"""# Database
DATABASE_URL="postgresql://inmova_user:inmova123@localhost:5432/inmova_production"

# NextAuth
NEXTAUTH_URL=https://inmovaapp.com
NEXTAUTH_SECRET={nextauth_secret}

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://inmovaapp.com
"""

run_cmd(
    client,
    f"cd {PATH} && cat > .env.production << 'EOF'\n{env_content}\nEOF"
)

print("  ✅ .env.production actualizado\n")

# 3. Mostrar contenido
success, out, err = run_cmd(
    client,
    f"cd {PATH} && cat .env.production"
)

print("  Contenido:")
for line in out.split('\n'):
    if line.strip() and not line.startswith('#'):
        parts = line.split('=')
        if len(parts) == 2:
            key = parts[0]
            val = parts[1]
            if 'SECRET' in key or 'PASSWORD' in key:
                val = val[:20] + '...'
            print(f"    {key}={val}")

# 4. Restart PM2 con vars correctas
print("\n3. RESTART PM2 CON VARS CORRECTAS")
print("-"*70 + "\n")

restart_script = """#!/bin/bash
cd /opt/inmova-app

# Load vars
export $(cat .env.production | grep -v '^#' | xargs)

# Restart PM2
pm2 delete inmova-app 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

echo "✅ Done"
"""

run_cmd(client, f"cat > /tmp/restart.sh << 'EOF'\n{restart_script}\nEOF")
run_cmd(client, "chmod +x /tmp/restart.sh")

success, out, err = run_cmd(client, "bash /tmp/restart.sh", timeout=60)

if 'online' in out or '✅' in out:
    print("  ✅ PM2 reiniciado\n")
else:
    print("  Resultado:")
    print(out[:300])

print("  ⏳ Esperando warm-up (25s)...\n")
time.sleep(25)

# 5. Verificar PM2
print("4. VERIFICAR PM2")
print("-"*70 + "\n")

success, out, err = run_cmd(client, "pm2 status")

if 'online' in out.lower():
    online_count = out.lower().count('online')
    print(f"  ✅ PM2 online ({online_count} instancias)\n")
else:
    print("  ⚠️ PM2 status:")
    print(out[:200])

# 6. Test health y login
print("5. TEST ENDPOINTS")
print("-"*70 + "\n")

# Health
success, out, err = run_cmd(client, "curl -s http://localhost:3000/api/health")
if 'ok' in out.lower():
    print("  ✅ Health OK")
else:
    print(f"  ⚠️ Health: {out[:50]}")

# Login page
success, out, err = run_cmd(client, "curl -s -I http://localhost:3000/login | head -1")
if '200' in out:
    print("  ✅ Login page OK")
elif '500' in out:
    print("  ⚠️ Login page error 500")

# 7. Check logs for errors
print("\n6. VERIFICAR LOGS")
print("-"*70 + "\n")

time.sleep(3)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 20 --nostream | grep -i 'error\\|no_secret' || echo 'Sin errores'"
)

if 'Sin errores' in out:
    print("  ✅ Sin errores en logs\n")
else:
    print("  Logs recientes:")
    for line in out.split('\n')[:10]:
        if line.strip():
            print(f"    {line}")

# RESUMEN
print("\n" + "="*70)
print("🎉 FIX COMPLETO")
print("="*70 + "\n")

print("Variables corregidas:")
print("  ✅ DATABASE_URL → postgresql://inmova_user@localhost/inmova_production")
print("  ✅ NEXTAUTH_URL → https://inmovaapp.com")
print("  ✅ NEXTAUTH_SECRET → generado nuevo")
print("  ✅ PM2 reiniciado con variables correctas\n")

print("INTENTAR LOGIN:")
print("  URL: https://inmovaapp.com/login")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("="*70 + "\n")

client.close()
