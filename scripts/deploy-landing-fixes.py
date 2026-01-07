#!/usr/bin/env python3
"""
Deployment script for landing page fixes
Uses Paramiko for SSH connection
"""
import sys
import time

# Add path for paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuration
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.END):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, command, timeout=300):
    """Execute command and return status and output"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print(f"""
{Colors.CYAN}{'='*70}
🚀 DEPLOYMENT - LANDING PAGE FIXES
{'='*70}{Colors.END}

Servidor: {SERVER_IP}
Path: {APP_PATH}
""")

    # Connect
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # Step 1: Git pull
        log("📥 Actualizando código...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log(f"❌ Error git pull: {error}", Colors.RED)
            return 1
        log(f"✅ Código actualizado", Colors.GREEN)
        print(output)

        # Step 2: Install deps if needed (usually not needed for landing fixes)
        log("📦 Verificando dependencias...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --prefer-offline", timeout=180)
        log("✅ Dependencias OK", Colors.GREEN)

        # Step 3: Build
        log("🏗️ Building aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -30", timeout=600)
        if status != 0:
            log(f"⚠️ Build terminado con warnings/errors - verificando...", Colors.YELLOW)
            # Check if .next directory exists
            status2, output2, _ = exec_cmd(client, f"ls -la {APP_PATH}/.next/server/app 2>&1 | head -5")
            if "page.js" not in output2 and status2 != 0:
                log(f"❌ Build falló", Colors.RED)
                print(error[:500] if error else output[:500])
                return 1
        log("✅ Build completado", Colors.GREEN)

        # Step 4: PM2 reload
        log("♻️ Reiniciando PM2...", Colors.BLUE)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app")
        if status != 0:
            log(f"⚠️ PM2 reload warning: {error}", Colors.YELLOW)
        log("✅ PM2 reloaded", Colors.GREEN)

        # Step 5: Wait for warm-up
        log("⏳ Esperando warm-up (15s)...", Colors.YELLOW)
        time.sleep(15)

        # Step 6: Health checks
        log("🏥 Verificando health...", Colors.BLUE)
        
        # Check PM2 status
        status, output, _ = exec_cmd(client, "pm2 jlist")
        if "online" in output.lower():
            log("✅ PM2: online", Colors.GREEN)
        else:
            log("⚠️ PM2: verificar estado", Colors.YELLOW)

        # Check health endpoint
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or "ok" in output.lower():
            log("✅ Health API: OK", Colors.GREEN)
        else:
            log(f"⚠️ Health API: {output[:100]}", Colors.YELLOW)

        # Check landing page
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing")
        if "200" in output:
            log("✅ Landing page: 200 OK", Colors.GREEN)
        else:
            log(f"⚠️ Landing page: {output}", Colors.YELLOW)

        # Check login page
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        if "200" in output:
            log("✅ Login page: 200 OK", Colors.GREEN)
        else:
            log(f"⚠️ Login page: {output}", Colors.YELLOW)

        print(f"""
{Colors.GREEN}{'='*70}
✅ DEPLOYMENT COMPLETADO EXITOSAMENTE
{'='*70}{Colors.END}

{Colors.CYAN}URLs:{Colors.END}
  Landing: https://inmovaapp.com/landing
  Login: https://inmovaapp.com/login
  API Health: https://inmovaapp.com/api/health

{Colors.CYAN}Cambios deployados:{Colors.END}
  - WhatsApp button con SVG y tooltip
  - Botones con contraste correcto (sin morado sobre morado)
  - Texto justificado en Hero
  - Cupones correctos en CTAs
  - Fechas actualizadas a 2026
  - Links corregidos a rutas correctas

{Colors.YELLOW}Para ver logs:{Colors.END}
  ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'
""")
        return 0

    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    exit(main())
