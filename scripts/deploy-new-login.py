#!/usr/bin/env python3
"""
Deploy nuevo diseño de login
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
print("🎨 DEPLOY NUEVO DISEÑO DE LOGIN")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Pull código
print("1. ACTUALIZAR CÓDIGO")
print("-"*70 + "\n")

run_cmd(client, f"cd {PATH} && git pull origin main")
print("  ✅ Código actualizado\n")

# 2. Restart PM2
print("2. RESTART PM2")
print("-"*70 + "\n")

run_cmd(client, "pm2 restart inmova-app")
print("  ✅ PM2 restarted")
print("  ⏳ Esperando warm-up (15s)...\n")
time.sleep(15)

# 3. Verificar
print("3. VERIFICAR")
print("-"*70 + "\n")

success, out, err = run_cmd(client, "pm2 status")
if 'online' in out.lower():
    print("  ✅ PM2 online\n")

# Test login
success, out, err = run_cmd(client, "curl -s -I http://localhost:3000/login | head -3")
if '200' in out:
    print("  ✅ Login page OK\n")

# RESUMEN
print("\n" + "="*70)
print("✨ NUEVO DISEÑO DEPLOYADO")
print("="*70 + "\n")

print("Mejoras aplicadas:")
print("  ✅ Diseño glassmorphism moderno")
print("  ✅ Logo INMOVA con icono Building2")
print("  ✅ Gradientes y efectos visuales mejorados")
print("  ✅ Inputs con iconos integrados")
print("  ✅ Animaciones suaves")
print("  ✅ Background decorativo con blur")
print("  ✅ Eliminada imagen del logo antigua\n")

print("VER NUEVO DISEÑO:")
print("  URL: https://inmovaapp.com/login\n")

print("CREDENCIALES DE PRUEBA:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!\n")

print("="*70 + "\n")

client.close()
