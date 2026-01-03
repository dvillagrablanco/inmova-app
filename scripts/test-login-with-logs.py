#!/usr/bin/env python3
"""
Test login con logs detallados
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko
import time
import json

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
print("🔍 TEST LOGIN CON LOGS DETALLADOS")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Deploy código actualizado
print("1. DEPLOY CÓDIGO CON LOGS")
print("-"*70 + "\n")

run_cmd(client, f"cd {PATH} && git pull origin main")
print("  ✅ Código actualizado")

run_cmd(client, f"cd {PATH} && pm2 restart inmova-app --update-env")
print("  ✅ PM2 restarted")

print("  ⏳ Esperando warm-up (15s)...\n")
time.sleep(15)

# 2. Limpiar logs de PM2
print("2. LIMPIAR LOGS")
print("-"*70 + "\n")

run_cmd(client, "pm2 flush")
print("  ✅ Logs limpiados\n")

time.sleep(2)

# 3. Test login
print("3. TEST LOGIN")
print("-"*70 + "\n")

run_cmd(client, "rm -f /tmp/*.txt")
time.sleep(1)

# GET login page
print("  [1/4] GET /login...")
run_cmd(client, "curl -s -c /tmp/login.txt 'http://localhost:3000/login' > /dev/null")
print("  ✅")
time.sleep(2)

# GET CSRF
print("\n  [2/4] GET /api/auth/csrf...")
success, out, err = run_cmd(client, "curl -s -b /tmp/login.txt 'http://localhost:3000/api/auth/csrf'")

try:
    csrf_data = json.loads(out)
    csrf_token = csrf_data.get('csrfToken')
    print(f"  ✅ CSRF: {csrf_token[:30]}...")
except:
    csrf_token = None
    print(f"  ❌ Error: {out[:80]}")

if not csrf_token:
    print("\n  ❌ No CSRF token - ABORTANDO\n")
    client.close()
    exit(1)

time.sleep(2)

# POST login
print("\n  [3/4] POST /api/auth/callback/credentials...")

login_data = f"csrfToken={csrf_token}&email=admin%40inmova.app&password=Admin123%21&callbackUrl=%2Fdashboard&json=true"

success, out, err = run_cmd(
    client,
    f"""curl -s -X POST 'http://localhost:3000/api/auth/callback/credentials' -H 'Content-Type: application/x-www-form-urlencoded' -b /tmp/login.txt -c /tmp/session.txt -d '{login_data}' """
)

print(f"  Response: {out[:120]}")

if 'csrf' in out.lower():
    print("  ⚠️ CSRF error\n")
else:
    print("  ✅ Sin error CSRF aparente\n")

time.sleep(3)

# GET session
print("  [4/4] GET /api/auth/session...")
success, out, err = run_cmd(client, "curl -s -b /tmp/session.txt 'http://localhost:3000/api/auth/session'")

try:
    session = json.loads(out)
    if session and 'user' in session:
        print("\n  ✅✅✅ SESIÓN CREADA ✅✅✅")
        print(f"  Email: {session['user'].get('email')}")
        print(f"  Role: {session['user'].get('role')}\n")
        has_session = True
    else:
        print(f"  ⚠️ Sesión vacía: {out[:60]}\n")
        has_session = False
except:
    print(f"  ❌ Error: {out[:60]}\n")
    has_session = False

# 4. Ver logs de PM2
print("4. LOGS DE PM2")
print("-"*70 + "\n")

time.sleep(2)

success, out, err = run_cmd(client, "pm2 logs inmova-app --lines 50 --nostream")

print("  Logs relevantes:\n")

# Filter líneas con NextAuth
lines = (out + err).split('\n')
nextauth_lines = [l for l in lines if '[NextAuth]' in l or 'authorize' in l.lower() or 'credentials' in l.lower() or 'password' in l.lower()]

if nextauth_lines:
    for line in nextauth_lines[-30:]:  # últimas 30
        print(f"    {line}")
else:
    print("    (No hay logs de NextAuth)\n")
    print("  Mostrando últimas 20 líneas:\n")
    for line in lines[-20:]:
        if line.strip():
            print(f"    {line}")

# RESUMEN
print("\n" + "="*70)
print("RESUMEN")
print("="*70 + "\n")

if has_session:
    print("🎉 RESULTADO: LOGIN FUNCIONA CORRECTAMENTE\n")
else:
    print("⚠️ RESULTADO: Login aún no funciona\n")
    print("Revisar logs arriba para ver el error exacto en authorize()\n")

print("Test manual:")
print("  https://inmovaapp.com/login")
print("  admin@inmova.app / Admin123!\n")

print("="*70 + "\n")

client.close()
