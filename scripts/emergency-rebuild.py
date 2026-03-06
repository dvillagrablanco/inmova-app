#!/usr/bin/env python3
"""Emergency rebuild — .next directory missing."""
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)
c.get_transport().set_keepalive(30)

APP = '/opt/inmova-app'

def run(cmd, t=900):
    print(f"$ {cmd[:120]}")
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return code, out, err

print("✅ Connected\n")

# Stop PM2 first to free resources
print("[1] Stopping PM2...")
run(f"pm2 stop inmova-app 2>/dev/null")
print("   Stopped\n")

# Check .next
print("[2] Checking .next...")
_, out, _ = run(f"ls -la {APP}/.next/BUILD_ID 2>&1")
print(f"   .next/BUILD_ID: {out}")
_, out, _ = run(f"ls -la {APP}/.next/build-manifest.json 2>&1")
print(f"   build-manifest: {out}")
print()

# Clean and rebuild
print("[3] Cleaning .next cache...")
run(f"rm -rf {APP}/.next")
print("   Cleaned\n")

print("[4] Prisma generate...")
code, out, _ = run(f"cd {APP} && npx prisma generate 2>&1 | tail -5")
print(f"   {'✅' if code == 0 else '❌'} {out[-100:]}\n")

print("[5] Building (this takes 5-10 minutes)...")
code, out, err = run(f"cd {APP} && npm run build 2>&1 | tail -20", t=900)
print(f"   Exit code: {code}")
for line in out.split('\n')[-10:]:
    print(f"   {line}")
if code != 0 and err:
    print(f"   ERR: {err[-200:]}")
print()

# Verify build output
print("[6] Verifying build...")
_, out, _ = run(f"ls -la {APP}/.next/BUILD_ID 2>&1")
print(f"   BUILD_ID: {out}")
_, out, _ = run(f"ls {APP}/.next/server/app 2>&1 | head -5")
print(f"   Server pages: {out[:200]}")
print()

# Restart PM2
print("[7] Starting PM2...")
run(f"cd {APP} && pm2 start inmova-app --update-env 2>/dev/null || pm2 restart inmova-app --update-env")
print("   Started. Waiting 25s...")
time.sleep(25)

# Verify
print("\n[8] Verify...")
_, health, _ = run("curl -sf http://localhost:3000/api/health 2>&1 | head -3", t=15)
print(f"   Health: {'✅ OK' if health and 'ok' in health.lower() else '⚠️ ' + (health or 'NO RESPONSE')[:100]}")

_, login, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/login", t=15)
print(f"   Login: {'✅' if login == '200' else '⚠️'} HTTP {login}")

_, op, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/firma-digital/operadores", t=15)
print(f"   Operadores: {'✅' if op == '200' else '⚠️'} HTTP {op}")

c.close()
print("\nDone.")
