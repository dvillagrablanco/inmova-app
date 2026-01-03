#!/usr/bin/env python3
"""
Debug: ¿Por qué el build "exitoso" no tiene BUILD_ID?
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

def run_cmd(client, cmd, timeout=60):
    """Execute command"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n🔍 DEBUG BUILD STATUS\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# Ver build log
print("="*70)
print("BUILD LOG (últimas 40 líneas):")
print("="*70 + "\n")

success, out, err = run_cmd(client, "tail -40 /tmp/build-test.log")
for line in out.split('\n'):
    if line.strip():
        print(f"  {line}")

# Ver si existe .next
print("\n" + "="*70)
print("¿EXISTE .next?")
print("="*70 + "\n")

success, out, err = run_cmd(client, f"ls -la {PATH}/.next/ 2>/dev/null | head -15 || echo 'NO_NEXT'")
if 'NO_NEXT' not in out:
    print("  ✅ .next existe:")
    for line in out.split('\n')[:15]:
        if line.strip():
            print(f"    {line}")
else:
    print("  ❌ .next NO existe")

# Ver PM2 logs
print("\n" + "="*70)
print("PM2 LOGS ERROR:")
print("="*70 + "\n")

success, out, err = run_cmd(client, "pm2 logs inmova-app --err --nostream --lines 20 2>/dev/null || echo 'NO_PM2'")
if 'NO_PM2' not in out:
    for line in out.split('\n')[-20:]:
        if line.strip():
            print(f"  {line}")
else:
    print("  ⚠️ No hay logs de PM2")

# Ver PM2 status
print("\n" + "="*70)
print("PM2 STATUS:")
print("="*70 + "\n")

success, out, err = run_cmd(client, "pm2 list")
print(out[:500])

# Intentar start manual
print("\n" + "="*70)
print("INTENTAR START MANUAL:")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && pm2 start ecosystem.config.js --env development"
)
if success:
    print("  ✅ PM2 start exitoso")
else:
    print("  ⚠️ PM2 start falló")
    print(f"  Error: {err[:300]}")

# Wait
print("  ⏳ Esperando 10s...")
import time
time.sleep(10)

# Health check
print("\n" + "="*70)
print("HEALTH CHECK:")
print("="*70 + "\n")

success, out, err = run_cmd(client, "curl -s http://localhost:3000/api/health")
if 'ok' in out.lower():
    print(f"  ✅ Health OK: {out[:100]}")
else:
    print(f"  ⚠️ Health fail: {out[:100]}")

# Landing
success, out, err = run_cmd(
    client,
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing"
)
print(f"  Landing: {out}")

client.close()
print("\n✅ Debug completado\n")
