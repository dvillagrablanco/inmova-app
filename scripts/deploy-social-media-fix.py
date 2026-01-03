#!/usr/bin/env python3
"""Deploy fix de redes sociales"""
import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)
import paramiko, time

SERVER, USER, PASS = '157.180.119.236', 'root', 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore')

print("\n" + "="*70)
print("🔧 DEPLOY: Fix de Redes Sociales")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

print("1. Git pull...")
run(f"cd {PATH} && git pull origin main")
print("   ✅ Código actualizado\n")

print("2. Build...")
run(f"cd {PATH} && npm run build", timeout=600)
print("   ✅ Build completado\n")

print("3. Restart PM2...")
run("pm2 restart inmova-app")
print("   ✅ PM2 restarted\n")
time.sleep(20)

print("4. Health check...")
health = run("curl -s http://localhost:3000/api/health")
if '"status":"ok"' in health:
    print("   ✅ Health OK\n")

print("="*70)
print("✅ FIX DEPLOYADO")
print("="*70 + "\n")
print("El módulo de Gestión de Redes Sociales está ahora en:")
print("  📍 Sidebar → Comunicaciones → Gestión de Redes Sociales")
print("  🔗 URL: https://inmovaapp.com/dashboard/social-media\n")
print("="*70 + "\n")
client.close()
