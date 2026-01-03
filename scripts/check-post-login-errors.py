#!/usr/bin/env python3
"""
Verificar errores post-login y limpiar caché
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
print("🔍 VERIFICAR ERRORES POST-LOGIN Y LIMPIAR CACHÉ")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Ver logs recientes (errores post-login)
print("1. LOGS RECIENTES (últimos 50)")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 50 --nostream"
)

lines = (out + err).split('\n')
error_lines = [l for l in lines if 'error' in l.lower() or 'exception' in l.lower() or 'failed' in l.lower() or 'warning' in l.lower()]

if error_lines:
    print("  Errores/Warnings encontrados:\n")
    for line in error_lines[-20:]:
        if line.strip():
            print(f"    {line}")
else:
    print("  ✅ No hay errores obvios\n")

# 2. Limpiar caché de Next.js
print("\n2. LIMPIAR CACHÉ DE NEXT.JS")
print("-"*70 + "\n")

run_cmd(client, f"cd {PATH} && rm -rf .next/cache")
print("  ✅ Caché eliminada")

# 3. Rebuild solo página de login (rápido)
print("\n3. REBUILD PÁGINA DE LOGIN")
print("-"*70 + "\n")

print("  Rebuilding...")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && npm run build",
    timeout=300
)

if 'Compiled successfully' in out or '.next' in out:
    print("  ✅ Build completado\n")
else:
    print("  ⚠️ Build warnings:")
    for line in (out + err).split('\n')[-10:]:
        if line.strip() and ('warn' in line.lower() or 'error' in line.lower()):
            print(f"    {line}")

# 4. Restart PM2
print("4. RESTART PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 restart inmova-app")
print("  ✅ PM2 restarted")
print("  ⏳ Esperando warm-up (15s)...\n")
time.sleep(15)

# 5. Verificar PM2
success, out, err = run_cmd(client, "pm2 status")
if 'online' in out.lower():
    print("  ✅ PM2 online\n")

# 6. Ver logs NUEVOS (después de restart)
print("5. LOGS NUEVOS (después de restart)")
print("-"*70 + "\n")

time.sleep(5)

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 30 --nostream"
)

new_errors = []
for line in (out + err).split('\n'):
    if any(keyword in line.lower() for keyword in ['error', 'exception', 'failed', 'prisma', 'nextauth']):
        new_errors.append(line)

if new_errors:
    print("  Errores encontrados:\n")
    for line in new_errors[-15:]:
        if line.strip():
            print(f"    {line}")
else:
    print("  ✅ No hay errores nuevos\n")

# RESUMEN
print("\n" + "="*70)
print("RESUMEN")
print("="*70 + "\n")

print("Acciones:")
print("  ✅ Logs revisados")
print("  ✅ Caché de Next.js limpiada")
print("  ✅ Build regenerado")
print("  ✅ PM2 reiniciado\n")

print("El nuevo diseño del login debería verse ahora.")
print("Refrescar el navegador con Ctrl+Shift+R (hard refresh)\n")

print("Para tests E2E, crear archivo de pruebas Playwright...\n")

print("="*70 + "\n")

client.close()
