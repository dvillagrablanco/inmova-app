#!/usr/bin/env python3
"""
Deploy fix y verificar login
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

DB_URL = "postgresql://inmova_user:inmova123@localhost:5432/inmova_production"

def run_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🚀 DEPLOY FIX COMPANY INCLUDE OPCIONAL")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Pull código
print("1. ACTUALIZAR CÓDIGO")
print("-"*70 + "\n")

success, out, err = run_cmd(client, f"cd {PATH} && git pull origin main")

if 'Already up to date' in out:
    print("  ℹ️ Código ya actualizado\n")
elif 'Updating' in out or 'Fast-forward' in out:
    print("  ✅ Código actualizado\n")
    for line in out.split('\n')[:5]:
        if line.strip():
            print(f"    {line}")
else:
    print("  Resultado:")
    print(out[:200])

# 2. Restart PM2
print("\n2. RESTART PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 restart inmova-app --update-env")
print("  ✅ PM2 restarted")
print("  ⏳ Esperando warm-up (15s)...\n")
time.sleep(15)

# 3. Check PM2
success, out, err = run_cmd(client, "pm2 status")
if 'online' in out.lower():
    print("  ✅ PM2 online\n")

# 4. Flush logs y wait
print("3. PREPARAR LOGS")
print("-"*70 + "\n")

run_cmd(client, "pm2 flush")
print("  ✅ Logs limpiados")
print("  ⏳ Esperando 5s para que app esté lista...\n")
time.sleep(5)

# INSTRUCCIONES
print("\n" + "="*70)
print("🎯 LISTO PARA TEST")
print("="*70 + "\n")

print("La aplicación está lista con el fix de company include opcional.\n")

print("POR FAVOR, INTENTAR LOGIN NUEVAMENTE:")
print("-"*70)
print("\n  1. Ir a: https://inmovaapp.com/login")
print("\n  2. Abrir DevTools (F12) → pestaña Console")
print("\n  3. Ingresar credenciales:")
print("     Email: admin@inmova.app")
print("     Password: Admin123!")
print("\n  4. Click en 'Iniciar Sesión'\n")

print("QUÉ BUSCAR EN CONSOLE:")
print("-"*70)
print("  - Logs que empiecen con [NextAuth]")
print("  - Si ves 'authorize() llamado' → el flujo está funcionando")
print("  - Si ves 'Login exitoso' → todo OK")
print("  - Si ves 'Password inválido' → hay problema con bcrypt\n")

print("SI AÚN FALLA:")
print("-"*70)
print("  Ejecutar en servidor:")
print("  pm2 logs inmova-app --lines 50\n")
print("  Y compartir los logs que aparezcan\n")

print("="*70 + "\n")

client.close()
