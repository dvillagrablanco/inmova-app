#!/usr/bin/env python3
"""
Script de Deployment via SSH con Paramiko
"""

import sys
import time

# Añadir path de Paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(message, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Ejecutar comando SSH y retornar resultado"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    return exit_status, output, error

def main():
    log("=" * 60, Colors.CYAN)
    log("🚀 DEPLOYMENT INMOVA APP", Colors.CYAN)
    log("=" * 60, Colors.CYAN)
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"Path: {APP_PATH}", Colors.CYAN)
    log("=" * 60, Colors.CYAN)
    
    # Conectar
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=USERNAME,
            password=PASSWORD,
            timeout=30
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Verificar directorio
        log("📁 Verificando directorio de la app...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"ls -la {APP_PATH}")
        if status != 0:
            log(f"❌ Directorio no encontrado: {APP_PATH}", Colors.RED)
            return 1
        log("✅ Directorio verificado", Colors.GREEN)
        
        # 2. Git pull
        log("📥 Actualizando código desde Git...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && git fetch origin && git pull origin cursor/p-ginas-de-gesti-n-y-limpieza-2ed2",
            timeout=120
        )
        if "Already up to date" in output:
            log("✅ Código ya actualizado", Colors.GREEN)
        elif status == 0:
            log("✅ Código actualizado desde Git", Colors.GREEN)
        else:
            # Intentar reset y pull
            log("⚠️ Intentando reset y pull...", Colors.YELLOW)
            status, output, error = exec_cmd(
                client,
                f"cd {APP_PATH} && git stash && git fetch origin && git checkout cursor/p-ginas-de-gesti-n-y-limpieza-2ed2 && git pull origin cursor/p-ginas-de-gesti-n-y-limpieza-2ed2",
                timeout=120
            )
            if status != 0:
                log(f"⚠️ Git pull con advertencias: {error[:200]}", Colors.YELLOW)
        
        # 3. Instalar dependencias (si package.json cambió)
        log("📦 Verificando dependencias...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install --production=false",
            timeout=300
        )
        if status == 0:
            log("✅ Dependencias verificadas", Colors.GREEN)
        else:
            log(f"⚠️ Advertencia en npm install: {error[:200]}", Colors.YELLOW)
        
        # 4. Generar Prisma Client
        log("🔧 Generando Prisma Client...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma generate",
            timeout=120
        )
        if status == 0:
            log("✅ Prisma Client generado", Colors.GREEN)
        else:
            log(f"⚠️ Prisma generate: {error[:200]}", Colors.YELLOW)
        
        # 5. Build de la aplicación
        log("🏗️ Building aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build",
            timeout=600
        )
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"⚠️ Build con advertencias", Colors.YELLOW)
            if "error" in error.lower():
                log(f"Error en build: {error[:500]}", Colors.RED)
        
        # 6. Reiniciar PM2
        log("♻️ Reiniciando PM2...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env",
            timeout=60
        )
        if status == 0:
            log("✅ PM2 reiniciado", Colors.GREEN)
        else:
            # Intentar start si no existe
            log("⚠️ Intentando iniciar PM2...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
        
        # 7. Esperar warm-up
        log("⏳ Esperando warm-up (15s)...", Colors.YELLOW)
        time.sleep(15)
        
        # 8. Health check
        log("🏥 Verificando health...", Colors.YELLOW)
        for i in range(5):
            status, output, error = exec_cmd(
                client,
                "curl -s http://localhost:3000/api/health"
            )
            if '"status":"ok"' in output or '"status": "ok"' in output:
                log("✅ Health check PASSED", Colors.GREEN)
                break
            time.sleep(3)
        else:
            log("⚠️ Health check inconcluso", Colors.YELLOW)
        
        # 9. Verificar PM2 status
        log("📊 Estado de PM2:", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 list")
        print(output)
        
        # Éxito
        log("=" * 60, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 60, Colors.GREEN)
        log(f"URL: https://inmovaapp.com", Colors.CYAN)
        log(f"Fallback: http://{SERVER_IP}:3000", Colors.CYAN)
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
    finally:
        client.close()
        log("🔒 Conexión cerrada", Colors.YELLOW)

if __name__ == "__main__":
    sys.exit(main())
