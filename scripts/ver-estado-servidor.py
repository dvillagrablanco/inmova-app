#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("📊 ESTADO DEL SERVIDOR\n")
    
    # PM2 Status
    print("1️⃣  PM2 Status:")
    stdin, stdout, stderr = client.exec_command("pm2 status")
    print(stdout.read().decode())
    
    # Logs recientes
    print("\n2️⃣  Últimas líneas de error log:")
    stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --err --lines 20 --nostream")
    print(stdout.read().decode())
    
    # Verificar .env
    print("\n3️⃣  Variables críticas en .env.production:")
    stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && grep -E '(NEXTAUTH_SECRET|DATABASE_URL|NODE_ENV)' .env.production")
    output = stdout.read().decode()
    for line in output.split('\n'):
        if 'SECRET' in line:
            print(f"  NEXTAUTH_SECRET: {'✅ Presente' if line.strip() and '=' in line else '❌ Ausente'}")
        elif 'DATABASE_URL' in line:
            print(f"  DATABASE_URL: {'✅ Presente' if line.strip() and '=' in line else '❌ Ausente'}")
        elif 'NODE_ENV' in line:
            print(f"  NODE_ENV: {line.split('=')[1] if '=' in line else '❌ Ausente'}")
    
    # Test endpoint
    print("\n4️⃣  Test de health endpoint:")
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    print(f"  {stdout.read().decode()[:100]}")
    
finally:
    client.close()
