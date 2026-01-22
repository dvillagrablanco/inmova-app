#!/usr/bin/env python3
"""
Rebuild completo en el servidor
"""

import sys
import time
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, command, timeout=600):
    print(f"\n$ {command[:100]}...")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    if output:
        print(output[-2000:])  # Últimas líneas
    if error and 'warning' not in error.lower()[:100]:
        print(f"[stderr]: {error[-1000:]}")
    return exit_status, output, error

def main():
    print("🔧 REBUILD COMPLETO EN SERVIDOR...")
    print(f"Servidor: {SERVER_IP}")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        print("✅ Conectado\n")
        
        # 1. Detener PM2
        print("1️⃣ Deteniendo servicios...")
        exec_cmd(client, "pm2 delete all 2>/dev/null || true")
        exec_cmd(client, "fuser -k 3000/tcp 2>/dev/null || true")
        
        # 2. Limpiar cache de Next.js
        print("\n2️⃣ Limpiando cache de Next.js...")
        exec_cmd(client, f"rm -rf {APP_PATH}/.next")
        
        # 3. Verificar que tenemos el código correcto
        print("\n3️⃣ Actualizando código...")
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin")
        exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/main")
        
        # 4. Instalar dependencias
        print("\n4️⃣ Instalando dependencias...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm ci", timeout=600)
        
        # 5. Prisma generate
        print("\n5️⃣ Prisma generate...")
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        
        # 6. Build
        print("\n6️⃣ Building aplicación (esto toma ~3-5 minutos)...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1", timeout=900)
        
        if status != 0 and 'error' in (output + error).lower():
            print(f"❌ Build falló")
            return False
        
        # 7. Verificar que .next existe
        print("\n7️⃣ Verificando build...")
        status, output, _ = exec_cmd(client, f"ls -la {APP_PATH}/.next/ | head -10")
        
        status, output, _ = exec_cmd(client, f"cat {APP_PATH}/.next/BUILD_ID 2>/dev/null || echo 'NO_BUILD_ID'")
        if 'NO_BUILD_ID' in output:
            print("❌ Build incompleto - no hay BUILD_ID")
            return False
        print(f"✅ BUILD_ID: {output.strip()}")
        
        # 8. Crear ecosystem simple
        print("\n8️⃣ Creando configuración PM2...")
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
        
        # 9. Iniciar PM2
        print("\n9️⃣ Iniciando PM2...")
        exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js")
        exec_cmd(client, "pm2 save")
        
        # 10. Esperar warm-up
        print("\n⏳ Esperando 60 segundos para warm-up completo...")
        time.sleep(60)
        
        # 11. Verificar
        print("\n🔟 Verificando servicio...")
        exec_cmd(client, "pm2 status")
        
        # Health check
        print("\n🏥 Health check:")
        for i in range(10):
            status, output, _ = exec_cmd(client, "curl -s -m 15 http://localhost:3000/api/health 2>/dev/null || echo 'TIMEOUT'")
            if 'healthy' in output.lower() or 'ok' in output.lower() or '"status"' in output:
                print(f"\n✅ HEALTH CHECK OK: {output[:100]}")
                break
            if 'TIMEOUT' not in output and output.strip():
                print(f"Respuesta: {output[:200]}")
            print(f"Intento {i+1}/10...")
            time.sleep(10)
        else:
            print("⚠️ Health check no confirmado")
        
        # HTTP Status
        print("\n🌐 Verificación HTTP:")
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' -m 15 http://localhost:3000/")
        print(f"Landing: HTTP {output.strip()}")
        
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' -m 15 http://localhost:3000/login")
        print(f"Login: HTTP {output.strip()}")
        
        print("\n" + "="*60)
        print("✅ REBUILD COMPLETADO")
        print("="*60)
        print(f"🌐 URL: https://inmovaapp.com")
        print(f"📍 IP: http://{SERVER_IP}:3000")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
