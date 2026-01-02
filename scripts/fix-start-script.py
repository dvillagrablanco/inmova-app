#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🔧 CORRIGIENDO SCRIPT DE INICIO\n")
    
    # 1. Stop PM2
    print("1️⃣  Deteniendo PM2...")
    stdin, stdout, stderr = client.exec_command("pm2 delete inmova-app 2>/dev/null || true")
    stdout.channel.recv_exit_status()
    
    # 2. Crear script correcto
    print("\n2️⃣  Creando start-with-env.sh corregido...")
    
    start_script = """#!/bin/bash
set -a
source /opt/inmova-app/.env.production
set +a

cd /opt/inmova-app
npm start
"""
    
    stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/start-with-env.sh << 'EOFSTART'\n{start_script}EOFSTART")
    stdout.channel.recv_exit_status()
    
    stdin, stdout, stderr = client.exec_command(f"chmod +x {APP_DIR}/start-with-env.sh")
    stdout.channel.recv_exit_status()
    
    print("  ✅ Script creado")
    
    # Verificar contenido
    stdin, stdout, stderr = client.exec_command(f"cat {APP_DIR}/start-with-env.sh")
    print("\n📄 Contenido del script:")
    print(stdout.read().decode())
    
    # 3. Iniciar PM2
    print("\n3️⃣  Iniciando PM2...")
    stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && pm2 start ecosystem.config.js")
    stdout.channel.recv_exit_status()
    
    stdin, stdout, stderr = client.exec_command("pm2 save")
    stdout.channel.recv_exit_status()
    
    print("\n4️⃣  Esperando warm-up (20s)...")
    time.sleep(20)
    
    # 4. Verificar
    print("\n5️⃣  Verificaciones:")
    
    # PM2 status
    stdin, stdout, stderr = client.exec_command("pm2 status")
    output = stdout.read().decode()
    if 'online' in output:
        print("  ✅ PM2: online")
    else:
        print("  ❌ PM2 no está online")
        print(output[:300])
    
    # Health check
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    output = stdout.read().decode()
    if '"status":"ok"' in output:
        print("  ✅ Health: OK")
    elif 'database' in output.lower():
        print("  ⚠️  Health: Database issue")
        print(f"  {output[:150]}")
    else:
        print("  ⚠️  Health: Sin respuesta o error")
        print(f"  {output[:150]}")
    
    # Login page
    stdin, stdout, stderr = client.exec_command("curl -I http://localhost:3000/login")
    output = stdout.read().decode()
    if '200' in output:
        print("  ✅ Login page: 200 OK")
    else:
        print("  ⚠️  Login page: Error")
        print(output[:100])
    
    # Últimos logs
    print("\n6️⃣  Últimos logs (errores):")
    stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --err --lines 5 --nostream")
    output = stdout.read().decode()
    if output.strip():
        print(output[:500])
    else:
        print("  (No hay errores recientes)")
    
    print("\n✅ SCRIPT CORREGIDO E INICIADO")
    print("\n📝 Prueba en:")
    print("  http://157.180.119.236/login")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
finally:
    client.close()
