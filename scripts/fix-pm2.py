#!/usr/bin/env python3
"""
Fix PM2 y verificar logs
"""

import sys
import time
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, command, timeout=300):
    print(f"$ {command[:100]}...")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    if output:
        print(output[:1000])
    if error and 'warning' not in error.lower():
        print(f"[stderr]: {error[:500]}")
    return exit_status, output, error

def main():
    print("🔧 Diagnosticando y arreglando PM2...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        print("✅ Conectado\n")
        
        # 1. Ver logs de error
        print("📋 Logs de error PM2:")
        exec_cmd(client, "pm2 logs inmova-app --err --lines 30 --nostream")
        
        # 2. Limpiar y reiniciar sin wait_ready
        print("\n🧹 Limpiando procesos...")
        exec_cmd(client, "pm2 delete all")
        exec_cmd(client, "fuser -k 3000/tcp 2>/dev/null || true")
        time.sleep(2)
        
        # 3. Crear nuevo ecosystem sin wait_ready
        print("\n📝 Creando nuevo ecosystem.config.js...")
        ecosystem = '''module.exports = {
  apps: [{
    name: 'inmova-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/opt/inmova-app',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};'''
        exec_cmd(client, f"cat > {APP_PATH}/ecosystem.config.js << 'EOFCONFIG'\n{ecosystem}\nEOFCONFIG")
        
        # 4. Iniciar simple
        print("\n🚀 Iniciando PM2 (modo simple)...")
        exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js")
        exec_cmd(client, "pm2 save")
        
        # 5. Esperar
        print("\n⏳ Esperando 45 segundos para warm-up completo...")
        time.sleep(45)
        
        # 6. Ver logs
        print("\n📋 Logs de aplicación:")
        exec_cmd(client, "pm2 logs inmova-app --lines 20 --nostream")
        
        # 7. Estado final
        print("\n📊 Estado PM2:")
        exec_cmd(client, "pm2 status")
        
        # 8. Health check
        print("\n🏥 Health check:")
        for i in range(6):
            status, output, _ = exec_cmd(client, "curl -s -m 10 http://localhost:3000/api/health 2>/dev/null || echo 'TIMEOUT'")
            if 'healthy' in output.lower() or 'ok' in output.lower() or '"status"' in output:
                print(f"✅ Health OK")
                break
            if 'TIMEOUT' not in output and output.strip():
                print(f"Respuesta: {output[:200]}")
            print(f"Intento {i+1}/6...")
            time.sleep(10)
        
        # 9. HTTP check
        print("\n🌐 HTTP Status:")
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' -m 10 http://localhost:3000/ 2>/dev/null || echo '000'")
        print(f"Landing: {output}")
        
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' -m 10 http://localhost:3000/login 2>/dev/null || echo '000'")
        print(f"Login: {output}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
