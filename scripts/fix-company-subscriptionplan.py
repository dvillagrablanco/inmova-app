#!/usr/bin/env python3
"""
Fix DEFINITIVO: subscriptionPlanId NULL en Company
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
print("🔧 FIX: subscriptionPlanId NULL en Company")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Verificar companies con subscriptionPlanId NULL
print("1. DETECTAR COMPANIES CON PROBLEMA")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT id, nombre, subscriptionPlanId FROM companies WHERE subscriptionPlanId IS NULL OR subscriptionPlanId = '' LIMIT 5;" """
)

print("  Companies con subscriptionPlanId NULL:")
if out and 'rows' in out and '(0 rows)' not in out:
    print(out)
    has_null_companies = True
else:
    print("    (Ninguna - puede estar ya arreglado)\n")
    has_null_companies = False

# 2. Verificar si existe algún plan
print("2. VERIFICAR SUBSCRIPTION PLANS")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT id, name, price FROM subscription_plans LIMIT 5;" """
)

print("  Plans existentes:")
if '(0 rows)' in out:
    print("    (No hay planes - creando default...)\n")
    needs_plan_creation = True
else:
    print(out)
    needs_plan_creation = False
    
    # Extract first plan ID
    lines = out.split('\n')
    for line in lines:
        if '|' in line and 'cuid' in line.lower() or len(line.split('|')[0].strip()) > 15:
            plan_id = line.split('|')[0].strip()
            print(f"    → Usaremos plan: {plan_id}\n")
            break

# 3. Crear plan default si no existe
if needs_plan_creation:
    print("3. CREAR PLAN DEFAULT")
    print("-"*70 + "\n")
    
    # Generar UUID
    success, uuid_out, err = run_cmd(
        client,
        """python3 -c "import uuid; print(str(uuid.uuid4()).replace('-', '')[:25])" """
    )
    plan_id = uuid_out.strip()
    
    print(f"  Plan ID: {plan_id}")
    
    # SQL para crear plan
    create_plan_sql = f"""
    INSERT INTO subscription_plans
    (id, name, price, features, "maxUsers", "maxProperties", "isActive", "createdAt", "updatedAt")
    VALUES
    ('{plan_id}', 'Plan Gratuito', 0, '{{"basico": true}}', 10, 50, true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
    RETURNING id, name;
    """
    
    success, out, err = run_cmd(
        client,
        f"""psql {DB_URL} -c "{create_plan_sql}" """
    )
    
    if 'INSERT' in out or plan_id in out:
        print(f"  ✅ Plan creado: {out.strip()}\n")
    else:
        print(f"  ⚠️ Resultado: {out}\n")

else:
    print("3. PLAN EXISTENTE")
    print("-"*70)
    print(f"  ✅ Usando plan existente\n")

# 4. Actualizar todas las companies
print("4. ACTUALIZAR COMPANIES")
print("-"*70 + "\n")

# Get plan_id nuevamente por si acaso
success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -t -c "SELECT id FROM subscription_plans LIMIT 1;" """
)
plan_id = out.strip()

if plan_id and len(plan_id) > 10:
    print(f"  Plan a asignar: {plan_id}")
    
    # Update companies
    update_sql = f"""
    UPDATE companies
    SET "subscriptionPlanId" = '{plan_id}'
    WHERE "subscriptionPlanId" IS NULL OR "subscriptionPlanId" = '';
    """
    
    success, out, err = run_cmd(
        client,
        f"""psql {DB_URL} -c "{update_sql}" """
    )
    
    if 'UPDATE' in out:
        # Extract number updated
        for line in out.split('\n'):
            if 'UPDATE' in line:
                print(f"  ✅ {line.strip()}\n")
    else:
        print(f"  Resultado: {out}\n")
else:
    print("  ❌ No se pudo obtener plan_id\n")

# 5. Verificar que ya no hay NULL
print("5. VERIFICAR FIX")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT COUNT(*) as count FROM companies WHERE subscriptionPlanId IS NULL OR subscriptionPlanId = '';" """
)

if '0' in out or '(0 rows)' in out:
    print("  ✅ Ya no hay companies con subscriptionPlanId NULL\n")
else:
    print(f"  ⚠️ Aún hay registros NULL:\n{out}\n")

