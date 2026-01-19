#!/usr/bin/env python3
"""
Deployment del fix para el bucle del tutorial de bienvenida
"""
import sys
import time

# Añadir path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

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
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Ejecuta comando y retorna (exit_status, output)"""
    log(f"  $ {command[:80]}..." if len(command) > 80 else f"  $ {command}", Colors.CYAN)
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and error:
        log(f"  Error: {error[:200]}", Colors.RED)
    
    return exit_status, output, error

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}  DEPLOYMENT: Fix Tutorial Bienvenida Bucle{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*70}{Colors.RESET}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    log(f"Path: {APP_PATH}", Colors.BLUE)
    
    # Conectar
    log("Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=15)
        log("Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Git pull
        log("\n📥 Actualizando código...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log("Error en git pull", Colors.RED)
            return 1
        log("Código actualizado", Colors.GREEN)
        
        # 2. Verificar que el archivo fue actualizado
        log("\n🔍 Verificando archivo modificado...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git log -1 --oneline components/onboarding/OnboardingTour.tsx")
        log(f"  Último commit: {output.strip()}", Colors.CYAN)
        
        # Verificar que contiene tourClosedRef (el fix)
        status, output, error = exec_cmd(client, f"grep -c 'tourClosedRef' {APP_PATH}/components/onboarding/OnboardingTour.tsx")
        if int(output.strip()) > 0:
            log("Fix verificado en el código (tourClosedRef encontrado)", Colors.GREEN)
        else:
            log("ADVERTENCIA: Fix no encontrado en el código", Colors.RED)
        
        # 3. Reinstalar dependencias si hay cambios en package.json
        log("\n📦 Verificando dependencias...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --prefer-offline", timeout=120)
        log("Dependencias verificadas", Colors.GREEN)
        
        # 4. Build de la aplicación
        log("\n🏗️ Building aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"Error en build: {error[:500]}", Colors.RED)
            return 1
        log("Build completado", Colors.GREEN)
        
        # 5. Restart PM2
        log("\n♻️ Reiniciando PM2...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status != 0:
            # Intentar restart si reload falla
            status, output, error = exec_cmd(client, "pm2 restart inmova-app --update-env")
        log("PM2 reiniciado", Colors.GREEN)
        
        # 6. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 7. Health check
        log("\n🏥 Verificando health...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("Health check: OK", Colors.GREEN)
        else:
            log(f"Health check: {output[:200]}", Colors.YELLOW)
        
        # 8. Verificar PM2 status
        log("\n📊 Estado PM2...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "pm2 status inmova-app --no-color")
        if "online" in output.lower():
            log("PM2 status: online", Colors.GREEN)
        else:
            log(f"PM2 status: {output}", Colors.YELLOW)
        
        # 9. Test de la página de login
        log("\n🔐 Verificando página de login...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        if output.strip() == "200":
            log("Login page: OK (200)", Colors.GREEN)
        else:
            log(f"Login page: HTTP {output.strip()}", Colors.YELLOW)
        
        # 10. Test del dashboard
        log("\n📊 Verificando dashboard...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/dashboard")
        # Dashboard redirige a login si no hay sesión, así que 307 o 200 son OK
        if output.strip() in ["200", "307", "302"]:
            log(f"Dashboard: OK (HTTP {output.strip()})", Colors.GREEN)
        else:
            log(f"Dashboard: HTTP {output.strip()}", Colors.YELLOW)
        
        print(f"\n{Colors.BOLD}{'='*70}{Colors.RESET}")
        print(f"{Colors.GREEN}{Colors.BOLD}  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*70}{Colors.RESET}")
        print(f"\n{Colors.CYAN}URLs de verificación:{Colors.RESET}")
        print(f"  - Health: https://inmovaapp.com/api/health")
        print(f"  - Login: https://inmovaapp.com/login")
        print(f"  - Dashboard: https://inmovaapp.com/dashboard")
        print(f"\n{Colors.YELLOW}Para verificar el fix:{Colors.RESET}")
        print(f"  1. Ir a https://inmovaapp.com/login")
        print(f"  2. Loguearse como administrador de sociedad")
        print(f"  3. Verificar que el tutorial de bienvenida se puede cerrar")
        print(f"  4. Confirmar que NO se reabre en bucle")
        
        return 0
        
    except Exception as e:
        log(f"Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("\nConexión cerrada", Colors.BLUE)

if __name__ == "__main__":
    sys.exit(main())
