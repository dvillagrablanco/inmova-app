#!/usr/bin/env python3
"""
Diagnosticar error de servidor
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
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🔍 DIAGNOSTICAR ERROR DE SERVIDOR")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Ver logs de PM2
print("1. LOGS DE PM2 (últimos 100)")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 100 --nostream"
)

print("  Errores encontrados:\n")

lines = (out + err).split('\n')
error_lines = [l for l in lines if 'error' in l.lower() or 'exception' in l.lower() or 'failed' in l.lower()]

if error_lines:
    for line in error_lines[-30:]:
        print(f"    {line}")
else:
    print("    (No hay errores obvios)")
    print("\n  Últimas 20 líneas:\n")
    for line in lines[-20:]:
        if line.strip():
            print(f"    {line}")

# 2. PM2 status
print("\n2. PM2 STATUS")
print("-"*70 + "\n")

success, out, err = run_cmd(client, "pm2 status")
print(out)

# 3. Check if login page loads
print("\n3. TEST GET /login")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "curl -s -I http://localhost:3000/login 2>&1 | head -20"
)

print("  Response headers:")
for line in out.split('\n')[:10]:
    if line.strip():
        print(f"    {line}")

if '500' in out or '502' in out or '503' in out:
    print("\n  ⚠️ Error de servidor detectado\n")
elif '200' in out:
    print("\n  ✅ Login page responde OK\n")

# 4. Check DATABASE_URL
print("4. VERIFICAR DATABASE_URL")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"cd {PATH} && grep DATABASE_URL .env.production | head -1"
)

if 'postgresql' in out:
    print("  ✅ DATABASE_URL configurado")
    # Hide password
    parts = out.split('@')
    if len(parts) > 1:
        print(f"    Host: {parts[1].split('/')[0]}")
else:
    print("  ⚠️ DATABASE_URL no encontrado o inválido")

# 5. Test database connection
print("\n5. TEST CONEXIÓN BD")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "psql postgresql://inmova_user:inmova123@localhost:5432/inmova_production -c 'SELECT 1;' 2>&1"
)

if '1 row' in out or 'column' in out:
    print("  ✅ Base de datos accesible\n")
else:
    print("  ⚠️ Error conectando BD:")
    print(out[:200])

# RESUMEN
print("\n" + "="*70)
print("DIAGNÓSTICO")
print("="*70 + "\n")

print("Revisar logs arriba para identificar el error específico.\n")

print("Errores comunes:")
print("  - Prisma Client no inicializado")
print("  - DATABASE_URL inválido")
print("  - Módulo faltante")
print("  - Error en componente de React\n")

print("="*70 + "\n")

client.close()
