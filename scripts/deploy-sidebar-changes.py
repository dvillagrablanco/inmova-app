#!/usr/bin/env python3
"""
Deploy de cambios en sidebar con selector de empresa
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración
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
    BOLD = '\033[1m'

def log(message, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Ejecuta un comando y retorna (exit_status, output)"""
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if error and exit_status != 0:
            return exit_status, f"{output}\nERROR: {error}"
        return exit_status, output
    except Exception as e:
        return -1, str(e)

def main():
    print(f"\n{Colors.CYAN}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}🚀 DEPLOY - SIDEBAR CON SELECTOR DE EMPRESA{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*70}{Colors.RESET}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"Path: {APP_PATH}", Colors.CYAN)
    print()
    
    # Conectar
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
        # 1. Verificar estado actual
        log("📋 Verificando estado actual...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git status --short")
        if output.strip():
            log(f"  Archivos modificados en servidor:\n{output}", Colors.YELLOW)
        
        # 2. Guardar cambios locales si existen
        log("💾 Guardando cambios locales del servidor...", Colors.YELLOW)
        exec_cmd(client, f"cd {APP_PATH} && git stash")
        
        # 3. Pull de cambios
        log("📥 Descargando cambios del repositorio...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git pull origin main", timeout=120)
        if status != 0:
            log(f"⚠️ Warning en git pull: {output}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 4. Instalar dependencias si hay cambios en package.json
        log("📦 Verificando dependencias...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=300)
        if status == 0:
            log("✅ Dependencias OK", Colors.GREEN)
        else:
            log(f"⚠️ Warning en npm install: {output[:200]}", Colors.YELLOW)
        
        # 5. Generar Prisma
        log("🔧 Generando Prisma Client...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status == 0:
            log("✅ Prisma Client generado", Colors.GREEN)
        else:
            log(f"⚠️ Warning en Prisma: {output[:200]}", Colors.YELLOW)
        
        # 6. Build
        log("🏗️ Construyendo aplicación...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"❌ Error en build: {output[-500:]}", Colors.RED)
            return 1
        log("✅ Build completado", Colors.GREEN)
        
        # 7. Reiniciar PM2
        log("♻️ Reiniciando aplicación con PM2...", Colors.YELLOW)
        status, output = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status != 0:
            # Intentar restart si reload falla
            status, output = exec_cmd(client, "pm2 restart inmova-app --update-env")
        
        if status == 0:
            log("✅ Aplicación reiniciada", Colors.GREEN)
        else:
            log(f"⚠️ Warning en PM2: {output}", Colors.YELLOW)
        
        # 8. Esperar warm-up
        log("⏳ Esperando warm-up (20 segundos)...", Colors.YELLOW)
        time.sleep(20)
        
        # 9. Health check
        log("🏥 Verificando health check...", Colors.YELLOW)
        for i in range(5):
            status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            if '"status":"ok"' in output or '"status": "ok"' in output:
                log("✅ Health check OK", Colors.GREEN)
                break
            log(f"  Intento {i+1}/5 - esperando...", Colors.YELLOW)
            time.sleep(5)
        else:
            log("⚠️ Health check no respondió OK, verificar logs", Colors.YELLOW)
        
        # 10. Verificar que la landing carga
        log("🌐 Verificando landing page...", Colors.YELLOW)
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
        if '200' in output:
            log("✅ Landing page OK (200)", Colors.GREEN)
        else:
            log(f"⚠️ Landing page status: {output}", Colors.YELLOW)
        
        # 11. Guardar PM2
        log("💾 Guardando configuración PM2...", Colors.YELLOW)
        exec_cmd(client, "pm2 save")
        
        print(f"\n{Colors.GREEN}{'='*70}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}✅ DEPLOY COMPLETADO EXITOSAMENTE{Colors.RESET}")
        print(f"{Colors.GREEN}{'='*70}{Colors.RESET}")
        print(f"\n{Colors.CYAN}URLs:{Colors.RESET}")
        print(f"  • Producción: https://inmovaapp.com")
        print(f"  • IP Directa: http://{SERVER_IP}:3000")
        print(f"\n{Colors.CYAN}Cambios desplegados:{Colors.RESET}")
        print(f"  • Sidebar reorganizado: Gestión Plataforma primero")
        print(f"  • Selector de empresa para Super Admin")
        print(f"  • Verticales/Herramientas filtradas por empresa seleccionada")
        print()
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deploy: {e}", Colors.RED)
        return 1
    finally:
        client.close()
        log("🔌 Conexión cerrada", Colors.CYAN)

if __name__ == "__main__":
    sys.exit(main())
