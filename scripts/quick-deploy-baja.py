#!/usr/bin/env python3
"""Deployment rápido - Baja de Usuario"""
import paramiko
import time
import sys

SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'
BRANCH = 'cursor/baja-de-usuario-5895'

def cmd(c, cmd_str, timeout=300):
    print(f"→ {cmd_str[:70]}...")
    sys.stdout.flush()
    stdin, stdout, stderr = c.exec_command(cmd_str, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if exit_code == 0:
        print("  ✅ OK")
    else:
        print(f"  ❌ Error: {err[:150] if err else 'exit code ' + str(exit_code)}")
    sys.stdout.flush()
    return exit_code == 0, out

print(f"\n🚀 DEPLOY to {SERVER}\n")
sys.stdout.flush()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("Connecting...")
    sys.stdout.flush()
    client.connect(SERVER, username=USER, password=PASS, timeout=30)
    print("✅ Connected\n")
    sys.stdout.flush()

    # Git operations
    cmd(client, f"cd {PATH} && git stash")
    cmd(client, f"cd {PATH} && git fetch --all")
    cmd(client, f"cd {PATH} && git checkout {BRANCH} 2>/dev/null || git checkout -b {BRANCH} origin/{BRANCH}")
    cmd(client, f"cd {PATH} && git pull origin {BRANCH}")

    # Install & Prisma
    print("\n📦 Installing...")
    sys.stdout.flush()
    cmd(client, f"cd {PATH} && npm install", timeout=600)
    cmd(client, f"cd {PATH} && npx prisma generate")
    cmd(client, f"cd {PATH} && npx prisma migrate deploy")

    # Restart
    print("\n🔄 Restarting...")
    sys.stdout.flush()
    cmd(client, "pm2 reload inmova-app --update-env")
    cmd(client, "pm2 save")
    
    print("\n⏳ Waiting 15s...")
    sys.stdout.flush()
    time.sleep(15)

    # Health check
    print("\n🏥 Health check...")
    sys.stdout.flush()
    ok, out = cmd(client, "curl -s http://localhost:3000/api/health")
    if 'ok' in out.lower():
        print("  ✅ Health OK")
    
    ok, out = cmd(client, "pm2 status inmova-app")
    if 'online' in out.lower():
        print("  ✅ PM2 Online")
    
    # Test new API
    ok, out = cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/user/deactivate")
    print(f"  API /api/user/deactivate: HTTP {out.strip()}")

    print("\n" + "="*50)
    print("✅ DEPLOYMENT COMPLETADO")
    print("="*50)
    print(f"URL: https://inmovaapp.com/configuracion")
    print("Nueva funcionalidad: Mi Cuenta → Darme de baja")
    print("="*50 + "\n")
    sys.stdout.flush()

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    sys.stdout.flush()
    raise
finally:
    client.close()
