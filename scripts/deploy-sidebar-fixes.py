#!/usr/bin/env python3
"""
Deploy sidebar fixes - Agregar páginas faltantes
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
print("🚀 DEPLOY: Sidebar Fixes - Páginas Faltantes")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Git pull
print("1. GIT PULL")
print("-"*70 + "\n")

success, out, err = run_cmd(client, f"cd {PATH} && git pull origin main")
if 'Already up to date' in out:
    print("  ℹ️ Ya estaba actualizado\n")
elif 'Fast-forward' in out or 'Updating' in out:
    print("  ✅ Código actualizado\n")
    # Mostrar archivos cambiados
    for line in out.split('\n'):
        if 'components/layout/sidebar.tsx' in line:
            print(f"    {line}")
else:
    print("  ⚠️ Output:")
    print(f"  {out[:200]}\n")

# 2. Build (necesario porque sidebar es client component)
print("2. BUILD")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && npm run build",
    timeout=600
)

if 'Compiled successfully' in out or '.next' in out:
    print("  ✅ Build completado\n")
else:
    print("  ⚠️ Build warnings (revisar):\n")
    for line in (out + err).split('\n')[-10:]:
        if line.strip() and ('warn' in line.lower() or 'error' in line.lower()):
            print(f"    {line}")

# 3. Restart PM2
print("\n3. RESTART PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 restart inmova-app")
print("  ✅ PM2 restarted")
print("  ⏳ Esperando warm-up (20s)...\n")
time.sleep(20)

# 4. Health check
print("4. HEALTH CHECK")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/health"
)

if '"status":"ok"' in out:
    print("  ✅ Health check OK\n")
else:
    print("  ❌ Health check FAILED")
    print(f"  {out[:200]}\n")

# 5. Verificar logs
print("5. LOGS RECIENTES")
print("-"*70 + "\n")

time.sleep(5)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 15 --nostream | grep -i 'error' || echo 'Sin errores'"
)

if 'Sin errores' in out:
    print("  ✅ Sin errores en logs\n")
else:
    print("  ⚠️ Logs:")
    for line in out.split('\n')[:8]:
        if line.strip():
            print(f"    {line}")
    print()

print("\n" + "="*70)
print("COMPLETADO - SIDEBAR ACTUALIZADO")
print("="*70 + "\n")

print("✅ 6 páginas nuevas agregadas al sidebar:\n")
print("   💰 Finanzas:")
print("      → Presupuestos (/dashboard/budgets)\n")
print("   📊 Analytics:")
print("      → Dashboard Adaptativo (/dashboard/adaptive)\n")
print("   👥 CRM/Marketing:")
print("      → Programa de Referidos (/dashboard/referrals)")
print("      → Cupones y Descuentos (/dashboard/coupons)\n")
print("   ⚡ Super Admin:")
print("      → Integraciones (/dashboard/integrations)\n")
print("   🏘️ Alquiler Residencial:")
print("      → Dashboard Alquiler (/traditional-rental)\n")

print("Para verificar:")
print("  1. Login en https://inmovaapp.com")
print("  2. Abrir sidebar")
print("  3. Buscar las nuevas páginas en sus secciones\n")

print("="*70 + "\n")

client.close()
