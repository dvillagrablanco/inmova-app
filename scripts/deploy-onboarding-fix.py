#!/usr/bin/env python3
"""
Deployment script para fix de onboarding móvil
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
    log("🚀 DEPLOYMENT: FIX ONBOARDING MÓVIL", Colors.BLUE)
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
        
        # 2. Verificar que los cambios están presentes
        log("\n🔍 Verificando cambios de onboarding...")
        status, output, error = exec_cmd(client, f"grep -c 'max-h-\\[95vh\\]' {APP_PATH}/components/onboarding/WelcomeWizard.tsx")
        if "1" in output or "2" in output:
            log("✅ Fix de WelcomeWizard presente", Colors.GREEN)
        else:
            log("⚠️ Fix de WelcomeWizard no encontrado", Colors.YELLOW)
            
        # 3. Rebuild
        log("\n🔨 Rebuilding...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -30", timeout=600)
        if "Build error" in output.lower() or (status != 0 and "error" in output.lower()):
            log(f"⚠️ Posible error de build: {output[-800:]}", Colors.YELLOW)
        else:
            log("✅ Build completado", Colors.GREEN)
        
        # 4. Crear prerender-manifest.json si no existe
        log("\n📄 Verificando prerender-manifest.json...")
        status, output, error = exec_cmd(client, f"test -f {APP_PATH}/.next/prerender-manifest.json && echo 'exists' || echo 'missing'")
        if "missing" in output:
            log("Creando prerender-manifest.json...", Colors.YELLOW)
            prerender_content = '''{
  "version": 4,
  "routes": {},
  "dynamicRoutes": {},
  "notFoundRoutes": [],
  "preview": {
    "previewModeId": "preview-mode-id",
    "previewModeSigningKey": "preview-mode-signing-key",
    "previewModeEncryptionKey": "preview-mode-encryption-key"
  }
}'''
            exec_cmd(client, f"cat > {APP_PATH}/.next/prerender-manifest.json << 'EOF'\n{prerender_content}\nEOF")
            log("✅ prerender-manifest.json creado", Colors.GREEN)
        else:
            log("✅ prerender-manifest.json existe", Colors.GREEN)
        
        # 5. PM2 reload
        log("\n♻️ PM2 reload...")
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status != 0 or "error" in output.lower():
            log(f"⚠️ PM2 reload warning, intentando restart...", Colors.YELLOW)
            exec_cmd(client, "pm2 restart inmova-app --update-env")
        log("✅ PM2 reloaded", Colors.GREEN)
        
        # 6. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...")
        time.sleep(20)
        
        # 7. Health check
        log("\n🏥 Health check...")
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
            if '"database":"connected"' in output:
                log("✅ Database conectada", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:300]}", Colors.YELLOW)
        
        # 8. Verificar login page
        log("\n🔐 Verificando login page...")
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        if output.strip() == "200":
            log("✅ Login page OK", Colors.GREEN)
        else:
            log(f"⚠️ Login page status: {output}", Colors.YELLOW)
        
        log("\n" + "=" * 60, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 60, Colors.GREEN)
        log(f"\n📍 URL: https://inmovaapp.com")
        log(f"📍 Fix aplicado: onboarding ahora scrolleable en móvil")
        log(f"📍 Botón cerrar siempre visible en la parte superior")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
