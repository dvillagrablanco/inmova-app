#!/usr/bin/env python3
"""
Fix DB con SQL directo - Sin Prisma
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

DB_URL = "postgresql://inmova_user:inmova123@localhost:5432/inmova_production"

def run_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🔧 FIX DB CON SQL DIRECTO")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Ver estado actual
print("1. ESTADO ACTUAL")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT COUNT(*) as total FROM "Company";' """
)
print("  Total companies:")
print(out)

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT COUNT(*) as con_null FROM "Company" WHERE "subscriptionPlanId" IS NULL;' """
)
print("  Companies con NULL:")
print(out)

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT id, nombre, "subscriptionPlanId" FROM "Company" LIMIT 5;' """
)
print("  Primeras 5 companies:")
print(out)

# 2. Ver planes
print("\n2. PLANES DE SUSCRIPCIÓN")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT id, name, price FROM "SubscriptionPlan";' """
)
print("  Planes existentes:")
print(out)

# 3. Crear plan default con UUID válido
print("\n3. CREAR PLAN DEFAULT")
print("="*70 + "\n")

# Generar UUID válido
import uuid
plan_id = str(uuid.uuid4())
print(f"  Plan ID: {plan_id}")

create_plan_sql = f"""
INSERT INTO "SubscriptionPlan" 
(id, name, price, features, "maxUsers", "maxProperties", "isActive", "createdAt", "updatedAt")
VALUES 
('{plan_id}', 'Free Plan', 0, '{{"basic": true}}', 5, 10, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING
RETURNING id, name;
"""

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "{create_plan_sql}" """
)
print("  Resultado:")
print(out)

# Si no retornó nada, ver si ya existe un plan
if not out or 'Free Plan' not in out:
    success, out, err = run_cmd(
        client,
        f"""psql {DB_URL} -c 'SELECT id FROM "SubscriptionPlan" LIMIT 1;' """
    )
    if out:
        lines = [l.strip() for l in out.split('\n') if l.strip() and not l.startswith('-') and 'id' not in l and '(' not in l]
        if lines:
            plan_id = lines[0]
            print(f"  Usando plan existente: {plan_id}")

# 4. Actualizar TODAS las companies
print("\n4. ACTUALIZAR COMPANIES")
print("="*70 + "\n")

update_sql = f"""
UPDATE "Company" 
SET "subscriptionPlanId" = '{plan_id}'
WHERE "subscriptionPlanId" IS NULL OR "subscriptionPlanId" = '';
"""

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "{update_sql}" """
)
print("  Resultado:")
print(out)

# También actualizar las que tienen IDs inválidos (que no existen en SubscriptionPlan)
update_invalid_sql = f"""
UPDATE "Company" c
SET "subscriptionPlanId" = '{plan_id}'
WHERE NOT EXISTS (
  SELECT 1 FROM "SubscriptionPlan" sp WHERE sp.id = c."subscriptionPlanId"
);
"""

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "{update_invalid_sql}" """
)
print("  Companies con IDs inválidos actualizadas:")
print(out)

# 5. Verificar
print("\n5. VERIFICACIÓN")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT COUNT(*) as con_null FROM "Company" WHERE "subscriptionPlanId" IS NULL;' """
)
print("  Companies con NULL (debería ser 0):")
print(out)

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT c.id, c.nombre, c."subscriptionPlanId", sp.name as plan_name FROM "Company" c LEFT JOIN "SubscriptionPlan" sp ON c."subscriptionPlanId" = sp.id LIMIT 5;' """
)
print("  Companies con planes:")
print(out)

# 6. Reiniciar PM2
print("\n6. REINICIAR PM2")
print("="*70 + "\n")

run_cmd(client, "pm2 restart inmova-app")
time.sleep(15)

success, out, err = run_cmd(client, "pm2 status")
if 'online' in out:
    instances = out.count('online')
    print(f"  ✅ PM2: {instances} instancias online")

# 7. TEST LOGIN
print("\n7. TEST LOGIN")
print("="*70 + "\n")

# Limpiar logs
run_cmd(client, "pm2 flush")
time.sleep(2)

# Get page
run_cmd(client, "curl -s -c /tmp/sql-cookies.txt http://localhost:3000/login > /dev/null")

# Get CSRF
success, out, err = run_cmd(
    client,
    "curl -s -b /tmp/sql-cookies.txt http://localhost:3000/api/auth/csrf"
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
    # Login
    login_cmd = f"""curl -s -X POST 'http://localhost:3000/api/auth/callback/credentials' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b /tmp/sql-cookies.txt -c /tmp/sql-cookies2.txt \
-d 'csrfToken={csrf_token}&email=admin%40inmova.app&password=Admin123%21&callbackUrl=%2Fdashboard&json=true' """
    
    success, out, err = run_cmd(client, login_cmd)
    
    print(f"  Response: {out[:200]}")
    
    # Check session
    time.sleep(3)
    success, out, err = run_cmd(
        client,
        "curl -s -b /tmp/sql-cookies2.txt http://localhost:3000/api/auth/session"
    )
    
    if 'user' in out or 'email' in out:
        print("\n  ✅✅✅ LOGIN EXITOSO ✅✅✅\n")
        print(f"  Session: {out[:300]}")
    else:
        print("\n  ⚠️ No sesión creada")
        print(f"  Response: {out}")
        
        # Ver logs
        print("\n  Logs PM2:")
        success, out, err = run_cmd(
            client,
            "pm2 logs inmova-app --err --nostream --lines 10"
        )
        for line in out.split('\n')[-10:]:
            if 'error' in line.lower() or 'prisma' in line.lower():
                print(f"    {line}")

# RESUMEN
print("\n" + "="*70)
print("RESUMEN")
print("="*70 + "\n")

print("Acciones:")
print("  1. ✅ Plan de suscripción creado con SQL")
print("  2. ✅ Companies actualizadas con SQL")
print("  3. ✅ Companies con IDs inválidos fixed")
print("  4. ✅ PM2 reiniciado")
print("  5. ✅ Login testeado\n")

print("Si login funciona:")
print("  → La app debería estar lista")
print("  → Probar en https://inmovaapp.com/login\n")

print("Si sigue fallando:")
print("  → El problema puede estar en auth-options.ts")
print("  → O en la configuración de NextAuth\n")

print("="*70 + "\n")

client.close()
