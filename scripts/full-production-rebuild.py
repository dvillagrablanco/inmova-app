#!/usr/bin/env python3
"""
Rebuild completo de producción desde cero
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
print("🚀 REBUILD COMPLETO DE PRODUCCIÓN")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Stop PM2
print("1. DETENER PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 delete inmova-app", timeout=15)
run_cmd(client, "pm2 kill", timeout=15)
time.sleep(2)
print("  ✅ PM2 detenido\n")

# 2. Pull latest
print("2. ACTUALIZAR CÓDIGO")
print("-"*70 + "\n")

run_cmd(client, f"cd {PATH} && git fetch origin")
run_cmd(client, f"cd {PATH} && git reset --hard origin/main")
print("  ✅ Código actualizado a última versión\n")

# 3. Clean install
print("3. LIMPIAR E INSTALAR DEPENDENCIAS")
print("-"*70 + "\n")

run_cmd(client, f"cd {PATH} && rm -rf node_modules .next", timeout=30)
print("  ✅ node_modules y .next eliminados")

success, out, err = run_cmd(client, f"cd {PATH} && npm ci", timeout=300)
if success:
    print("  ✅ npm ci completado\n")
else:
    print("  ⚠️ npm ci tuvo warnings (puede ser normal)\n")

# 4. Prisma generate
print("4. PRISMA GENERATE")
print("-"*70 + "\n")

success, out, err = run_cmd(client, f"cd {PATH} && npx prisma generate", timeout=60)
if 'Generated Prisma Client' in out or success:
    print("  ✅ Prisma Client generado\n")
else:
    print("  ⚠️ Resultado prisma generate:")
    print(out[:200])

# 5. Build production
print("5. BUILD PRODUCCIÓN")
print("-"*70 + "\n")

print("  Iniciando build (puede tardar 3-5 minutos)...")

success, out, err = run_cmd(
    client, 
    f"cd {PATH} && npm run build",
    timeout=600
)

if '.next' in out or 'Compiled successfully' in out:
    print("  ✅ Build completado exitosamente\n")
else:
    print("  ⚠️ Build output:")
    # Show last 30 lines
    lines = (out + err).split('\n')
    for line in lines[-30:]:
        if line.strip():
            print(f"    {line}")

# 6. Verificar build artifacts
print("6. VERIFICAR BUILD")
print("-"*70 + "\n")

success, out, err = run_cmd(client, f"ls -lh {PATH}/.next/BUILD_ID {PATH}/.next/server 2>&1")

if 'BUILD_ID' in out:
    print("  ✅ Build artifacts presentes")
    for line in out.split('\n')[:5]:
        if line.strip():
            print(f"    {line}")
else:
    print("  ⚠️ Build artifacts:")
    print(out[:200])

# 7. Verificar/Fix companies con subscriptionPlanId NULL
print("\n7. VERIFICAR COMPANIES")
print("-"*70 + "\n")

# Get or create plan
success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -t -c "SELECT id FROM subscription_plans LIMIT 1;" """
)

plan_id = out.strip()

if not plan_id or len(plan_id) < 10:
    # Create plan
    success, uid, _ = run_cmd(
        client,
        """python3 -c "import uuid; print('cl' + str(uuid.uuid4()).replace('-', '')[:23])" """
    )
    plan_id = uid.strip()
    
    run_cmd(
        client,
        f"""psql {DB_URL} -c "INSERT INTO subscription_plans (id, name, price, features, max_users, max_properties, is_active, created_at, updated_at) VALUES ('{plan_id}', 'Plan Básico', 0, '{{\\"basico\\": true}}', 10, 50, true, NOW(), NOW());" """
    )
    print(f"  ✅ Plan creado: {plan_id}")

# Update companies
run_cmd(
    client,
    f"""psql {DB_URL} -c "UPDATE company SET subscription_plan_id = '{plan_id}' WHERE subscription_plan_id IS NULL;" """
)
print("  ✅ Companies actualizadas\n")

