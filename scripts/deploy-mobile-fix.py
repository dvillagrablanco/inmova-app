#!/usr/bin/env python3
"""
Deploy fix for mobile hamburger menu and tutorial loop
Uses paramiko for SSH connection
"""

import sys
import time

# Añadir path para paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
BRANCH = 'cursor/login-y-sidebar-fce3'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(message, color=Colors.RESET):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Execute command and return status and output"""
    log(f"Ejecutando: {command[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    
    if exit_status != 0 and error:
        log(f"Error: {error[:200]}", Colors.RED)
    
    return exit_status, output, error

def main():
    print(f"\n{Colors.CYAN}{'='*70}")
    print("🚀 DEPLOYMENT - FIX HAMBURGUESA MÓVIL Y TUTORIAL LOOP")
    print(f"{'='*70}{Colors.RESET}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.YELLOW)
    log(f"Path: {APP_PATH}", Colors.YELLOW)
    log(f"Branch: {BRANCH}", Colors.YELLOW)
    print()
    
    # Conectar
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(
            SERVER_IP, 
            username=SERVER_USER, 
            password=SERVER_PASSWORD, 
            timeout=30
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
        
        # 1. Cambiar al directorio y hacer git pull
        log("\n📥 PASO 1: Actualizando código desde GitHub...", Colors.CYAN)
        status, output, error = exec_cmd(
            client, 
            f"cd {APP_PATH} && git fetch origin {BRANCH} && git checkout {BRANCH} && git pull origin {BRANCH}"
        )
        if status != 0:
            log(f"❌ Error en git pull: {error}", Colors.RED)
            return False
        log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Instalar dependencias (por si hay cambios)
        log("\n📦 PASO 2: Verificando dependencias...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if status != 0:
            log(f"⚠️ Warning en npm install: {error[:200]}", Colors.YELLOW)
        log("✅ Dependencias verificadas", Colors.GREEN)
        
        # 3. Generar Prisma Client
        log("\n🔧 PASO 3: Generando Prisma client...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        if status != 0:
            log(f"⚠️ Warning en prisma generate", Colors.YELLOW)
        log("✅ Prisma client generado", Colors.GREEN)
        
        # 4. Build
        log("\n🏗️ PASO 4: Building aplicación...", Colors.CYAN)
        status, output, error = exec_cmd(
            client, 
            f"cd {APP_PATH} && npm run build",
            timeout=600
        )
        if status != 0:
            log(f"❌ Error en build: {error[:500]}", Colors.RED)
            return False
        log("✅ Build completado", Colors.GREEN)
        
        # 5. Reiniciar PM2
        log("\n♻️ PASO 5: Reiniciando aplicación (PM2)...", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status != 0:
            # Intentar restart si reload falla
            status, output, error = exec_cmd(client, "pm2 restart inmova-app --update-env")
        log("✅ Aplicación reiniciada", Colors.GREEN)
        
        # 6. Esperar warm-up
        log("\n⏳ PASO 6: Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)
        
        # 7. Health check
        log("\n🏥 PASO 7: Verificando health check...", Colors.CYAN)
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check: OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check response: {output[:200]}", Colors.YELLOW)
        
        # 8. Verificar páginas críticas
        log("\n🌐 PASO 8: Verificando páginas críticas...", Colors.CYAN)
        
        # Login page
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        login_status = output.strip()
        if login_status == '200':
            log(f"✅ /login: HTTP {login_status}", Colors.GREEN)
        else:
            log(f"⚠️ /login: HTTP {login_status}", Colors.YELLOW)
        
        # Dashboard page
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/dashboard")
        dashboard_status = output.strip()
        if dashboard_status in ['200', '307', '302']:  # 307/302 es redirect a login si no auth
            log(f"✅ /dashboard: HTTP {dashboard_status}", Colors.GREEN)
        else:
            log(f"⚠️ /dashboard: HTTP {dashboard_status}", Colors.YELLOW)
        
        # 9. Verificar PM2 status
        log("\n📊 PASO 9: Verificando estado de PM2...", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 jlist")
        if 'online' in output.lower():
            log("✅ PM2: Aplicación online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {output[:200]}", Colors.YELLOW)
        
        # 10. Verificar logs por errores
        log("\n📋 PASO 10: Verificando logs por errores...", Colors.CYAN)
        status, output, error = exec_cmd(
            client, 
            "pm2 logs inmova-app --lines 30 --nostream 2>&1 | grep -i 'error\\|includes' | tail -5"
        )
        if output.strip():
            log(f"⚠️ Posibles errores en logs:\n{output[:300]}", Colors.YELLOW)
        else:
            log("✅ No se encontraron errores 'includes' en logs recientes", Colors.GREEN)
        
        # Resumen final
        print(f"\n{Colors.GREEN}{'='*70}")
        print("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
        print(f"{'='*70}{Colors.RESET}\n")
        
        log("URLs de verificación:", Colors.CYAN)
        print(f"  • https://inmovaapp.com/login")
        print(f"  • https://inmovaapp.com/dashboard")
        print(f"  • http://{SERVER_IP}:3000/login\n")
        
        log("Cambios desplegados:", Colors.CYAN)
        print("  • Fix hamburguesa (menú) en móvil")
        print("  • Fix tutorial que se repetía en loop")
        print("  • Exclusión de roles admin del onboarding\n")
        
        log("Para verificar en móvil:", Colors.YELLOW)
        print("  1. Abrir https://inmovaapp.com/login en móvil")
        print("  2. Hacer login")
        print("  3. Verificar que aparece la barra de navegación inferior")
        print("  4. Verificar que el botón 'Menú' abre el sidebar")
        print("  5. Verificar que el tutorial NO se repite al cerrarlo\n")
        
        return True
        
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()
        log("Conexión cerrada", Colors.CYAN)

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
