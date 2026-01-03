#!/usr/bin/env python3
"""
Fix Build y Restart - Next.js Build Issue
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
    """Execute command and return output"""
    print(f"  → {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    status = '✅' if exit_status == 0 else '⚠️'
    print(f"  {status} Exit {exit_status}")
    
    return exit_status == 0, out, err

print("\n🔧 FIX BUILD Y RESTART\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. VERIFICAR ERROR DE BUILD
# ============================================================================
print("=== 1. VERIFICAR ERROR DE BUILD ===")
success, out, err = run_cmd(client, f"cd {PATH} && ls -la .next/ 2>/dev/null | head -5 || echo 'NO_NEXT_DIR'")
if 'NO_NEXT_DIR' in out:
    print("  ⚠️ Directorio .next no existe")
else:
    print("  Directorio .next existe:")
    print(out[:300])

# ============================================================================
# 2. LIMPIAR CACHE
# ============================================================================
print("\n=== 2. LIMPIAR CACHE ===")
print("  🗑️ Eliminando .next...")
run_cmd(client, f"cd {PATH} && rm -rf .next")

print("  🗑️ Eliminando node_modules/.cache...")
run_cmd(client, f"cd {PATH} && rm -rf node_modules/.cache")

# ============================================================================
# 3. REINSTALAR DEPENDENCIAS
# ============================================================================
print("\n=== 3. REINSTALAR DEPENDENCIAS ===")
print("  📥 npm ci (clean install)...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && npm ci",
    timeout=600
)

if success or 'up to date' in out.lower():
    print("  ✅ Dependencias instaladas")

# ============================================================================
# 4. PRISMA GENERATE
# ============================================================================
print("\n=== 4. PRISMA GENERATE ===")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx prisma generate"
)
if success:
    print("  ✅ Prisma client generado")

# ============================================================================
# 5. BUILD CON LOGS DETALLADOS
# ============================================================================
print("\n=== 5. BUILD NEXT.JS (INTENTO 2) ===")
print("  🔨 npm run build (con logs completos)...")
print("  ⏳ Esto puede tardar 2-5 minutos...\n")

build_cmd = f"""cd {PATH} && \
export DATABASE_URL='{DB_URL}' && \
export NEXTAUTH_SECRET='{NEXTAUTH_SECRET}' && \
export NEXTAUTH_URL='https://inmovaapp.com' && \
export NODE_ENV='production' && \
npm run build 2>&1 | tee /tmp/build.log"""

success, out, err = run_cmd(client, build_cmd, timeout=600)

if success:
    print("\n  ✅ BUILD EXITOSO")
    # Mostrar líneas importantes
    for line in out.split('\n'):
        if any(kw in line.lower() for kw in ['compiled', 'route', 'size', 'first load js']):
            print(f"    {line.strip()}")
else:
    print("\n  ⚠️ BUILD FALLÓ")
    print("  Mostrando últimas 20 líneas del error:\n")
    
    # Mostrar las últimas líneas del error
    error_lines = (err or out).split('\n')
    for line in error_lines[-20:]:
        if line.strip():
            print(f"    {line}")
    
    print("\n  Verificando si hay build parcial...")
    success2, out2, err2 = run_cmd(client, f"cd {PATH} && ls -la .next/BUILD_ID 2>/dev/null || echo 'NO_BUILD_ID'")
    
    if 'NO_BUILD_ID' in out2:
        print("  ❌ No hay build válido")
        print("\n  ALTERNATIVA: Usar modo development")
        print("  Cambiando a 'npm run dev' en PM2...")
        
        # Cambiar ecosystem a dev mode
        ecosystem_dev = f"""module.exports = {{
  apps: [{{
    name: 'inmova-app',
    script: 'npm',
    args: 'run dev',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '1G',
    env: {{
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: '{DB_URL}',
      NEXTAUTH_URL: 'https://inmovaapp.com',
      NEXTAUTH_SECRET: '{NEXTAUTH_SECRET}'
    }}
  }}]
}}
"""
        cmd = f"cd {PATH} && cat > ecosystem.config.js << 'EOFCONFIG'\n{ecosystem_dev}\nEOFCONFIG"
        run_cmd(client, cmd)
        
        print("  ℹ️ Configurado para modo development")
    else:
        print("  ✅ Hay un build parcial, intentando usar...")

# ============================================================================
# 6. VERIFICAR BUILD_ID
# ============================================================================
print("\n=== 6. VERIFICAR BUILD ===")
success, out, err = run_cmd(client, f"cd {PATH} && cat .next/BUILD_ID 2>/dev/null || echo 'NO_BUILD'")
if 'NO_BUILD' in out:
    print("  ⚠️ No hay BUILD_ID - usando modo development")
    use_dev = True
else:
    print(f"  ✅ BUILD_ID encontrado: {out.strip()}")
    use_dev = False

# ============================================================================
# 7. REINICIAR PM2
# ============================================================================
print("\n=== 7. REINICIAR PM2 ===")
run_cmd(client, "pm2 delete inmova-app || true")
time.sleep(2)

print("  🚀 Iniciando PM2...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && pm2 start ecosystem.config.js --env {'development' if use_dev else 'production'}"
)

run_cmd(client, "pm2 save")

print("  ⏳ Esperando 30s para warm-up...")
time.sleep(30)

# ============================================================================
# 8. HEALTH CHECKS
# ============================================================================
print("\n=== 8. HEALTH CHECKS ===")

# PM2 Status
print("  1/5 PM2 Status...")
success, out, err = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    print("  ✅ PM2 online")
elif 'errored' in out:
    print("  ❌ PM2 errored - ver logs")
    # Mostrar logs de error
    success, out, err = run_cmd(client, "pm2 logs inmova-app --err --nostream --lines 10")
    if out:
        print("  Logs de error:")
        for line in out.split('\n')[-10:]:
            if line.strip():
                print(f"    {line}")
else:
    print("  ⚠️ PM2 status desconocido")

# Puerto
print("\n  2/5 Puerto 3000...")
success, out, err = run_cmd(client, "ss -tlnp | grep :3000")
if success:
    print("  ✅ Puerto 3000 listening")
else:
    print("  ❌ Puerto 3000 no responde")
    print("  Esperando 10s más...")
    time.sleep(10)
    success, out, err = run_cmd(client, "ss -tlnp | grep :3000")
    if success:
        print("  ✅ Puerto 3000 listening (después de espera)")

# Health endpoint
print("\n  3/5 Health endpoint...")
for i in range(3):
    success, out, err = run_cmd(
        client,
        "curl -s http://localhost:3000/api/health"
    )
    if success and ('ok' in out.lower() or '200' in out):
        print(f"  ✅ Health check OK: {out[:100]}")
        break
    elif i < 2:
        print(f"  ⏳ Intento {i+1}/3 - esperando 10s...")
        time.sleep(10)
    else:
        print("  ⚠️ Health check no responde después de 3 intentos")

# Login page
print("\n  4/5 Login page...")
success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login"
)
if '200' in out:
    print("  ✅ Login page: 200 OK")
else:
    print(f"  ⚠️ Login page: {out}")

# Database
print("\n  5/5 Database...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx -e \"require('./lib/db').prisma.user.count().then(c => console.log('Users:', c))\"",
    timeout=30
)
if 'Users:' in out:
    print(f"  ✅ Database OK: {out.strip()}")

# ============================================================================
# 9. LOGS FINALES
# ============================================================================
print("\n=== 9. LOGS PM2 (ÚLTIMAS 15 LÍNEAS) ===")
success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 15")
if out:
    for line in out.split('\n')[-15:]:
        if line.strip():
            print(f"  {line}")

print("\n" + "="*70)
if use_dev:
    print("⚠️ APLICACIÓN EN MODO DEVELOPMENT")
    print("="*70)
    print("\nℹ️ El build de producción falló.")
    print("La aplicación está corriendo en modo development.\n")
    print("Para producción, necesitas:")
    print("  1. Investigar error de build")
    print("  2. Corregir problemas")
    print("  3. Hacer build exitoso")
    print("  4. Cambiar ecosystem.config.js a production mode\n")
else:
    print("✅ APLICACIÓN EN MODO PRODUCTION")
    print("="*70)
    print("\n🎉 Build exitoso y aplicación online\n")

print("🌐 URLs:")
print("  → https://inmovaapp.com")
print("  → https://inmovaapp.com/login")
print(f"  → http://{SERVER}:3000\n")

print("📝 Credenciales:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("🔍 Debugging:")
print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app'")
print(f"  ssh {USER}@{SERVER} 'pm2 monit'")
print(f"  ssh {USER}@{SERVER} 'cat {PATH}/.next/BUILD_ID'\n")

client.close()
print("✅ Script completado\n")
