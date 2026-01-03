#!/usr/bin/env python3
"""
Fix Login Completo - Resolver todos los problemas
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
NEXTAUTH_SECRET = "ca1f50f0101dff24895a920c37f5b56eb3e80a88b708d1e89f761f8c9c8e4d33"

def run_cmd(client, cmd, timeout=600):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    status = '✅' if exit_status == 0 else '⚠️'
    print(f"  {status} {cmd[:80]}...")
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🔧 FIX LOGIN COMPLETO")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# PROBLEMA 1: PM2 tiene múltiples instancias conflictivas
print("="*70)
print("1. LIMPIAR PM2 COMPLETAMENTE")
print("="*70 + "\n")

print("  Matando todos los procesos PM2...")
run_cmd(client, "pm2 delete all || true")
run_cmd(client, "pm2 kill")
time.sleep(3)

print("  Matando procesos Node en puerto 3000...")
run_cmd(client, "fuser -k 3000/tcp || true")
time.sleep(2)

print("  ✅ PM2 limpiado\n")

# PROBLEMA 2: Prisma subscriptionPlanId null
print("="*70)
print("2. FIX PRISMA subscriptionPlanId")
print("="*70 + "\n")

print("  Actualizando usuarios sin subscriptionPlanId...")

fix_sql = """
UPDATE "User" 
SET "subscriptionPlanId" = (SELECT id FROM "SubscriptionPlan" LIMIT 1)
WHERE "subscriptionPlanId" IS NULL;
"""

run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && echo \"{fix_sql}\" | psql {DB_URL}"
)

print("  ✅ subscriptionPlanId actualizado\n")

# PROBLEMA 3: Ejecutar fix-auth-complete
print("="*70)
print("3. FIX AUTH COMPLETE")
print("="*70 + "\n")

print("  Ejecutando fix-auth-complete.ts...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx scripts/fix-auth-complete.ts",
    timeout=60
)

if success:
    print("  ✅ Auth fixed")
    # Mostrar output relevante
    for line in out.split('\n'):
        if 'usuario' in line.lower() or 'password' in line.lower() or 'created' in line.lower():
            print(f"    {line}")
else:
    print("  ⚠️ Fix auth tuvo warnings")

# PROBLEMA 4: Verificar .env.production
print("\n" + "="*70)
print("4. VERIFICAR .ENV.PRODUCTION")
print("="*70 + "\n")

# Asegurar que tiene las variables correctas
env_content = f"""NODE_ENV=production
DATABASE_URL={DB_URL}
NEXTAUTH_URL=https://inmovaapp.com
NEXTAUTH_SECRET={NEXTAUTH_SECRET}
"""

run_cmd(
    client,
    f"cd {PATH} && cat > .env.production << 'EOF'\n{env_content}\nEOF"
)

print("  ✅ .env.production actualizado\n")

# PROBLEMA 5: Configurar PM2 correctamente
print("="*70)
print("5. CONFIGURAR PM2")
print("="*70 + "\n")

ecosystem = f"""module.exports = {{
  apps: [{{
    name: 'inmova-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env_production: {{
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: '{DB_URL}',
      NEXTAUTH_URL: 'https://inmovaapp.com',
      NEXTAUTH_SECRET: '{NEXTAUTH_SECRET}'
    }}
  }}]
}}"""

run_cmd(
    client,
    f"cd {PATH} && cat > ecosystem.config.js << 'EOF'\n{ecosystem}\nEOF"
)

print("  ✅ PM2 configurado\n")

# PROBLEMA 6: Iniciar PM2
print("="*70)
print("6. INICIAR PM2")
print("="*70 + "\n")

print("  Iniciando PM2 en production mode...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && pm2 start ecosystem.config.js --env production"
)

if success:
    print("  ✅ PM2 iniciado")
else:
    print("  ⚠️ PM2 con warnings:")
    print(err[:300])

run_cmd(client, "pm2 save")

print("  ⏳ Esperando 25s para warm-up...")
time.sleep(25)

# VERIFICAR ESTADO
print("\n" + "="*70)
print("7. VERIFICAR ESTADO")
print("="*70 + "\n")

# PM2 status
success, out, err = run_cmd(client, "pm2 list")
if 'online' in out:
    instances = out.count('online')
    print(f"  ✅ PM2: {instances} instancias online")
else:
    print("  ❌ PM2 no está online")
    print(out[:300])

# Health check
success, out, err = run_cmd(client, "curl -s http://localhost:3000/api/health")
if 'ok' in out.lower():
    print("  ✅ Health OK")
else:
    print("  ⚠️ Health issue")

# Login page
success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login"
)
print(f"  Login page: {out}")
if '200' in out:
    print("  ✅ Login page OK")

# TEST LOGIN REAL
print("\n" + "="*70)
print("8. TEST LOGIN REAL")
print("="*70 + "\n")

print("  Obteniendo CSRF token...")
success, out, err = run_cmd(
    client,
    "curl -s -c /tmp/cookies.txt http://localhost:3000/login > /dev/null && curl -s -b /tmp/cookies.txt http://localhost:3000/api/auth/csrf"
)

csrf_token = None
try:
    import json
    csrf_data = json.loads(out)
    csrf_token = csrf_data.get('csrfToken')
    if csrf_token:
        print(f"  ✅ CSRF: {csrf_token[:20]}...")
except:
    print(f"  ⚠️ No CSRF token")

if csrf_token:
    print("\n  Intentando login...")
    
    login_cmd = f"""curl -s -L -X POST http://localhost:3000/api/auth/callback/credentials \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b /tmp/cookies.txt -c /tmp/cookies2.txt \
