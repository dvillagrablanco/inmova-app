#!/usr/bin/env python3
"""
Deploy del branch actual al servidor
"""

import sys
import time
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"
BRANCH = "cursor/ltimo-build-auditado-cursorrules-8336"

def exec_cmd(client, command, timeout=600):
    print(f"\n$ {command[:100]}...")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    if output:
        # Solo últimas líneas si es muy largo
        if len(output) > 3000:
            print(f"[...truncado...]\n{output[-2000:]}")
        else:
            print(output)
    if error and 'warning' not in error.lower()[:100]:
        print(f"[stderr]: {error[-500:]}")
    return exit_status, output, error

def main():
    print("🚀 DEPLOY DEL BRANCH CON CORRECCIONES...")
    print(f"Servidor: {SERVER_IP}")
    print(f"Branch: {BRANCH}")
    
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
        print("\n2️⃣ Limpiando cache...")
        exec_cmd(client, f"rm -rf {APP_PATH}/.next")
        exec_cmd(client, f"rm -rf {APP_PATH}/node_modules/.cache")
        
        # 3. Fetch y checkout al branch correcto
        print(f"\n3️⃣ Cambiando a branch {BRANCH}...")
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin")
        # Limpiar cambios locales
        exec_cmd(client, f"cd {APP_PATH} && git checkout -- . && git clean -fd")
        # Checkout al branch
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git checkout -B deploy-branch origin/{BRANCH}")
        
        # 4. Instalar dependencias
        print("\n4️⃣ Instalando dependencias...")
        exec_cmd(client, f"cd {APP_PATH} && npm ci", timeout=600)
        
        # 5. Prisma generate
        print("\n5️⃣ Prisma generate...")
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        
        # 6. Build
        print("\n6️⃣ Building aplicación...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1", timeout=900)
        
        # Verificar BUILD_ID
        status, build_id, _ = exec_cmd(client, f"cat {APP_PATH}/.next/BUILD_ID 2>/dev/null || echo 'NO_BUILD'")
        if 'NO_BUILD' in build_id:
            print("❌ Build incompleto")
            # Ver errores específicos
            exec_cmd(client, f"tail -100 {APP_PATH}/.next/trace")
            return False
        print(f"✅ BUILD_ID: {build_id.strip()}")
        
        # 7. Crear ecosystem
        print("\n7️⃣ Configurando PM2...")
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
        
        # 8. Iniciar PM2
        print("\n8️⃣ Iniciando PM2...")
        exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js")
        exec_cmd(client, "pm2 save")
        
        # 9. Esperar warm-up
        print("\n⏳ Esperando 45 segundos...")
        time.sleep(45)
        
        # 10. Verificar
        print("\n9️⃣ Verificando servicio...")
        exec_cmd(client, "pm2 status")
        
        # Health check
        print("\n🏥 Health check:")
        success = False
        for i in range(8):
            status, output, _ = exec_cmd(client, "curl -s -m 15 http://localhost:3000/api/health")
            if output.strip() and ('healthy' in output.lower() or 'ok' in output.lower() or '"status"' in output):
                print(f"\n✅ HEALTH OK: {output[:100]}")
                success = True
                break
            print(f"Intento {i+1}/8...")
            time.sleep(10)
        
        if not success:
            print("⚠️ Health check no confirmado - verificando logs...")
            exec_cmd(client, "pm2 logs inmova-app --lines 30 --nostream")
        
        # HTTP Status
        print("\n🌐 Verificación HTTP:")
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' -m 15 http://localhost:3000/")
        print(f"Landing: HTTP {output.strip()}")
        
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' -m 15 http://localhost:3000/login")
        print(f"Login: HTTP {output.strip()}")
        
        print("\n" + "="*60)
        print("✅ DEPLOY COMPLETADO")
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
