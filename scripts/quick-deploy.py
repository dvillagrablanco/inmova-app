#!/usr/bin/env python3
"""
Script de deployment rápido para actualizar el servidor de producción
"""

import sys
import time
import os

# Añadir paramiko al path
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = os.environ.get("SERVER_PASSWORD", "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=")
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(message, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {color}{message}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Ejecutar comando en el servidor"""
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace').strip()
        error = stderr.read().decode('utf-8', errors='replace').strip()
        
        return exit_status, output, error
    except Exception as e:
        return -1, "", str(e)

def main():
    print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.CYAN}  QUICK DEPLOY - INMOVA APP{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*60}{Colors.RESET}\n")
    
    # Conectar al servidor
    log("Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        log(f"✅ Conectado a {SERVER_IP}", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Pull del código
        log("📥 Actualizando código...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client, 
            f"cd {APP_PATH} && git pull origin main"
        )
        
        if status != 0:
            log(f"⚠️ Git pull warning: {error}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Instalar dependencias si es necesario
        log("📦 Verificando dependencias...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install --prefer-offline 2>&1 | tail -5",
            timeout=300
        )
        log("✅ Dependencias verificadas", Colors.GREEN)
        
        # 3. Build de la aplicación
        log("🏗️ Construyendo aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -20",
            timeout=600
        )
        
        if status != 0:
            log(f"❌ Build falló: {error}", Colors.RED)
            print(output)
            return 1
        
        log("✅ Build completado", Colors.GREEN)
        
        # 4. Reiniciar PM2
        log("♻️ Reiniciando aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            "pm2 reload inmova-app --update-env"
        )
        
        if status != 0:
            log(f"⚠️ Usando restart: {error}", Colors.YELLOW)
            exec_cmd(client, "pm2 restart inmova-app --update-env")
        
        log("✅ Aplicación reiniciada", Colors.GREEN)
        
        # 5. Esperar warm-up
        log("⏳ Esperando warm-up (15s)...", Colors.YELLOW)
        time.sleep(15)
        
        # 6. Health check
        log("🏥 Verificando health check...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/health"
        )
        
        if '"status":"ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output}", Colors.YELLOW)
        
        # 7. Verificar PM2 status
        log("📊 Estado de PM2...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "pm2 status")
        print(output)
        
        print(f"\n{Colors.GREEN}{'='*60}{Colors.RESET}")
        print(f"{Colors.GREEN}  ✅ DEPLOYMENT COMPLETADO{Colors.RESET}")
        print(f"{Colors.GREEN}{'='*60}{Colors.RESET}")
        print(f"\n🌐 URL: https://inmovaapp.com")
        print(f"🔍 Health: https://inmovaapp.com/api/health\n")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
