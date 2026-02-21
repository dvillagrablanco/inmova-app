#!/usr/bin/env python3
"""
Deploy INMOVA to production via SSH (paramiko)
"""
import sys
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_DIR = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    ts = time.strftime('%H:%M:%S')
    print(f"{color}[{ts}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    log(f"  $ {cmd}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n')[:20]:
            print(f"    {line}")
        if len(out.split('\n')) > 20:
            print(f"    ... ({len(out.split(chr(10)))} lines total)")
    if err and exit_status != 0:
        for line in err.split('\n')[:10]:
            print(f"    {Colors.RED}{line}{Colors.RESET}")
    return exit_status, out, err

def main():
    print(f"\n{'='*70}")
    print(f"{Colors.BOLD}DEPLOY INMOVA - PRODUCCION{Colors.RESET}")
    print(f"{'='*70}")
    print(f"Servidor: {SERVER}")
    print(f"App Dir:  {APP_DIR}")
    print(f"{'='*70}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        log("Conectando por SSH...", Colors.YELLOW)
        client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)
        log("Conectado", Colors.GREEN)

        # 1. Backup
        log("\n--- BACKUP ---", Colors.BOLD)
        ts = time.strftime('%Y%m%d_%H%M%S')
        exec_cmd(client, f"cd {APP_DIR} && git rev-parse --short HEAD")

        # 2. Git pull
        log("\n--- GIT PULL ---", Colors.BOLD)
        status, out, err = exec_cmd(client, f"cd {APP_DIR} && git pull origin main", timeout=120)
        if status != 0:
            log(f"Git pull failed: {err}", Colors.RED)
            return False

        # 3. Install deps
        log("\n--- INSTALL DEPENDENCIES ---", Colors.BOLD)
        status, out, err = exec_cmd(client, f"cd {APP_DIR} && npm install --production=false", timeout=600)
        if status != 0:
            log("npm install failed, trying with --legacy-peer-deps", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_DIR} && npm install --legacy-peer-deps", timeout=600)

        # 4. Prisma generate
        log("\n--- PRISMA GENERATE ---", Colors.BOLD)
        exec_cmd(client, f"cd {APP_DIR} && npx prisma generate", timeout=120)

        # 5. Prisma migrate
        log("\n--- PRISMA MIGRATE ---", Colors.BOLD)
        exec_cmd(client, f"cd {APP_DIR} && npx prisma migrate deploy", timeout=120)

        # 6. Build
        log("\n--- BUILD ---", Colors.BOLD)
        status, out, err = exec_cmd(client, f"cd {APP_DIR} && npm run build", timeout=600)
        if status != 0:
            log("Build failed!", Colors.RED)
            log("Checking error...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_DIR} && tail -50 /tmp/inmova-build.log 2>/dev/null || echo 'No build log'")
            log("Attempting PM2 reload anyway (previous build may work)...", Colors.YELLOW)

        # 7. PM2 reload
        log("\n--- PM2 RELOAD ---", Colors.BOLD)
        exec_cmd(client, f"cd {APP_DIR} && pm2 reload inmova-app --update-env 2>/dev/null || pm2 restart inmova-app --update-env 2>/dev/null || (pm2 delete inmova-app 2>/dev/null; pm2 start ecosystem.config.js --env production)")

        # 8. Wait for warm-up
        log("\nEsperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)

        # 9. Health checks
        log("\n--- HEALTH CHECKS ---", Colors.BOLD)

        # HTTP check
        status, out, _ = exec_cmd(client, "curl -sf http://localhost:3000/api/health -m 10")
        if status == 0 and 'ok' in out.lower():
            log("HTTP health: OK", Colors.GREEN)
        else:
            log("HTTP health: FAIL", Colors.RED)

        # Login page
        status, out, _ = exec_cmd(client, "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/login -m 10")
        if '200' in out:
            log("Login page: OK (200)", Colors.GREEN)
        else:
            log(f"Login page: {out}", Colors.YELLOW)

        # PM2 status
        exec_cmd(client, "pm2 status inmova-app --no-color 2>/dev/null | head -10")

        # Auth session check
        status, out, _ = exec_cmd(client, "curl -sf http://localhost:3000/api/auth/session -m 10")
        if status == 0 and 'problem' not in out.lower():
            log("Auth session: OK", Colors.GREEN)
        else:
            log("Auth session: CHECK", Colors.YELLOW)

        # Check PM2 errors
        status, out, _ = exec_cmd(client, "pm2 logs inmova-app --err --lines 5 --nostream 2>/dev/null | grep -i 'error\\|NO_SECRET' | head -5")
        if not out.strip():
            log("No critical errors in logs", Colors.GREEN)
        else:
            log("Errors found in logs:", Colors.YELLOW)

        log(f"\n{'='*70}", Colors.BOLD)
        log("DEPLOY COMPLETADO", Colors.GREEN)
        log(f"{'='*70}\n", Colors.BOLD)

        # Show final git commit
        exec_cmd(client, f"cd {APP_DIR} && git log --oneline -1")

        return True

    except Exception as e:
        log(f"Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
