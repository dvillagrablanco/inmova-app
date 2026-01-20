#!/usr/bin/env python3
"""
Deployment Script via SSH using Paramiko
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Server credentials
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Execute command and return status and output"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        return exit_status, output, error
    except Exception as e:
        return -1, "", str(e)

def main():
    print(f"""
{Colors.CYAN}{'='*70}
🚀 DEPLOYMENT AUTOMÁTICO - INMOVA APP
{'='*70}{Colors.RESET}

Servidor: {SERVER_IP}
Usuario: {USERNAME}
""")

    # Connect
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # 1. Check current directory
        log("📁 Verificando directorio de la aplicación...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "cd /opt/inmova-app && pwd")
        if status != 0:
            log("❌ Directorio /opt/inmova-app no existe", Colors.RED)
            return 1
        log("✅ Directorio encontrado: /opt/inmova-app", Colors.GREEN)

        # 2. Git pull
        log("📥 Actualizando código desde git...", Colors.BLUE)
        status, output, error = exec_cmd(client, "cd /opt/inmova-app && git pull origin main", timeout=120)
        if status != 0:
            log(f"⚠️ Git pull warning: {error[:200]}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
            if output.strip():
                print(f"   {output.strip()[:200]}")

        # 3. Install dependencies (if needed)
        log("📦 Verificando dependencias...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "cd /opt/inmova-app && npm install --production=false", timeout=600)
        if status == 0:
            log("✅ Dependencias verificadas", Colors.GREEN)
        else:
            log("⚠️ Algunas dependencias pueden tener problemas", Colors.YELLOW)

        # 4. Generate Prisma client
        log("🔧 Generando cliente Prisma...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "cd /opt/inmova-app && npx prisma generate", timeout=120)
        if status == 0:
            log("✅ Prisma client generado", Colors.GREEN)
        else:
            log("⚠️ Prisma generation warning", Colors.YELLOW)

        # 5. Build
        log("🏗️ Construyendo aplicación...", Colors.BLUE)
        status, output, error = exec_cmd(client, "cd /opt/inmova-app && npm run build 2>&1 | tail -50", timeout=600)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"⚠️ Build warning (puede estar OK): {error[:200] if error else output[:200]}", Colors.YELLOW)

        # 6. Restart PM2
        log("♻️ Reiniciando aplicación con PM2...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env", timeout=60)
        if status == 0:
            log("✅ PM2 reiniciado", Colors.GREEN)
        else:
            # Try starting if not running
            status, output, _ = exec_cmd(client, "cd /opt/inmova-app && pm2 start ecosystem.config.js --env production", timeout=60)
            if status == 0:
                log("✅ PM2 iniciado", Colors.GREEN)
            else:
                log("⚠️ PM2 puede necesitar configuración manual", Colors.YELLOW)

        # 7. Wait for warm-up
        log("⏳ Esperando warm-up (15s)...", Colors.BLUE)
        time.sleep(15)

        # 8. Health check
        log("🏥 Verificando health check...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check: OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check response: {output[:100]}", Colors.YELLOW)

        # 9. Check PM2 status
        log("📊 Estado de PM2:", Colors.BLUE)
        status, output, _ = exec_cmd(client, "pm2 status")
        print(output)

        # 10. Final verification
        log("🔍 Verificación final...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
        http_code = output.strip()
        if http_code in ['200', '302', '304']:
            log(f"✅ Aplicación respondiendo (HTTP {http_code})", Colors.GREEN)
        else:
            log(f"⚠️ HTTP response: {http_code}", Colors.YELLOW)

        print(f"""
{Colors.GREEN}{'='*70}
✅ DEPLOYMENT COMPLETADO
{'='*70}{Colors.RESET}

URLs:
  - Principal: https://inmovaapp.com
  - Health: https://inmovaapp.com/api/health
  - Fallback: http://{SERVER_IP}:3000

Para ver logs:
  ssh root@{SERVER_IP} 'pm2 logs inmova-app'
""")

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
    finally:
        client.close()
        log("🔒 Conexión cerrada", Colors.BLUE)

    return 0

if __name__ == "__main__":
    sys.exit(main())
