#!/usr/bin/env python3
"""
Production Deploy v3 - Con fix de OpenAI
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko, time

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
    print(f"  {status} {cmd[:80]}")
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🚀 PRODUCTION DEPLOY V3 - Con fix de OpenAI lazy init")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

print("GIT UPDATE")
run_cmd(client, f"cd {PATH} && git fetch origin main")
run_cmd(client, f"cd {PATH} && git reset --hard origin/main")
success, out, err = run_cmd(client, f"cd {PATH} && git log --oneline -1")
print(f"  Commit: {out.strip()}\n")

print("CLEAN")
run_cmd(client, f"cd {PATH} && rm -rf .next node_modules/.cache")

print("\nBUILD")
build_cmd = f"""cd {PATH} && \
export DATABASE_URL='{DB_URL}' && \
export NEXTAUTH_SECRET='{NEXTAUTH_SECRET}' && \
export NEXTAUTH_URL='https://inmovaapp.com' && \
export NODE_ENV='production' && \
npm run build 2>&1 | tee /tmp/build-v3.log"""

print("  Ejecutando build (3-5 min)...")
success, out, err = run_cmd(client, build_cmd, timeout=600)

if success:
    print("\n  ✅✅✅ BUILD EXITOSO ✅✅✅\n")
    # Ver si hay BUILD_ID
    success, out, err = run_cmd(client, f"cd {PATH} && cat .next/BUILD_ID 2>/dev/null || echo 'NO_ID'")
    
    if 'NO_ID' not in out:
        build_id = out.strip()
        print(f"  ✅ BUILD_ID: {build_id}")
        use_production = True
    else:
        print("  ⚠️ BUILD_ID no encontrado - revisando logs...")
        success, out, err = run_cmd(
            client,
            "tail -20 /tmp/build-v3.log | grep -i 'error\\|failed' || echo 'NO_ERRORS'"
        )
        if 'NO_ERRORS' not in out:
            print("  Errores en build:")
            for line in out.split('\n')[:15]:
                if line.strip():
                    print(f"    {line}")
        use_production = False
else:
    print("\n  ❌ BUILD FALLÓ\n")
    use_production = False

print("\nPM2 CONFIG")
if use_production:
    print("  Configurando PRODUCTION MODE...")
    
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
    
    cmd = f"cd {PATH} && cat > ecosystem.config.js << 'EOF'\n{ecosystem}\nEOF"
    run_cmd(client, cmd)
    print("  ✅ PRODUCTION configured")
else:
    print("  DEVELOPMENT MODE")

print("\nRESTART PM2")
run_cmd(client, "pm2 delete inmova-app || true")
run_cmd(client, "pm2 kill")
time.sleep(3)

if use_production:
    run_cmd(client, f"cd {PATH} && pm2 start ecosystem.config.js --env production")
else:
    run_cmd(client, f"cd {PATH} && pm2 start ecosystem.config.js")

run_cmd(client, "pm2 save")

print("  ⏳ Warm-up 25s...")
time.sleep(25)

print("\nHEALTH CHECKS")
checks = 0

success, out, err = run_cmd(client, "pm2 status | grep 'online'")
if success:
    print("  ✅ PM2 online")
    checks += 1

success, out, err = run_cmd(client, "curl -s http://localhost:3000/api/health")
if 'ok' in out.lower():
    print("  ✅ Health OK")
    checks += 1

success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing"
)
if '200' in out:
    print("  ✅ Landing: 200")
    checks += 1

success, out, err = run_cmd(client, "curl -s http://localhost:3000/landing | wc -c")
size = int(out.strip()) if success else 0
if size > 100000:
    print(f"  ✅ Landing: {size} bytes")
    checks += 1

success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/landing | grep -o '<section' | wc -l"
)
sections = int(out.strip()) if success else 0
if sections >= 10:
    print(f"  ✅ Secciones: {sections}")
    checks += 1

print(f"\nCHECKS: {checks}/5\n")

if use_production and checks >= 4:
    print("✅✅✅ PRODUCTION MODE EXITOSO ✅✅✅")
    print("\n🎉 Aplicación online en modo PRODUCTION")
    print("  - Cluster: 2 instancias")
    print("  - Performance: Optimizado")
    mode = "PRODUCTION"
elif checks >= 4:
    print("✅ DEVELOPMENT MODE OK")
    mode = "DEVELOPMENT"
else:
    print("⚠️ WARNINGS - Revisar logs")
    mode = "DEVELOPMENT" if not use_production else "PRODUCTION"

print("\n🌐 URLs:")
print("  https://inmovaapp.com/landing")
print("  https://inmovaapp.com/login")

print(f"\n✅ MODO: {mode}")

print("\n📝 Credenciales:")
print("  admin@inmova.app / Admin123!")

print("\n🔍 Logs:")
print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app'")

print("\n" + "="*70)
print("✅ DEPLOY COMPLETADO")
print("="*70 + "\n")

client.close()
