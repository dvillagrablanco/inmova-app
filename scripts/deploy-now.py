#!/usr/bin/env python3
"""Deploy directo con SSH - step by step con timeouts altos."""
import paramiko
import time
import sys
from datetime import datetime

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def run(client, cmd, timeout=900, label=""):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] {label}...", flush=True)
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        if exit_code != 0 and err:
            print(f"  stderr: {err[:200]}", flush=True)
        return exit_code, out, err
    except Exception as e:
        print(f"  TIMEOUT/ERROR: {e}", flush=True)
        return -1, "", str(e)

def main():
    print("="*60, flush=True)
    print("  DEPLOY INMOVA -> PRODUCCIÓN", flush=True)
    print("="*60, flush=True)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    print("Conectado.", flush=True)

    # 1. Git pull
    code, out, _ = run(client, f"cd {APP_PATH} && git stash 2>&1; git pull origin main 2>&1", label="Git pull")
    print(f"  {out[:200]}", flush=True)

    # 2. npm install
    code, out, _ = run(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600, label="npm install")
    print(f"  {out[:200]}", flush=True)

    # 3. Prisma generate
    code, out, _ = run(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -5", timeout=120, label="Prisma generate")
    print(f"  {out[:200]}", flush=True)

    # 4. Prisma migrate (para ManagementContract)
    code, out, _ = run(client, f"cd {APP_PATH} && npx prisma db push --accept-data-loss 2>&1 | tail -10", timeout=120, label="Prisma db push")
    print(f"  {out[:300]}", flush=True)

    # 5. Build
    code, out, _ = run(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -30", timeout=900, label="Build (puede tardar 5-10 min)")
    print(f"  {out[:500]}", flush=True)

    # 6. PM2 reload
    code, out, _ = run(client, "pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1", timeout=60, label="PM2 reload")
    print(f"  {out[:200]}", flush=True)

    # 7. Wait
    print("Esperando warm-up (20s)...", flush=True)
    time.sleep(20)

    # 8. Health check
    code, out, _ = run(client, "curl -sf http://localhost:3000/api/health 2>&1", label="Health check")
    print(f"  {out[:200]}", flush=True)

    # 9. PM2 status
    code, out, _ = run(client, "pm2 status inmova-app --no-color 2>&1 | grep inmova", label="PM2 status")
    print(f"  {out[:200]}", flush=True)

    # 10. Auth check
    code, out, _ = run(client, "curl -sf http://localhost:3000/api/auth/session 2>&1", label="Auth session")
    ok = 'problem' not in out.lower()
    print(f"  Auth: {'OK' if ok else 'ERROR - ' + out[:100]}", flush=True)

    # 11. Check errors
    code, out, _ = run(client, "pm2 logs inmova-app --err --lines 5 --nostream 2>&1 | tail -5", label="Error logs")
    print(f"  {out[:200]}", flush=True)

    client.close()

    print("\n" + "="*60, flush=True)
    print("  DEPLOY COMPLETADO", flush=True)
    print("  https://inmovaapp.com", flush=True)
    print("="*60, flush=True)

if __name__ == '__main__':
    main()
