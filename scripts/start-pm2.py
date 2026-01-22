#!/usr/bin/env python3
"""
Inicia PM2 en el servidor
"""

import sys
import time
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, command, timeout=300):
    print(f"Ejecutando: {command[:80]}...")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    if output:
        print(f"Output: {output[:500]}")
    if error and 'warning' not in error.lower():
        print(f"Error: {error[:300]}")
    return exit_status, output, error

def main():
    print("🚀 Iniciando PM2 en servidor...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        print("✅ Conectado")
        
        # Verificar si existe ecosystem.config.js
        status, output, _ = exec_cmd(client, f"cat {APP_PATH}/ecosystem.config.js 2>/dev/null || echo 'NO_EXISTS'")
        
        if 'NO_EXISTS' in output:
            print("📝 Creando ecosystem.config.js...")
            ecosystem = '''module.exports = {
  apps: [{
    name: 'inmova-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/opt/inmova-app',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};'''
            exec_cmd(client, f"cat > {APP_PATH}/ecosystem.config.js << 'EOFCONFIG'\n{ecosystem}\nEOFCONFIG")
        
        # Limpiar PM2
        print("🧹 Limpiando PM2...")
        exec_cmd(client, "pm2 delete all 2>/dev/null || true")
        exec_cmd(client, "pm2 kill 2>/dev/null || true")
        
        # Matar procesos en puerto 3000
        print("🔪 Liberando puerto 3000...")
        exec_cmd(client, "fuser -k 3000/tcp 2>/dev/null || true")
        time.sleep(2)
        
        # Iniciar con PM2
        print("🚀 Iniciando PM2...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
        
        # Guardar configuración PM2
        exec_cmd(client, "pm2 save")
        
        # Esperar warm-up
        print("⏳ Esperando 30 segundos para warm-up...")
        time.sleep(30)
        
        # Verificar status
        print("📊 Estado PM2:")
        status, output, _ = exec_cmd(client, "pm2 status")
        print(output)
        
        # Health check
        print("🏥 Health check:")
        for i in range(5):
            status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            if 'healthy' in output.lower() or 'ok' in output.lower() or '"status"' in output:
                print(f"✅ Health check OK: {output[:100]}")
                break
            print(f"Intento {i+1}/5...")
            time.sleep(5)
        
        # Verificar HTTP
        print("\n🌐 Verificación HTTP:")
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
        print(f"Landing: HTTP {output}")
        
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        print(f"Login: HTTP {output}")
        
        print("\n✅ PROCESO COMPLETADO")
        print(f"🌐 URL: https://inmovaapp.com")
        print(f"📍 IP: http://{SERVER_IP}:3000")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        client.close()
    
    return True

if __name__ == "__main__":
    main()
