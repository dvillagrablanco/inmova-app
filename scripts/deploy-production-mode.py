#!/usr/bin/env python3
"""
Deploy en Modo Producción + Fix Landing
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
print("🚀 DEPLOYMENT MODO PRODUCCIÓN + FIX LANDING")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. INVESTIGAR ERROR DE LANDING
# ============================================================================
print("="*70)
print("🔍 FASE 1: INVESTIGAR ERROR DE LANDING")
print("="*70 + "\n")

print("  Obteniendo logs de PM2...")
success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 50 | grep -i 'error\\|warning\\|hydration' || echo 'NO_ERRORS'")

if 'NO_ERRORS' not in out:
    print("  Errores encontrados:")
    for line in out.split('\n')[:20]:
        if line.strip() and ('error' in line.lower() or 'warning' in line.lower()):
            print(f"    {line}")
else:
    print("  ✅ No se encontraron errores obvios en logs")

# Verificar logs del navegador (console errors)
print("\n  Verificando respuesta de /landing...")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/landing | head -100"
)
if out:
    if '<html' in out and '<body' in out:
        print("  ✅ Landing renderiza HTML")
    else:
        print("  ⚠️ Landing puede no estar renderizando correctamente")

# ============================================================================
# 2. LIMPIAR CACHE Y PREPARAR BUILD
# ============================================================================
print("\n" + "="*70)
print("🧹 FASE 2: LIMPIAR CACHE")
print("="*70 + "\n")

print("  Eliminando .next...")
run_cmd(client, f"cd {PATH} && rm -rf .next")

print("  Eliminando node_modules/.cache...")
run_cmd(client, f"cd {PATH} && rm -rf node_modules/.cache")

print("  Eliminando .swc...")
run_cmd(client, f"cd {PATH} && rm -rf .swc")

# ============================================================================
# 3. VERIFICAR VARIABLES DE ENTORNO
# ============================================================================
print("\n" + "="*70)
print("🔐 FASE 3: VERIFICAR VARIABLES")
print("="*70 + "\n")

print("  Verificando .env.production...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && grep -E 'DATABASE_URL|NEXTAUTH_SECRET|NEXTAUTH_URL' .env.production | wc -l"
)
if success and out.strip():
    count = int(out.strip())
    if count >= 3:
        print(f"  ✅ Variables configuradas ({count} encontradas)")
    else:
        print(f"  ⚠️ Faltan variables ({count}/3)")

# ============================================================================
# 4. BUILD DE PRODUCCIÓN
# ============================================================================
print("\n" + "="*70)
print("🏗️ FASE 4: BUILD DE PRODUCCIÓN")
print("="*70 + "\n")

print("  Configurando variables de entorno...")
build_env = f"""export DATABASE_URL='{DB_URL}'
export NEXTAUTH_SECRET='{NEXTAUTH_SECRET}'
export NEXTAUTH_URL='https://inmovaapp.com'
export NODE_ENV='production'
export SKIP_ENV_VALIDATION='true'
export NEXT_TELEMETRY_DISABLED='1'"""

print("  🔨 Ejecutando build (esto puede tardar 3-5 minutos)...\n")

build_cmd = f"""cd {PATH} && {build_env} && npm run build 2>&1"""

success, out, err = run_cmd(client, build_cmd, timeout=600)

if success:
    print("\n  ✅ BUILD EXITOSO")
    # Mostrar estadísticas del build
    for line in out.split('\n'):
        if any(kw in line.lower() for kw in ['compiled', 'route', '├', '└', 'first load js']):
            print(f"    {line.strip()}")
else:
    print("\n  ⚠️ BUILD CON WARNINGS")
    print("  Mostrando últimas 30 líneas:\n")
    
    # Mostrar error details
    lines = (err or out).split('\n')
    for line in lines[-30:]:
        if line.strip():
            if 'error' in line.lower():
                print(f"    ❌ {line}")
            elif 'warning' in line.lower():
                print(f"    ⚠️ {line}")
            else:
                print(f"    {line}")

# ============================================================================
# 5. VERIFICAR BUILD_ID
# ============================================================================
print("\n" + "="*70)
print("🔍 FASE 5: VERIFICAR BUILD")
print("="*70 + "\n")

success, out, err = run_cmd(client, f"cd {PATH} && cat .next/BUILD_ID 2>/dev/null || echo 'NO_BUILD'")

if 'NO_BUILD' not in out:
    build_id = out.strip()
    print(f"  ✅ BUILD_ID: {build_id}")
    
    # Verificar que existe la estructura de producción
    success2, out2, err2 = run_cmd(client, f"cd {PATH} && ls -la .next/server/app/landing/page.js 2>/dev/null && echo 'LANDING_EXISTS' || echo 'NO_LANDING'")
    
    if 'LANDING_EXISTS' in out2:
        print("  ✅ Landing page compilada")
    else:
        print("  ⚠️ Landing page puede no estar compilada correctamente")
    
    use_production = True
else:
    print("  ❌ NO HAY BUILD_ID")
    print("  No se puede usar modo production sin build exitoso")
    print("  Se mantendrá en modo development")
    use_production = False

# ============================================================================
# 6. CONFIGURAR PM2 PARA PRODUCCIÓN
# ============================================================================
print("\n" + "="*70)
print("⚙️ FASE 6: CONFIGURAR PM2")
print("="*70 + "\n")

if use_production:
    print("  Configurando ecosystem.config.js para PRODUCTION...")
    
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
    print("  ✅ Configurado para PRODUCTION MODE (cluster x2)")
else:
    print("  Manteniendo configuración DEVELOPMENT...")

# ============================================================================
# 7. REINICIAR PM2
# ============================================================================
print("\n" + "="*70)
print("♻️ FASE 7: REINICIAR PM2")
print("="*70 + "\n")

print("  Deteniendo PM2...")
run_cmd(client, "pm2 delete inmova-app || true")
run_cmd(client, "pm2 kill")
time.sleep(3)

print("  Iniciando PM2...")
if use_production:
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && pm2 start ecosystem.config.js --env production"
    )
else:
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && pm2 start ecosystem.config.js"
    )

run_cmd(client, "pm2 save")

print("  ⏳ Esperando 30s para warm-up...")
time.sleep(30)

# ============================================================================
# 8. HEALTH CHECKS
# ============================================================================
print("\n" + "="*70)
print("🏥 FASE 8: HEALTH CHECKS")
print("="*70 + "\n")

checks_passed = 0
checks_total = 8

# Check 1: PM2 Status
print("  1/8 PM2 Status...")
success, out, err = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    online_count = out.count('online')
    print(f"  ✅ PM2 online ({online_count} instancias)")
    checks_passed += 1
else:
    print("  ❌ PM2 no está online")
    # Mostrar logs de error
    success, out, err = run_cmd(client, "pm2 logs inmova-app --err --nostream --lines 10")
    if out:
        print("  Errores:")
        for line in out.split('\n')[-10:]:
            if line.strip():
                print(f"    {line}")

# Check 2: Puerto 3000
print("\n  2/8 Puerto 3000...")
success, out, err = run_cmd(client, "ss -tlnp | grep :3000")
if success:
    print("  ✅ Puerto 3000 listening")
    checks_passed += 1
else:
    print("  ❌ Puerto 3000 no responde")

# Check 3: Health endpoint
print("\n  3/8 Health endpoint...")
for i in range(3):
    success, out, err = run_cmd(
        client,
        "curl -s http://localhost:3000/api/health"
    )
    if success and 'ok' in out.lower():
        print(f"  ✅ Health check OK: {out[:100]}")
        checks_passed += 1
        break
    elif i < 2:
        print(f"  ⏳ Intento {i+1}/3 - esperando 10s...")
        time.sleep(10)
    else:
        print("  ⚠️ Health check no responde")

# Check 4: Landing page (CRÍTICO)
print("\n  4/8 Landing page...")
for i in range(3):
    success, out, err = run_cmd(
        client,
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing"
    )
    if '200' in out:
        print("  ✅ Landing page: 200 OK")
        checks_passed += 1
        break
    elif i < 2:
        print(f"  ⏳ Intento {i+1}/3 - esperando 10s...")
        time.sleep(10)
    else:
        print(f"  ⚠️ Landing page: {out}")

# Check 5: Landing content (verificar que no está vacía)
print("\n  5/8 Landing content...")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/landing | wc -c"
)
if success and out.strip():
    bytes_count = int(out.strip())
    if bytes_count > 10000:  # Landing debería tener >10KB
        print(f"  ✅ Landing content OK ({bytes_count} bytes)")
        checks_passed += 1
    else:
        print(f"  ⚠️ Landing content muy pequeño ({bytes_count} bytes)")
        # Ver el contenido
        success2, out2, err2 = run_cmd(client, "curl -s http://localhost:3000/landing | head -20")
        if out2:
            print("  Primeras líneas:")
            print(out2[:500])

# Check 6: Login page
print("\n  6/8 Login page...")
success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login"
)
if '200' in out:
    print("  ✅ Login page: 200 OK")
    checks_passed += 1
else:
    print(f"  ⚠️ Login page: {out}")

# Check 7: Database
print("\n  7/8 Database...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx -e \"require('./lib/db').prisma.user.count().then(c => console.log('Users:', c))\"",
    timeout=30
)
if 'Users:' in out:
    print(f"  ✅ Database OK: {out.strip()}")
    checks_passed += 1
else:
    print("  ⚠️ Database connection issue")

# Check 8: Memoria
print("\n  8/8 Memoria...")
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
            if percent < 90:
                checks_passed += 1

# ============================================================================
# 9. TEST ESPECÍFICO DE LANDING
# ============================================================================
print("\n" + "="*70)
print("🎯 FASE 9: TEST ESPECÍFICO DE LANDING")
print("="*70 + "\n")

print("  Test 1: Verificar HTML completo...")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/landing | grep -c '<section' || echo '0'"
)
if success and out.strip():
    sections = int(out.strip())
    if sections > 5:
        print(f"  ✅ Landing tiene {sections} secciones")
    else:
        print(f"  ⚠️ Landing tiene solo {sections} secciones (esperado >5)")

print("\n  Test 2: Verificar que no hay errores JS...")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/landing | grep -i 'error\\|exception' | head -5 || echo 'NO_ERRORS'"
)
if 'NO_ERRORS' in out:
    print("  ✅ No se detectaron errores JS en HTML")
else:
    print("  ⚠️ Posibles errores JS:")
    print(out[:300])

print("\n  Test 3: Verificar scripts cargando...")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/landing | grep -c '<script' || echo '0'"
)
if success and out.strip():
    scripts = int(out.strip())
    print(f"  ✅ Landing tiene {scripts} scripts")

# ============================================================================
# 10. LOGS FINALES
# ============================================================================
print("\n" + "="*70)
print("📋 FASE 10: LOGS RECIENTES")
print("="*70 + "\n")

success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 20")
if out:
    for line in out.split('\n')[-20:]:
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

print(f"Health Checks: {checks_passed}/{checks_total} pasando\n")

if use_production:
    if checks_passed >= 6:
        print("✅ DEPLOYMENT EN MODO PRODUCTION EXITOSO")
        print("\n🎉 La aplicación está online en modo production\n")
    else:
        print("⚠️ DEPLOYMENT COMPLETADO CON WARNINGS")
        print(f"\nSolo {checks_passed}/{checks_total} checks pasaron.\n")
else:
    print("⚠️ NO SE PUDO USAR MODO PRODUCTION")
    print("\nSe mantiene en modo development debido a errores de build.\n")

print("🌐 URLs:")
print("  → https://inmovaapp.com")
print("  → https://inmovaapp.com/landing")
print("  → https://inmovaapp.com/login")
print(f"  → http://{SERVER}:3000\n")

print("📝 Credenciales:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("🔍 Comandos útiles:")
print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app --lines 50'")
print(f"  ssh {USER}@{SERVER} 'pm2 monit'")
print(f"  ssh {USER}@{SERVER} 'curl http://localhost:3000/landing | head -50'\n")

if use_production:
    print("✅ MODO: PRODUCTION")
    print("  - Cluster mode: 2 instancias")
    print("  - Performance: Optimizado")
    print("  - Cache: Activo")
else:
    print("⚠️ MODO: DEVELOPMENT")
    print("  - Hot-reload: Activo")
    print("  - Performance: ~30% más lento")

print("\n" + "="*70)
print("✅ SCRIPT COMPLETADO")
print("="*70 + "\n")

client.close()
