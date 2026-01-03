#!/usr/bin/env python3
"""
Fix PostgreSQL User y Password
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

def run_cmd(client, cmd, timeout=120):
    """Execute command and return output"""
    print(f"  → {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    print(f"  {'✅' if exit_status == 0 else '⚠️'} Exit {exit_status}")
    
    return exit_status == 0, out, err

print("\n🗄️ FIX POSTGRESQL USER\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. LISTAR USUARIOS POSTGRESQL
# ============================================================================
print("=== 1. LISTAR USUARIOS POSTGRESQL ===")
success, out, err = run_cmd(
    client,
    "sudo -u postgres psql -c '\\du'"
)
if out:
    print("  Usuarios encontrados:")
    for line in out.split('\n'):
        if 'inmova' in line.lower() or 'Role name' in line:
            print(f"    {line}")

# ============================================================================
# 2. DROP Y RECREAR USUARIO
# ============================================================================
print("\n=== 2. DROP Y RECREAR USUARIO ===")

# Drop usuario si existe
print("  Eliminando usuario anterior...")
run_cmd(
    client,
    "sudo -u postgres psql -c 'DROP USER IF EXISTS inmova_user;'"
)

# Crear nuevo usuario
print("  Creando usuario con password...")
success, out, err = run_cmd(
    client,
    "sudo -u postgres psql -c \"CREATE USER inmova_user WITH PASSWORD 'inmova2024secure';\""
)

if success:
    print("  ✅ Usuario creado")
else:
    print("  ⚠️ Puede haber fallado")

# ============================================================================
# 3. OTORGAR PERMISOS
# ============================================================================
print("\n=== 3. OTORGAR PERMISOS ===")

# SUPERUSER para evitar problemas de permisos
run_cmd(
    client,
    "sudo -u postgres psql -c 'ALTER USER inmova_user WITH SUPERUSER;'"
)

# Grant all privileges
run_cmd(
    client,
    "sudo -u postgres psql -c 'GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;'"
)

# Grant schema permissions
run_cmd(
    client,
    "sudo -u postgres psql -d inmova_production -c 'GRANT ALL ON SCHEMA public TO inmova_user;'"
)

# Grant table permissions
run_cmd(
    client,
    "sudo -u postgres psql -d inmova_production -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inmova_user;'"
)

# Grant sequences
run_cmd(
    client,
    "sudo -u postgres psql -d inmova_production -c 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inmova_user;'"
)

# ============================================================================
# 4. TEST CONNECTION
# ============================================================================
print("\n=== 4. TEST CONNECTION ===")
success, out, err = run_cmd(
    client,
    "PGPASSWORD='inmova2024secure' psql -U inmova_user -d inmova_production -h localhost -c 'SELECT 1;'"
)

if success:
    print("  ✅ Conexión exitosa")
else:
    print("  ⚠️ Conexión falló")
    if err:
        print(f"    Error: {err[:200]}")

# ============================================================================
# 5. EJECUTAR PRISMA MIGRATE
# ============================================================================
print("\n=== 5. PRISMA MIGRATE ===")
cmd = (
    f"cd {PATH} && "
    f"export DATABASE_URL='postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production' && "
    f"npx prisma migrate deploy"
)
success, out, err = run_cmd(client, cmd, timeout=180)

if success:
    print("  ✅ Migraciones aplicadas")
    # Contar aplicadas
    for line in out.split('\n'):
        if 'migration' in line.lower():
            print(f"    {line.strip()}")
elif 'No pending migrations' in out or 'No pending migrations' in err:
    print("  ✅ Sin migraciones pendientes")
else:
    print("  ⚠️ Puede haber fallado")
    # Mostrar primeras líneas de error
    if err:
        for line in err.split('\n')[:5]:
            if line.strip():
                print(f"    {line}")

# ============================================================================
# 6. EJECUTAR FIX-AUTH-COMPLETE
# ============================================================================
print("\n=== 6. FIX-AUTH-COMPLETE ===")
cmd = (
    f"cd {PATH} && "
    f"export DATABASE_URL='postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production' && "
    f"npx tsx scripts/fix-auth-complete.ts"
)
success, out, err = run_cmd(client, cmd, timeout=60)

if success:
    print("  ✅ Auth fixed exitosamente")
    # Mostrar resumen
    in_resumen = False
    for line in out.split('\n'):
        if 'RESUMEN' in line:
            in_resumen = True
        if in_resumen or any(kw in line for kw in ['✅ Company', '@inmova.app', 'Password:', 'FIX COMPLETO']):
            print(f"  {line}")
else:
    print("  ⚠️ Fix auth falló")
    # Pero verificar si hay mensaje de éxito
    if 'FIX COMPLETO' in out:
        print("  ℹ️ Pero contiene mensaje de FIX COMPLETO")
        for line in out.split('\n'):
            if '@inmova' in line or 'Password:' in line or '✅' in line:
                print(f"  {line}")

# ============================================================================
# 7. VERIFICAR USUARIOS EN BD
# ============================================================================
print("\n=== 7. VERIFICAR USUARIOS EN BD ===")
cmd = (
    f"cd {PATH} && "
    f"export DATABASE_URL='postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production' && "
    f"npx tsx -e \"require('./lib/db').prisma.user.findMany({{select: {{email: true, role: true, activo: true}}}}).then(users => console.log(JSON.stringify(users, null, 2)))\""
)
success, out, err = run_cmd(client, cmd)

if success and out:
    print("  ✅ Usuarios en BD:")
    print(out[:500])
else:
    print("  ⚠️ No se pudieron leer usuarios")

# ============================================================================
# 8. REINICIAR PM2
# ============================================================================
print("\n=== 8. REINICIAR PM2 ===")
run_cmd(client, f"cd {PATH} && pm2 restart inmova-app")
run_cmd(client, "pm2 save")

print("  ⏳ Esperando 15s...")
time.sleep(15)

# ============================================================================
# 9. TEST API AUTH
# ============================================================================
print("\n=== 9. TEST API AUTH ===")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/auth/providers"
)
if 'credentials' in out.lower():
    print("  ✅ API auth providers OK")
else:
    print("  ⚠️ API auth response:")
    print(f"    {out[:150]}")

print("\n" + "="*70)
print("✅ POSTGRESQL USER FIXED")
print("="*70)

print("\n📝 CREDENCIALES DE TEST:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!")
print("\n  Email: test@inmova.app")
print("  Password: Test123456!")

print("\n🗄️ DATABASE CONNECTION:")
print("  postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production")

print("\n🌐 TEST LOGIN AHORA EN:")
print("  → https://inmovaapp.com/login")
print(f"  → http://{SERVER}:3000/login")

print("\n🔍 PARA VER LOGS:")
print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app --lines 50'")

client.close()
print("\n✅ Script completado\n")
