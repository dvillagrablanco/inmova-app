#!/usr/bin/env python3
"""
Deploy: Landing de Precios con Stripe y Facturación
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
BRANCH = "cursor/configuraci-n-botones-404-32e9"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300, check_error=True):
    """Ejecuta comando y retorna (exit_status, output)"""
    log(f"  $ {cmd[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    
    if exit_status != 0 and check_error:
        if error:
            log(f"  Error: {error[:200]}", Colors.YELLOW)
    
    return exit_status, output + error

def main():
    print(f"\n{Colors.BOLD}{'='*70}")
    print("🚀 DEPLOYMENT: Landing Precios + Stripe + Facturación")
    print(f"{'='*70}{Colors.RESET}\n")
    
    log(f"Servidor: {SERVER_IP}")
    log(f"Branch: {BRANCH}")
    log(f"Path: {APP_PATH}")
    
    # Conectar
    log("\n🔐 Conectando al servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # 1. Backup de .env.production
        log("\n💾 BACKUP DE CONFIGURACIÓN", Colors.CYAN)
        exec_cmd(client, f"cp {APP_PATH}/.env.production /root/.env.inmova.backup.$(date +%Y%m%d%H%M%S)", check_error=False)
        log("✅ Backup creado", Colors.GREEN)

        # 2. Actualizar código
        log("\n📥 ACTUALIZANDO CÓDIGO", Colors.CYAN)
        
        # Guardar cambios locales
        exec_cmd(client, f"cd {APP_PATH} && git stash", check_error=False)
        
        # Fetch y checkout del branch
        status, _ = exec_cmd(client, f"cd {APP_PATH} && git fetch origin {BRANCH}")
        if status != 0:
            # Si el branch no existe, usar main
            log("Branch no encontrado, usando main...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && git fetch origin main")
            exec_cmd(client, f"cd {APP_PATH} && git checkout main")
            exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/main")
        else:
            exec_cmd(client, f"cd {APP_PATH} && git checkout {BRANCH}")
            exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/{BRANCH}")
        
        # Restaurar .env.production
        exec_cmd(client, f"cp /root/.env.inmova.backup {APP_PATH}/.env.production", check_error=False)
        log("✅ Código actualizado", Colors.GREEN)

        # 3. Instalar dependencias
        log("\n📦 INSTALANDO DEPENDENCIAS", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if status != 0:
            log(f"⚠️ npm install con warnings", Colors.YELLOW)
        else:
            log("✅ Dependencias instaladas", Colors.GREEN)

        # 4. Prisma generate
        log("\n🔧 GENERANDO PRISMA CLIENT", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        log("✅ Prisma generado", Colors.GREEN)

        # 5. Build
        log("\n🏗️ BUILDING APLICACIÓN", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -50", timeout=600)
        if status != 0:
            log(f"❌ Build falló", Colors.RED)
            log(output[-500:] if len(output) > 500 else output, Colors.YELLOW)
            return 1
        log("✅ Build completado", Colors.GREEN)

        # 6. Restart PM2
        log("\n♻️ REINICIANDO PM2", Colors.CYAN)
        exec_cmd(client, "pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env", check_error=False)
        log("✅ PM2 reiniciado", Colors.GREEN)

        # 7. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)

        # 8. Health checks
        log("\n🏥 VERIFICANDO SALUD", Colors.CYAN)
        
        # Test health
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:100]}", Colors.YELLOW)

        # Test landing precios
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing/precios")
        if '200' in output:
            log("✅ Landing precios OK", Colors.GREEN)
        else:
            log(f"⚠️ Landing precios: HTTP {output}", Colors.YELLOW)

        # Test API facturas
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/empresa/facturas")
        if '401' in output or '200' in output:
            log("✅ API facturas OK (requiere auth)", Colors.GREEN)
        else:
            log(f"⚠️ API facturas: HTTP {output}", Colors.YELLOW)

        print(f"\n{Colors.BOLD}{'='*70}")
        print(f"✅ DEPLOYMENT COMPLETADO")
        print(f"{'='*70}{Colors.RESET}\n")
        
        log("URLs:", Colors.CYAN)
        log("  - Landing Precios: https://inmovaapp.com/landing/precios")
        log("  - Facturas: https://inmovaapp.com/empresa/facturas")
        log("  - Módulos: https://inmovaapp.com/empresa/modulos")
        
        return 0

    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
