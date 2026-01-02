#!/usr/bin/env python3
"""Verificar si los cambios del tutorial están en el servidor"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🔍 VERIFICANDO DEPLOY DEL TUTORIAL\n")
    
    # 1. Ver último commit en el servidor
    print("1️⃣  Último commit en el servidor:")
    stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && git log --oneline -1")
    print(stdout.read().decode())
    
    # 2. Verificar si el archivo tiene los cambios
    print("\n2️⃣  Verificando SmartOnboardingWizard.tsx:")
    stdin, stdout, stderr = client.exec_command(
        f"grep -A5 'isSuperAdmin' {APP_DIR}/components/automation/SmartOnboardingWizard.tsx 2>&1"
    )
    content = stdout.read().decode()
    
    if 'isSuperAdmin' in content:
        print("   ✅ Código con verificación de superadmin encontrado:")
        print(content[:300])
    else:
        print("   ❌ NO se encuentra la verificación de superadmin")
        print("   Mostrando primeras líneas del componente:")
        stdin, stdout, stderr = client.exec_command(
            f"head -60 {APP_DIR}/components/automation/SmartOnboardingWizard.tsx"
        )
        print(stdout.read().decode())
    
    # 3. Ver si hay cambios sin commitear
    print("\n3️⃣  Estado de Git:")
    stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && git status --short")
    git_status = stdout.read().decode()
    if git_status.strip():
        print(f"   ⚠️  Hay cambios sin commitear:\n{git_status}")
    else:
        print("   ✅ Working tree limpio")
    
    # 4. Verificar fecha del build
    print("\n4️⃣  Fecha del último build:")
    stdin, stdout, stderr = client.exec_command(f"ls -lh {APP_DIR}/.next/ | head -5")
    print(stdout.read().decode())
    
    # 5. Ver si PM2 está corriendo
    print("\n5️⃣  Estado de PM2:")
    stdin, stdout, stderr = client.exec_command("pm2 status inmova-app | grep inmova-app")
    print(stdout.read().decode())
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
finally:
    client.close()