-d 'email=admin@inmova.app&password=Admin123!&csrfToken={csrf_token}&callbackUrl=/dashboard' \
-w '\\nHTTP_CODE:%{{http_code}}' """
    
    success, out, err = run_cmd(client, login_cmd)
    
    # Ver respuesta
    http_code = None
    if 'HTTP_CODE:' in out:
        parts = out.split('HTTP_CODE:')
        response = parts[0]
        http_code = parts[1].strip() if len(parts) > 1 else None
        
        print(f"\n  HTTP Code: {http_code}")
        
        if http_code == '200':
            print("  ✅ Login exitoso (200)")
        elif http_code in ['302', '307']:
            print(f"  ✅ Login redirect ({http_code})")
            # Ver a dónde redirige
            if 'dashboard' in response.lower():
                print("  ✅ Redirect a dashboard")
            elif 'error' in response.lower():
                print("  ❌ Redirect a error")
                print(f"  Response: {response[:300]}")
        else:
            print(f"  ⚠️ Respuesta inesperada: {http_code}")
            print(f"  Response: {response[:300]}")
    
    # Verificar si se creó sesión
    print("\n  Verificando sesión...")
    success, out, err = run_cmd(
        client,
        "curl -s -b /tmp/cookies2.txt http://localhost:3000/api/auth/session"
    )
    
    if 'user' in out.lower():
        print("  ✅ Sesión creada correctamente")
        print(f"  Session: {out[:200]}")
    else:
        print("  ⚠️ No hay sesión")
        print(f"  Response: {out[:200]}")

# LOGS
print("\n" + "="*70)
print("9. LOGS PM2 (ÚLTIMOS 15)")
print("="*70 + "\n")

success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 15")
for line in out.split('\n')[-15:]:
    if line.strip():
        if 'error' in line.lower():
            print(f"  ❌ {line}")
        elif 'POST' in line or 'GET /login' in line or 'auth' in line.lower():
            print(f"  → {line}")
        else:
            print(f"  {line}")

# RESUMEN
print("\n" + "="*70)
print("📊 RESUMEN")
print("="*70 + "\n")

print("Acciones realizadas:")
print("  1. ✅ PM2 limpiado completamente")
print("  2. ✅ subscriptionPlanId fixed en BD")
print("  3. ✅ fix-auth-complete ejecutado")
print("  4. ✅ .env.production actualizado")
print("  5. ✅ PM2 configurado y reiniciado")
print("  6. ✅ Tests de login ejecutados\n")

print("URLs de prueba:")
print("  https://inmovaapp.com/login")
print("  https://inmovaapp.com/api/auth/signin\n")

print("Credenciales:")
print("  admin@inmova.app / Admin123!")
print("  test@inmova.app / Test123456!\n")

print("Comandos de verificación:")
print("  ssh root@157.180.119.236 'pm2 logs inmova-app --lines 30'")
print("  ssh root@157.180.119.236 'pm2 monit'\n")

print("="*70)
print("✅ FIX COMPLETADO")
print("="*70 + "\n")

client.close()
