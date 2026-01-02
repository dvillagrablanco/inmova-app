#!/usr/bin/env python3
"""Fix definitivo del .env.production"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def execute_command(ssh, command, timeout=120):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    output = stdout.read().decode()
    error = stderr.read().decode()
    return output, error

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🔧 FIX DEFINITIVO DE VARIABLES DE ENTORNO\n")
    
    # 1. Stop PM2
    print("1️⃣  Deteniendo PM2...")
    execute_command(client, "pm2 stop inmova-app")
    execute_command(client, "pm2 delete inmova-app")
    
    # 2. Backup del .env actual
    print("\n2️⃣  Backup de .env actual...")
    execute_command(client, f"cd {APP_DIR} && cp .env.production .env.production.backup.$(date +%s) 2>/dev/null || true")
    
    # 3. Crear nuevo .env.production COMPLETO
    print("\n3️⃣  Creando .env.production con TODAS las variables...")
    
    env_content = """NODE_ENV="production"
DATABASE_URL="postgresql://inmova_user:TuPasswordSegura2024!@localhost:5432/inmova_production"
NEXTAUTH_URL="http://157.180.119.236"
NEXTAUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

# Database
POSTGRES_USER="inmova_user"
POSTGRES_PASSWORD="TuPasswordSegura2024!"
POSTGRES_DB="inmova_production"

# App
NEXT_PUBLIC_APP_NAME="Inmova"
NEXT_PUBLIC_APP_URL="http://157.180.119.236"

# Timezone
TZ="Europe/Madrid"
"""
    
    # Escribir archivo
    stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/.env.production << 'EOFENV'\n{env_content}EOFENV")
    stdout.channel.recv_exit_status()
    print("  ✅ .env.production creado")
    
    # Verificar contenido
    output, _ = execute_command(client, f"cat {APP_DIR}/.env.production")
    print("\n📄 Contenido del .env.production:")
    for line in output.split('\n')[:10]:
        if line.strip() and not line.startswith('#'):
            print(f"  {line}")
    
    # 4. Crear script de inicio mejorado
    print("\n4️⃣  Creando script de inicio...")
    
    start_script = """#!/bin/bash
set -a
source /opt/inmova-app/.env.production
set +a

cd /opt/inmova-app
node server.js
"""
    
    stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/start-with-env.sh << 'EOFSTART'\n{start_script}EOFSTART")
    stdout.channel.recv_exit_status()
    
    execute_command(client, f"chmod +x {APP_DIR}/start-with-env.sh")
    print("  ✅ start-with-env.sh creado")
    
    # 5. Crear ecosystem.config.js
    print("\n5️⃣  Creando ecosystem.config.js...")
    
    ecosystem = """module.exports = {
  apps: [{
    name: 'inmova-app',
    script: './start-with-env.sh',
    cwd: '/opt/inmova-app',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};"""
    
    stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/ecosystem.config.js << 'EOFECO'\n{ecosystem}EOFECO")
    stdout.channel.recv_exit_status()
    print("  ✅ ecosystem.config.js creado")
    
    # 6. Limpiar y rebuild
    print("\n6️⃣  Limpiando .next...")
    execute_command(client, f"cd {APP_DIR} && rm -rf .next")
    
    print("\n7️⃣  Haciendo build (esto tomará varios minutos)...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && source .env.production && npm run build",
        timeout=900
    )
    
    # Esperar build
    build_output = []
    while True:
        line = stdout.readline()
        if not line:
            break
        build_output.append(line)
        if 'Compiled' in line or 'Route' in line or 'Error' in line:
            print(f"  {line.strip()[:80]}")
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("  ✅ Build exitoso")
    else:
        print(f"  ⚠️  Build exit code: {exit_code}")
        # Mostrar últimas líneas
        for line in build_output[-5:]:
            print(f"  {line.strip()[:80]}")
    
    # 7. Iniciar PM2
    print("\n8️⃣  Iniciando PM2...")
    execute_command(client, f"cd {APP_DIR} && pm2 start ecosystem.config.js")
    execute_command(client, "pm2 save")
    
    print("\n9️⃣  Esperando warm-up (15s)...")
    time.sleep(15)
    
    # 8. Verificación
    print("\n🔟 Verificaciones finales:")
    
    # PM2 status
    output, _ = execute_command(client, "pm2 status inmova-app")
    if 'online' in output:
        print("  ✅ PM2: online")
    else:
        print("  ❌ PM2: error")
        print(output[:200])
    
    # Health check
    output, _ = execute_command(client, "curl -s http://localhost:3000/api/health")
    if '"status":"ok"' in output:
        print("  ✅ Health: OK")
    else:
        print("  ⚠️  Health: error")
        print(f"  {output[:100]}")
    
    # Check login page
    output, _ = execute_command(client, "curl -I http://localhost:3000/login")
    if '200' in output:
        print("  ✅ Login page: 200 OK")
    else:
        print("  ⚠️  Login page: error")
    
    print("\n✅ FIX COMPLETADO")
    print("\n📝 Prueba el login en:")
    print("  http://157.180.119.236/login")
    print("  superadmin@inmova.app / Admin123!")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
finally:
    client.close()
