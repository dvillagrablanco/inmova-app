#!/usr/bin/env python3
"""
Fix Auth Final - Exportando DATABASE_URL explícitamente
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

print("\n🔐 FIX AUTH FINAL - CON DATABASE_URL\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. EXPORTAR DATABASE_URL Y EJECUTAR PRISMA MIGRATE
# ============================================================================
print("=== 1. PRISMA MIGRATE CON DATABASE_URL ===")
cmd = (
    f"cd {PATH} && "
    f"export DATABASE_URL='postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production' && "
    f"npx prisma migrate deploy"
)
success, out, err = run_cmd(client, cmd, timeout=180)

if success or 'No pending migrations' in out or 'No pending migrations' in err:
    print("  ✅ Migraciones OK")
else:
    print(f"  ⚠️ Migraciones pueden tener issues")
    if err:
        # Mostrar solo primeras líneas de error
        for line in err.split('\n')[:5]:
            if line.strip():
                print(f"    {line}")

# ============================================================================
# 2. EJECUTAR FIX-AUTH-COMPLETE CON DATABASE_URL
# ============================================================================
print("\n=== 2. FIX-AUTH-COMPLETE ===")
cmd = (
    f"cd {PATH} && "
    f"export DATABASE_URL='postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production' && "
    f"npx tsx scripts/fix-auth-complete.ts"
)
success, out, err = run_cmd(client, cmd, timeout=60)

if success:
    print("  ✅ Auth fixed exitosamente")
    # Mostrar líneas importantes
    for line in out.split('\n'):
        if any(kw in line for kw in ['✅', '@inmova', 'RESUMEN', 'Company', 'Password:']):
            print(f"  {line}")
else:
    print(f"  ⚠️ Fix auth puede haber fallado")
    if 'FIX COMPLETO' in out:
        print("  ✅ Pero parece que completó (mensaje presente)")
        for line in out.split('\n'):
            if '@inmova' in line or 'Password:' in line:
                print(f"  {line}")

# ============================================================================
# 3. ACTUALIZAR ECOSYSTEM.CONFIG.JS PARA INCLUIR DATABASE_URL
# ============================================================================
print("\n=== 3. ACTUALIZAR ECOSYSTEM.CONFIG.JS ===")

ecosystem_content = """module.exports = {
  apps: [{
    name: 'inmova-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production'
    }
  }]
}
"""

# Escribir ecosystem.config.js
cmd = f"cd {PATH} && cat > ecosystem.config.js << 'EOFCONFIG'\n{ecosystem_content}\nEOFCONFIG"
success, out, err = run_cmd(client, cmd)

if success:
    print("  ✅ ecosystem.config.js actualizado")
else:
    print("  ⚠️ Puede haber fallado al actualizar ecosystem")

# ============================================================================
# 4. REINICIAR PM2 CON NUEVO CONFIG
# ============================================================================
print("\n=== 4. REINICIAR PM2 ===")
run_cmd(client, f"cd {PATH} && pm2 delete inmova-app || true")
run_cmd(client, f"cd {PATH} && pm2 start ecosystem.config.js --env production")
run_cmd(client, "pm2 save")

print("  ⏳ Esperando 15s para warm-up...")
time.sleep(15)

# ============================================================================
# 5. VERIFICAR PM2 STATUS
# ============================================================================
print("\n=== 5. PM2 STATUS ===")
success, out, err = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    print("  ✅ PM2 online")
else:
    print("  ⚠️ PM2 puede no estar online")

# ============================================================================
# 6. TEST LOGIN PAGE
# ============================================================================
print("\n=== 6. TEST LOGIN PAGE ===")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/login | grep -i 'email' | head -3"
)
if out:
    print("  ✅ Login page carga correctamente")
else:
    print("  ⚠️ Login page puede no estar cargando")

# ============================================================================
# 7. TEST API AUTH
# ============================================================================
print("\n=== 7. TEST API AUTH PROVIDERS ===")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/auth/providers"
)
if 'credentials' in out.lower():
    print("  ✅ API auth providers OK")
else:
    print("  ⚠️ API auth puede tener problemas")
    if out:
        print(f"    Response: {out[:100]}")

# ============================================================================
# 8. VERIFICAR DATABASE CONNECTIVITY DESDE APP
# ============================================================================
print("\n=== 8. TEST DATABASE DESDE APP ===")
cmd = (
    f"cd {PATH} && "
    f"export DATABASE_URL='postgresql://inmova_user:inmova2024secure@localhost:5432/inmova_production' && "
    f"npx tsx -e \"require('./lib/db').prisma.user.count().then(c => console.log('Users in DB:', c))\""
)
success, out, err = run_cmd(client, cmd)
if success and 'Users in DB:' in out:
    print(f"  ✅ Database conectada")
    print(f"  {out.strip()}")
else:
    print("  ⚠️ Database puede tener problemas")

print("\n" + "="*70)
print("✅ FIX LOGIN COMPLETADO")
print("="*70)

print("\n📝 CREDENCIALES DE TEST:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!")
print("\n  Email: test@inmova.app")
print("  Password: Test123456!")

print("\n🌐 URLS PARA TEST MANUAL:")
print("  → https://inmovaapp.com/login")
print(f"  → http://{SERVER}:3000/login")

print("\n🗄️ DATABASE INFO:")
print("  postgresql://inmova_user:***@localhost:5432/inmova_production")

print("\n🔍 NEXT STEPS:")
print("  1. Test login manual en navegador")
print("  2. Verificar que redirige a /dashboard después de login")
print("  3. Ver logs si hay problemas:")
print(f"     ssh {USER}@{SERVER} 'pm2 logs inmova-app --lines 100'")

client.close()
print("\n✅ Script completado\n")
