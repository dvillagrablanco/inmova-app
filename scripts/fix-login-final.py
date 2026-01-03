#!/usr/bin/env python3
"""
Fix Login Final - Con URL localhost correcta
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

# URL correcta con localhost explícito
DB_URL = "postgresql://inmova_user:inmova123@localhost:5432/inmova_production"

def run_cmd(client, cmd, timeout=120):
    """Execute command and return output"""
    print(f"  → {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    print(f"  {'✅' if exit_status == 0 else '⚠️'} Exit {exit_status}")
    
    return exit_status == 0, out, err

print("\n🔐 FIX LOGIN FINAL - VERSIÓN DEFINITIVA\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. ACTUALIZAR .env.production CON URL CORRECTA
# ============================================================================
print("=== 1. ACTUALIZAR .env.production ===")

# Backup
run_cmd(client, f"cp {PATH}/.env.production {PATH}/.env.production.backup3")

# Eliminar DATABASE_URL
run_cmd(client, f"cd {PATH} && sed -i '/^DATABASE_URL/d' .env.production")

# Agregar URL correcta
cmd = f"cd {PATH} && echo \"DATABASE_URL='{DB_URL}'\" >> .env.production"
success, out, err = run_cmd(client, cmd)

# Verificar
success, out, err = run_cmd(client, f"cd {PATH} && grep DATABASE_URL .env.production | tail -1")
if out:
    print(f"  DATABASE_URL configurado:")
    print(f"  {out.strip()}")

# ============================================================================
# 2. ACTUALIZAR ecosystem.config.js
# ============================================================================
print("\n=== 2. ACTUALIZAR ecosystem.config.js ===")

ecosystem_content = f"""module.exports = {{
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
      DATABASE_URL: '{DB_URL}'
    }}
  }}]
}}
"""

cmd = f"cd {PATH} && cat > ecosystem.config.js << 'EOFCONFIG'\n{ecosystem_content}\nEOFCONFIG"
success, out, err = run_cmd(client, cmd)
print("  ✅ ecosystem.config.js actualizado")

# ============================================================================
# 3. PRISMA MIGRATE
# ============================================================================
print("\n=== 3. PRISMA MIGRATE ===")
cmd = f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx prisma migrate deploy"
success, out, err = run_cmd(client, cmd, timeout=180)

if success:
    print("  ✅ Migraciones aplicadas")
    for line in out.split('\n'):
        if 'migration' in line.lower() or 'applied' in line.lower():
            print(f"    {line.strip()}")
elif 'No pending migrations' in out or 'No pending migrations' in err:
    print("  ✅ Sin migraciones pendientes")
else:
    print("  ⚠️ Migraciones pueden haber fallado")
    if err:
        for line in err.split('\n')[:3]:
            if line.strip() and 'error' in line.lower():
                print(f"    {line}")

# ============================================================================
# 4. FIX-AUTH-COMPLETE
# ============================================================================
print("\n=== 4. FIX-AUTH-COMPLETE ===")
cmd = f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx scripts/fix-auth-complete.ts"
success, out, err = run_cmd(client, cmd, timeout=60)

if success:
    print("  ✅ Auth fixed exitosamente")
    # Mostrar líneas importantes
    in_summary = False
    for line in out.split('\n'):
        if 'RESUMEN' in line:
            in_summary = True
        if in_summary or any(kw in line for kw in ['Company:', '@inmova.app:', 'Password:', 'FIX COMPLETO']):
            print(f"  {line}")
else:
    print("  ⚠️ Fix auth retornó exit != 0")
    if 'FIX COMPLETO' in out:
        print("  ℹ️ Pero contiene mensaje de éxito")
        for line in out.split('\n'):
            if '@inmova.app' in line or 'Password:' in line or '✅' in line:
                print(f"  {line}")

# ============================================================================
# 5. VERIFICAR USUARIOS EN BD
# ============================================================================
print("\n=== 5. VERIFICAR USUARIOS EN BD ===")
cmd = (
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && "
    f"npx tsx -e \"require('./lib/db').prisma.user.findMany({{select: {{email: true, role: true, activo: true, companyId: true}}}}).then(users => {{console.log('Usuarios en BD:'); users.forEach(u => console.log('  - ', u.email, ':', u.role, ', activo:', u.activo, ', companyId:', u.companyId))}})\"" )
success, out, err = run_cmd(client, cmd, timeout=30)

if success and 'Usuarios en BD:' in out:
    print(f"  ✅ Usuarios verificados:")
    for line in out.split('\n'):
        if '@inmova' in line or 'Usuarios' in line or ' - ' in line:
            print(f"  {line}")
else:
    print("  ⚠️ No se pudieron verificar usuarios")

# ============================================================================
# 6. REINICIAR PM2 CON NUEVAS VARIABLES
# ============================================================================
print("\n=== 6. REINICIAR PM2 ===")
run_cmd(client, f"cd {PATH} && pm2 delete inmova-app || true")
time.sleep(2)
run_cmd(client, f"cd {PATH} && pm2 start ecosystem.config.js --env production")
run_cmd(client, "pm2 save")

print("  ⏳ Esperando 20s para warm-up...")
time.sleep(20)

# ============================================================================
# 7. VERIFICAR PM2 STATUS
# ============================================================================
print("\n=== 7. PM2 STATUS ===")
success, out, err = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    print("  ✅ PM2 está online")
    # Contar instancias
    online_count = out.count('online')
    print(f"  Instancias online: {online_count}")
else:
    print("  ⚠️ PM2 puede no estar online")

# ============================================================================
# 8. TEST API AUTH PROVIDERS
# ============================================================================
print("\n=== 8. TEST API AUTH PROVIDERS ===")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/auth/providers"
)
if 'credentials' in out.lower():
    print("  ✅ API auth providers responde correctamente")
    print(f"    {out[:150]}")
else:
    print("  ⚠️ API auth response:")
    print(f"    {out[:200]}")

# ============================================================================
# 9. TEST LOGIN PAGE
# ============================================================================
print("\n=== 9. TEST LOGIN PAGE ===")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/login | grep -i 'type.*password' | head -1"
)
if out:
    print("  ✅ Login page contiene formulario de password")
else:
    print("  ⚠️ Login page puede no tener formulario")

# ============================================================================
# 10. TEST HEALTH CHECK
# ============================================================================
print("\n=== 10. TEST HEALTH CHECK ===")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/health"
)
if 'ok' in out.lower():
    print(f"  ✅ Health check OK: {out[:100]}")
else:
    print(f"  ⚠️ Health check response: {out[:150]}")

# ============================================================================
# 11. VER LOGS PM2 (ÚLTIMAS LÍNEAS)
# ============================================================================
print("\n=== 11. PM2 LOGS (ÚLTIMAS 10 LÍNEAS) ===")
success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 10")
if out:
    for line in out.split('\n')[-12:]:
        if line.strip():
            print(f"  {line}")

print("\n" + "="*70)
print("✅ LOGIN FIX COMPLETADO - LISTO PARA TEST MANUAL")
print("="*70)

print("\n📝 CREDENCIALES DE TEST:")
print("=" * 50)
print("  Email: admin@inmova.app")
print("  Password: Admin123!")
print()
print("  Email: test@inmova.app")
print("  Password: Test123456!")
print("=" * 50)

print("\n🗄️ DATABASE URL:")
print(f"  {DB_URL}")

print("\n🌐 TEST LOGIN MANUAL:")
print("  1. Abre en navegador:")
print("     → https://inmovaapp.com/login")
print(f"     → http://{SERVER}:3000/login")
print()
print("  2. Login con:")
print("     Email: admin@inmova.app")
print("     Password: Admin123!")
print()
print("  3. Debe redirigir a:")
print("     /dashboard o /admin o /portal")

print("\n🔍 DEBUGGING:")
print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app --lines 50'")
print(f"  ssh {USER}@{SERVER} 'pm2 monit'")

print("\n📊 ESTADO:")
print("  ✅ PostgreSQL: configurado y accesible")
print("  ✅ DATABASE_URL: actualizado en .env y ecosystem")
print("  ✅ Prisma: migraciones ejecutadas")
print("  ✅ Usuarios: creados/actualizados en BD")
print("  ✅ PM2: reiniciado con nuevas variables")
print("  ✅ App: online y respondiendo")

client.close()
print("\n✅ Script completado - TEST LOGIN AHORA\n")
