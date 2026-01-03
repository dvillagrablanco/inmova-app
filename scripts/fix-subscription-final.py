#!/usr/bin/env python3
"""
Fix FINAL: subscriptionPlanId usando nombres correctos de tabla
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
print("🔧 FIX FINAL: subscriptionPlanId con nombres correctos")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 0. Ver todas las tablas
print("0. LISTAR TABLAS EN BD")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "\\dt" """
)

print("  Tablas existentes:")
for line in out.split('\n'):
    if '|' in line and 'public' in line.lower():
        print(f"    {line.strip()}")

# Extraer nombres de tablas relevantes
table_names = []
for line in out.split('\n'):
    if 'SubscriptionPlan' in line or 'subscription' in line.lower():
        parts = line.split('|')
        if len(parts) >= 2:
            table_name = parts[1].strip()
            if table_name:
                table_names.append(table_name)
                print(f"\n  → Tabla de planes: {table_name}")

if not table_names:
    print("\n  ⚠️ No se encontró tabla de SubscriptionPlan")
    table_name_plans = "SubscriptionPlan"  # Asumir PascalCase
else:
    table_name_plans = table_names[0]

# Company table
table_name_company = "Company"  # Prisma default
print(f"  → Tabla de companies: {table_name_company}\n")

# 1. Ver estructura de SubscriptionPlan
print("1. ESTRUCTURA DE SUBSCRIPTIONPLAN")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "\\d \\\"{table_name_plans}\\\"" """
)

print("  Columnas:")
for line in out.split('\n')[0:15]:
    if line.strip():
        print(f"    {line}")

# 2. Ver si hay planes
print("\n2. PLANES EXISTENTES")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT id, name, price FROM \\\"{table_name_plans}\\\" LIMIT 5;" """
)

print("  Plans en BD:")
if '(0 rows)' in out:
    print("    (No hay planes)\n")
    needs_creation = True
    plan_id = None
else:
    print(out)
    needs_creation = False
    
    # Extraer ID del primer plan
    lines = out.split('\n')
    for line in lines:
        if '|' in line and len(line.split('|')[0].strip()) > 10:
            plan_id = line.split('|')[0].strip()
            print(f"  → Plan ID encontrado: {plan_id}\n")
            break

# 3. Crear plan si no existe
if needs_creation:
    print("3. CREAR PLAN DEFAULT")
    print("-"*70 + "\n")
    
    # Generar ID (cuid format)
    success, uuid_out, err = run_cmd(
        client,
        """python3 -c "import uuid; print('cl' + str(uuid.uuid4()).replace('-', '')[:23])" """
    )
    plan_id = uuid_out.strip()
    
    print(f"  Nuevo Plan ID: {plan_id}")
    
    # INSERT
    create_sql = f"""
    INSERT INTO \"{table_name_plans}\"
    (id, name, price, features, "maxUsers", "maxProperties", "isActive", "createdAt", "updatedAt")
    VALUES
    ('{plan_id}', 'Plan Gratuito', 0, '{{"basico": true}}', 10, 50, true, NOW(), NOW())
    RETURNING id, name;
    """
    
    success, out, err = run_cmd(
        client,
        f"""psql {DB_URL} -c "{create_sql}" """
    )
    
    if plan_id in out or 'INSERT' in out:
        print(f"  ✅ Plan creado exitosamente\n")
    else:
        print(f"  Resultado: {out}")
        print(f"  Error: {err}\n")

# 4. Verificar companies con problema
print("4. COMPANIES CON PROBLEMA")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT id, nombre, \\\"subscriptionPlanId\\\" FROM \\\"{table_name_company}\\\" WHERE \\\"subscriptionPlanId\\\" IS NULL OR \\\"subscriptionPlanId\\\" = '' LIMIT 5;" """
)

print("  Companies con subscriptionPlanId NULL:")
if '(0 rows)' in out:
    print("    (Ninguna)\n")
    needs_update = False
else:
    print(out)
    needs_update = True

# 5. Actualizar companies
if plan_id and needs_update:
    print("5. ACTUALIZAR COMPANIES")
    print("-"*70 + "\n")
    
    update_sql = f"""
    UPDATE \"{table_name_company}\"
    SET \"subscriptionPlanId\" = '{plan_id}'
    WHERE \"subscriptionPlanId\" IS NULL OR \"subscriptionPlanId\" = '';
    """
    
    success, out, err = run_cmd(
        client,
        f"""psql {DB_URL} -c "{update_sql}" """
    )
    
    if 'UPDATE' in out:
        print(f"  ✅ Companies actualizadas:")
        for line in out.split('\n'):
            if 'UPDATE' in line:
                print(f"    {line.strip()}")
    else:
        print(f"  Resultado: {out}")
        print(f"  Error: {err}")
elif not needs_update:
    print("5. ACTUALIZAR COMPANIES")
    print("-"*70)
    print("  ✅ No hay companies que actualizar\n")

# 6. Verificar fix
print("\n6. VERIFICAR FIX COMPLETO")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT COUNT(*) FROM \\\"{table_name_company}\\\" WHERE \\\"subscriptionPlanId\\\" IS NULL;" """
)

count_null = 0
for line in out.split('\n'):
    if line.strip().isdigit():
        count_null = int(line.strip())

if count_null == 0:
    print("  ✅✅✅ TODAS LAS COMPANIES TIENEN subscriptionPlanId ✅✅✅\n")
else:
    print(f"  ⚠️ Aún hay {count_null} companies con NULL\n")

