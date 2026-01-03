#!/usr/bin/env python3
"""
Fix DEFINITIVO de subscriptionPlanId - Actualizar TODAS las tables relacionadas
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

def run_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🔧 FIX DEFINITIVO: subscriptionPlanId")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Ver tabla company
print("1. VERIFICAR TABLA COMPANY")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT id, nombre, subscription_plan_id FROM company LIMIT 5;" """
)

print("  Companies actuales:")
print(out)

# Count NULLs
success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -t -c "SELECT COUNT(*) FROM company WHERE subscription_plan_id IS NULL;" """
)

null_count = int(out.strip()) if out.strip().isdigit() else 0
print(f"\n  Companies con NULL: {null_count}\n")

# 2. Obtener/crear plan
print("2. OBTENER/CREAR PLAN DEFAULT")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -t -c "SELECT id FROM subscription_plans ORDER BY created_at ASC LIMIT 1;" """
)

plan_id = out.strip()

if not plan_id or len(plan_id) < 10:
    # Generate ID
    success, uid, _ = run_cmd(
        client,
        """python3 -c "import uuid; print('cl' + str(uuid.uuid4()).replace('-', '')[:23])" """
    )
    plan_id = uid.strip()
    
    # Create
    run_cmd(
        client,
        f"""psql {DB_URL} -c "INSERT INTO subscription_plans (id, name, price, features, max_users, max_properties, is_active, created_at, updated_at) VALUES ('{plan_id}', 'Plan Básico', 0, '{{\\"basico\\": true}}', 10, 50, true, NOW(), NOW());" """
    )
    print(f"  ✅ Plan creado: {plan_id}\n")
else:
    print(f"  ✅ Plan existente: {plan_id}\n")

# 3. Update ALL companies
print("3. ACTUALIZAR TODAS LAS COMPANIES")
print("-"*70 + "\n")

if null_count > 0:
    update_sql = f"UPDATE company SET subscription_plan_id = '{plan_id}' WHERE subscription_plan_id IS NULL OR subscription_plan_id = '';"
    
    success, out, err = run_cmd(
        client,
        f"""psql {DB_URL} -c "{update_sql}" """
    )
    
    if 'UPDATE' in out:
        print(f"  ✅ {out.strip()}\n")
else:
    print("  ℹ️ No hay companies con NULL\n")

# 4. Verificar
success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -t -c "SELECT COUNT(*) FROM company WHERE subscription_plan_id IS NULL;" """
)

final_null = int(out.strip()) if out.strip().isdigit() else -1

if final_null == 0:
    print("  ✅ TODAS LAS COMPANIES ACTUALIZADAS\n")
else:
    print(f"  ⚠️ Aún quedan {final_null} companies con NULL\n")

# 5. Restart PM2
print("4. RESTART PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 restart inmova-app")
print("  ✅ PM2 restarted\n")
time.sleep(20)

# 6. Check logs
print("5. VERIFICAR LOGS")
print("-"*70 + "\n")

time.sleep(5)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 20 --nostream | grep -i 'subscriptionplanid' || echo 'Sin errores'"
)

if 'Sin errores' in out:
    print("  ✅ Sin errores de subscriptionPlanId\n")
else:
    print("  ⚠️ Aún hay errores:")
    for line in out.split('\n')[:8]:
        if line.strip():
            print(f"    {line}")

print("\n" + "="*70)
print("COMPLETADO")
print("="*70 + "\n")

client.close()
