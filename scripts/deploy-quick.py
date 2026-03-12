#!/usr/bin/env python3
"""Deploy rápido: el git pull y npm install ya están hechos. Solo build + restart."""
import paramiko, time, sys
from datetime import datetime

SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP = '/opt/inmova-app'

def run(c, cmd, t=900):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] $ {cmd[:80]}...", flush=True)
    _, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return code, out, err

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(SERVER, username=USER, password=PASS, timeout=30)
print("Connected.", flush=True)

# Check if build was already done or running
code, out, _ = run(c, f"ls -la {APP}/.next/BUILD_ID 2>&1 && cat {APP}/.next/BUILD_ID", 10)
print(f"  Current build: {out.strip()}", flush=True)

# Check if npm run build is already running
code, out, _ = run(c, "pgrep -f 'next build' | head -1", 10)
if out.strip():
    print(f"  Build already running (PID: {out.strip()}). Waiting...", flush=True)
    for i in range(60):
        time.sleep(30)
        code, out, _ = run(c, "pgrep -f 'next build' | head -1", 10)
        if not out.strip():
            print("  Build finished!", flush=True)
            break
        print(f"  Still building... ({(i+1)*30}s)", flush=True)
else:
    # Run build with nohup so it doesn't get killed by SSH timeout
    print("Starting build via nohup...", flush=True)
    run(c, f"cd {APP} && nohup npm run build > /tmp/inmova-build.log 2>&1 &", 10)
    
    time.sleep(5)
    for i in range(60):
        code, out, _ = run(c, "pgrep -f 'next build' | head -1", 10)
        if not out.strip():
            print("  Build finished!", flush=True)
            break
        # Show last line of build log
        _, log_tail, _ = run(c, "tail -1 /tmp/inmova-build.log 2>&1", 10)
        print(f"  [{(i+1)*15}s] {log_tail.strip()[:80]}", flush=True)
        time.sleep(15)

# Show build result
code, out, _ = run(c, "tail -20 /tmp/inmova-build.log 2>&1", 10)
print(f"\n  Build output:\n{out}", flush=True)

# Check build success
code, out, _ = run(c, f"ls -la {APP}/.next/BUILD_ID 2>&1", 10)
if '.next/BUILD_ID' in out:
    print("Build OK!", flush=True)
else:
    print("Build FAILED. Check /tmp/inmova-build.log", flush=True)
    c.close()
    sys.exit(1)

# PM2 reload
print("\nRestarting PM2...", flush=True)
code, out, _ = run(c, "pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1", 60)
print(f"  {out[:150]}", flush=True)

time.sleep(20)
print("Warm-up done.", flush=True)

# Health checks
code, out, _ = run(c, "curl -sf http://localhost:3000/api/health 2>&1", 15)
health_ok = '"status":"ok"' in out or '"status"' in out
print(f"  Health: {'OK' if health_ok else out[:100]}", flush=True)

code, out, _ = run(c, "curl -sf http://localhost:3000/api/auth/session 2>&1", 15)
auth_ok = 'problem' not in out.lower()
print(f"  Auth: {'OK' if auth_ok else 'ERROR'}", flush=True)

code, out, _ = run(c, "pm2 status inmova-app --no-color 2>&1 | grep inmova", 10)
print(f"  PM2: {out.strip()}", flush=True)

c.close()
print(f"\nDEPLOY COMPLETADO -> https://inmovaapp.com", flush=True)
