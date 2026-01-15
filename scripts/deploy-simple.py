#!/usr/bin/env python3
"""Deploy simple con timeouts cortos"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER = "157.180.119.236"
USER = "root"
PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
PATH = "/opt/inmova-app"
BRANCH = "cursor/login-y-sidebar-fce3"

print("🚀 Conectando...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=30)
print("✅ Conectado")

def run(cmd, timeout=120):
    print(f"→ {cmd[:60]}...")
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        stdout.channel.settimeout(timeout)
        out = stdout.read().decode('utf-8', errors='ignore')[-500:]
        err = stderr.read().decode('utf-8', errors='ignore')[-200:]
        status = stdout.channel.recv_exit_status()
        if out: print(f"  {out[-300:]}")
        return status
    except Exception as e:
        print(f"  ⚠️ {e}")
        return 1

# Pasos
print("\n1️⃣ Git fetch...")
run(f"cd {PATH} && git fetch origin {BRANCH}")

print("\n2️⃣ Git checkout...")
run(f"cd {PATH} && git checkout {BRANCH} 2>/dev/null || git checkout -b {BRANCH} origin/{BRANCH}")

print("\n3️⃣ Git pull...")
run(f"cd {PATH} && git pull origin {BRANCH}")

print("\n4️⃣ npm install...")
run(f"cd {PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=300)

print("\n5️⃣ Prisma generate...")
run(f"cd {PATH} && npx prisma generate 2>&1 | tail -3")

print("\n6️⃣ Build (puede tardar)...")
run(f"cd {PATH} && npm run build 2>&1 | tail -10", timeout=480)

print("\n7️⃣ PM2 restart...")
run(f"cd {PATH} && pm2 delete inmova-app 2>/dev/null; pm2 start ecosystem.config.js --env production 2>&1 | tail -5")

print("\n⏳ Esperando 15s...")
time.sleep(15)

print("\n8️⃣ Health check...")
run("curl -s http://localhost:3000/api/health | head -1")

print("\n9️⃣ PM2 status...")
run("pm2 status")

print("\n✅ Deployment completado")
client.close()
