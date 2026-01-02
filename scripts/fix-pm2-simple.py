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
    
    print("🔧 CONFIGURACIÓN SIMPLE DE PM2\n")
    
    # 1. Kill todo
    print("1️⃣  Limpiando procesos...")
    stdin, stdout, stderr = client.exec_command("pm2 delete all 2>/dev/null || true")
    stdout.channel.recv_exit_status()
    stdin, stdout, stderr = client.exec_command("pm2 kill")
    stdout.channel.recv_exit_status()
    
    # 2. Verificar .env.production
    print("\n2️⃣  Verificando .env.production...")
    stdin, stdout, stderr = client.exec_command(f"cat {APP_DIR}/.env.production")
    env_content = stdout.read().decode()
    
    has_secret = 'NEXTAUTH_SECRET' in env_content
    has_db = 'DATABASE_URL' in env_content
    has_url = 'NEXTAUTH_URL' in env_content
    
    print(f"  NEXTAUTH_SECRET: {'✅' if has_secret else '❌'}")
    print(f"  DATABASE_URL: {'✅' if has_db else '❌'}")
    print(f"  NEXTAUTH_URL: {'✅' if has_url else '❌'}")
    
    # 3. Iniciar directamente con PM2
    print("\n3️⃣  Iniciando con PM2 (comando directo)...")
    
    start_command = f"""cd {APP_DIR} && pm2 start npm --name "inmova-app" -- start --env-file .env.production"""
    
    stdin, stdout, stderr = client.exec_command(start_command)
    stdout.channel.recv_exit_status()
    
    print("  ✅ Comando ejecutado")
    
    # 4. Guardar PM2
    print("\n4️⃣  Guardando configuración PM2...")
    stdin, stdout, stderr = client.exec_command("pm2 save")
    stdout.channel.recv_exit_status()
    
    # 5. Esperar warm-up
    print("\n5️⃣  Esperando warm-up (25s)...")
    time.sleep(25)
    
    # 6. Verificar
    print("\n6️⃣  Verificaciones:")
    
    # PM2 status
    stdin, stdout, stderr = client.exec_command("pm2 status")
    output = stdout.read().decode()
    
    if 'online' in output:
        print("  ✅ PM2: online")
        # Extraer info
        lines = output.split('\n')
        for line in lines:
            if 'inmova-app' in line:
                print(f"  {line}")
                break
    else:
        print("  ❌ PM2: no online")
        print(output[:300])
    
    # Health check
    print("\n7️⃣  Test de endpoints:")
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    output = stdout.read().decode()
    if '"status":"ok"' in output:
        print("  ✅ /api/health: OK")
    else:
        print(f"  ⚠️  /api/health: {output[:100]}")
    
    # Login page
    stdin, stdout, stderr = client.exec_command("curl -I http://localhost:3000/login 2>&1 | head -1")
    output = stdout.read().decode()
    if '200' in output:
        print("  ✅ /login: 200 OK")
    else:
        print(f"  ⚠️  /login: {output.strip()}")
    
    # Dashboard
    stdin, stdout, stderr = client.exec_command("curl -I http://localhost:3000/dashboard 2>&1 | head -1")
    output = stdout.read().decode()
    if '200' in output or '307' in output:
        print(f"  ✅ /dashboard: {output.strip()}")
    else:
        print(f"  ⚠️  /dashboard: {output.strip()}")
    
    # Ver logs recientes
    print("\n8️⃣  Logs recientes (últimas 10 líneas):")
    stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --lines 10 --nostream")
    output = stdout.read().decode()
    
    # Filtrar líneas relevantes
    for line in output.split('\n'):
        if line.strip() and not line.startswith('[TAILING]'):
            print(f"  {line[:120]}")
    
    print("\n✅ CONFIGURACIÓN COMPLETADA")
    print("\n📱 Ahora prueba el tutorial en móvil:")
    print("  http://157.180.119.236/dashboard")
    print("  superadmin@inmova.app / Admin123!")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
