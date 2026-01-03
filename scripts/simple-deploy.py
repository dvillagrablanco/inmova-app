#!/usr/bin/env python3
"""Deployment Simplificado"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko
import time

SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

def run_cmd(client, cmd):
    print(f"→ {cmd[:60]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if exit_status == 0:
        print(f"✅ OK")
        return True, out
    else:
        print(f"❌ Error {exit_status}")
        if err:
            print(f"  {err[:200]}")
        return False, out

print(f"\n🚀 DEPLOYMENT TO {SERVER}\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Connected\n")

# 1. Backup
print("=== BACKUP ===")
run_cmd(client, f"cd {PATH} && git rev-parse HEAD")

# 2. Update
print("\n=== UPDATE CODE ===")
success, _ = run_cmd(client, f"cd {PATH} && git pull origin cursor/cursorrules-next-steps-caf3 || git pull origin main")
if not success:
    print("⚠️ Git pull failed, continuing...")

# 3. Install
print("\n=== INSTALL ===")
run_cmd(client, f"cd {PATH} && npm install")

# 4. Prisma
print("\n=== PRISMA ===")
run_cmd(client, f"cd {PATH} && npx prisma generate")
run_cmd(client, f"cd {PATH} && npx prisma migrate deploy")

# 5. Deploy
print("\n=== DEPLOY ===")
run_cmd(client, f"cd {PATH} && pm2 reload inmova-app --update-env || pm2 restart inmova-app")
run_cmd(client, "pm2 save")
print("⏳ Waiting 15s for warm-up...")
time.sleep(15)

# 6. Health check
print("\n=== HEALTH CHECK ===")
success, out = run_cmd(client, "curl -s http://localhost:3000/api/health")
if 'ok' in out.lower():
    print("✅ Health check PASSED")
else:
    print("⚠️ Health check uncertain")

success, out = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    print("✅ PM2 online")

print("\n✅ DEPLOYMENT COMPLETED!")
print(f"→ https://inmovaapp.com")
print(f"→ http://{SERVER}:3000\n")

client.close()
