#!/usr/bin/env python3
"""
Deploy del fix de auditoría Vidaro a producción.
- Pull rama feature en servidor
- npm install (si necesario)
- npm run build
- pm2 reload
- Verificar health
"""
import paramiko
import time
import sys

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_DIR = "/opt/inmova-app"
BRANCH = "cursor/visual-audit-vidaro-5e81"


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def exec_cmd(client, cmd, timeout=60, show=True):
    if show:
        log(f"$ {cmd[:200]}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if show and out.strip():
        for line in out.splitlines()[-15:]:
            print(f"   | {line}")
    if show and err.strip():
        for line in err.splitlines()[-10:]:
            print(f"   | ERR: {line}")
    return code, out, err


def main():
    log(f"Conectando a {SERVER_IP}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=15)
    log("Conectado.")

    try:
        log("== 1. Backup BD ==")
        ts = time.strftime('%Y%m%d_%H%M%S')
        exec_cmd(client, f"mkdir -p /var/backups/inmova && cd {APP_DIR} && DBURL=$(grep '^DATABASE_URL=' .env.production | head -1 | cut -d= -f2- | tr -d '\"') && pg_dump \"$DBURL\" > /var/backups/inmova/pre-vidaro-audit-{ts}.sql 2>&1 | tail -5", timeout=180)

        log("== 2. Save current commit (rollback) ==")
        code, current_commit, _ = exec_cmd(client, f"cd {APP_DIR} && git rev-parse HEAD", show=False)
        log(f"   Current: {current_commit.strip()}")

        log("== 3. Fetch & Checkout branch ==")
        exec_cmd(client, f"cd {APP_DIR} && git fetch origin {BRANCH} 2>&1 | tail -5", timeout=60)
        exec_cmd(client, f"cd {APP_DIR} && git checkout {BRANCH} 2>&1 | tail -5", timeout=30)
        exec_cmd(client, f"cd {APP_DIR} && git pull origin {BRANCH} 2>&1 | tail -5", timeout=60)
        code, new_commit, _ = exec_cmd(client, f"cd {APP_DIR} && git rev-parse HEAD", show=False)
        log(f"   New: {new_commit.strip()}")

        log("== 4. npm install (si hay cambios en package) ==")
        # check if package.json or package-lock changed
        code, _, _ = exec_cmd(client, f"cd {APP_DIR} && git diff --name-only {current_commit.strip()} {new_commit.strip()} | grep -E 'package(-lock)?\\.json'", show=True)
        if code == 0:
            log("Package changed, running install...")
            exec_cmd(client, f"cd {APP_DIR} && npm ci 2>&1 | tail -10", timeout=600)
        else:
            log("No package changes, skipping install")

        log("== 5. Prisma generate ==")
        exec_cmd(client, f"cd {APP_DIR} && npx prisma generate 2>&1 | tail -5", timeout=120)

        log("== 6. Build ==")
        code, out, err = exec_cmd(client, f"cd {APP_DIR} && npm run build 2>&1 | tail -30", timeout=900)
        if code != 0:
            log(f"❌ Build falló (exit {code}). Rollback...")
            exec_cmd(client, f"cd {APP_DIR} && git checkout {current_commit.strip()} && npm run build 2>&1 | tail -10", timeout=900)
            sys.exit(1)

        log("== 7. PM2 reload ==")
        exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1 | tail -5", timeout=60)

        log("== 8. Wait warm-up ==")
        time.sleep(20)

        log("== 9. Health check ==")
        code, out, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health | head -c 500")
        if '"status":"ok"' not in out:
            log(f"❌ Health check falló: {out}")
            sys.exit(1)

        log("== 10. PM2 status ==")
        exec_cmd(client, "pm2 list")

        log("✅ DEPLOYMENT COMPLETADO")

    finally:
        client.close()


if __name__ == "__main__":
    main()
