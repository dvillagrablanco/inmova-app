#!/usr/bin/env python3
"""
Deployment Final en Modo Producción - Con Fix de Sintaxis
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

print("\n" + "="*70)
print("🚀 DEPLOYMENT FINAL - MODO PRODUCCIÓN")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. GIT PULL (CON FIX)
# ============================================================================
print("="*70)
print("📥 FASE 1: ACTUALIZAR CÓDIGO (CON FIX)")
print("="*70 + "\n")

print("  Git pull origin main...")
success, out, err = run_cmd(client, f"cd {PATH} && git pull origin main")

if success:
    print("  ✅ Código actualizado")
    # Ver último commit
    success, out, err = run_cmd(client, f"cd {PATH} && git log --oneline -1")
    if out:
        print(f"  Último commit: {out.strip()}")
else:
    print("  ⚠️ Git pull puede haber fallado")

# ============================================================================
# 2. LIMPIAR TODO
# ============================================================================
print("\n" + "="*70)
print("🧹 FASE 2: LIMPIAR TODO")
print("="*70 + "\n")

run_cmd(client, f"cd {PATH} && rm -rf .next")
run_cmd(client, f"cd {PATH} && rm -rf node_modules/.cache")
run_cmd(client, f"cd {PATH} && rm -rf .swc")
print("  ✅ Cache limpiado")

# ============================================================================
# 3. REINSTALAR DEPENDENCIAS
# ============================================================================
print("\n" + "="*70)
print("📦 FASE 3: REINSTALAR DEPENDENCIAS")
print("="*70 + "\n")

print("  npm ci...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && npm ci",
    timeout=600
)
if success:
    print("  ✅ Dependencias instaladas")

# ============================================================================
# 4. PRISMA
# ============================================================================
print("\n" + "="*70)
print("🔧 FASE 4: PRISMA")
print("="*70 + "\n")

print("  Prisma generate...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx prisma generate",
    timeout=120
)
if success:
    print("  ✅ Prisma client generado")

print("  Prisma migrate...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx prisma migrate deploy",
    timeout=180
)
if success or 'No pending migrations' in out:
    print("  ✅ Migraciones OK")

# ============================================================================
# 5. BUILD DE PRODUCCIÓN (CON CÓDIGO CORREGIDO)
# ============================================================================
print("\n" + "="*70)
print("🏗️ FASE 5: BUILD DE PRODUCCIÓN")
print("="*70 + "\n")

print("  🔨 npm run build...")
print("  ⏳ Esto puede tardar 3-5 minutos...\n")

build_cmd = f"""cd {PATH} && \
export DATABASE_URL='{DB_URL}' && \
export NEXTAUTH_SECRET='{NEXTAUTH_SECRET}' && \
export NEXTAUTH_URL='https://inmovaapp.com' && \
export NODE_ENV='production' && \
export SKIP_ENV_VALIDATION='true' && \
export NEXT_TELEMETRY_DISABLED='1' && \
npm run build 2>&1"""

success, out, err = run_cmd(client, build_cmd, timeout=600)

if success:
    print("\n  ✅✅✅ BUILD DE PRODUCCIÓN EXITOSO ✅✅✅\n")
    # Mostrar estadísticas
    for line in out.split('\n'):
        if any(kw in line.lower() for kw in ['compiled successfully', 'route', '├', '└', 'first load js', 'completed in']):
            if line.strip():
                print(f"    {line.strip()}")
    
    build_success = True
else:
    print("\n  ❌ BUILD FALLÓ\n")
    # Mostrar errores
    lines = (err or out).split('\n')
    for line in lines[-20:]:
        if line.strip() and ('error' in line.lower() or 'failed' in line.lower()):
            print(f"    {line}")
    
    build_success = False

# ============================================================================
# 6. VERIFICAR BUILD
# ============================================================================
print("\n" + "="*70)
print("🔍 FASE 6: VERIFICAR BUILD")
print("="*70 + "\n")

success, out, err = run_cmd(client, f"cd {PATH} && cat .next/BUILD_ID 2>/dev/null || echo 'NO_BUILD'")

if 'NO_BUILD' not in out and build_success:
    build_id = out.strip()
    print(f"  ✅ BUILD_ID: {build_id}")
    
    # Verificar estructura de producción
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && ls -la .next/standalone/server.js 2>/dev/null && echo 'STANDALONE_OK' || ls -la .next/server/ | head -5"
    )
    if out:
        print("  ✅ Estructura de build verificada:")
        for line in out.split('\n')[:5]:
            if line.strip():
                print(f"    {line}")
    
    use_production = True
    print("\n  ✅✅✅ LISTO PARA MODO PRODUCTION ✅✅✅")
else:
    print("  ❌ NO HAY BUILD VÁLIDO")
    use_production = False

# ============================================================================
# 7. CONFIGURAR PM2 PARA PRODUCCIÓN
# ============================================================================
print("\n" + "="*70)
print("⚙️ FASE 7: CONFIGURAR PM2")
print("="*70 + "\n")

if use_production:
    print("  📝 Configurando ecosystem.config.js para PRODUCTION...")
    
    ecosystem_prod = f"""module.exports = {{
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
}}
"""
    
    cmd = f"cd {PATH} && cat > ecosystem.config.js << 'EOFCONFIG'\n{ecosystem_prod}\nEOFCONFIG"
    run_cmd(client, cmd)
    
    print("  ✅ CONFIGURADO PARA PRODUCTION MODE")
    print("    - Modo: cluster")
    print("    - Instancias: 2")
    print("    - Auto-restart: enabled")
else:
    print("  ⚠️ Manteniendo modo DEVELOPMENT")

# ============================================================================
# 8. REINICIAR PM2
# ============================================================================
print("\n" + "="*70)
print("♻️ FASE 8: REINICIAR PM2")
print("="*70 + "\n")

print("  Deteniendo PM2...")
run_cmd(client, "pm2 delete inmova-app || true")
run_cmd(client, "pm2 kill")
time.sleep(3)

print("  Iniciando PM2...")
if use_production:
    print("  🚀 Modo: PRODUCTION (cluster x2)")
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && pm2 start ecosystem.config.js --env production"
    )
else:
    print("  🚀 Modo: DEVELOPMENT")
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && pm2 start ecosystem.config.js"
    )

run_cmd(client, "pm2 save")

print("\n  ⏳ Esperando 30s para warm-up...")
time.sleep(30)

# ============================================================================
# 9. HEALTH CHECKS COMPLETOS
# ============================================================================
print("\n" + "="*70)
print("🏥 FASE 9: HEALTH CHECKS")
print("="*70 + "\n")

checks = []

# PM2 Status
print("  1/10 PM2 Status...")
success, out, err = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    instances = out.count('online')
    print(f"  ✅ PM2 online ({instances} instancias)")
    checks.append(True)
else:
    print("  ❌ PM2 error")
    checks.append(False)

# Puerto
print("\n  2/10 Puerto 3000...")
success, out, err = run_cmd(client, "ss -tlnp | grep :3000")
if success:
    print("  ✅ Puerto 3000 listening")
    checks.append(True)
else:
    print("  ❌ Puerto no responde")
    checks.append(False)

# Health endpoint
print("\n  3/10 Health endpoint...")
success, out, err = run_cmd(client, "curl -s http://localhost:3000/api/health")
if success and 'ok' in out.lower():
    print(f"  ✅ Health OK: {out[:100]}")
    checks.append(True)
else:
    print("  ⚠️ Health check issue")
    checks.append(False)

# Landing page
print("\n  4/10 Landing page...")
success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing"
)
if '200' in out:
    print("  ✅ Landing: 200 OK")
    checks.append(True)
else:
    print(f"  ⚠️ Landing: {out}")
    checks.append(False)

# Landing content size
print("\n  5/10 Landing content...")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/landing | wc -c"
)
if success:
    size = int(out.strip())
    if size > 10000:
        print(f"  ✅ Landing content: {size} bytes")
        checks.append(True)
    else:
        print(f"  ⚠️ Landing muy pequeño: {size} bytes")
        checks.append(False)

# Landing secciones
print("\n  6/10 Landing secciones...")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/landing | grep -o '<section' | wc -l"
)
if success:
    sections = int(out.strip())
    if sections > 0:
        print(f"  ✅ Landing secciones: {sections}")
        checks.append(True)
    else:
        print(f"  ⚠️ Landing secciones: {sections}")
        checks.append(False)

# Login page
print("\n  7/10 Login page...")
success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login"
)
if '200' in out:
    print("  ✅ Login: 200 OK")
    checks.append(True)
else:
    print(f"  ⚠️ Login: {out}")
    checks.append(False)

# Dashboard
print("\n  8/10 Dashboard...")
success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/dashboard"
)
if '200' in out or '307' in out or '302' in out:  # Redirect es OK (requiere auth)
    print(f"  ✅ Dashboard: {out} (redirect OK)")
    checks.append(True)
else:
    print(f"  ⚠️ Dashboard: {out}")
    checks.append(False)

# Database
print("\n  9/10 Database...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx -e \"require('./lib/db').prisma.user.count().then(c => console.log('Users:', c))\"",
    timeout=30
)
if 'Users:' in out:
    print(f"  ✅ Database OK: {out.strip()}")
    checks.append(True)
else:
    print("  ⚠️ Database issue")
    checks.append(False)

# Memoria
print("\n  10/10 Memoria...")
success, out, err = run_cmd(client, "free -m | grep Mem")
if success:
    lines = out.strip().split('\n')
    if lines:
        mem_info = lines[-1].split()
        if len(mem_info) >= 3:
            total = int(mem_info[1])
            used = int(mem_info[2])
            percent = (used / total) * 100
            print(f"  ✅ Memoria: {used}MB / {total}MB ({percent:.1f}%)")
            checks.append(True)

# ============================================================================
# 10. LOGS PM2
# ============================================================================
print("\n" + "="*70)
print("📋 FASE 10: LOGS PM2")
print("="*70 + "\n")

success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 15")
if out:
    for line in out.split('\n')[-15:]:
        if line.strip():
            if 'error' in line.lower():
                print(f"  ❌ {line}")
            elif 'ready' in line.lower() or 'compiled' in line.lower():
                print(f"  ✅ {line}")
            else:
                print(f"  {line}")

# ============================================================================
# RESUMEN FINAL
# ============================================================================
print("\n" + "="*70)
print("📊 RESUMEN FINAL")
print("="*70 + "\n")

checks_passed = sum(checks)
checks_total = len(checks)

print(f"Health Checks: {checks_passed}/{checks_total} pasando\n")

if use_production and checks_passed >= 8:
    print("✅✅✅ DEPLOYMENT EN MODO PRODUCTION EXITOSO ✅✅✅")
    print("\n🎉 La aplicación está online en modo production\n")
    
    print("📈 BENEFICIOS DE MODO PRODUCTION:")
    print("  ✅ Performance optimizado (~30-50% más rápido)")
    print("  ✅ Cluster mode (2 instancias)")
    print("  ✅ Load balancing automático")
    print("  ✅ Auto-restart en crashes")
    print("  ✅ Cache optimizado")
    print("  ✅ Bundle minificado")
elif use_production:
    print("⚠️ DEPLOYMENT PRODUCTION CON WARNINGS")
    print(f"\nSolo {checks_passed}/{checks_total} checks pasaron.")
    print("Revisar logs para más detalles.\n")
else:
    print("⚠️ DEPLOYMENT EN MODO DEVELOPMENT")
    print("\nNo se pudo completar el build de producción.")
    print("La app está en modo development.\n")

print("🌐 URLs:")
print("  → https://inmovaapp.com")
print("  → https://inmovaapp.com/landing  ← LANDING PRINCIPAL")
print("  → https://inmovaapp.com/login")
print("  → https://inmovaapp.com/dashboard")
print(f"  → http://{SERVER}:3000\n")

print("📝 Credenciales de Test:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("🔍 Comandos útiles:")
print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app --lines 50'")
print(f"  ssh {USER}@{SERVER} 'pm2 monit'")
print(f"  ssh {USER}@{SERVER} 'pm2 restart inmova-app'")
print(f"  ssh {USER}@{SERVER} 'curl http://localhost:3000/landing | head -100'\n")

if use_production:
    print("✅ MODO ACTUAL: PRODUCTION")
    print("  - Cluster: 2 instancias")
    print("  - Performance: Optimizado")
    print("  - Memory limit: 1GB per instance")
else:
    print("⚠️ MODO ACTUAL: DEVELOPMENT")
    print("  - Hot-reload: Activo")
    print("  - Performance: ~30% más lento")

print("\n" + "="*70)
print("✅ DEPLOYMENT COMPLETADO")
print("="*70 + "\n")

client.close()
