#!/usr/bin/env python3
"""Verificar estado de páginas stub"""
import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)
import paramiko

SERVER, USER, PASS = '157.180.119.236', 'root', 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return out, err

print("\n" + "="*70)
print("🔍 VERIFICACIÓN DE PÁGINAS STUB")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

print("1. Verificando PM2 status...")
out, _ = run("pm2 status inmova-app")
if 'online' in out:
    print("   ✅ PM2 online\n")
else:
    print("   ❌ PM2 no está online")
    print(out)

print("2. Ver últimos logs de PM2...")
out, _ = run("pm2 logs inmova-app --lines 20 --nostream")
print(out[-500:] if len(out) > 500 else out)

print("\n3. Test health check...")
out, _ = run("curl -s http://localhost:3000/api/health")
print(f"   Response: {out[:100]}")

print("\n4. Test página stub (traditional-rental)...")
out, _ = run("curl -s http://localhost:3000/traditional-rental | head -50")
print(f"   Response: {out[:200]}")

print("\n5. Verificar archivos creados...")
files = [
    'app/traditional-rental/page.tsx',
    'app/str-housekeeping/page.tsx',
    'app/room-rental/page.tsx',
    'app/open-banking/page.tsx',
    'app/soporte/page.tsx',
]

for f in files:
    out, _ = run(f"cd {PATH} && ls -la {f} 2>&1")
    if 'No such file' not in out:
        print(f"   ✅ {f}")
    else:
        print(f"   ❌ {f} - NO EXISTE")

print("\n" + "="*70 + "\n")
client.close()
