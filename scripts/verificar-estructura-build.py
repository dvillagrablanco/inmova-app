#!/usr/bin/env python3
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
    
    print("📁 ESTRUCTURA DEL BUILD\n")
    
    # Ver estructura .next
    print("1️⃣  Directorio .next:")
    stdin, stdout, stderr = client.exec_command(f"ls -la {APP_DIR}/.next/ | head -20")
    print(stdout.read().decode())
    
    # Ver si hay server.js
    print("\n2️⃣  Buscando server.js:")
    stdin, stdout, stderr = client.exec_command(f"find {APP_DIR}/.next -name 'server.js' -type f")
    output = stdout.read().decode()
    if output.strip():
        print(f"  Encontrado:\n{output}")
    else:
        print("  ❌ No encontrado en .next")
    
    # Ver si hay standalone
    print("\n3️⃣  Verificando standalone:")
    stdin, stdout, stderr = client.exec_command(f"ls -la {APP_DIR}/.next/standalone/ 2>&1 | head -10")
    print(stdout.read().decode())
    
    # Ver package.json scripts
    print("\n4️⃣  Scripts en package.json:")
    stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && cat package.json | grep -A 10 '\"scripts\"'")
    print(stdout.read().decode())
    
    # Ver logs PM2
    print("\n5️⃣  Últimos logs PM2:")
    stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --lines 10 --nostream")
    print(stdout.read().decode())
    
finally:
    client.close()