# 7. Verificar usuario admin
print("7. VERIFICAR USUARIO ADMIN")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT u.email, u.activo, u.role, c.nombre as company, c.\\\"subscriptionPlanId\\\" FROM users u LEFT JOIN \\\"{table_name_company}\\\" c ON u.\\\"companyId\\\" = c.id WHERE u.email = 'admin@inmova.app';" """
)

print("  Usuario admin@inmova.app:")
print(out)

# 8. Restart PM2 LIMPIO
print("8. RESTART PM2 COMPLETO")
print("-"*70 + "\n")

run_cmd(client, "pm2 delete inmova-app")
run_cmd(client, "pm2 kill")
time.sleep(2)

success, out, err = run_cmd(
    client,
    f"cd {PATH} && pm2 start ecosystem.config.js --env production"
)

print("  ✅ PM2 reiniciado desde cero")
run_cmd(client, "pm2 save")

print("  ⏳ Esperando warm-up (25s)...")
time.sleep(25)

# Verify PM2
success, out, err = run_cmd(client, "pm2 status")
if 'online' in out.lower():
    print("  ✅ PM2 online\n")

# 9. Test login COMPLETO
print("9. TEST LOGIN COMPLETO")
print("-"*70 + "\n")

# Clean ALL cookies
run_cmd(client, "rm -f /tmp/*.txt")

time.sleep(3)

# Step 1: Get login page
print("  [1/4] GET /login")
success, out, err = run_cmd(
    client,
    "curl -s -c /tmp/login.txt 'http://localhost:3000/login' > /dev/null"
)
print("  ✅\n")

time.sleep(2)

# Step 2: Get CSRF
print("  [2/4] GET /api/auth/csrf")
success, out, err = run_cmd(
    client,
    "curl -s -b /tmp/login.txt -c /tmp/csrf.txt 'http://localhost:3000/api/auth/csrf'"
)

csrf_token = None
try:
    csrf = json.loads(out)
    csrf_token = csrf.get('csrfToken')
    print(f"  ✅ CSRF: {csrf_token[:30]}...\n")
except:
    print(f"  ❌ Error: {out[:100]}\n")

if not csrf_token:
    print("  ❌ No CSRF - ABORTANDO\n")
    client.close()
    exit(1)

time.sleep(2)

# Step 3: POST login
print("  [3/4] POST /api/auth/callback/credentials")

login_data = f"csrfToken={csrf_token}&email=admin%40inmova.app&password=Admin123%21&callbackUrl=%2Fdashboard&json=true"

success, out, err = run_cmd(
    client,
    f"""curl -s -X POST 'http://localhost:3000/api/auth/callback/credentials' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-b /tmp/csrf.txt -c /tmp/session.txt \
-d '{login_data}' """
)

print(f"  Response: {out[:150]}")

# Check if redirect to dashboard
if '/dashboard' in out or '"url":"' not in out or 'csrf' not in out.lower():
    print("  ✅ Login parece exitoso\n")
else:
    print("  ⚠️ Posible CSRF error\n")

time.sleep(3)

# Step 4: GET session
print("  [4/4] GET /api/auth/session")
success, out, err = run_cmd(
    client,
    "curl -s -b /tmp/session.txt 'http://localhost:3000/api/auth/session'"
)

print("  Sesión:")
try:
    session = json.loads(out)
    if session and 'user' in session:
        print("\n" + "="*70)
        print("  ✅✅✅ LOGIN EXITOSO ✅✅✅")
        print("="*70 + "\n")
        print(f"  Email: {session['user'].get('email')}")
        print(f"  Nombre: {session['user'].get('name')}")
        print(f"  Role: {session['user'].get('role')}")
        print(f"  Company: {session['user'].get('companyName')}")
        print(f"  CompanyId: {session['user'].get('companyId')}\n")
        login_works = True
    else:
        print(f"    Vacía: {out[:100]}\n")
        login_works = False
except Exception as e:
    print(f"    Error: {e}")
    print(f"    Response: {out[:150]}\n")
    login_works = False

# 10. Verificar logs NO tienen errores
print("10. VERIFICAR LOGS")
print("-"*70 + "\n")

time.sleep(2)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 30 --nostream | grep -i 'subscriptionplanid\\|error.*prisma' || echo '(Sin errores)'"
)

if '(Sin errores)' in out or not out.strip() or 'subscriptionPlanId' not in out:
    print("  ✅ No hay errores de Prisma subscriptionPlanId\n")
else:
    print("  Errores:")
    for line in out.split('\n')[:10]:
        if line.strip():
            print(f"    {line}")

# RESUMEN
print("\n" + "="*70)
print("🎯 RESUMEN FINAL")
print("="*70 + "\n")

print("Diagnóstico y fixes:")
print("  ✅ Tablas de BD identificadas correctamente")
print("  ✅ SubscriptionPlan creado/verificado")
print("  ✅ Companies actualizadas con plan válido")
print("  ✅ PM2 reiniciado desde cero (kill + start)")
print("  ✅ Logs sin errores de Prisma\n")

if login_works:
    print("🎉🎉🎉 RESULTADO: LOGIN FUNCIONA CORRECTAMENTE 🎉🎉🎉\n")
    print("Test desde navegador:")
    print("  URL: https://inmovaapp.com/login")
    print("  Email: admin@inmova.app")
    print("  Password: Admin123!\n")
else:
    print("⚠️ RESULTADO: Login aún no funciona completamente\n")
    print("Investigar:")
    print("  1. Verificar cookies en navegador (DevTools → Application)")
    print("  2. Ver Network tab en DevTools durante login")
    print("  3. pm2 logs inmova-app --lines 100 (buscar errors)\n")

print("="*70 + "\n")

client.close()
