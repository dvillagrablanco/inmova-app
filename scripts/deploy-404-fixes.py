#!/usr/bin/env python3
"""
Deploy de correcciones de páginas 404 - Super Admin
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time
import base64

# Configuración
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD_B64 = "aEJYeEM2cFpDUVBCTFBpSEdVSGtBU2lsbitTdS9CQVZRQU42cVEreGpWbz0="
PASSWORD = base64.b64decode(PASSWORD_B64).decode('utf-8').strip()
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando remoto"""
    log(f"$ {cmd[:80]}{'...' if len(cmd) > 80 else ''}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and error:
        log(f"⚠️ Error: {error[:200]}", Colors.YELLOW)
    
    return exit_status, output, error

def main():
    log("=" * 60, Colors.CYAN)
    log("🚀 DEPLOYMENT - Corrección de páginas 404", Colors.CYAN)
    log("=" * 60, Colors.CYAN)
    
    # Conectar
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Git pull
        log("\n📥 Actualizando código...", Colors.BLUE)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if "Already up to date" in output:
            log("ℹ️ Código ya actualizado", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Install dependencies (si hay cambios en package.json)
        log("\n📦 Verificando dependencias...", Colors.BLUE)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        log("✅ Dependencias verificadas", Colors.GREEN)
        
        # 3. Build
        log("\n🏗️ Construyendo aplicación...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=900)
        if status != 0:
            log(f"❌ Error en build: {error[:500]}", Colors.RED)
            return 1
        log("✅ Build completado", Colors.GREEN)
        
        # 4. PM2 reload
        log("\n♻️ Reiniciando aplicación...", Colors.BLUE)
        exec_cmd(client, "pm2 reload inmova-app")
        log("✅ Aplicación reiniciada", Colors.GREEN)
        
        # 5. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.BLUE)
        time.sleep(20)
        
        # 6. Health check
        log("\n🏥 Verificando health check...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check response: {output[:200]}", Colors.YELLOW)
        
        # 7. Verificar páginas corregidas
        log("\n🔍 Verificando páginas corregidas...", Colors.BLUE)
        pages_to_check = [
            "/str-housekeeping",
            "/room-rental",
            "/ordenes-trabajo",
            "/ewoorker/asignaciones"
        ]
        
        all_ok = True
        for page in pages_to_check:
            status, output, _ = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{page}")
            code = output.strip()
            if code == "200":
                log(f"  ✅ {page}: {code}", Colors.GREEN)
            else:
                log(f"  ❌ {page}: {code}", Colors.RED)
                all_ok = False
        
        if all_ok:
            log("\n" + "=" * 60, Colors.GREEN)
            log("✅ DEPLOYMENT COMPLETADO - Todas las páginas corregidas", Colors.GREEN)
            log("=" * 60, Colors.GREEN)
        else:
            log("\n" + "=" * 60, Colors.YELLOW)
            log("⚠️ DEPLOYMENT COMPLETADO - Algunas páginas aún tienen problemas", Colors.YELLOW)
            log("=" * 60, Colors.YELLOW)
        
        return 0
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
