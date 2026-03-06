#!/usr/bin/env python3
"""
Rebuild servidor — Marzo 2026
Incluye:
- Backup BD pre-deploy
- Git pull (preservando archivos locales)
- Prisma generate + build
- PM2 restart con --update-env
- Health checks completos (health, login, auth, nuevas rutas)
- DocuSign variables verification
"""
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP = '/opt/inmova-app'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname=SERVER, username=USER, password=PASSWORD, port=22, timeout=30)
c.get_transport().set_keepalive(30)

def run(cmd, t=900):
    print(f"  $ {cmd[:140]}")
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return code, out, err

def check(label, ok, detail=''):
    status = '\033[92mOK\033[0m' if ok else '\033[91mFAIL\033[0m'
    print(f"  [{status}] {label}" + (f" — {detail}" if detail else ''))
    return ok

print(f"\n{'='*60}")
print(f"  REBUILD SERVIDOR — {time.strftime('%Y-%m-%d %H:%M')}")
print(f"  Servidor: {SERVER}")
print(f"{'='*60}\n")

# ──────────────────────────────────────────────────────────
# 1. BACKUP BD
# ──────────────────────────────────────────────────────────
print("1. BACKUP BD")
ts = time.strftime('%Y%m%d_%H%M%S')
code, out, _ = run(f"pg_dump -U postgres inmova_production -F c -f /var/backups/inmova/pre-deploy-{ts}.dump 2>&1 | tail -2", t=120)
check("Backup BD", code == 0, f"pre-deploy-{ts}.dump")
print()

# ──────────────────────────────────────────────────────────
# 2. GIT PULL
# ──────────────────────────────────────────────────────────
print("2. GIT PULL")
# Preservar archivos locales
run(f"mkdir -p /tmp/rebuild-preserve", t=5)
run(f"cp -f {APP}/data/seguros/*.pdf /tmp/rebuild-preserve/ 2>/dev/null", t=10)
run(f"cp -f {APP}/scripts/audit-data.js /tmp/rebuild-preserve/ 2>/dev/null", t=5)
run(f"cp -f {APP}/scripts/check-insurances.js /tmp/rebuild-preserve/ 2>/dev/null", t=5)
run(f"cd {APP} && git checkout -- . 2>/dev/null", t=10)
code, out, _ = run(f"cd {APP} && git pull origin main", t=60)
check("Git pull", code == 0, out[-100:] if out else '')
# Restore local files
run(f"cp -n /tmp/rebuild-preserve/*.pdf {APP}/data/seguros/ 2>/dev/null", t=5)
run(f"cp -n /tmp/rebuild-preserve/*.js {APP}/scripts/ 2>/dev/null", t=5)
print()

# ──────────────────────────────────────────────────────────
# 3. DEPENDENCIES + PRISMA
# ──────────────────────────────────────────────────────────
print("3. DEPENDENCIES + PRISMA")
code, out, _ = run(f"cd {APP} && npm install --legacy-peer-deps 2>&1 | tail -3", t=300)
check("npm install", code == 0)
code, out, _ = run(f"cd {APP} && npx prisma generate 2>&1 | tail -3", t=60)
check("Prisma generate", code == 0)
code, out, _ = run(f"cd {APP} && npx prisma db push --accept-data-loss 2>&1 | tail -5", t=60)
check("Prisma db push", code == 0, out[-100:] if out else '')
print()

# ──────────────────────────────────────────────────────────
# 4. BUILD
# ──────────────────────────────────────────────────────────
print("4. BUILD")
run(f"rm -rf {APP}/.next", t=10)
code, out, _ = run(f"cd {APP} && npm run build 2>&1 | tail -15", t=600)
check("Next.js build", code == 0, out[-120:] if code != 0 else '')
if code != 0:
    print(f"\n  BUILD FAILED — últimas líneas:\n{out[-500:]}")
    print("\n  ABORTANDO REBUILD")
    c.close()
    sys.exit(1)
print()

# ──────────────────────────────────────────────────────────
# 5. PM2 RESTART
# ──────────────────────────────────────────────────────────
print("5. PM2 RESTART")
run(f"cd {APP} && pm2 restart inmova-app --update-env 2>&1 | tail -5", t=30)
print("  Esperando warm-up (25s)...")
time.sleep(25)
# Verify PM2 status
code, out, _ = run("pm2 jlist 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); apps=[a for a in d if a['name']=='inmova-app']; print(f'{len(apps)} workers, status: {apps[0][\"pm2_env\"][\"status\"] if apps else \"?\"}'  )\"", t=10)
check("PM2 status", 'online' in out.lower() if out else False, out)
print()

