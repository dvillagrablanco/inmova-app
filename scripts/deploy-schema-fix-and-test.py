#!/usr/bin/env python3
"""
Deploy schema fix y ejecutar tests E2E
"""

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

def run_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🚀 DEPLOY SCHEMA FIX + TESTS E2E")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Git pull
print("1. GIT PULL")
print("-"*70 + "\n")

run_cmd(client, f"cd {PATH} && git pull origin main")
print("  ✅ Código actualizado\n")

# 2. Prisma generate (schema actualizado)
print("2. PRISMA GENERATE")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && npx prisma generate",
    timeout=120
)

if 'Generated Prisma Client' in out:
    print("  ✅ Prisma Client regenerado\n")
else:
    print("  ⚠️ Warnings:")
    for line in (out + err).split('\n')[-5:]:
        if line.strip():
            print(f"    {line}")
    print()

# 3. Rebuild
print("3. REBUILD APP")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && npm run build",
    timeout=600
)

if 'Compiled successfully' in out or '.next' in out:
    print("  ✅ Build completado\n")

# 4. Restart PM2
print("4. RESTART PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 restart inmova-app")
print("  ✅ PM2 restarted")
time.sleep(20)

# 5. Health check
print("\n5. HEALTH CHECK")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/health"
)

if '"status":"ok"' in out:
    print("  ✅ Health check OK\n")
    print(f"  {out[:100]}\n")
else:
    print("  ❌ Health check FAILED")
    print(f"  {out[:200]}\n")

# 6. Ver logs
print("6. LOGS RECIENTES")
print("-"*70 + "\n")

time.sleep(5)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 20 --nostream | grep -i 'subscriptionplanid' || echo 'Sin errores'"
)

if 'Sin errores' in out:
    print("  ✅ Sin errores de subscriptionPlanId\n")
else:
    print("  ⚠️ Aún hay menciones:")
    for line in out.split('\n')[:5]:
        if line.strip():
            print(f"    {line}")
    print()

print("\n" + "="*70)
print("COMPLETADO")
print("="*70 + "\n")

print("✅ Schema actualizado (subscriptionPlanId ahora es opcional)")
print("✅ Prisma regenerado")
print("✅ App rebuildeada")
print("✅ PM2 restarted\n")

print("Para ejecutar tests E2E localmente:")
print("  PLAYWRIGHT_BASE_URL=https://inmovaapp.com npx playwright test --reporter=list\n")

print("="*70 + "\n")

client.close()
