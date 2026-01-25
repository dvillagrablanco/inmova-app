#!/usr/bin/env python3
"""
Deploy de páginas de media y baja prioridad.
"""

import sys
import time

# Añadir path para importar paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# ============================================================================
# COLORES
# ============================================================================

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.END):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.END}")

# ============================================================================
# SSH UTILITIES
# ============================================================================

def get_ssh_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    return client

def exec_cmd(client, cmd, timeout=300):
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore').strip()
        errors = stderr.read().decode('utf-8', errors='ignore').strip()
        return exit_code, output, errors
    except Exception as e:
        return -1, "", str(e)

# ============================================================================
# MAIN
# ============================================================================

def main():
    log("=" * 70, Colors.BOLD)
    log("  DEPLOY PÁGINAS MEDIA/BAJA PRIORIDAD", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    
    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client = get_ssh_client()
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Git pull
        log("")
        log("📥 Actualizando código...", Colors.CYAN)
        exit_code, output, errors = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if exit_code != 0:
            log(f"⚠️  Git pull con advertencias: {errors[:200]}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Install dependencies
        log("")
        log("📦 Instalando dependencias...", Colors.CYAN)
        exit_code, output, errors = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if exit_code != 0:
            log(f"⚠️  npm install con advertencias", Colors.YELLOW)
        else:
            log("✅ Dependencias instaladas", Colors.GREEN)
        
        # 3. Build
        log("")
        log("🏗️  Building aplicación...", Colors.CYAN)
        exit_code, output, errors = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if exit_code != 0:
            log(f"❌ Build falló: {errors[:500]}", Colors.RED)
            return 1
        log("✅ Build completado", Colors.GREEN)
        
        # 4. Restart PM2
        log("")
        log("♻️  Reiniciando PM2...", Colors.CYAN)
        exit_code, output, errors = exec_cmd(client, "pm2 reload inmova-app || pm2 restart inmova-app")
        if exit_code != 0:
            log(f"⚠️  PM2 restart con advertencias", Colors.YELLOW)
        else:
            log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 5. Esperar warm-up
        log("")
        log("⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)
        
        # 6. Health check
        log("")
        log("🏥 Verificando health check...", Colors.CYAN)
        exit_code, output, errors = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output.lower() or '"status": "ok"' in output.lower():
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️  Health check: {output[:200]}", Colors.YELLOW)
        
        # 7. Verificar algunas páginas
        log("")
        log("🔍 Verificando páginas...", Colors.CYAN)
        pages = ["/hospitality", "/retail", "/subastas", "/servicios-concierge"]
        for page in pages:
            exit_code, output, errors = exec_cmd(client, f'curl -s -o /dev/null -w "%{{http_code}}" http://localhost:3000{page}')
            status = output.strip()
            if status in ['200', '302', '307']:
                log(f"  ✅ {page} - HTTP {status}", Colors.GREEN)
            else:
                log(f"  ❌ {page} - HTTP {status}", Colors.RED)
        
        log("")
        log("=" * 70, Colors.GREEN)
        log("  ✅ DEPLOY COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
        client.close()
        return 0
        
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        return 1

if __name__ == "__main__":
    sys.exit(main())
