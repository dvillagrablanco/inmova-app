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

print("Connected\n")

# Pull
run(f"cd {APP} && git checkout -- . 2>/dev/null")
run(f"mkdir -p /tmp/qb && mv -f {APP}/data/seguros/*.pdf /tmp/qb/ 2>/dev/null && mv -f {APP}/scripts/audit-data.js /tmp/qb/ 2>/dev/null && mv -f {APP}/scripts/check-insurances.js /tmp/qb/ 2>/dev/null && mv -f {APP}/scripts/load-seguros-gdrive.ts /tmp/qb/ 2>/dev/null", t=10)
code, out, _ = run(f"cd {APP} && git pull origin main", t=60)
print(f"Pull: {'OK' if code == 0 else 'FAIL'} {out[-80:]}")
run(f"cp -n /tmp/qb/* {APP}/data/seguros/ 2>/dev/null && cp -n /tmp/qb/*.js {APP}/scripts/ 2>/dev/null && cp -n /tmp/qb/*.ts {APP}/scripts/ 2>/dev/null", t=10)

# Build
print("\nBuilding...")
run(f"rm -rf {APP}/.next")
run(f"cd {APP} && npx prisma generate 2>&1 | tail -2")
code, out, _ = run(f"cd {APP} && npm run build 2>&1 | tail -10")
print(f"Build: {'OK' if code == 0 else 'FAIL'}")
if code != 0:
    print(out[-300:])

# Restart
run(f"cd {APP} && pm2 restart inmova-app --update-env")
print("Restarted. Waiting 25s...")
time.sleep(25)

# Verify
_, h, _ = run("curl -sf http://localhost:3000/api/health", t=15)
print(f"Health: {'OK' if h and 'ok' in h.lower() else h or 'FAIL'}")
_, l, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/firma-digital/operadores", t=15)
print(f"Operadores: HTTP {l}")

# Test operator-signatures API
_, api, _ = run("curl -sf http://localhost:3000/api/operator-signatures/stats 2>&1 | head -5", t=15)
print(f"Stats API: {api[:150]}")

c.close()
print("\nDone.")
