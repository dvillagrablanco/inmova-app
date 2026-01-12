#!/usr/bin/env python3
"""
Deployment automatizado con Paramiko - Inmova App
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

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(message, color=None):
    timestamp = datetime.now().strftime('%H:%M:%S')
    if color:
        print(f"[{timestamp}] {color}{message}{Colors.END}")
    else:
        print(f"[{timestamp}] {message}")

def exec_cmd(client, command, timeout=300):
    """Ejecuta un comando SSH con timeout"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore').strip()
    error = stderr.read().decode('utf-8', errors='ignore').strip()
    return exit_status, output, error

def main():
    print("=" * 70)
    log("🚀 DEPLOYMENT AUTOMATIZADO - INMOVA APP", Colors.CYAN)
    print("=" * 70)
    print()
    log(f"Servidor: {SERVER_IP}")
    log(f"Path: {APP_PATH}")
    print()

    # Conectar
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)

        # 1. Git pull
        log("📥 Actualizando código...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1")
        if status != 0:
            log(f"⚠️ Git pull warning: {error or output}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # 2. Verificar PM2
        log("🔍 Verificando PM2...", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 list | grep inmova")
        if "inmova" in output.lower():
            log("✅ PM2 detectado con inmova-app", Colors.GREEN)
        else:
            log("⚠️ PM2 no tiene inmova-app configurado", Colors.YELLOW)

        # 3. Reload PM2 (zero-downtime)
        log("♻️ Recargando aplicación...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1", timeout=120)
        if status != 0:
            # Intentar restart si reload falla
            log("⚠️ Reload falló, intentando restart...", Colors.YELLOW)
            status, output, error = exec_cmd(client, f"cd {APP_PATH} && pm2 restart inmova-app --update-env 2>&1", timeout=120)
        
        if status == 0:
            log("✅ Aplicación recargada", Colors.GREEN)
        else:
            log(f"⚠️ Warning: {error or output}", Colors.YELLOW)

        # 4. Esperar warm-up
        log("⏳ Esperando warm-up (15s)...", Colors.CYAN)
        time.sleep(15)

        # 5. Health check
        log("🏥 Verificando health check...", Colors.CYAN)
        for attempt in range(5):
            status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            if '"status":"ok"' in output or '"status": "ok"' in output:
                log("✅ Health check OK", Colors.GREEN)
                break
            else:
                if attempt < 4:
                    log(f"⏳ Intento {attempt + 1}/5 - esperando...", Colors.YELLOW)
                    time.sleep(5)
                else:
                    log(f"⚠️ Health check no OK: {output[:100]}", Colors.YELLOW)

        # 6. Verificar PM2 status
        log("📊 Estado de PM2:", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 status inmova-app --no-color")
        print(output)

        print()
        print("=" * 70)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        print("=" * 70)
        print()
        log("URLs:", Colors.CYAN)
        log("  - Producción: https://inmovaapp.com")
        log("  - Health: https://inmovaapp.com/api/health")
        print()

    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        return 1
    finally:
        client.close()

    return 0

if __name__ == '__main__':
    sys.exit(main())
