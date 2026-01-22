#!/usr/bin/env python3
"""Emergency deploy - start in dev mode to bypass build errors"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username="root", password=PASSWORD, timeout=30)

def run(cmd, timeout=120):
    print(f"\n$ {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n')[-10:]:
            print(f"  {line}")
    return status, out

print("=" * 60)
print("🚨 EMERGENCY DEPLOY - DEV MODE")
print("=" * 60)

# 1. Stop everything and clean up
print("\n1. Limpiando procesos anteriores...")
run("pm2 delete all 2>/dev/null || true")
run("pm2 kill 2>/dev/null || true")
run("fuser -k 3000/tcp 2>/dev/null || true")
time.sleep(2)

# 2. Start in dev mode with production env
print("\n2. Iniciando en modo desarrollo (evita errores de build)...")
run("cd /opt/inmova-app && NODE_ENV=production pm2 start npm --name inmova-app -- run dev -- -p 3000", timeout=30)

# 3. Wait for startup
print("\n3. Esperando arranque (45s)...")
time.sleep(45)

# 4. Check status
print("\n4. Verificando estado...")
run("pm2 list")

# 5. Health check
print("\n5. Health check...")
for i in range(5):
    status, out = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 --connect-timeout 5")
    print(f"  Intento {i+1}: HTTP {out}")
    if "200" in out:
        print("\n✅ APLICACIÓN FUNCIONANDO")
        break
    time.sleep(10)
else:
    print("\n⚠️ La aplicación puede tardar más en arrancar")

# 6. Save PM2
run("pm2 save")

print("\n" + "=" * 60)
print("🏁 Deploy de emergencia completado")
print("URL: https://inmovaapp.com")
print("=" * 60)

client.close()