# ──────────────────────────────────────────────────────────
# 6. HEALTH CHECKS
# ──────────────────────────────────────────────────────────
print("6. HEALTH CHECKS")
passed = 0
total = 0

# 6.1 API Health
total += 1
_, h, _ = run("curl -sf http://localhost:3000/api/health", t=15)
ok = h and 'ok' in h.lower()
if check("Health API", ok, h[:100] if h else 'No response'):
    passed += 1

# 6.2 Login page
total += 1
_, code_str, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/login", t=15)
ok = code_str == '200'
if check("Login page", ok, f"HTTP {code_str}"):
    passed += 1

# 6.3 Auth session (no error de servidor)
total += 1
_, auth, _ = run("curl -sf http://localhost:3000/api/auth/session", t=15)
ok = auth is not None and 'problem with the server' not in auth.lower()
if check("Auth session", ok, auth[:80] if auth else 'No response'):
    passed += 1

# 6.4 PM2 logs — no NO_SECRET errors
total += 1
_, logs, _ = run("pm2 logs inmova-app --err --lines 20 --nostream 2>&1 | grep -ci 'NO_SECRET'", t=10)
no_secret_count = int(logs.strip()) if logs.strip().isdigit() else 0
ok = no_secret_count == 0
if check("No NO_SECRET errors", ok, f"{no_secret_count} errores"):
    passed += 1

# 6.5 Nuevas rutas DocuSign
total += 1
_, code_str, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/api/webhooks/docusign", t=10)
# POST endpoint returns 405 on GET, which means route exists
ok = code_str in ['200', '405', '401']
if check("DocuSign webhook route", ok, f"HTTP {code_str}"):
    passed += 1

# 6.6 Firma digital operadores
total += 1
_, code_str, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/firma-digital/operadores", t=15)
ok = code_str == '200'
if check("Firma digital operadores", ok, f"HTTP {code_str}"):
    passed += 1

# 6.7 Conciliación page
total += 1
_, code_str, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/finanzas/conciliacion", t=15)
ok = code_str == '200'
if check("Conciliación page", ok, f"HTTP {code_str}"):
    passed += 1

print(f"\n  Health checks: {passed}/{total} pasando\n")

# ──────────────────────────────────────────────────────────
# 7. DOCUSIGN VARIABLES
# ──────────────────────────────────────────────────────────
print("7. DOCUSIGN VARIABLES (verificación)")
docusign_vars = ['DOCUSIGN_INTEGRATION_KEY', 'DOCUSIGN_USER_ID', 'DOCUSIGN_ACCOUNT_ID', 'DOCUSIGN_BASE_PATH', 'DOCUSIGN_PRIVATE_KEY']
ds_ok = 0
for var in docusign_vars:
    _, val, _ = run(f"grep '^{var}=' {APP}/.env.production | head -1", t=5)
    has_val = bool(val and '=' in val and len(val.split('=', 1)[1].strip()) > 5)
    if check(f"  {var}", has_val, 'configurada' if has_val else 'FALTA'):
        ds_ok += 1
print(f"\n  DocuSign: {ds_ok}/{len(docusign_vars)} variables configuradas")

# ──────────────────────────────────────────────────────────
# 8. RESUMEN
# ──────────────────────────────────────────────────────────
print(f"\n{'='*60}")
if passed == total:
    print(f"  \033[92mREBUILD EXITOSO\033[0m — {passed}/{total} checks OK")
else:
    print(f"  \033[93mREBUILD CON WARNINGS\033[0m — {passed}/{total} checks OK")
print(f"  DocuSign: {ds_ok}/{len(docusign_vars)} variables")
print(f"\n  URLs:")
print(f"    https://inmovaapp.com")
print(f"    http://{SERVER}:3000")
print(f"\n  DocuSign Go Live (cuando aprueben):")
print(f"    1. Abrir: https://inmovaapp.com/api/integrations/docusign/consent")
print(f"    2. Login con cuenta DocuSign Vidaro + Allow")
print(f"    3. Configurar webhook en DocuSign Dashboard:")
print(f"       URL: https://inmovaapp.com/api/webhooks/docusign")
print(f"       Events: Envelope Sent, Delivered, Completed, Declined, Voided")
print(f"{'='*60}\n")

c.close()