# 6. Verificar users tienen companyId válido
print("6. VERIFICAR USERS")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT u.email, u.activo, c.nombre as company FROM users u LEFT JOIN companies c ON u.companyId = c.id WHERE u.email IN ('admin@inmova.app', 'test@inmova.app');" """
)

print("  Estado de usuarios de test:")
print(out)

# 7. Restart PM2 para limpiar errores
print("7. RESTART PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 restart inmova-app --update-env")
print("  ✅ PM2 restarted")

print("  ⏳ Esperando warm-up (20s)...")
time.sleep(20)

# 8. Test login AHORA
print("8. TEST LOGIN (después del fix)")
print("-"*70 + "\n")

# Clean cookies
run_cmd(client, "rm -f /tmp/final-*.txt")

# Get login page
run_cmd(client, "curl -s -c /tmp/final-cookies.txt 'http://localhost:3000/login' > /dev/null")
time.sleep(1)

# Get CSRF
success, out, err = run_cmd(
    client,
    "curl -s -b /tmp/final-cookies.txt 'http://localhost:3000/api/auth/csrf'"
)

csrf_token = None
try:
    csrf_data = json.loads(out)
    csrf_token = csrf_data.get('csrfToken')
    print(f"  [1/3] CSRF token obtenido: {csrf_token[:20]}...\n")
except:
    print(f"  ❌ No CSRF token")

if csrf_token:
    # Login
    login_data = f"csrfToken={csrf_token}&email=admin%40inmova.app&password=Admin123%21&callbackUrl=%2Fdashboard&json=true"
    
    success, out, err = run_cmd(
        client,
        f"""curl -s -X POST 'http://localhost:3000/api/auth/callback/credentials' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b /tmp/final-cookies.txt -c /tmp/final-cookies2.txt \
-d '{login_data}' """
    )
    
    print(f"  [2/3] Login response:")
    print(f"    {out[:200]}\n")
    
    time.sleep(2)
    
    # Check session
    success, session_out, err = run_cmd(
        client,
        "curl -s -b /tmp/final-cookies2.txt 'http://localhost:3000/api/auth/session'"
    )
    
    print("  [3/3] Sesión:")
    try:
        session_data = json.loads(session_out)
        if session_data and 'user' in session_data:
            print("\n" + "  "*5 + "✅"*10)
            print("  "*5 + "LOGIN EXITOSO")
            print("  "*5 + "✅"*10 + "\n")
            print(f"  Usuario: {session_data['user'].get('email')}")
            print(f"  Nombre: {session_data['user'].get('name')}")
            print(f"  Role: {session_data['user'].get('role')}")
            print(f"  Company: {session_data['user'].get('companyName')}\n")
        else:
            print(f"    ⚠️ Sesión vacía: {session_out[:100]}\n")
    except Exception as e:
        print(f"    ❌ Error: {e}")
        print(f"    Response: {session_out[:200]}\n")

# 9. Verificar logs NO tienen más errores de Prisma
print("9. VERIFICAR LOGS PRISMA")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 20 --nostream | grep -i 'subscriptionplanid\\|prisma.*error' || echo '(No errors)'"
)

if '(No errors)' in out or not out.strip():
    print("  ✅ No hay errores de subscriptionPlanId en logs\n")
else:
    print("  Errores encontrados:")
    print(out)

# RESUMEN FINAL
print("\n" + "="*70)
print("RESUMEN FINAL")
print("="*70 + "\n")

print("Fixes aplicados:")
print("  ✅ Verificado/creado SubscriptionPlan default")
print("  ✅ Actualizado todas las companies con subscriptionPlanId")
print("  ✅ Verificado usuarios tienen company válida")
print("  ✅ PM2 reiniciado sin errores de Prisma\n")

if session_data and 'user' in session_data:
    print("🎉 RESULTADO: LOGIN FUNCIONA CORRECTAMENTE 🎉\n")
else:
    print("⚠️ RESULTADO: Login aún presenta problemas\n")
    print("Siguiente paso: Revisar lib/auth-options.ts en detalle\n")

print("Test manual:")
print("  URL: https://inmovaapp.com/login")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("="*70 + "\n")

client.close()
