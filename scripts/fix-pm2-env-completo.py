#!/usr/bin/env python3
"""
Corregir PM2 para que cargue variables de entorno
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def execute_command(ssh, command, timeout=120):
    print(f"  💻 {command[:100]}...")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    output = stdout.read().decode()
    error = stderr.read().decode()
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0 and error:
        print(f"  ⚠️  {error[:200]}")
    elif output and len(output) < 200:
        print(f"  ✓ {output.strip()[:150]}")
    else:
        print(f"  ✓ OK")
    
    return exit_code == 0, output, error

def main():
    print("🔧 FIX COMPLETO PM2 ENV\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Creando start-with-env.sh...")
        start_script = """#!/bin/bash
# Cargar variables de entorno desde .env.production
set -a
source /opt/inmova-app/.env.production
set +a

# Iniciar aplicación
cd /opt/inmova-app
exec npm start
"""
        
        stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/start-with-env.sh << 'EOF'\n{start_script}EOF\n")
        stdout.channel.recv_exit_status()
        execute_command(client, f"chmod +x {APP_DIR}/start-with-env.sh")
        print("  ✓ start-with-env.sh creado\n")
        
        print("2️⃣  Actualizando ecosystem.config.js...")
        ecosystem_config = """/**
 * PM2 Ecosystem Configuration
 * Para producción con auto-restart y monitoreo
 */

module.exports = {
  apps: [
    {
      name: 'inmova-app',
      script: '/opt/inmova-app/start-with-env.sh',
      cwd: '/opt/inmova-app',

      // Execution Mode - FORK porque cluster puede causar problemas con Next.js
      instances: 1,
      exec_mode: 'fork',

      // Environment (mínimas, las demás en .env.production)
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048',
      },

      // Logs
      out_file: '/var/log/inmova/out.log',
      error_file: '/var/log/inmova/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Auto-Restart Configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      restart_delay: 4000,
      kill_timeout: 5000,

      // Watch (desactivado en producción)
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],

      // Time
      time: true,

      // Cron Restart (restart diario a las 3 AM)
      cron_restart: '0 3 * * *',
    },
  ],
};
"""
        
        stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/ecosystem.config.js << 'EOF'\n{ecosystem_config}EOF\n")
        stdout.channel.recv_exit_status()
        print("  ✓ ecosystem.config.js actualizado\n")
        
        print("3️⃣  Deteniendo PM2...")
        execute_command(client, "pm2 delete inmova-app 2>&1 || true")
        
        print("\n4️⃣  Iniciando PM2 con nueva configuración...")
        execute_command(client, f"pm2 start {APP_DIR}/ecosystem.config.js")
        execute_command(client, "pm2 save")
        
        print("\n5️⃣  Esperando 20 segundos para warm-up...")
        time.sleep(20)
        
        print("\n6️⃣  Verificando aplicación...")
        success, output, _ = execute_command(client, "curl -I http://localhost:3000/login")
        if "200" in output:
            print("  ✅ Login responde\n")
        
        print("7️⃣  Verificando logs...")
        success, output, _ = execute_command(client, "pm2 logs inmova-app --lines 10 --nostream")
        print(f"  Logs: {output[:300]}...\n")
        
        print("✅ PM2 RECONFIGURADO\n")
        print("📝 Cambios aplicados:")
        print("  - Script de inicio carga .env.production")
        print("  - PM2 en modo fork (no cluster)")
        print("  - Variables de entorno disponibles\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
