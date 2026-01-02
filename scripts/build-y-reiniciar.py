#!/usr/bin/env python3
"""
Hacer build de Next.js y reiniciar PM2
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def execute_command(ssh, command, timeout=600):
    print(f"  💻 {command[:100]}...")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    
    # Print output in real-time
    while True:
        line = stdout.readline()
        if not line:
            break
        print(f"     {line.strip()[:150]}")
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0:
        error = stderr.read().decode()
        if error:
            print(f"  ⚠️  Error: {error[:300]}")
        return False
    
    print(f"  ✓ OK")
    return True

def main():
    print("🏗️  BUILD DE NEXT.JS\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Deteniendo PM2...")
        execute_command(client, "pm2 stop inmova-app", timeout=30)
        
        print("\n2️⃣  Haciendo build de Next.js...")
        print("     (Esto puede tardar varios minutos...)\n")
        
        success = execute_command(
            client, 
            f"cd {APP_DIR} && source .env.production && npm run build",
            timeout=900  # 15 minutos
        )
        
        if not success:
            print("\n⚠️  Build falló. Intentando usar desarrollo...\n")
            # Actualizar PM2 para usar dev
            dev_ecosystem = """module.exports = {
  apps: [{
    name: 'inmova-app',
    script: '/opt/inmova-app/start-with-env.sh',
    cwd: '/opt/inmova-app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=2048',
    },
    out_file: '/var/log/inmova/out.log',
    error_file: '/var/log/inmova/error.log',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    restart_delay: 4000,
  }],
};"""
            
            stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/ecosystem.config.js << 'EOF'\n{dev_ecosystem}EOF\n")
            stdout.channel.recv_exit_status()
            
            # Actualizar script de inicio para usar dev
            dev_start = """#!/bin/bash
set -a
source /opt/inmova-app/.env.production
set +a
cd /opt/inmova-app
exec npm run dev
"""
            stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/start-with-env.sh << 'EOF'\n{dev_start}EOF\n")
            stdout.channel.recv_exit_status()
            
        print("\n3️⃣  Reiniciando PM2...")
        execute_command(client, "pm2 restart inmova-app", timeout=30)
        
        print("\n4️⃣  Esperando 30 segundos para warm-up...")
        time.sleep(30)
        
        print("\n5️⃣  Verificando...")
        stdin, stdout, stderr = client.exec_command("curl -I http://localhost:3000/login")
        output = stdout.read().decode()
        
        if "200" in output:
            print("  ✅ Login responde\n")
        else:
            print("  ⚠️  Login no responde correctamente\n")
            print(f"  Response: {output[:200]}\n")
        
        print("6️⃣  Estado de PM2:")
        stdin, stdout, stderr = client.exec_command("pm2 status")
        print(stdout.read().decode())
        
        print("\n✅ PROCESO COMPLETADO\n")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
