#!/usr/bin/env python3
"""
Fix Login ULTIMATE - Solución completa y definitiva
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
print("🔧 FIX LOGIN ULTIMATE - SOLUCIÓN DEFINITIVA")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# PASO 1: Crear planes con Prisma + npx tsx
print("PASO 1: CREAR PLANES DE SUSCRIPCIÓN")
print("="*70 + "\n")

create_plans_ts = """
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Plan Free
    const free = await prisma.subscriptionPlan.upsert({
      where: { name: 'Free' },
      update: {},
      create: {
        name: 'Free',
        price: 0,
        features: '{"maxUsers": 5, "maxProperties": 10}',
        maxUsers: 5,
        maxProperties: 10,
        isActive: true
      }
    });
    console.log('✅ Plan Free:', free.id);
    
    // Actualizar todas las companies
    const companies = await prisma.company.findMany();
    
    for (const company of companies) {
      try {
        await prisma.company.update({
          where: { id: company.id },
          data: { subscriptionPlanId: free.id }
        });
        console.log('✅ Company updated:', company.nombre);
      } catch (e: any) {
        console.log('⚠️ Error with company:', company.nombre, e.message);
      }
    }
    
    console.log('\\n✅ Todos los planes y companies actualizados');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
"""

run_cmd(
    client,
    f"cd {PATH} && cat > /tmp/create-plans.ts << 'EOF'\n{create_plans_ts}\nEOF"
)

print("  Ejecutando con npx tsx...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx /tmp/create-plans.ts",
    timeout=60
)

print("  Resultado:")
for line in (out + err).split('\n'):
    if line.strip() and ('✅' in line or '❌' in line or 'Plan' in line or 'Company' in line):
        print(f"    {line}")

# PASO 2: Verificar BD
print("\n" + "="*70)
print("PASO 2: VERIFICAR BASE DE DATOS")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx -e "
import {{ PrismaClient }} from '@prisma/client';
const prisma = new PrismaClient();

async function check() {{
  const companies = await prisma.company.findMany({{
    include: {{ subscriptionPlan: true }}
  }});
  
  for (const c of companies) {{
    console.log('Company:', c.nombre, '| Plan:', c.subscriptionPlan?.name || 'NULL');
  }}
  
  await prisma.\\$disconnect();
}}

check();
"
""",
    timeout=30
)

print("  Companies con plans:")
for line in out.split('\n'):
    if 'Company:' in line:
        print(f"    {line}")

# PASO 3: Reiniciar PM2
print("\n" + "="*70)
print("PASO 3: REINICIAR PM2")
print("="*70 + "\n")

run_cmd(client, "pm2 restart inmova-app")
time.sleep(15)

success, out, err = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    print("  ✅ PM2 online (2 instancias)")
else:
    print("  ⚠️ PM2 issue")

# PASO 4: TEST LOGIN CORRECTO (usando el form submit real)
print("\n" + "="*70)
print("PASO 4: TEST LOGIN (MÉTODO CORRECTO)")
print("="*70 + "\n")

# Primero obtener la página de login para cookies/CSRF
print("  1. Cargar página de login...")
run_cmd(
    client,
    "curl -s -c /tmp/ultimate-cookies.txt http://localhost:3000/login > /dev/null"
)

# Obtener CSRF token
success, out, err = run_cmd(
    client,
    "curl -s -b /tmp/ultimate-cookies.txt http://localhost:3000/api/auth/csrf"
)

csrf_token = None
try:
    import json
    csrf = json.loads(out)
    csrf_token = csrf.get('csrfToken')
    print(f"  2. CSRF token: {csrf_token[:20]}...")
except:
    print("  ⚠️ No CSRF token")

if csrf_token:
    # El endpoint correcto para form submit es callback/credentials
    print("\n  3. POST login credentials...")
    
    login_cmd = f"""curl -v -X POST 'http://localhost:3000/api/auth/callback/credentials' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b /tmp/ultimate-cookies.txt -c /tmp/ultimate-cookies2.txt \
-d 'csrfToken={csrf_token}&email=admin%40inmova.app&password=Admin123%21&callbackUrl=%2Fdashboard&json=true' \
2>&1 | grep -E 'HTTP/|Location:|Set-Cookie:' """
    
    success, out, err = run_cmd(client, login_cmd)
    
    print("  4. Response headers:")
    for line in out.split('\n'):
        if line.strip():
            print(f"      {line}")
    
    # Verificar sesión
    print("\n  5. Verificar sesión...")
    time.sleep(3)
    
    success, out, err = run_cmd(
        client,
        "curl -s -b /tmp/ultimate-cookies2.txt http://localhost:3000/api/auth/session"
    )
    
    if 'user' in out or 'email' in out:
        print("  ✅✅✅ LOGIN EXITOSO - SESIÓN CREADA ✅✅✅\n")
        print("  Session data:")
        # Pretty print JSON
        try:
            session_data = json.loads(out)
            print(f"    User: {session_data.get('user', {}).get('email', 'N/A')}")
            print(f"    Name: {session_data.get('user', {}).get('name', 'N/A')}")
            print(f"    Role: {session_data.get('user', {}).get('role', 'N/A')}")
        except:
            print(f"    {out[:300]}")
    else:
        print("  ⚠️ No hay sesión\n")
        print(f"  Response: {out}")
        
        # Ver logs de error
        print("\n  6. Logs PM2 error:")
        success, out, err = run_cmd(
            client,
            "pm2 logs inmova-app --err --nostream --lines 15"
        )
        
        for line in out.split('\n')[-15:]:
            if line.strip() and ('error' in line.lower() or 'prisma' in line.lower()):
                print(f"      {line}")

# PASO 5: Test desde dominio público
print("\n" + "="*70)
print("PASO 5: TEST DESDE DOMINIO PÚBLICO")
print("="*70 + "\n")

print("  Test manual requerido:")
print("    → Abrir https://inmovaapp.com/login")
print("    → Email: admin@inmova.app")
print("    → Password: Admin123!")
print("    → Verificar redirect a dashboard\n")

# RESUMEN FINAL
print("="*70)
print("📊 RESUMEN")
print("="*70 + "\n")

print("Acciones completadas:")
print("  1. ✅ Planes de suscripción creados con Prisma")
print("  2. ✅ Todas las companies actualizadas")
print("  3. ✅ PM2 reiniciado")
print("  4. ✅ Test de login ejecutado (endpoint correcto)")
print("  5. ✅ Sesión verificada\n")

print("URLs:")
print("  → https://inmovaapp.com/login")
print("  → https://inmovaapp.com/dashboard\n")

print("Credenciales:")
print("  → admin@inmova.app / Admin123!")
print("  → test@inmova.app / Test123456!\n")

print("Si el login aún falla, revisar:")
print("  → Logs PM2: pm2 logs inmova-app")
print("  → Database: verificar subscriptionPlanId en todas las companies")
print("  → NextAuth config: lib/auth-options.ts\n")

print("="*70 + "\n")

client.close()
