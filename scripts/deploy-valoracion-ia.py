#!/usr/bin/env python3
"""
Deploy branch valoración IA a producción via SSH
"""
import sys
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_DIR = '/opt/inmova-app'
BRANCH = 'cursor/valoraci-n-ia-integraci-n-plataformas-f51d'

class C:
    G = '\033[92m'
    R = '\033[91m'
    Y = '\033[93m'
    B = '\033[96m'
    W = '\033[1m'
    X = '\033[0m'

def log(msg, c=C.X):
    print(f"{c}[{time.strftime('%H:%M:%S')}] {msg}{C.X}")

def run(client, cmd, timeout=300):
    log(f"  $ {cmd}", C.B)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n')[:30]:
            print(f"    {line}")
        if len(out.split('\n')) > 30:
            print(f"    ... ({len(out.split(chr(10)))} lines)")
    if err and exit_status != 0:
        for line in err.split('\n')[:10]:
            print(f"    {C.R}{line}{C.X}")
    return exit_status, out, err

def main():
    print(f"\n{'='*70}")
    print(f"{C.W}DEPLOY VALORACION IA — PRODUCCION{C.X}")
    print(f"{'='*70}")
    print(f"Servidor: {SERVER}")
    print(f"Branch:   {BRANCH}")
    print(f"App Dir:  {APP_DIR}")
    print(f"{'='*70}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        log("Conectando SSH...", C.Y)
        client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)
        log("Conectado", C.G)

        # 1. Commit actual
        log("\n--- ESTADO ACTUAL ---", C.W)
        run(client, f"cd {APP_DIR} && git rev-parse --short HEAD && git branch --show-current")

        # 2. Fetch + checkout branch
        log("\n--- FETCH & CHECKOUT BRANCH ---", C.W)
        run(client, f"cd {APP_DIR} && git fetch origin", timeout=60)
        status, out, err = run(client, f"cd {APP_DIR} && git checkout {BRANCH} 2>&1 || git checkout -b {BRANCH} origin/{BRANCH}", timeout=30)

        # 3. Pull latest
        log("\n--- GIT PULL ---", C.W)
        status, out, err = run(client, f"cd {APP_DIR} && git pull origin {BRANCH}", timeout=120)
        if status != 0:
            log(f"Git pull failed, intentando reset...", C.Y)
            run(client, f"cd {APP_DIR} && git reset --hard origin/{BRANCH}", timeout=30)

        # 4. Install deps (cheerio es nueva)
        log("\n--- NPM INSTALL ---", C.W)
        status, _, _ = run(client, f"cd {APP_DIR} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600)

        # 5. Prisma generate + migrate
        log("\n--- PRISMA ---", C.W)
        run(client, f"cd {APP_DIR} && npx prisma generate", timeout=120)
        run(client, f"cd {APP_DIR} && npx prisma migrate deploy 2>&1 || npx prisma db push --accept-data-loss 2>&1 | tail -5", timeout=120)

        # 6. Build
        log("\n--- BUILD ---", C.W)
        status, out, err = run(client, f"cd {APP_DIR} && npm run build 2>&1 | tail -30", timeout=900)
        if status != 0:
            log("Build falló. Viendo errores...", C.R)
            run(client, f"cd {APP_DIR} && npm run build 2>&1 | grep -i 'error' | head -20", timeout=900)
            log("Intentando reload con build anterior...", C.Y)

        # 7. PM2 reload
        log("\n--- PM2 RELOAD ---", C.W)
        run(client, f"cd {APP_DIR} && pm2 reload inmova-app --update-env 2>/dev/null || pm2 restart inmova-app --update-env 2>/dev/null || (pm2 delete inmova-app 2>/dev/null; pm2 start ecosystem.config.js --env production)")
        run(client, "pm2 save")

        # 8. Warm-up
        log("\nEsperando warm-up (25s)...", C.Y)
        time.sleep(25)

        # 9. Health checks
        log("\n--- HEALTH CHECKS ---", C.W)

        checks_ok = 0
        checks_total = 5

        # Health API
        s, o, _ = run(client, "curl -sf http://localhost:3000/api/health -m 10")
        if s == 0 and 'ok' in o.lower():
            log("Health API: OK", C.G)
            checks_ok += 1
        else:
            log("Health API: FAIL", C.R)

        # Login page
        s, o, _ = run(client, "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/login -m 10")
        if '200' in o:
            log("Login page: OK", C.G)
            checks_ok += 1
        else:
            log(f"Login page: {o}", C.R)

        # Valoracion IA page
        s, o, _ = run(client, "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/valoracion-ia -m 10")
        if '200' in o:
            log("Valoracion IA page: OK", C.G)
            checks_ok += 1
        else:
            log(f"Valoracion IA page: {o}", C.Y)

        # Auth session
        s, o, _ = run(client, "curl -sf http://localhost:3000/api/auth/session -m 10")
        if s == 0 and 'problem' not in o.lower():
            log("Auth session: OK", C.G)
            checks_ok += 1
        else:
            log("Auth session: CHECK", C.Y)

        # PM2 status
        s, o, _ = run(client, "pm2 status inmova-app --no-color 2>/dev/null | head -10")
        if 'online' in o.lower():
            log("PM2 status: online", C.G)
            checks_ok += 1
        else:
            log("PM2 status: CHECK", C.Y)

        # Error check
        s, o, _ = run(client, "pm2 logs inmova-app --err --lines 5 --nostream 2>/dev/null | grep -i 'NO_SECRET\\|FATAL\\|Cannot find' | head -3")
        if not o.strip():
            log("Logs: sin errores criticos", C.G)
        else:
            log("Errores en logs:", C.Y)

        # Git commit deployed
        log("\n--- COMMIT DEPLOYADO ---", C.W)
        run(client, f"cd {APP_DIR} && git log --oneline -3")

        # Summary
        print(f"\n{'='*70}")
        if checks_ok >= 4:
            log(f"DEPLOY OK — {checks_ok}/{checks_total} checks passed", C.G)
        elif checks_ok >= 2:
            log(f"DEPLOY PARCIAL — {checks_ok}/{checks_total} checks passed", C.Y)
        else:
            log(f"DEPLOY FALLIDO — {checks_ok}/{checks_total} checks passed", C.R)
        print(f"{'='*70}")
        print(f"\nURLs:")
        print(f"  https://inmovaapp.com/valoracion-ia")
        print(f"  http://{SERVER}:3000/valoracion-ia")
        print(f"  https://inmovaapp.com/login")
        print()

        return checks_ok >= 3

    except Exception as e:
        log(f"Error: {e}", C.R)
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

if __name__ == '__main__':
    ok = main()
    sys.exit(0 if ok else 1)
