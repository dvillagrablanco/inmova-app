#!/usr/bin/env python3
"""Diagnóstico después del deploy"""
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
    
    print("🔍 DIAGNÓSTICO POST-DEPLOY\n")
    
    # 1. PM2 status
    print("1️⃣  Estado PM2:")
    stdin, stdout, stderr = client.exec_command("pm2 status")
    print(stdout.read().decode())
    
    # 2. Últimos logs de deploy
    print("\n2️⃣  Últimos logs del deploy:")
    stdin, stdout, stderr = client.exec_command(f"tail -30 {APP_DIR}/deploy.log 2>/dev/null || echo 'No hay logs'")
    print(stdout.read().decode())
    
    # 3. Verificar si hay procesos en puerto 3000
    print("\n3️⃣  Procesos en puerto 3000:")
    stdin, stdout, stderr = client.exec_command("lsof -ti:3000 2>/dev/null || echo 'Puerto libre'")
    print(stdout.read().decode())
    
    # 4. Verificar node_modules
    print("\n4️⃣  Node modules instalados:")
    stdin, stdout, stderr = client.exec_command(f"ls -la {APP_DIR}/node_modules 2>&1 | head -5")
    print(stdout.read().decode())
    
    # 5. Verificar .env.production
    print("\n5️⃣  Variables críticas:")
    stdin, stdout, stderr = client.exec_command(f"grep -E '(NEXTAUTH_URL|DATABASE_URL)' {APP_DIR}/.env.production")
    print(stdout.read().decode())
    
    # 6. Test de conexión a DB
    print("\n6️⃣  Test conexión DB:")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && node -e \"require('dotenv').config({{path:'.env.production'}}); console.log('DB URL:', process.env.DATABASE_URL?.includes('inmova_production') ? 'OK' : 'ERROR')\""
    )
    print(stdout.read().decode())
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
finally:
    client.close()
