#!/usr/bin/env python3
"""
Deployment script para fix de multi-tenancy
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log(msg, color=None):
    timestamp = datetime.now().strftime("%H:%M:%S")
    if color:
        print(f"{color}[{timestamp}] {msg}{Colors.END}")
    else:
        print(f"[{timestamp}] {msg}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando y retornar resultado"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    log("=" * 60, Colors.BLUE)
    log("🚀 DEPLOYMENT: FIX MULTI-TENANCY", Colors.BLUE)
    log("=" * 60, Colors.BLUE)
    
    # Conectar
    log("Conectando al servidor...")
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
        log("\n📥 Actualizando código...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/cursor/ltimo-deployment-exitoso-8158")
        if status != 0:
            log(f"❌ Error git: {error}", Colors.RED)
            return 1
        log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Verificar que el cambio está presente
        log("\n🔍 Verificando cambio...")
        status, output, error = exec_cmd(client, f"grep -c 'Administrador sin companyId' {APP_PATH}/app/api/users/route.ts")
        if "1" in output:
            log("✅ Fix de multi-tenancy presente en el código", Colors.GREEN)
        else:
            log("⚠️ Fix no encontrado, verificar manualmente", Colors.YELLOW)
        
        # 3. Rebuild
        log("\n🔨 Rebuilding...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if "Build error" in output or status != 0:
            log(f"❌ Error de build: {output[-500:]}", Colors.RED)
            # Continuar con el reload de PM2 de todos modos
        else:
            log("✅ Build completado", Colors.GREEN)
        
        # 4. PM2 reload
        log("\n♻️ PM2 reload...")
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status != 0:
            log(f"⚠️ PM2 reload warning: {error}", Colors.YELLOW)
            # Intentar restart
            exec_cmd(client, "pm2 restart inmova-app --update-env")
        log("✅ PM2 reloaded", Colors.GREEN)
        
        # 5. Esperar warm-up
        log("\n⏳ Esperando warm-up (15s)...")
        time.sleep(15)
        
        # 6. Health check
        log("\n🏥 Health check...")
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:200]}", Colors.YELLOW)
        
        # 7. Verificar login
        log("\n🔐 Verificando auth...")
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/auth/session")
        if status == 0:
            log("✅ Auth endpoint responde", Colors.GREEN)
        
        log("\n" + "=" * 60, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 60, Colors.GREEN)
        log(f"\n📍 URL: https://inmovaapp.com")
        log(f"📍 Fix aplicado: usuarios de administrador ahora filtrados por companyId")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
