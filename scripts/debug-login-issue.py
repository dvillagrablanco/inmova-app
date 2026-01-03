#!/usr/bin/env python3
"""
Debug Login Issue - Diagnóstico completo
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko
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
print("🔍 DEBUG LOGIN ISSUE")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# 1. VERIFICAR VARIABLES DE ENTORNO
print("="*70)
print("1. VARIABLES DE ENTORNO")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && grep -E 'NEXTAUTH_URL|NEXTAUTH_SECRET|DATABASE_URL' .env.production"
)
print("  Variables en .env.production:")
for line in out.split('\n'):
    if line.strip() and not 'DATABASE_URL' in line:  # No mostrar DB_URL completa
        if 'NEXTAUTH_SECRET' in line:
            print(f"    NEXTAUTH_SECRET=*** (configurada)")
        else:
            print(f"    {line}")
    elif 'DATABASE_URL' in line:
        print(f"    DATABASE_URL=postgresql://... (configurada)")

# 2. VERIFICAR PM2 ENV
print("\n" + "="*70)
print("2. PM2 ENVIRONMENT")
print("="*70 + "\n")

success, out, err = run_cmd(client, "pm2 env 0 | grep -E 'NEXTAUTH|DATABASE'")
print("  Variables PM2:")
for line in out.split('\n')[:10]:
    if line.strip():
        print(f"    {line}")

# 3. VERIFICAR USUARIOS EN BD
print("\n" + "="*70)
print("3. USUARIOS EN BASE DE DATOS")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx -e \"require('./lib/db').prisma.user.findMany({{select:{{email:true,activo:true,role:true,password:true}}}}).then(u=>console.log(JSON.stringify(u,null,2)))\""
)

if success and out:
    try:
        # Parsear JSON de usuarios
        users_text = out.split('[Prisma]')[-1].strip()
        if users_text:
            print("  Usuarios encontrados:")
            import json
            users = json.loads(users_text)
            for user in users:
                password_len = len(user.get('password', '')) if user.get('password') else 0
                print(f"    Email: {user['email']}")
                print(f"      Activo: {user['activo']}")
                print(f"      Role: {user['role']}")
                print(f"      Password: {'✅ Hasheado' if password_len > 20 else '❌ Incorrecto'} ({password_len} chars)")
                print()
    except:
        print("  Error parseando usuarios:")
        print(out[:500])

# 4. TEST DE LOGIN PAGE
print("\n" + "="*70)
print("4. TEST LOGIN PAGE")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login"
)
print(f"  HTTP Status: {out}")

# Ver si tiene el formulario
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/login | grep -o 'input.*email' | head -3"
)
if 'email' in out:
    print("  ✅ Formulario de email presente")
else:
    print("  ⚠️ Formulario puede no estar presente")

# 5. TEST DE API AUTH
print("\n" + "="*70)
print("5. TEST API AUTH")
print("="*70 + "\n")

# Verificar providers
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/auth/providers"
)
print("  Providers disponibles:")
print(f"    {out[:200]}")

# 6. LOGS DE AUTENTICACIÓN
print("\n" + "="*70)
print("6. LOGS PM2 (ÚLTIMOS 30)")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --nostream --lines 30 | grep -i 'auth\\|login\\|error\\|POST' || pm2 logs inmova-app --nostream --lines 30"
)
for line in out.split('\n')[-30:]:
    if line.strip():
        print(f"  {line}")

# 7. TEST DE LOGIN REAL
print("\n" + "="*70)
print("7. TEST DE LOGIN SIMULADO")
print("="*70 + "\n")

print("  Intentando login con admin@inmova.app...")

# Obtener CSRF token primero
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
        print(f"  ✅ CSRF Token obtenido: {csrf_token[:20]}...")
except:
    print(f"  ⚠️ No se pudo obtener CSRF token")
    print(f"  Response: {out[:200]}")

# Intentar login
if csrf_token:
    login_cmd = f"""curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
-H 'Content-Type: application/json' \
-b /tmp/cookies.txt \
-d '{{"email":"admin@inmova.app","password":"Admin123!","csrfToken":"{csrf_token}","callbackUrl":"/dashboard","json":"true"}}' """
    
    success, out, err = run_cmd(client, login_cmd)
    print(f"\n  Login Response:")
    print(f"    {out[:500]}")

# 8. VERIFICAR ARCHIVO AUTH-OPTIONS
print("\n" + "="*70)
print("8. VERIFICAR AUTH-OPTIONS.TS")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && grep -n 'CredentialsProvider\\|signIn:' lib/auth-options.ts | head -20"
)
print("  Configuración de CredentialsProvider:")
for line in out.split('\n')[:10]:
    if line.strip():
        print(f"    {line}")

# 9. HEALTH CHECK
print("\n" + "="*70)
print("9. HEALTH CHECK GENERAL")
print("="*70 + "\n")

success, out, err = run_cmd(client, "curl -s http://localhost:3000/api/health")
print(f"  Health: {out[:200]}")

# 10. RESUMEN
print("\n" + "="*70)
print("📊 RESUMEN")
print("="*70 + "\n")

print("Revisar:")
print("  1. Usuarios en BD tienen password hasheado correctamente")
print("  2. NEXTAUTH_URL está configurado")
print("  3. NEXTAUTH_SECRET está configurado")
print("  4. Login page carga correctamente")
print("  5. API auth responde\n")

print("Siguiente paso:")
print("  → Si usuarios NO tienen password correcto: ejecutar fix-auth-complete.ts")
print("  → Si variables NO están configuradas: verificar .env.production")
print("  → Si login retorna error: revisar logs PM2 para detalles\n")

client.close()
print("✅ Debug completado\n")
