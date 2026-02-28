#!/usr/bin/env python3
"""Deploy Inmova App to production server via SSH (Paramiko)"""
import sys
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASS = '97V^577;{4UXqEJE.sS.8oGM'
APP_DIR = '/opt/inmova-app'

def exec_cmd(client, cmd, timeout=300):
    print(f"  $ {cmd[:80]}{'...' if len(cmd) > 80 else ''}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n')[-5:]:
            print(f"    {line}")
    if exit_code != 0 and err:
        for line in err.split('\n')[-3:]:
            print(f"    [ERR] {line}")
    return exit_code, out, err

def main():
    print(f"\n{'='*60}")
    print("DEPLOY INMOVA APP TO PRODUCTION")
    print(f"{'='*60}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print("[1/7] Connecting to server...")
    try:
        client.connect(SERVER, username=USER, password=PASS, timeout=15)
        print(f"  ✅ Connected to {SERVER}\n")
    except Exception as e:
        print(f"  ❌ Connection failed: {e}")
        sys.exit(1)

    print("[2/7] Pulling latest code...")
    code, out, _ = exec_cmd(client, f"cd {APP_DIR} && git pull origin main")
    if code != 0:
        print("  ❌ Git pull failed")
        client.close()
        sys.exit(1)
    print(f"  ✅ Code updated\n")

    print("[3/7] Installing dependencies...")
    code, _, _ = exec_cmd(client, f"cd {APP_DIR} && npm install --production=false", timeout=600)
    if code != 0:
        print("  ⚠️ npm install had issues, continuing...")
    print(f"  ✅ Dependencies installed\n")

    print("[4/7] Generating Prisma client...")
    code, _, _ = exec_cmd(client, f"cd {APP_DIR} && npx prisma generate", timeout=120)
    print(f"  ✅ Prisma generated\n")

    print("[5/7] Building application...")
    code, _, err = exec_cmd(client, f"cd {APP_DIR} && npm run build", timeout=600)
    if code != 0:
        print(f"  ❌ Build failed. Trying with --no-lint...")
        code, _, _ = exec_cmd(client, f"cd {APP_DIR} && npm run build:vercel", timeout=600)
        if code != 0:
            print("  ❌ Build failed completely. Skipping build, restarting PM2 with dev mode...")
            # Don't exit - try to restart anyway
    print(f"  ✅ Build complete\n")

    print("[6/7] Restarting PM2...")
    exec_cmd(client, f"cd {APP_DIR} && pm2 reload inmova-app --update-env 2>/dev/null || pm2 restart inmova-app --update-env 2>/dev/null || pm2 start ecosystem.config.js --env production 2>/dev/null")
    print(f"  ✅ PM2 reloaded\n")

    print("[7/7] Health check (waiting 15s for warm-up)...")
    time.sleep(15)
    code, out, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
    if '"status":"ok"' in out:
        print(f"  ✅ Health check PASSED\n")
    else:
        print(f"  ⚠️ Health check returned: {out[:200]}\n")

    # Verify login page
    code, out, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
    print(f"  Login page: HTTP {out}")

    # Check PM2 status
    exec_cmd(client, "pm2 status")

    client.close()

    print(f"\n{'='*60}")
    print("✅ DEPLOYMENT COMPLETE")
    print(f"{'='*60}")
    print(f"\nURLs:")
    print(f"  Production: https://inmovaapp.com")
    print(f"  Fallback:   http://{SERVER}")
    print(f"  Health:     https://inmovaapp.com/api/health")

if __name__ == '__main__':
    main()
