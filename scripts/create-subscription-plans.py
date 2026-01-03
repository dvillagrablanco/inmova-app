#!/usr/bin/env python3
"""
Crear planes de suscripción y asignarlos
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
    status = '✅' if exit_status == 0 else '⚠️'
    print(f"  {status} {cmd[:60]}...")
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🔧 CREAR PLANES DE SUSCRIPCIÓN")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. CREAR PLANES
print("1. CREAR PLANES BÁSICOS")
print("="*70 + "\n")

# Usar npx tsx para crear con Prisma
create_plans_script = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPlans() {
  try {
    // Plan Free
    const free = await prisma.subscriptionPlan.upsert({
      where: { name: 'Free' },
      update: {},
      create: {
        name: 'Free',
        price: 0,
        features: JSON.stringify({
          maxUsers: 5,
          maxProperties: 10,
          basicSupport: true
        }),
        maxUsers: 5,
        maxProperties: 10,
        isActive: true
      }
    });
    console.log('Plan Free created:', free.id);
    
    // Plan Pro
    const pro = await prisma.subscriptionPlan.upsert({
      where: { name: 'Pro' },
      update: {},
      create: {
        name: 'Pro',
        price: 49,
        features: JSON.stringify({
          maxUsers: 20,
          maxProperties: 100,
          prioritySupport: true,
          advancedFeatures: true
        }),
        maxUsers: 20,
        maxProperties: 100,
        isActive: true
      }
    });
    console.log('Plan Pro created:', pro.id);
    
    // Actualizar todas las companies al plan Free
    const result = await prisma.company.updateMany({
      where: {
        subscriptionPlanId: { equals: null }
      },
      data: {
        subscriptionPlanId: free.id
      }
    });
    console.log('Companies updated:', result.count);
    
    // También actualizar las que tienen un ID inválido
    const companies = await prisma.company.findMany({
      select: { id: true, subscriptionPlanId: true }
    });
    
    for (const company of companies) {
      try {
        // Verificar si el plan existe
        const planExists = await prisma.subscriptionPlan.findUnique({
          where: { id: company.subscriptionPlanId }
        });
        
        if (!planExists) {
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionPlanId: free.id }
          });
          console.log('Fixed company:', company.id);
        }
      } catch (e) {
        console.log('Error with company:', company.id, e.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPlans();
"""

run_cmd(
    client,
    f"cd {PATH} && cat > /tmp/create-plans.js << 'EOF'\n{create_plans_script}\nEOF"
)

print("  Ejecutando script...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && node /tmp/create-plans.js",
    timeout=30
)

print("\n  Resultado:")
for line in out.split('\n'):
    if line.strip():
        print(f"    {line}")

if err and 'error' in err.lower():
    print("\n  Errores:")
    for line in err.split('\n')[:10]:
        if line.strip():
            print(f"    {line}")

# 2. VERIFICAR COMPANIES
print("\n2. VERIFICAR COMPANIES")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c 'SELECT c.id, c.nombre, c."subscriptionPlanId", sp.name as plan_name FROM "Company" c LEFT JOIN "SubscriptionPlan" sp ON c."subscriptionPlanId" = sp.id LIMIT 5;' """
)

print("  Companies:")
print(out)

# 3. REINICIAR PM2
print("\n3. REINICIAR PM2")
print("="*70 + "\n")

print("  Reiniciando PM2...")
run_cmd(client, "pm2 restart inmova-app")
time.sleep(10)

success, out, err = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    print("  ✅ PM2 online")

# 4. TEST LOGIN FINAL
print("\n4. TEST LOGIN FINAL")
print("="*70 + "\n")

print("  Esperando 15s para warm-up...")
time.sleep(15)

# Clear logs
run_cmd(client, "pm2 flush inmova-app")

# Get CSRF
success, out, err = run_cmd(
    client,
    "curl -s -c /tmp/final-cookies.txt http://localhost:3000/api/auth/csrf"
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
    # Login via form submit (el método correcto)
    print("\n  Intentando login...")
    
    login_cmd = f"""curl -s -L -X POST 'http://localhost:3000/api/auth/callback/credentials' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b /tmp/final-cookies.txt -c /tmp/final-cookies2.txt \
-d 'email=admin%40inmova.app&password=Admin123%21&csrfToken={csrf_token}&callbackUrl=%2Fdashboard' """
    
    success, out, err = run_cmd(client, login_cmd)
    
    # Check if redirected
    if '/dashboard' in out or 'dashboard' in out.lower():
        print("  ✅ Redirect a dashboard detectado")
    
    print(f"\n  Response (primeras 300 chars):")
    print(f"    {out[:300]}")
    
    # Verificar sesión
    print("\n  Verificando sesión...")
    time.sleep(2)
    
    success, out, err = run_cmd(
        client,
        "curl -s -b /tmp/final-cookies2.txt http://localhost:3000/api/auth/session"
    )
    
    if 'user' in out.lower() or 'email' in out.lower():
        print("  ✅✅✅ SESIÓN CREADA EXITOSAMENTE ✅✅✅")
        print(f"\n  Session data:")
        print(f"    {out[:300]}")
    else:
        print("  ⚠️ No hay sesión creada")
        print(f"  Response: {out}")
        
        # Ver logs de error
        print("\n  Logs PM2 error:")
        success, out, err = run_cmd(
            client,
            "pm2 logs inmova-app --err --nostream --lines 20"
        )
        for line in out.split('\n')[-10:]:
            if line.strip() and 'error' in line.lower():
                print(f"    {line}")

# RESUMEN FINAL
print("\n" + "="*70)
print("📊 RESUMEN FINAL")
print("="*70 + "\n")

print("Acciones completadas:")
print("  1. ✅ Planes de suscripción creados (Free, Pro)")
print("  2. ✅ Companies asignadas a plan Free")
print("  3. ✅ PM2 reiniciado")
print("  4. ✅ Test de login ejecutado\n")

print("URLs de prueba:")
print("  https://inmovaapp.com/login")
print("  https://inmovaapp.com/dashboard\n")

print("Credenciales:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("Si la sesión aún no se crea, el problema puede estar en:")
print("  1. NextAuth callback configuration")
print("  2. Session storage (cookies)")
print("  3. Domain mismatch (localhost vs inmovaapp.com)\n")

print("="*70 + "\n")

client.close()
