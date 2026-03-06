#!/usr/bin/env python3
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

# Pull
print("[1] Pull...")
run(f"cd {APP} && git checkout -- . 2>/dev/null")
run(f"mkdir -p /tmp/ibak && mv -f {APP}/data/seguros/*.pdf /tmp/ibak/ 2>/dev/null && mv -f {APP}/scripts/audit-data.js /tmp/ibak/ 2>/dev/null && mv -f {APP}/scripts/check-insurances.js /tmp/ibak/ 2>/dev/null && mv -f {APP}/scripts/load-seguros-gdrive.ts /tmp/ibak/ 2>/dev/null", t=10)
code, out, _ = run(f"cd {APP} && git pull origin main", t=120)
print(f"   {'✅' if code == 0 else '❌'} {out[-100:]}")
run(f"cp -n /tmp/ibak/* {APP}/data/seguros/ 2>/dev/null && cp -n /tmp/ibak/*.js {APP}/scripts/ 2>/dev/null && cp -n /tmp/ibak/*.ts {APP}/scripts/ 2>/dev/null", t=10)

# Build
print("\n[2] Clean + Build...")
run(f"rm -rf {APP}/.next")
run(f"cd {APP} && npx prisma generate 2>&1 | tail -2")
code, out, err = run(f"cd {APP} && npm run build 2>&1 | tail -20")
if code == 0:
    print("   ✅ Build OK")
else:
    print(f"   ❌ Build failed (exit {code})")
    print(f"   {(err or out)[-400:]}")
    c.close()
    sys.exit(1)

# Verify BUILD_ID
_, bid, _ = run(f"cat {APP}/.next/BUILD_ID 2>&1")
print(f"   BUILD_ID: {bid}")

# Start
print("\n[3] Restart PM2...")
run(f"cd {APP} && pm2 restart inmova-app --update-env")
print("   Waiting 25s...")
time.sleep(25)

# Verify
print("\n[4] Verify...")
_, h, _ = run("curl -sf http://localhost:3000/api/health", t=15)
print(f"   Health: {'✅' if h and 'ok' in h.lower() else '⚠️ ' + (h or 'NO RESPONSE')}")
_, l, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/login", t=15)
print(f"   Login: {'✅' if l == '200' else '⚠️'} HTTP {l}")
_, op, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/firma-digital/operadores", t=15)
print(f"   Operadores: {'✅' if op == '200' else '⚠️'} HTTP {op}")
_, ds, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/admin/integraciones/docusign", t=15)
print(f"   DocuSign admin: {'✅' if ds == '200' else '⚠️'} HTTP {ds}")

c.close()
print("\n✅ Done.")
