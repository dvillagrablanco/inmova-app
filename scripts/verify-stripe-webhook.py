#!/usr/bin/env python3
"""Verificar estado del webhook de Stripe"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    
    # 1. Verificar archivo existe
    print("🔍 Verificando archivo de webhook...")
    stdin, stdout, stderr = client.exec_command('ls -la /opt/inmova-app/app/api/webhooks/stripe/route.ts 2>&1')
    output = stdout.read().decode()
    print(output)
    
    # 2. Verificar si .next está buildeado
    print("\n🔍 Verificando build...")
    stdin, stdout, stderr = client.exec_command('ls -la /opt/inmova-app/.next/server/app/api/webhooks/ 2>&1')
    output = stdout.read().decode()
    print(output)
    
    # 3. Verificar STRIPE_WEBHOOK_SECRET
    print("\n🔍 Verificando STRIPE_WEBHOOK_SECRET...")
    stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && grep STRIPE_WEBHOOK_SECRET .env.production | sed 's/=.*/=***HIDDEN***/'")
    output = stdout.read().decode()
    print(output)
    
    # 4. Test endpoint
    print("\n🧪 Test endpoint (debe retornar 200 o 405)...")
    stdin, stdout, stderr = client.exec_command("curl -s -w '\\nHTTP: %{http_code}\\n' http://localhost:3000/api/webhooks/stripe -X POST")
    output = stdout.read().decode()
    print(output)
    
    # 5. Ver si app necesita rebuild
    print("\n📊 Estado de PM2:")
    stdin, stdout, stderr = client.exec_command("pm2 list")
    output = stdout.read().decode()
    print(output)
    
finally:
    client.close()
