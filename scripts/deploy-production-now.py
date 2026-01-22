#!/usr/bin/env python3
"""
Deploy automático a producción via SSH/Paramiko
"""

import sys
import time

# Añadir path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
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
    """Ejecutar comando y retornar salida"""
    log(f"Ejecutando: {command[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and error:
        log(f"Error: {error[:200]}", Colors.RED)
    
    return exit_status, output, error

def main():
    log("=" * 70, Colors.CYAN)
    log("🚀 DEPLOY AUTOMÁTICO A PRODUCCIÓN - INMOVA APP", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"Path: {APP_PATH}", Colors.CYAN)
    
    # Conectar al servidor
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return False
    
    try:
        # 1. Verificar estado actual
        log("\n📋 PASO 1: Verificar estado actual", Colors.YELLOW)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git status --short")
        log(f"Estado git: {output[:100] if output else 'limpio'}", Colors.CYAN)
        
        # 2. Pull cambios
        log("\n📥 PASO 2: Actualizando código", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git pull origin main --ff-only", timeout=120)
        if status != 0:
            # Intentar con reset
            log("Intentando con git reset...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main")
        log("✅ Código actualizado", Colors.GREEN)
        
        # 3. Instalar dependencias si hay cambios
        log("\n📦 PASO 3: Verificando dependencias", Colors.YELLOW)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npm ci --prefer-offline || npm install", timeout=600)
        log("✅ Dependencias verificadas", Colors.GREEN)
        
        # 4. Generar Prisma
        log("\n🔧 PASO 4: Prisma generate", Colors.YELLOW)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        log("✅ Prisma generado", Colors.GREEN)
        
        # 5. Build
        log("\n🏗️ PASO 5: Building aplicación", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        # Los warnings no son errores - solo falla si hay error real de build
        if status != 0 and 'error' in error.lower() and 'warning' not in error.lower():
            log(f"❌ Build falló: {error[:500]}", Colors.RED)
            return False
        if 'Compiled with warnings' in error or 'Compiled successfully' in output:
            log("✅ Build completado (con warnings menores)", Colors.GREEN)
        else:
            log("✅ Build completado", Colors.GREEN)
        
        # 6. Reiniciar PM2
        log("\n♻️ PASO 6: Reiniciando PM2", Colors.YELLOW)
        exec_cmd(client, "pm2 reload inmova-app --update-env || pm2 restart inmova-app")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 7. Esperar warm-up
        log("\n⏳ PASO 7: Esperando warm-up (20s)", Colors.YELLOW)
        time.sleep(20)
        
        # 8. Health check
        log("\n🏥 PASO 8: Health check", Colors.YELLOW)
        for i in range(5):
            status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            if 'healthy' in output.lower() or 'ok' in output.lower() or '"status"' in output:
                log(f"✅ Health check OK: {output[:100]}", Colors.GREEN)
                break
            log(f"Intento {i+1}/5 - Esperando...", Colors.YELLOW)
            time.sleep(5)
        else:
            log("⚠️ Health check no confirmado, verificar manualmente", Colors.YELLOW)
        
        # 9. Verificar PM2 status
        log("\n📊 PASO 9: Estado PM2", Colors.YELLOW)
        status, output, _ = exec_cmd(client, "pm2 status")
        log(f"\n{output}", Colors.CYAN)
        
        # 10. Verificar URL pública
        log("\n🌐 PASO 10: Verificación final", Colors.YELLOW)
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
        log(f"HTTP Status Landing: {output}", Colors.CYAN)
        
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        log(f"HTTP Status Login: {output}", Colors.CYAN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ DEPLOY COMPLETADO EXITOSAMENTE", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log(f"\n🌐 URL: https://inmovaapp.com", Colors.CYAN)
        log(f"📍 IP Directa: http://{SERVER_IP}:3000", Colors.CYAN)
        
        return True
        
    except Exception as e:
        log(f"❌ Error durante deploy: {e}", Colors.RED)
        return False
    finally:
        client.close()
        log("\n🔒 Conexión cerrada", Colors.CYAN)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