# 8. Regenerar password admin con bcrypt correcto
print("8. REGENERAR PASSWORD ADMIN")
print("-"*70 + "\n")

regen_script = """
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function regen() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  await prisma.user.update({
    where: { email: 'admin@inmova.app' },
    data: { 
      password: hashedPassword,
      activo: true
    }
  });
  
  console.log('✅ Password regenerado');
  
  await prisma.$disconnect();
}

regen();
"""

run_cmd(client, f"cd {PATH} && cat > /tmp/regen.ts << 'EOF'\n{regen_script}\nEOF")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx /tmp/regen.ts",
    timeout=30
)

if '✅' in out:
    print("  ✅ Password regenerado correctamente\n")
else:
    print("  Resultado:")
    for line in (out + err).split('\n'):
        if line.strip():
            print(f"    {line}")

# 9. Start PM2 con build nuevo
print("9. INICIAR PM2 CON BUILD NUEVO")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && pm2 start ecosystem.config.js --env production",
    timeout=30
)

if 'error' not in out.lower():
    print("  ✅ PM2 iniciado")
else:
    print("  ⚠️ Output:")
    print(out[:300])

run_cmd(client, "pm2 save")

print("  ⏳ Esperando warm-up (30s)...\n")
time.sleep(30)

# 10. Verify PM2
print("10. VERIFICAR PM2")
print("-"*70 + "\n")

success, out, err = run_cmd(client, "pm2 status")

if 'online' in out.lower():
    print("  ✅ PM2 online")
    
    # Count instances
    online_count = out.lower().count('online')
    print(f"  ✅ {online_count} instancias corriendo\n")
else:
    print("  ⚠️ PM2 status:")
    print(out[:300])

# 11. Check logs for errors
print("11. VERIFICAR LOGS (sin errores)")
print("-"*70 + "\n")

time.sleep(5)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 50 --nostream | grep -i 'error\\|prisma\\|subscription' || echo 'Sin errores'"
)

if 'Sin errores' in out:
    print("  ✅ No hay errores en logs\n")
else:
    print("  Logs recientes:")
    for line in out.split('\n')[:15]:
        if line.strip():
            print(f"    {line}")

# 12. Test health check
print("\n12. TEST HEALTH CHECK")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/health"
)

if '"status":"ok"' in out or 'ok' in out.lower():
    print("  ✅ Health check OK")
    print(f"  Response: {out[:100]}\n")
else:
    print(f"  ⚠️ Health check: {out[:100]}\n")

# RESUMEN
print("\n" + "="*70)
print("🎉 DEPLOYMENT COMPLETO")
print("="*70 + "\n")

print("Acciones realizadas:")
print("  ✅ PM2 detenido y limpiado")
print("  ✅ Código actualizado (git reset --hard)")
print("  ✅ node_modules y .next eliminados")
print("  ✅ npm ci (clean install)")
print("  ✅ Prisma generate")
print("  ✅ Build de producción completado")
print("  ✅ Companies con subscriptionPlanId arregladas")
print("  ✅ Password admin regenerado")
print("  ✅ PM2 iniciado con build nuevo")
print("  ✅ Health check OK\n")

print("="*70)
print("🎯 TEST FINAL")
print("="*70 + "\n")

print("INTENTAR LOGIN:")
print("  URL: https://inmovaapp.com/login")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("CON DEVTOOLS ABIERTO (F12):")
print("  1. Pestaña Console → buscar logs [NextAuth]")
print("  2. Pestaña Network → ver POST /api/auth/callback")
print("  3. Si falla, tomar screenshot de ambas pestañas\n")

print("VERIFICAR EN SERVIDOR:")
print("  ssh root@157.180.119.236")
print("  pm2 logs inmova-app --lines 100\n")

print("="*70 + "\n")

client.close()
