#!/usr/bin/env python3
"""
Configurar DATABASE_URL en servidor
Crítico según .cursorrules
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

def run_cmd(client, cmd, timeout=60):
    """Execute command and return output"""
    print(f"  → {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    print(f"  {'✅' if exit_status == 0 else '⚠️'} Exit {exit_status}")
    if exit_status != 0 and err:
        print(f"    {err[:200]}")
    
    return exit_status == 0, out, err

print("\n🗄️ CONFIGURAR DATABASE_URL\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. VERIFICAR SI EXISTE .env.production
# ============================================================================
print("=== 1. VERIFICAR .env.production ===")
success, out, err = run_cmd(client, f"test -f {PATH}/.env.production && echo 'EXISTS' || echo 'MISSING'")
exists = 'EXISTS' in out
print(f"  Archivo: {'.env.production' if exists else '❌ FALTA'}")

# ============================================================================
# 2. VERIFICAR CONTENIDO ACTUAL DE DATABASE_URL
# ============================================================================
print("\n=== 2. DATABASE_URL ACTUAL ===")
success, out, err = run_cmd(client, f"cd {PATH} && grep '^DATABASE_URL' .env.production || echo 'NOT_FOUND'")
if 'NOT_FOUND' in out:
    print("  ⚠️ DATABASE_URL no encontrado en .env.production")
    current_url = None
elif out:
    current_url = out.strip()
    print(f"  Actual: {current_url}")
    if 'placeholder' in current_url or 'dummy' in current_url:
        print("  ⚠️ PLACEHOLDER detectado - CRÍTICO")
else:
    current_url = None
    print("  ⚠️ No se pudo leer")

# ============================================================================
# 3. VERIFICAR SI POSTGRESQL ESTÁ INSTALADO
# ============================================================================
print("\n=== 3. VERIFICAR POSTGRESQL ===")
success, out, err = run_cmd(client, "which psql")
if success:
    print("  ✅ PostgreSQL instalado")
    
    # Ver versión
    success, out, err = run_cmd(client, "psql --version")
    if out:
        print(f"  Versión: {out.strip()}")
    
    # Ver databases
    success, out, err = run_cmd(
        client,
        "sudo -u postgres psql -c '\\l' | grep inmova || echo 'DB_NOT_FOUND'"
    )
    if 'inmova' in out.lower():
        print("  ✅ Database 'inmova' existe")
    else:
        print("  ⚠️ Database 'inmova' NO existe")
        print("  📝 Se necesita crear BD")
else:
    print("  ❌ PostgreSQL NO instalado")

# ============================================================================
# 4. CREAR/CONFIGURAR DATABASE
# ============================================================================
print("\n=== 4. CONFIGURAR DATABASE ===")

# Crear database si no existe
print("  Creando database inmova_production...")
success, out, err = run_cmd(
    client,
    "sudo -u postgres psql -c \"CREATE DATABASE inmova_production;\" || echo 'ALREADY_EXISTS'"
)

# Crear usuario si no existe
print("  Creando usuario inmova_user...")
success, out, err = run_cmd(
    client,
    "sudo -u postgres psql -c \"CREATE USER inmova_user WITH PASSWORD 'inmova2024secure';\" || echo 'ALREADY_EXISTS'"
)

# Grant permissions
print("  Otorgando permisos...")
run_cmd(
    client,
    "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;\""
)

# Grant schema permissions
run_cmd(
    client,
    "sudo -u postgres psql -d inmova_production -c \"GRANT ALL ON SCHEMA public TO inmova_user;\""
)

# ============================================================================
# 5. ACTUALIZAR .env.production
# ============================================================================
print("\n=== 5. ACTUALIZAR .env.production ===")

new_url = "DATABASE_URL='postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production'"

# Backup de .env.production
run_cmd(client, f"cp {PATH}/.env.production {PATH}/.env.production.backup")

# Actualizar DATABASE_URL
cmd = f"cd {PATH} && sed -i '/^DATABASE_URL/d' .env.production && echo \"{new_url}\" >> .env.production"
success, out, err = run_cmd(client, cmd)

if success:
    print("  ✅ DATABASE_URL actualizado")
else:
    print("  ⚠️ Puede haber fallado")

# Verificar
success, out, err = run_cmd(client, f"cd {PATH} && grep DATABASE_URL .env.production")
if out:
    print(f"  Nuevo valor:\n  {out.strip()}")

# ============================================================================
# 6. EJECUTAR PRISMA MIGRATE
# ============================================================================
print("\n=== 6. EJECUTAR PRISMA MIGRATE ===")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && npx prisma migrate deploy",
    timeout=120
)
if success:
    print("  ✅ Migraciones aplicadas")
elif 'No pending migrations' in err or 'No pending migrations' in out:
    print("  ✅ Sin migraciones pendientes")
else:
    print(f"  ⚠️ Puede haber fallado:\n{err[:300]}")

# ============================================================================
# 7. EJECUTAR FIX-AUTH-COMPLETE
# ============================================================================
print("\n=== 7. EJECUTAR FIX-AUTH-COMPLETE ===")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && npx tsx scripts/fix-auth-complete.ts",
    timeout=60
)
if success and 'FIX COMPLETO' in out:
    print("  ✅ Auth fixed")
    # Mostrar resumen
    for line in out.split('\n'):
        if '✅' in line or 'RESUMEN' in line or '@inmova' in line:
            print(f"  {line}")
else:
    print(f"  ⚠️ Puede haber fallado")
    if out:
        print(f"  Output:\n{out[:500]}")
    if err:
        print(f"  Error:\n{err[:300]}")

# ============================================================================
# 8. REINICIAR PM2
# ============================================================================
print("\n=== 8. REINICIAR PM2 ===")
run_cmd(client, f"cd {PATH} && pm2 restart inmova-app --update-env")
run_cmd(client, "pm2 save")

print("\n" + "="*70)
print("✅ DATABASE_URL CONFIGURADO")
print("="*70)

print("\n📝 CREDENCIALES DE TEST:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!")
print("\n  Email: test@inmova.app")
print("  Password: Test123456!")

print("\n🌐 URLs:")
print("  → https://inmovaapp.com/login")
print(f"  → http://{SERVER}:3000/login")

print("\n🗄️ DATABASE INFO:")
print("  Host: localhost")
print("  Port: 5432")
print("  Database: inmova_production")
print("  User: inmova_user")

client.close()
print("\n✅ Script completado")
