#!/usr/bin/env python3
"""Full rebuild and deploy — ensure new code is running."""
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}
APP_DIR = '/opt/inmova-app'

def run(c, cmd, timeout=600):
    print(f"  $ {cmd[:100]}")
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return code, out, err

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(**SERVER)
c.get_transport().set_keepalive(30)
print("✅ Connected\n")

# 1. Check current commit
print("=== DIAGNÓSTICO ===")
_, commit, _ = run(c, f"cd {APP_DIR} && git log --oneline -1")
print(f"   Commit actual: {commit}")
_, branch, _ = run(c, f"cd {APP_DIR} && git branch --show-current")
print(f"   Branch: {branch}")

# Check if operator-signatures exists
_, exists, _ = run(c, f"ls {APP_DIR}/app/api/operator-signatures/route.ts 2>&1")
print(f"   operator-signatures API: {'✅ EXISTE' if 'No such file' not in exists else '❌ NO EXISTE'}")
_, exists2, _ = run(c, f"ls {APP_DIR}/app/firma-digital/operadores/page.tsx 2>&1")
print(f"   operadores page: {'✅ EXISTE' if 'No such file' not in exists2 else '❌ NO EXISTE'}")
_, exists3, _ = run(c, f"ls {APP_DIR}/app/api/webhooks/docusign/route.ts 2>&1")
print(f"   docusign webhook: {'✅ EXISTE' if 'No such file' not in exists3 else '❌ NO EXISTE'}")

# Check admin page for hardcoded values
_, hardcoded, _ = run(c, f"grep '0daca02a' {APP_DIR}/app/admin/integraciones/docusign/page.tsx 2>&1 | wc -l")
print(f"   Credenciales hardcoded en admin: {'❌ SÍ' if hardcoded.strip() != '0' else '✅ NO'}")

# Check DocuSign env
_, ds_uid, _ = run(c, f"cd {APP_DIR} && grep DOCUSIGN_USER_ID .env.production | head -1")
print(f"   {ds_uid}")
print()

# 2. Move untracked files and pull
print("=== GIT PULL ===")
run(c, "mkdir -p /tmp/inmova-bak3")
run(c, f"cd {APP_DIR} && mv -f data/seguros/*.pdf /tmp/inmova-bak3/ 2>/dev/null", timeout=10)
run(c, f"cd {APP_DIR} && mv -f scripts/audit-data.js /tmp/inmova-bak3/ 2>/dev/null", timeout=10)
run(c, f"cd {APP_DIR} && mv -f scripts/check-insurances.js /tmp/inmova-bak3/ 2>/dev/null", timeout=10)
run(c, f"cd {APP_DIR} && mv -f scripts/load-seguros-gdrive.ts /tmp/inmova-bak3/ 2>/dev/null", timeout=10)
run(c, f"cd {APP_DIR} && git checkout -- . 2>/dev/null", timeout=10)

code, out, err = run(c, f"cd {APP_DIR} && git pull origin main", timeout=120)
if code == 0:
    print(f"   ✅ Pull OK: {out[-150:]}")
else:
    print(f"   ❌ Pull failed: {(err or out)[-200:]}")
    # Force reset
    print("   Forcing reset to origin/main...")
    run(c, f"cd {APP_DIR} && git fetch origin main")
    run(c, f"cd {APP_DIR} && git reset --hard origin/main")
    print("   ✅ Reset done")

# Restore files
run(c, f"cp -n /tmp/inmova-bak3/*.pdf {APP_DIR}/data/seguros/ 2>/dev/null", timeout=10)
run(c, f"cp -n /tmp/inmova-bak3/*.js {APP_DIR}/scripts/ 2>/dev/null", timeout=10)
run(c, f"cp -n /tmp/inmova-bak3/*.ts {APP_DIR}/scripts/ 2>/dev/null", timeout=10)

# Verify files now exist
_, commit2, _ = run(c, f"cd {APP_DIR} && git log --oneline -1")
print(f"   Nuevo commit: {commit2}")
_, exists_after, _ = run(c, f"ls {APP_DIR}/app/firma-digital/operadores/page.tsx 2>&1")
print(f"   operadores page: {'✅ EXISTE' if 'No such file' not in exists_after else '❌ FALTA'}")
_, hc_after, _ = run(c, f"grep '0daca02a' {APP_DIR}/app/admin/integraciones/docusign/page.tsx 2>&1 | wc -l")
print(f"   Hardcoded creds removed: {'✅' if hc_after.strip() == '0' else '❌ TODAVÍA'}")
print()

# 3. Install deps + Prisma + Build
print("=== BUILD ===")
_, _, _ = run(c, f"cd {APP_DIR} && npm install --legacy-peer-deps 2>&1 | tail -3", timeout=600)
print("   ✅ npm install done")

_, _, _ = run(c, f"cd {APP_DIR} && npx prisma generate 2>&1 | tail -3", timeout=120)
print("   ✅ prisma generate done")

print("   Building (5-10 min)...")
code, out, err = run(c, f"cd {APP_DIR} && npm run build 2>&1 | tail -15", timeout=900)
if code == 0:
    print("   ✅ Build OK")
else:
    print(f"   ⚠️ Build exit {code}")
    if err:
        print(f"   {err[-300:]}")
print()

# 4. Restart
print("=== RESTART ===")
run(c, f"cd {APP_DIR} && pm2 restart inmova-app --update-env")
print("   ✅ PM2 restarted")
print("   Waiting 20s...")
time.sleep(20)
print()

# 5. Verify
print("=== VERIFY ===")
_, health, _ = run(c, "curl -sf http://localhost:3000/api/health")
print(f"   Health: {'✅ OK' if 'ok' in health.lower() else '⚠️ ' + health[:100]}")

_, login, _ = run(c, "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/login")
print(f"   Login: {'✅' if login == '200' else '⚠️'} HTTP {login}")

_, op_page, _ = run(c, "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/firma-digital/operadores")
print(f"   /firma-digital/operadores: {'✅' if op_page == '200' else '⚠️'} HTTP {op_page}")

_, ds_page, _ = run(c, "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/admin/integraciones/docusign")
print(f"   /admin/integraciones/docusign: {'✅' if ds_page == '200' else '⚠️'} HTTP {ds_page}")

_, api_op, _ = run(c, "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/api/operator-signatures/stats")
print(f"   /api/operator-signatures/stats: HTTP {api_op}")

# Check DocuSign env final
_, ds_check, _ = run(c, f"""cd {APP_DIR} && node -e "
require('dotenv').config({{ path: '.env.production' }});
const ik = process.env.DOCUSIGN_INTEGRATION_KEY;
const uid = process.env.DOCUSIGN_USER_ID;
const path = process.env.DOCUSIGN_BASE_PATH;
console.log('IK:', ik ? ik.substring(0,8) + '...' : 'MISSING');
console.log('UID:', uid ? uid.substring(0,8) + '...' : 'MISSING');
console.log('PATH:', path);
" 2>&1""")
print(f"   DocuSign env:\n   {ds_check.replace(chr(10), chr(10) + '   ')}")

c.close()
print("\n✅ Deploy completo.")
