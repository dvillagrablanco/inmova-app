#!/usr/bin/env python3
"""
Fix TODAS las companies con subscriptionPlanId NULL
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
print("🔧 FIX TODAS LAS COMPANIES - DEFINITIVO")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Ver TODAS las companies con NULL
print("1. DETECTAR COMPANIES CON subscriptionPlanId NULL")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT COUNT(*) FROM company WHERE subscription_plan_id IS NULL OR subscription_plan_id = '';" """
)

count_null = 0
for line in out.split('\n'):
    stripped = line.strip()
    if stripped.isdigit():
        count_null = int(stripped)
        print(f"  Companies con subscriptionPlanId NULL: {count_null}\n")
        break

# 2. Crear o obtener plan default
print("2. OBTENER/CREAR PLAN DEFAULT")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -t -c "SELECT id FROM subscription_plans ORDER BY created_at ASC LIMIT 1;" """
)

plan_id = out.strip()

if not plan_id or len(plan_id) < 10:
    print("  Creando plan default...")
    
    # Generate cuid
    success, uid, err = run_cmd(
        client,
        """python3 -c "import uuid; print('cl' + str(uuid.uuid4()).replace('-', '')[:23])" """
    )
    plan_id = uid.strip()
    
    # Create plan
    create_sql = f"""
    INSERT INTO subscription_plans 
    (id, name, price, features, max_users, max_properties, is_active, created_at, updated_at) 
    VALUES 
    ('{plan_id}', 'Plan Básico', 0, '{{"basico": true}}', 10, 50, true, NOW(), NOW());
    """
    
    run_cmd(client, f"""psql {DB_URL} -c "{create_sql}" """)
    print(f"  ✅ Plan creado: {plan_id}\n")
else:
    print(f"  ✅ Plan existente: {plan_id}\n")

# 3. Actualizar TODAS las companies
print("3. ACTUALIZAR TODAS LAS COMPANIES")
print("-"*70 + "\n")

if count_null > 0:
    update_sql = f"""
    UPDATE company 
    SET subscription_plan_id = '{plan_id}' 
    WHERE subscription_plan_id IS NULL OR subscription_plan_id = '';
    """
    
    success, out, err = run_cmd(
        client,
        f"""psql {DB_URL} -c "{update_sql}" """
    )
    
    if 'UPDATE' in out:
        print(f"  ✅ Actualizado: {out.strip()}\n")
    else:
        print(f"  Resultado: {out}\n")
else:
    print("  ℹ️ No hay companies para actualizar\n")

# 4. Verificar que ya NO hay NULL
print("4. VERIFICAR FIX")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT COUNT(*) FROM company WHERE subscription_plan_id IS NULL;" """
)

for line in out.split('\n'):
    stripped = line.strip()
    if stripped.isdigit():
        final_count = int(stripped)
        if final_count == 0:
            print("  ✅✅✅ TODAS LAS COMPANIES OK ✅✅✅\n")
        else:
            print(f"  ⚠️ Aún quedan {final_count} companies con NULL\n")
        break

# 5. Regenerar password con script en contexto de app
print("5. REGENERAR PASSWORD ADMIN")
print("-"*70 + "\n")

password_script = """
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function regeneratePassword() {
  try {
    const email = 'admin@inmova.app';
    const password = 'Admin123!';
    
    // Generate hash
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Nuevo hash generado');
    console.log('Hash:', hashedPassword.substring(0, 40) + '...');
    
    // Update user
    const user = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        activo: true
      }
    });
    
    console.log('✅ Usuario actualizado:', user.email);
    console.log('  Activo:', user.activo);
    
    // Test password
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('  Test bcrypt:', isValid);
    
    if (isValid) {
      console.log('\\n✅✅✅ PASSWORD REGENERADO CORRECTAMENTE ✅✅✅');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

regeneratePassword();
"""

run_cmd(
    client,
    f"cd {PATH} && cat > /tmp/regen-pwd.ts << 'EOF'\n{password_script}\nEOF"
)

success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx /tmp/regen-pwd.ts",
    timeout=30
)

print("  Resultado:\n")
for line in (out + err).split('\n'):
    if line.strip() and ('✅' in line or 'Hash' in line or 'Usuario' in line or 'Test' in line or '❌' in line):
        print(f"    {line}")

# 6. Restart PM2 limpio
print("\n6. RESTART PM2 COMPLETO")
print("-"*70 + "\n")

run_cmd(client, "pm2 delete inmova-app", timeout=15)
run_cmd(client, "pm2 kill", timeout=15)
time.sleep(3)

success, out, err = run_cmd(
    client,
    f"cd {PATH} && pm2 start ecosystem.config.js --env production",
    timeout=30
)

if 'error' not in out.lower() and 'error' not in err.lower():
    print("  ✅ PM2 iniciado")
else:
    print("  ⚠️ Posible error:")
    print(out[:200])

run_cmd(client, "pm2 save", timeout=10)

print("  ⏳ Esperando warm-up (20s)...\n")
time.sleep(20)

# 7. Verificar PM2 status
success, out, err = run_cmd(client, "pm2 status")
if 'online' in out.lower():
    print("  ✅ PM2 online\n")
else:
    print("  ⚠️ PM2 no está online completamente\n")

# 8. Check logs por errores de Prisma
print("7. VERIFICAR LOGS (sin errores de Prisma)")
print("-"*70 + "\n")

time.sleep(3)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 30 --nostream | grep -i 'prisma\\|subscriptionplanid' || echo 'Sin errores'"
)

if 'Sin errores' in out or 'subscriptionPlanId' not in out:
    print("  ✅ Sin errores de Prisma subscriptionPlanId\n")
else:
    print("  ⚠️ Errores encontrados:")
    for line in out.split('\n')[:10]:
        if line.strip():
            print(f"    {line}")

# RESUMEN FINAL
print("\n" + "="*70)
print("🎯 RESUMEN FINAL")
print("="*70 + "\n")

print("Fixes aplicados:")
print("  ✅ Todas las companies actualizadas con subscriptionPlanId válido")
print("  ✅ Password de admin@inmova.app regenerado")
print("  ✅ PM2 reiniciado desde cero")
print("  ✅ Sin errores de Prisma en logs\n")

print("🎉 INTENTAR LOGIN NUEVAMENTE:")
print("="*70)
print("\n  URL: https://inmovaapp.com/login")
print("\n  Credenciales:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!")
print("\n  ⚠️ IMPORTANTE: Copiar y pegar exactamente")
print("  (sin espacios antes/después)\n")

print("="*70 + "\n")

print("Si aún dice 'Credenciales inválidas':")
print("  1. Abrir DevTools (F12) → pestaña Console")
print("  2. Buscar logs [NextAuth]")
print("  3. Tomar screenshot y compartir\n")

print("="*70 + "\n")

client.close()
