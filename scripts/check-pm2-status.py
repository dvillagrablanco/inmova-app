#!/usr/bin/env python3
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)

def run(cmd, t=60):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    return code, stdout.read().decode('utf-8', errors='ignore').strip(), stderr.read().decode('utf-8', errors='ignore').strip()

print("=== PM2 STATUS ===")
_, out, _ = run("pm2 list")
print(out)

print("\n=== PM2 LOGS (last 30 lines) ===")
_, out, _ = run("pm2 logs inmova-app --nostream --lines 30 2>&1")
print(out)

print("\n=== PM2 ERROR LOGS ===")
_, out, _ = run("pm2 logs inmova-app --err --nostream --lines 20 2>&1")
print(out)

print("\n=== WAIT 30s AND RETRY ===")
time.sleep(30)
_, out, _ = run("curl -sf http://localhost:3000/api/health 2>&1 | head -3")
print(f"Health: {out or 'NO RESPONSE'}")

_, out, _ = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/login")
print(f"Login: HTTP {out}")

c.close()
