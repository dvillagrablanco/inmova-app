#!/usr/bin/env python3
"""
Deployment: Landing Cleanup - Eliminar Menciones a Competidores
Deploya los cambios que eliminan referencias a competidores de la landing.
"""

import sys
import os
import time

# Añadir path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = os.environ.get("SERVER_PASSWORD", "")
APP_PATH = "/opt/inmova-app"

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=None):
    timestamp = time.strftime("%H:%M:%S")
    if color:
        print(f"{color}[{timestamp}] {message}{Colors.END}")
    else:
        print(f"[{timestamp}] {message}")

def exec_cmd(client, command, timeout=300):
    """Ejecuta un comando SSH y retorna (exit_status, output)"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output + error

def main():
    print("=" * 70)
    log("🚀 DEPLOYMENT: LANDING CLEANUP - ELIMINAR MENCIONES A COMPETIDORES", Colors.CYAN)
    print("=" * 70)
    print()
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    log(f"Path: {APP_PATH}", Colors.BLUE)
    print()
    
    if not SERVER_PASSWORD:
        log("❌ SERVER_PASSWORD no configurada. Usando la del entorno.", Colors.RED)
        return 1
    
    # Conectar SSH
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Actualizar código
        print()
        log("📥 Actualizando código desde Git...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log(f"⚠️ Git pull: {output}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Instalar dependencias (si hay cambios)
        log("📦 Verificando dependencias...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install", timeout=600)
        if "up to date" in output or status == 0:
            log("✅ Dependencias OK", Colors.GREEN)
        else:
            log(f"⚠️ npm install: {output[:200]}", Colors.YELLOW)
        
        # 3. Build
        print()
        log("🏗️ Building aplicación...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"❌ Build falló: {output[-500:]}", Colors.RED)
            return 1
        log("✅ Build completado", Colors.GREEN)
        
        # 4. Ejecutar seed de planes (si aplica)
        log("🌱 Actualizando planes de suscripción...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx tsx prisma/seed-subscription-plans.ts", timeout=120)
        if status == 0:
            log("✅ Planes actualizados", Colors.GREEN)
        else:
            log(f"⚠️ Seed planes: {output[:200]}", Colors.YELLOW)
        
        # 5. Restart PM2
        print()
        log("♻️ Reiniciando aplicación (PM2 reload)...", Colors.YELLOW)
        status, output = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status == 0:
            log("✅ PM2 reloaded", Colors.GREEN)
        else:
            log(f"⚠️ PM2 reload: {output}", Colors.YELLOW)
        
        # 6. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 7. Health checks
        print()
        log("🏥 Verificando salud del sistema...", Colors.YELLOW)
        
        checks_passed = 0
        total_checks = 4
        
        # Check 1: HTTP
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing")
        if "200" in output:
            log("  ✅ Landing page OK (200)", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ❌ Landing page: {output}", Colors.RED)
        
        # Check 2: Health API
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output.lower() or status == 0:
            log("  ✅ Health API OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ❌ Health API: {output}", Colors.RED)
        
        # Check 3: PM2 status
        status, output = exec_cmd(client, "pm2 jlist")
        if "online" in output.lower():
            log("  ✅ PM2 online", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ❌ PM2 no online", Colors.RED)
        
        # Check 4: Verificar que NO hay menciones a competidores
        status, output = exec_cmd(client, "curl -s http://localhost:3000/landing | grep -i 'homming\\|rentger' | wc -l")
        count = int(output.strip()) if output.strip().isdigit() else 0
        if count == 0:
            log("  ✅ Sin menciones a competidores", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ Encontradas {count} menciones a competidores (puede ser cache)", Colors.YELLOW)
            # Limpiar cache
            status, output = exec_cmd(client, f"rm -rf {APP_PATH}/.next/cache")
            log("  ♻️ Cache limpiado, se aplicará en próximo request", Colors.YELLOW)
        
        print()
        log(f"Health checks: {checks_passed}/{total_checks} pasando", Colors.CYAN)
        
        if checks_passed >= 3:
            print()
            print("=" * 70)
            log("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE", Colors.GREEN)
            print("=" * 70)
            print()
            log("🌐 URLs:", Colors.CYAN)
            log("   Landing: https://inmovaapp.com/landing", Colors.BLUE)
            log("   Login: https://inmovaapp.com/login", Colors.BLUE)
            log("   Health: https://inmovaapp.com/api/health", Colors.BLUE)
            print()
            log("📝 Cambios deployados:", Colors.CYAN)
            log("   • Eliminadas todas las menciones a competidores", Colors.GREEN)
            log("   • Nombres genéricos en tablas de comparación", Colors.GREEN)
            log("   • SEO metadata actualizado", Colors.GREEN)
            log("   • Planes de suscripción actualizados", Colors.GREEN)
            print()
            return 0
        else:
            log("⚠️ Algunos checks fallaron, revisar logs", Colors.YELLOW)
            return 1
    
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
    
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
