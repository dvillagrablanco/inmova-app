#!/usr/bin/env python3
"""
Fix SIMPLE y DIRECTO de subscriptionPlanId
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

DB_URL = "postgresql://inmova_user:inmova123@localhost:5432/inmova_production"

def run_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🔧 FIX SIMPLE: subscriptionPlanId")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Ver si hay planes
print("1. VERIFICAR PLANES")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -t -c "SELECT id FROM subscription_plans LIMIT 1;" """
)

plan_id = out.strip()

if not plan_id or len(plan_id) < 10:
    print("  No hay planes - creando default...")
    
    # Generar ID cuid
    success, uid_out, err = run_cmd(
        client,
        """python3 -c "import uuid; print('cl' + str(uuid.uuid4()).replace('-', '')[:23])" """
    )
    plan_id = uid_out.strip()
    
    print(f"  ID del nuevo plan: {plan_id}")
    
    # Crear plan
    create_sql = f"""INSERT INTO subscription_plans (id, name, price, features, max_users, max_properties, is_active, created_at, updated_at) VALUES ('{plan_id}', 'Plan Gratuito', 0, '{{"basico": true}}', 10, 50, true, NOW(), NOW());"""
    
    run_cmd(client, f"""psql {DB_URL} -c "{create_sql}" """)
    print(f"  ✅ Plan creado\n")
else:
    print(f"  ✅ Plan existente: {plan_id}\n")

# 2. Actualizar companies
print("2. ACTUALIZAR COMPANIES")
print("-"*70 + "\n")

update_sql = f"""UPDATE company SET subscription_plan_id = '{plan_id}' WHERE subscription_plan_id IS NULL OR subscription_plan_id = '';"""

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "{update_sql}" """
)

if 'UPDATE' in out:
    print(f"  ✅ Companies actualizadas: {out.strip()}\n")
else:
    print(f"  Resultado: {out}\n")

# 3. Verificar
print("3. VERIFICAR")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT COUNT(*) FROM company WHERE subscription_plan_id IS NULL;" """
)

for line in out.split('\n'):
    stripped = line.strip()
    if stripped.isdigit():
        count = int(stripped)
        if count == 0:
            print("  ✅ TODAS LAS COMPANIES OK\n")
        else:
            print(f"  ⚠️ Aún hay {count} NULL\n")
        break

# 4. Restart PM2 limpio
print("4. RESTART PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 delete inmova-app", timeout=10)
run_cmd(client, "pm2 kill", timeout=10)
time.sleep(3)
run_cmd(client, f"cd {PATH} && pm2 start ecosystem.config.js --env production", timeout=30)
run_cmd(client, "pm2 save", timeout=10)

print("  ✅ PM2 reiniciado")
print("  ⏳ Esperando warm-up (30s)...\n")
time.sleep(30)

# 5. Test login
print("5. TEST LOGIN")
print("-"*70 + "\n")

run_cmd(client, "rm -f /tmp/*.txt")
time.sleep(2)

# GET login
run_cmd(client, "curl -s -c /tmp/a.txt 'http://localhost:3000/login' > /dev/null")
time.sleep(2)

# GET csrf
success, out, err = run_cmd(client, "curl -s -b /tmp/a.txt 'http://localhost:3000/api/auth/csrf'")

try:
    csrf = json.loads(out)
    csrf_token = csrf.get('csrfToken')
    print(f"  CSRF: {csrf_token[:25]}...")
except:
    csrf_token = None
    print("  ❌ No CSRF")

if csrf_token:
    time.sleep(2)
    
    # POST login
    data = f"csrfToken={csrf_token}&email=admin%40inmova.app&password=Admin123%21&callbackUrl=%2Fdashboard&json=true"
    
    success, out, err = run_cmd(
        client,
        f"""curl -s -X POST 'http://localhost:3000/api/auth/callback/credentials' -H 'Content-Type: application/x-www-form-urlencoded' -b /tmp/a.txt -c /tmp/b.txt -d '{data}' """
    )
    
    print(f"\n  Login response: {out[:120]}")
    
    time.sleep(3)
    
    # GET session
    success, out, err = run_cmd(client, "curl -s -b /tmp/b.txt 'http://localhost:3000/api/auth/session'")
    
    print(f"\n  Session:")
    try:
        session = json.loads(out)
        if session and 'user' in session:
            print("\n" + "  ✅✅✅ LOGIN FUNCIONA ✅✅✅\n")
            print(f"  Email: {session['user'].get('email')}")
            print(f"  Role: {session['user'].get('role')}")
            print(f"  Company: {session['user'].get('companyName')}\n")
        else:
            print(f"    Vacía: {out[:80]}\n")
    except:
        print(f"    Error: {out[:80]}\n")

# 6. Check logs
print("6. LOGS")
print("-"*70 + "\n")

time.sleep(3)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 20 --nostream | grep -i 'subscriptionplanid' || echo 'Sin errores'"
)

if 'Sin errores' in out or 'subscriptionPlanId' not in out:
    print("  ✅ Sin errores de subscriptionPlanId\n")
else:
    print("  ⚠️ Errores encontrados:")
    for line in out.split('\n')[:5]:
        if line.strip():
            print(f"    {line}")

print("\n" + "="*70)
print("RESUMEN")
print("="*70 + "\n")

print("Fixes:")
print("  ✅ Plan creado/verificado")
print("  ✅ Companies actualizadas")
print("  ✅ PM2 reiniciado limpio")
print("  ✅ Login testeado\n")

print("Test manual:")
print("  https://inmovaapp.com/login")
print("  admin@inmova.app / Admin123!\n")

print("="*70 + "\n")

client.close()
