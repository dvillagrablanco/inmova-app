#!/usr/bin/env python3
"""
Diagnóstico profundo de NextAuth CSRF
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
print("🔍 DIAGNÓSTICO PROFUNDO: NextAuth CSRF")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Verificar NEXTAUTH_URL
print("1. VERIFICAR NEXTAUTH_URL")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && grep -E '(NEXTAUTH_URL|NEXTAUTH_SECRET)' .env.production | head -2"
)

print("  Variables .env.production:")
for line in out.split('\n'):
    if line.strip():
        parts = line.split('=')
        if len(parts) == 2:
            key = parts[0]
            val = parts[1]
            if 'SECRET' in key:
                val = val[:15] + '...'
            print(f"    {key}={val}")

# Check PM2 env
print("\n  Variables PM2 (runtime):")
success, out, err = run_cmd(
    client,
    "pm2 env inmova-app | grep -E '(NEXTAUTH_URL|NEXTAUTH_SECRET|NODE_ENV)' | head -5"
)

for line in out.split('\n'):
    if '=' in line or 'NEXTAUTH' in line or 'NODE_ENV' in line:
        print(f"    {line.strip()}")

# 2. Verificar que NextAuth API responde
print("\n2. VERIFICAR NEXTAUTH API")
print("-"*70 + "\n")

# Providers
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/auth/providers"
)

print("  /api/auth/providers:")
if 'credentials' in out:
    print("    ✅ NextAuth responde OK")
    print(f"    {out[:80]}")
else:
    print(f"    ⚠️ Respuesta inesperada: {out[:100]}")

# 3. Test con curl -v (verbose) para ver headers y cookies
print("\n3. TEST CON CURL -v (headers completos)")
print("-"*70 + "\n")

# Step 1: GET login con verbose
print("  [1/3] GET /login (verbose)...")
success, out, err = run_cmd(
    client,
    "curl -v -c /tmp/debug-cookies.txt 'http://localhost:3000/login' 2>&1 | head -30"
)

# Buscar Set-Cookie
set_cookie_lines = [l for l in out.split('\n') if 'Set-Cookie' in l or 'cookie' in l.lower()]
if set_cookie_lines:
    print("    Cookies establecidas:")
    for line in set_cookie_lines[:5]:
        print(f"      {line.strip()}")
else:
    print("    ⚠️ No se establecieron cookies")

time.sleep(2)

# Step 2: GET /api/auth/csrf con verbose
print("\n  [2/3] GET /api/auth/csrf (verbose)...")
success, out, err = run_cmd(
    client,
    "curl -v -b /tmp/debug-cookies.txt -c /tmp/debug-cookies2.txt 'http://localhost:3000/api/auth/csrf' 2>&1"
)

# Buscar CSRF token y cookies
print("    Response:")
for line in out.split('\n'):
    if 'csrfToken' in line or 'Set-Cookie' in line:
        print(f"      {line.strip()}")

# Extraer csrf token
csrf_token = None
for line in out.split('\n'):
    if '"csrfToken"' in line:
        try:
            import json
            # Try to parse the whole response
            json_start = out.find('{')
            json_end = out.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                csrf_data = json.loads(out[json_start:json_end])
                csrf_token = csrf_data.get('csrfToken')
                break
        except:
            pass

if csrf_token:
    print(f"\n    ✅ CSRF Token extraído: {csrf_token[:30]}...")
else:
    print("\n    ❌ No se pudo extraer CSRF token")
    client.close()
    exit(1)

time.sleep(2)

# Step 3: POST login con verbose
print("\n  [3/3] POST /api/auth/callback/credentials (verbose)...")

login_data = f"csrfToken={csrf_token}&email=admin%40inmova.app&password=Admin123%21&callbackUrl=%2Fdashboard&json=true"

success, out, err = run_cmd(
    client,
    f"""curl -v -X POST 'http://localhost:3000/api/auth/callback/credentials' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-b /tmp/debug-cookies2.txt \
-c /tmp/debug-cookies3.txt \
-d '{login_data}' 2>&1 """
)

print("    Status y headers:")
for line in out.split('\n')[:40]:
    if any(keyword in line for keyword in ['HTTP', 'Location', 'Set-Cookie', 'csrf', 'error']):
        print(f"      {line.strip()}")

# Check response body
if '{' in out:
    json_start = out.find('{')
    json_end = out.rfind('}') + 1
    response_body = out[json_start:json_end]
    print(f"\n    Response body:")
    print(f"      {response_body}")

# 4. Ver contenido de cookies guardadas
print("\n4. CONTENIDO DE COOKIES")
print("-"*70 + "\n")

success, out, err = run_cmd(client, "cat /tmp/debug-cookies3.txt")
print("  Cookies finales:")
for line in out.split('\n'):
    if line.strip() and not line.startswith('#'):
        print(f"    {line.strip()}")

# 5. Intentar con signIn endpoint directo
print("\n5. TEST CON /api/auth/signin/credentials")
print("-"*70 + "\n")

print("  Intentando endpoint alternativo...")

# Fresh cookies
run_cmd(client, "rm -f /tmp/alt-*.txt")
time.sleep(1)

# GET login
run_cmd(client, "curl -s -c /tmp/alt-cookies.txt 'http://localhost:3000/login' > /dev/null")
time.sleep(1)

# GET csrf
success, out, err = run_cmd(
    client,
    "curl -s -b /tmp/alt-cookies.txt 'http://localhost:3000/api/auth/csrf'"
)

try:
    import json
    csrf = json.loads(out)
    csrf_token_alt = csrf.get('csrfToken')
    print(f"  CSRF: {csrf_token_alt[:25]}...")
except:
    csrf_token_alt = None
    print(f"  ❌ Error obteniendo CSRF")

if csrf_token_alt:
    time.sleep(1)
    
    # Try signIn endpoint
    data = f"csrfToken={csrf_token_alt}&email=admin%40inmova.app&password=Admin123%21&json=true"
    
    success, out, err = run_cmd(
        client,
        f"""curl -s -X POST 'http://localhost:3000/api/auth/signin/credentials' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b /tmp/alt-cookies.txt -c /tmp/alt-cookies2.txt \
-d '{data}' """
    )
    
    print(f"\n  Response:")
    print(f"    {out[:150]}")
    
    time.sleep(2)
    
    # Check session
    success, out, err = run_cmd(
        client,
        "curl -s -b /tmp/alt-cookies2.txt 'http://localhost:3000/api/auth/session'"
    )
    
    try:
        session = json.loads(out)
        if session and 'user' in session:
            print(f"\n  ✅✅✅ LOGIN EXITOSO con /signin/credentials ✅✅✅")
            print(f"  Email: {session['user'].get('email')}")
        else:
            print(f"\n  ⚠️ No sesión: {out[:80]}")
    except:
        print(f"\n  ⚠️ Error: {out[:80]}")

# RESUMEN
print("\n" + "="*70)
print("DIAGNÓSTICO")
print("="*70 + "\n")

print("Verificar:")
print("  1. NEXTAUTH_URL debe ser http://localhost:3000 (para requests internas)")
print("  2. O https://inmovaapp.com (para requests externas)")
print("  3. Cookies deben incluir next-auth.csrf-token")
print("  4. Usar endpoint /signin/credentials en lugar de /callback/credentials\n")

print("Posible fix:")
print("  - Actualizar NEXTAUTH_URL a http://localhost:3000")
print("  - O configurar trustHost: true en authOptions")
print("  - O usar /api/auth/signin en lugar de /callback\n")

print("="*70 + "\n")

client.close()
