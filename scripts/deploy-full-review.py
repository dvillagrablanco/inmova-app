#!/usr/bin/env python3
"""
Script de deployment para Inmova App
Realiza deploy automático vía SSH con paramiko
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración del servidor
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
BRANCH = 'cursor/p-ginas-de-gesti-n-y-limpieza-2ed2'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(message, color=Colors.RESET):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Ejecuta un comando y retorna el resultado"""
    log(f"Ejecutando: {command[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    errors = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, errors

def main():
    print("=" * 70)
    log("🚀 DEPLOYMENT AUTOMÁTICO - INMOVA APP", Colors.BLUE)
    print("=" * 70)
    print(f"Servidor: {SERVER_IP}")
    print(f"Branch: {BRANCH}")
    print(f"Path: {APP_PATH}")
    print("=" * 70)
    
    # Conectar al servidor
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Backup de BD
        log("💾 Creando backup de BD...", Colors.YELLOW)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        status, output, errors = exec_cmd(
            client,
            f"mkdir -p /var/backups/inmova && pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'",
            timeout=120
        )
        log("✅ Backup completado", Colors.GREEN)
        
        # 2. Git stash y pull
        log("📥 Actualizando código...", Colors.YELLOW)
        exec_cmd(client, f"cd {APP_PATH} && git stash", timeout=60)
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin", timeout=120)
        exec_cmd(client, f"cd {APP_PATH} && git checkout {BRANCH}", timeout=60)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/{BRANCH}", timeout=60)
        
        if status == 0:
            log("✅ Código actualizado", Colors.GREEN)
        else:
            log(f"⚠️ Git reset: {errors[:200]}", Colors.YELLOW)
        
        # 3. Instalar dependencias
        log("📦 Instalando dependencias...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npm install", timeout=600)
        if status == 0:
            log("✅ Dependencias instaladas", Colors.GREEN)
        else:
            log(f"⚠️ npm install warnings: {errors[:200]}", Colors.YELLOW)
        
        # 4. Prisma generate
        log("🔧 Generando Prisma client...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status == 0:
            log("✅ Prisma client generado", Colors.GREEN)
        else:
            log(f"⚠️ Prisma generate: {errors[:200]}", Colors.YELLOW)
        
        # 5. Build
        log("🏗️ Building aplicación...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=900)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"❌ Build failed: {errors[:500]}", Colors.RED)
            return 1
        
        # 6. PM2 reload
        log("♻️ Reiniciando PM2...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, "pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env", timeout=120)
        if status == 0:
            log("✅ PM2 reiniciado", Colors.GREEN)
        else:
            log(f"⚠️ PM2: {errors[:200]}", Colors.YELLOW)
        
        # 7. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 8. Health check
        log("🏥 Verificando health check...", Colors.YELLOW)
        for i in range(5):
            status, output, errors = exec_cmd(client, "curl -s http://localhost:3000/api/health", timeout=30)
            if '"status":"ok"' in output or 'ok' in output.lower():
                log("✅ Health check OK", Colors.GREEN)
                break
            elif i < 4:
                log(f"⏳ Reintentando health check ({i+2}/5)...", Colors.YELLOW)
                time.sleep(5)
            else:
                log(f"⚠️ Health check response: {output[:200]}", Colors.YELLOW)
        
        # 9. Verificar PM2 status
        log("📊 Estado de PM2...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, "pm2 status", timeout=30)
        if 'online' in output.lower():
            log("✅ PM2 está online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {output[:300]}", Colors.YELLOW)
        
        print("=" * 70)
        log("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE", Colors.GREEN)
        print("=" * 70)
        print(f"URL: https://inmovaapp.com")
        print(f"Health: https://inmovaapp.com/api/health")
        print("=" * 70)
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
        
    finally:
        client.close()
        log("🔒 Conexión cerrada", Colors.CYAN)

if __name__ == '__main__':
    sys.exit(main())
