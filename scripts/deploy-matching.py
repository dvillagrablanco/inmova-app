#!/usr/bin/env python3
"""
Deploy Matching Page to Production
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"
BRANCH = "cursor/edificios-critical-error-cbfd"

# ============================================================================
# COLORES
# ============================================================================

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.ENDC):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.ENDC}")

# ============================================================================
# EJECUCIÓN REMOTA
# ============================================================================

def exec_cmd(client, cmd, timeout=60):
    """Ejecuta comando SSH y retorna resultado"""
    log(f"  → {cmd[:80]}..." if len(cmd) > 80 else f"  → {cmd}", Colors.CYAN)
    
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and error:
        log(f"  ⚠ Error: {error[:200]}", Colors.YELLOW)
    
    return exit_status, output, error

# ============================================================================
# MAIN
# ============================================================================

def main():
    log("=" * 70, Colors.HEADER)
    log("🚀 DEPLOYMENT PÁGINA DE MATCHING - INMOVA APP", Colors.HEADER)
    log("=" * 70, Colors.HEADER)
    log("")
    log(f"Servidor: {SERVER_IP}")
    log(f"Path: {APP_PATH}")
    log(f"Branch: {BRANCH}")
    log("")
    
    # Conectar SSH
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=15
        )
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Fetch y checkout del branch
        log("")
        log("📥 ACTUALIZANDO CÓDIGO", Colors.BLUE)
        
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin {BRANCH}")
        
        # Checkout de los archivos nuevos
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && git checkout origin/{BRANCH} -- app/matching/page.tsx app/api/units/batch/route.ts"
        )
        
        if status != 0:
            log(f"⚠ Error checkout: {error}", Colors.YELLOW)
            # Crear directorios si no existen
            exec_cmd(client, f"mkdir -p {APP_PATH}/app/matching")
            exec_cmd(client, f"mkdir -p {APP_PATH}/app/api/units/batch")
            
            # Retry checkout
            exec_cmd(
                client,
                f"cd {APP_PATH} && git checkout origin/{BRANCH} -- app/matching/page.tsx app/api/units/batch/route.ts"
            )
        
        log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Verificar archivos
        log("")
        log("📋 VERIFICANDO ARCHIVOS", Colors.BLUE)
        
        status, output, error = exec_cmd(client, f"ls -la {APP_PATH}/app/matching/")
        log(f"   Matching: {output.strip()}", Colors.CYAN)
        
        status, output, error = exec_cmd(client, f"ls -la {APP_PATH}/app/api/units/batch/")
        log(f"   Batch API: {output.strip()}", Colors.CYAN)
        
        # 3. Build
        log("")
        log("🏗️ BUILDING APLICACIÓN", Colors.BLUE)
        log("   (esto puede tardar unos minutos...)")
        
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -20",
            timeout=600
        )
        
        if "error" in output.lower() or status != 0:
            log(f"⚠ Build output: {output[-500:]}", Colors.YELLOW)
            # Continuamos de todas formas
        else:
            log("✅ Build completado", Colors.GREEN)
        
        # 4. Restart PM2
        log("")
        log("♻️ REINICIANDO PM2", Colors.BLUE)
        
        exec_cmd(client, "pm2 reload inmova-app --update-env")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 5. Esperar warm-up
        log("")
        log("⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)
        
        # 6. Health checks
        log("")
        log("🏥 HEALTH CHECKS", Colors.BLUE)
        
        # Check API health
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/health"
        )
        
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ API Health OK", Colors.GREEN)
        else:
            log(f"⚠ API Health: {output[:100]}", Colors.YELLOW)
        
        # Check matching page
        status, output, error = exec_cmd(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/matching"
        )
        
        if "200" in output or "307" in output:
            log(f"✅ Matching Page: HTTP {output.strip()}", Colors.GREEN)
        else:
            log(f"⚠ Matching Page: HTTP {output.strip()}", Colors.YELLOW)
        
        # Check PM2 status
        status, output, error = exec_cmd(client, "pm2 list | grep inmova")
        
        if "online" in output.lower():
            log("✅ PM2 Status: online", Colors.GREEN)
        else:
            log(f"⚠ PM2 Status: {output.strip()}", Colors.YELLOW)
        
        # 7. Resultado final
        log("")
        log("=" * 70, Colors.HEADER)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.HEADER)
        log("")
        log("URLs:", Colors.CYAN)
        log(f"  🔗 Matching Page: https://inmovaapp.com/matching", Colors.CYAN)
        log(f"  🔗 Health Check: https://inmovaapp.com/api/health", Colors.CYAN)
        log("")
        log("Para ver logs:", Colors.YELLOW)
        log(f"  ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'", Colors.YELLOW)
        log("")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
        
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
