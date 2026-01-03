#!/usr/bin/env python3
"""Verificar e instalar nodemailer si es necesario"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def exec_cmd(client, command, description="", timeout=120):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    
    if output:
        print(output)
    
    return exit_status, output

print("📦 VERIFICANDO NODEMAILER\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print("✅ Conectado\n")
    
    # 1. Verificar si nodemailer está instalado
    print("1️⃣  Verificando nodemailer...")
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && npm list nodemailer 2>&1",
        "npm list nodemailer..."
    )
    print()
    
    if 'nodemailer@' in output:
        print("✅ Nodemailer ya está instalado\n")
        has_nodemailer = True
    else:
        print("⚠️  Nodemailer NO está instalado\n")
        has_nodemailer = False
    
    # 2. Instalar si no está
    if not has_nodemailer:
        print("2️⃣  Instalando nodemailer...")
        status, output = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install nodemailer",
            "npm install nodemailer...",
            timeout=120
        )
        print()
        
        if status == 0:
            print("✅ Nodemailer instalado exitosamente\n")
        else:
            print("❌ Error instalando nodemailer\n")
            print("   Instalar manualmente:")
            print("   ssh root@157.180.119.236")
            print("   cd /opt/inmova-app")
            print("   npm install nodemailer\n")
    
    # 3. Ver package.json
    print("3️⃣  Verificando package.json...")
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && grep -A 1 'nodemailer' package.json || echo 'No encontrado'",
        "grep nodemailer..."
    )
    print()
    
    print("=" * 70)
    print("✅ VERIFICACIÓN COMPLETADA")
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
