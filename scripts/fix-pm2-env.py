#!/usr/bin/env python3
"""
Script para configurar PM2 con variables de entorno correctamente
"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return exit_status, stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

def main():
    log("=" * 70, Colors.CYAN)
    log("🔧 CONFIGURAR PM2 CON VARIABLES DE ENTORNO", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Verificar contenido de .env.production
        log("\n📋 [1/5] Verificando .env.production...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep -E '(NEXTAUTH_SECRET|NEXTAUTH_URL|DATABASE_URL)' | head -5")
        log(f"Variables encontradas:\n{out}", Colors.CYAN)
        
        # 2. Crear ecosystem.config.js con env_file
        log("\n🔧 [2/5] Configurando ecosystem.config.js...", Colors.BLUE)
        ecosystem_config = '''
module.exports = {
  apps: [{
    name: 'inmova-app',
    script: 'npm',
    args: 'start',
    cwd: '/opt/inmova-app',
    env_file: '/opt/inmova-app/.env.production',
    autorestart: true,
    max_restarts: 10,
    restart_delay: 4000,
    max_memory_restart: '1G',
    watch: false,
    instances: 1,
    exec_mode: 'fork'
  }]
};
'''
        exec_cmd(client, f"cat > {APP_PATH}/ecosystem.config.js << 'EOFCONFIG'\n{ecosystem_config}\nEOFCONFIG")
        log("✅ ecosystem.config.js creado", Colors.GREEN)
        
        # 3. Parar PM2 completamente
        log("\n🛑 [3/5] Parando PM2...", Colors.BLUE)
        exec_cmd(client, "pm2 delete all 2>/dev/null; pm2 kill 2>/dev/null")
        log("✅ PM2 detenido", Colors.GREEN)
        
        # 4. Crear script de inicio con source de .env
        log("\n🚀 [4/5] Iniciando PM2 con variables de entorno...", Colors.BLUE)
        
        # Cargar variables y iniciar PM2
        start_cmd = f"""
cd {APP_PATH}
export $(grep -v '^#' .env.production | xargs)
pm2 start ecosystem.config.js
pm2 save
"""
        status, out, err = exec_cmd(client, start_cmd, timeout=120)
        log(f"  Output: {out[-300:]}", Colors.CYAN)
        
        # Esperar
        log("\n⏳ Esperando warm-up (30s)...", Colors.BLUE)
        time.sleep(30)
        
        # 5. Verificación
        log("\n🏥 [5/5] Verificando...", Colors.BLUE)
        
        # PM2 status
        status, out, err = exec_cmd(client, "pm2 list")
        log(f"PM2 Status:\n{out}", Colors.CYAN)
        
        # Verificar logs de errores
        status, out, err = exec_cmd(client, "pm2 logs inmova-app --err --nostream --lines 10")
        log(f"Últimos errores:\n{out[-500:]}", Colors.YELLOW if out.strip() else Colors.GREEN)
        
        # Health check
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        log(f"Health: {out[:200]}", Colors.CYAN)
        
        # Test login page
        status, out, err = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        log(f"Login page HTTP: {out}", Colors.GREEN if "200" in out else Colors.YELLOW)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ CONFIGURACIÓN COMPLETADA", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
