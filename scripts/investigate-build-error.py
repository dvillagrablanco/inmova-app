#!/usr/bin/env python3
"""
Investigar error de build detalladamente
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

DB_URL = "postgresql://inmova_user:inmova123@localhost:5432/inmova_production"
NEXTAUTH_SECRET = "ca1f50f0101dff24895a920c37f5b56eb3e80a88b708d1e89f761f8c9c8e4d33"

def run_cmd(client, cmd, timeout=600):
    """Execute command and return output"""
    print(f"  → {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    return exit_status == 0, out, err

print("\n🔍 INVESTIGAR ERROR DE BUILD\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

print("="*70)
print("INTENTANDO BUILD Y GUARDANDO LOG COMPLETO")
print("="*70 + "\n")

build_cmd = f"""cd {PATH} && \
export DATABASE_URL='{DB_URL}' && \
export NEXTAUTH_SECRET='{NEXTAUTH_SECRET}' && \
export NEXTAUTH_URL='https://inmovaapp.com' && \
export NODE_ENV='production' && \
npm run build 2>&1 | tee /tmp/build-full.log"""

print("  Ejecutando build completo...")
success, out, err = run_cmd(client, build_cmd, timeout=600)

print(f"\n  Exit status: {0 if success else 'Non-zero'}\n")

# Buscar errores específicos en el log
print("="*70)
print("ERRORES ENCONTRADOS:")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    "grep -i 'error\\|failed\\|cannot find' /tmp/build-full.log | head -50"
)

if out:
    lines = out.split('\n')
    for i, line in enumerate(lines[:50], 1):
        if line.strip():
            print(f"  {i}. {line}")
else:
    print("  ✅ No se encontraron errores específicos")

# Ver últimas líneas del log
print("\n" + "="*70)
print("ÚLTIMAS 30 LÍNEAS DEL BUILD:")
print("="*70 + "\n")

success, out, err = run_cmd(client, "tail -30 /tmp/build-full.log")
if out:
    for line in out.split('\n'):
        if line.strip():
            print(f"  {line}")

# Ver tamaño del log
print("\n" + "="*70)
print("INFO DEL LOG:")
print("="*70 + "\n")

success, out, err = run_cmd(client, "wc -l /tmp/build-full.log")
if out:
    print(f"  Líneas totales en log: {out.strip()}")

# Guardar log localmente para análisis
print("\n  💾 Log completo guardado en: /tmp/build-full.log")
print("  Para ver: ssh root@157.180.119.236 'cat /tmp/build-full.log | less'\n")

client.close()
print("✅ Investigación completada\n")
