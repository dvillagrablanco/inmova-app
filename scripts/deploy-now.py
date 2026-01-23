#!/usr/bin/env python3
"""
Deployment script via SSH using paramiko
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Server configuration
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    timestamp = time.strftime('%H:%M:%S')
    print(f"[{timestamp}] {color}{msg}{Colors.END}")

def exec_cmd(client, command, timeout=300):
    """Execute command and return (exit_status, output)"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output + error

def main():
    print("=" * 70)
    print(f"{Colors.CYAN}🚀 DEPLOYMENT INMOVA APP{Colors.END}")
    print("=" * 70)
    print(f"Servidor: {SERVER_IP}")
    print(f"Path: {APP_PATH}")
    print("=" * 70)
    print()

    # Connect
    log("Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conexión establecida", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # 1. Git pull
        log("📥 Actualizando código...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git fetch origin main && git reset --hard origin/main")
        if status != 0:
            log(f"⚠️ Git: {output}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # 2. Install dependencies
        log("📦 Instalando dependencias...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm ci --legacy-peer-deps", timeout=600)
        if status != 0:
            log(f"⚠️ npm ci falló, intentando npm install...", Colors.YELLOW)
            status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        log("✅ Dependencias instaladas", Colors.GREEN)

        # 3. Prisma generate
        log("🔧 Generando Prisma Client...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        log("✅ Prisma Client generado", Colors.GREEN)

        # 4. Build
        log("🏗️ Compilando aplicación...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"❌ Error en build: {output[-500:]}", Colors.RED)
            return 1
        log("✅ Build completado", Colors.GREEN)

        # 5. Restart PM2
        log("♻️ Reiniciando PM2...", Colors.BLUE)
        status, output = exec_cmd(client, "pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env")
        if status != 0:
            # Try starting if not exists
            exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
        exec_cmd(client, "pm2 save")
        log("✅ PM2 reiniciado", Colors.GREEN)

        # 6. Wait for warmup
        log("⏳ Esperando warmup (20s)...", Colors.BLUE)
        time.sleep(20)

        # 7. Health check
        log("🏥 Verificando salud...", Colors.BLUE)
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:200]}", Colors.YELLOW)

        # 8. Check PM2 status
        status, output = exec_cmd(client, "pm2 list | grep inmova")
        log(f"PM2 Status: {output.strip()}", Colors.CYAN)

        print()
        print("=" * 70)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        print("=" * 70)
        print(f"URL: https://inmovaapp.com")
        print(f"IP Directa: http://{SERVER_IP}:3000")
        print("=" * 70)

    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
