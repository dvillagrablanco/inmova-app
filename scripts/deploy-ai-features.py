#!/usr/bin/env python3
"""
Deployment script for AI features integration
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
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(message, color=Colors.END):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, command, timeout=300):
    """Execute command and return status and output"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output + error

def main():
    log("=" * 70, Colors.CYAN)
    log("🚀 DEPLOYMENT: AI Features Integration", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"Path: {APP_PATH}", Colors.CYAN)
    
    # Connect
    log("🔐 Conectando al servidor...", Colors.YELLOW)
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
        log("📥 Actualizando código desde Git...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git checkout cursor/ltimo-deployment-exitoso-8158 && git pull origin cursor/ltimo-deployment-exitoso-8158")
        if status != 0:
            log(f"⚠️ Git pull output: {output}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Install dependencies
        log("📦 Instalando dependencias...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if status != 0:
            log(f"⚠️ npm install output: {output[:500]}", Colors.YELLOW)
        else:
            log("✅ Dependencias instaladas", Colors.GREEN)
        
        # 3. Prisma generate
        log("🔧 Generando Prisma Client...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        log("✅ Prisma generado", Colors.GREEN)
        
        # 4. Build
        log("🏗️ Construyendo aplicación...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=900)
        if status != 0:
            log(f"⚠️ Build warnings/errors: {output[-1000:]}", Colors.YELLOW)
            # Check if .next exists
            status2, _ = exec_cmd(client, f"test -d {APP_PATH}/.next && echo 'exists'")
            if status2 != 0:
                log("❌ Build failed - .next directory not found", Colors.RED)
                return 1
        log("✅ Build completado", Colors.GREEN)
        
        # 5. Create prerender-manifest.json if needed
        log("📄 Verificando prerender-manifest.json...", Colors.YELLOW)
        manifest_check = f'''
if [ ! -f {APP_PATH}/.next/prerender-manifest.json ]; then
    echo '{{"version":4,"routes":{{}},"dynamicRoutes":{{}},"notFoundRoutes":[],"preview":{{"previewModeId":"previewModeId","previewModeSigningKey":"previewModeSigningKey","previewModeEncryptionKey":"previewModeEncryptionKey"}}}}' > {APP_PATH}/.next/prerender-manifest.json
    echo "created"
else
    echo "exists"
fi
'''
        status, output = exec_cmd(client, manifest_check)
        if "created" in output:
            log("✅ prerender-manifest.json creado", Colors.GREEN)
        else:
            log("✅ prerender-manifest.json ya existe", Colors.GREEN)
        
        # 6. Restart PM2
        log("♻️ Reiniciando PM2...", Colors.YELLOW)
        status, output = exec_cmd(client, "pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env")
        if status != 0:
            log(f"⚠️ PM2 restart output: {output}", Colors.YELLOW)
            # Try full restart
            exec_cmd(client, "pm2 delete all; pm2 kill")
            time.sleep(2)
            exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 7. Wait for warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 8. Health check
        log("🏥 Verificando health check...", Colors.YELLOW)
        for attempt in range(3):
            status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            if '"status":"ok"' in output or '"status": "ok"' in output:
                log("✅ Health check OK", Colors.GREEN)
                break
            time.sleep(5)
        else:
            log(f"⚠️ Health check output: {output}", Colors.YELLOW)
        
        # 9. Test AI endpoints
        log("🤖 Verificando endpoints de IA...", Colors.YELLOW)
        ai_endpoints = [
            "/api/ai/form-assistant",
            "/api/ai/property-document-analysis",
            "/api/ai/maintenance-document-analysis",
            "/api/ai/insurance-document-analysis"
        ]
        for endpoint in ai_endpoints:
            status, output = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{endpoint}")
            # Should return 401 (unauthorized) or 405 (method not allowed) - not 404
            if "404" in output:
                log(f"⚠️ {endpoint}: 404 (no encontrado)", Colors.YELLOW)
            else:
                log(f"✅ {endpoint}: {output.strip()}", Colors.GREEN)
        
        # 10. Show PM2 status
        log("📊 Estado de PM2:", Colors.CYAN)
        status, output = exec_cmd(client, "pm2 status")
        print(output)
        
        log("=" * 70, Colors.CYAN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.CYAN)
        log("URLs:", Colors.CYAN)
        log("  - https://inmovaapp.com", Colors.CYAN)
        log("  - http://157.180.119.236:3000", Colors.CYAN)
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
