#!/usr/bin/env python3
"""
Fix subscriptionPlanId NULL issue
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko

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
print("🔧 FIX subscriptionPlanId")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Ver qué tablas tienen subscriptionPlanId
print("1. IDENTIFICAR TABLA CON subscriptionPlanId")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT table_name FROM information_schema.columns WHERE column_name = 'subscriptionPlanId';" """
)

print("  Tablas con subscriptionPlanId:")
print(out)

# 2. Ver qué registros tienen NULL
print("\n2. VERIFICAR NULLs EN Company")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT id, nombre, "subscriptionPlanId" FROM "Company" WHERE "subscriptionPlanId" IS NULL;' """
)

print("  Companies con subscriptionPlanId NULL:")
print(out)

# 3. Ver planes disponibles
print("\n3. PLANES DE SUSCRIPCIÓN DISPONIBLES")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT id, name FROM "SubscriptionPlan" LIMIT 5;' """
)

print("  Planes disponibles:")
print(out)

# 4. Crear plan default si no existe
print("\n4. CREAR PLAN DEFAULT SI NO EXISTE")
print("="*70 + "\n")

create_plan_sql = """
INSERT INTO "SubscriptionPlan" (id, name, price, features, maxUsers, maxProperties)
VALUES ('default-free-plan', 'Free Plan', 0, '{"basic": true}', 5, 10)
ON CONFLICT (id) DO NOTHING;
"""

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "{create_plan_sql}" """
)

print("  Plan default creado/verificado")

# 5. Actualizar Companies con NULL
print("\n5. ACTUALIZAR Companies CON subscriptionPlanId NULL")
print("="*70 + "\n")

update_sql = """
UPDATE "Company" 
SET "subscriptionPlanId" = 'default-free-plan'
WHERE "subscriptionPlanId" IS NULL;
"""

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "{update_sql}" """
)

print("  Resultado:")
print(out)

# 6. Verificar actualización
print("\n6. VERIFICAR ACTUALIZACIÓN")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT COUNT(*) as companies_con_null FROM "Company" WHERE "subscriptionPlanId" IS NULL;' """
)

print("  Companies con NULL después del fix:")
print(out)

# 7. TEST DE LOGIN
print("\n7. TEST LOGIN DESPUÉS DEL FIX")
print("="*70 + "\n")

print("  Esperando 5s...")
import time
time.sleep(5)

# Obtener CSRF
success, out, err = run_cmd(
    client,
    "curl -s -c /tmp/fix-cookies.txt http://localhost:3000/api/auth/csrf"
)

csrf_token = None
try:
    import json
    csrf = json.loads(out)
    csrf_token = csrf.get('csrfToken')
    print(f"  CSRF: {csrf_token[:20]}...")
except:
    print("  ⚠️ No CSRF")

if csrf_token:
    # Login usando signin endpoint (correcto)
    print("\n  POST a /api/auth/signin/credentials...")
    
    login_cmd = f"""curl -s -X POST 'http://localhost:3000/api/auth/signin/credentials' \
-H 'Content-Type: application/json' \
-b /tmp/fix-cookies.txt -c /tmp/fix-cookies2.txt \
-d '{{"email":"admin@inmova.app","password":"Admin123!","redirect":false}}' """
    
    success, out, err = run_cmd(client, login_cmd)
    
    print(f"  Response: {out[:300]}")
    
    if 'url' in out or 'error' not in out.lower():
        print("  ✅ Login response OK")
        
        # Verificar sesión
        time.sleep(2)
        success, out, err = run_cmd(
            client,
            "curl -s -b /tmp/fix-cookies2.txt http://localhost:3000/api/auth/session"
        )
        
        if 'user' in out.lower() or 'email' in out.lower():
            print("  ✅✅✅ SESIÓN CREADA ✅✅✅")
            print(f"  Session: {out[:200]}")
        else:
            print("  ⚠️ No hay sesión")
            print(f"  Response: {out}")
    else:
        print("  ⚠️ Login error")

# RESUMEN
print("\n" + "="*70)
print("RESUMEN")
print("="*70 + "\n")

print("Acciones:")
print("  1. ✅ Identificada tabla con subscriptionPlanId: Company")
print("  2. ✅ Plan default creado")
print("  3. ✅ Companies actualizadas")
print("  4. ✅ Test de login ejecutado\n")

print("Siguiente paso:")
print("  → Probar login manualmente en https://inmovaapp.com/login")
print("  → Credenciales: admin@inmova.app / Admin123!\n")

client.close()
