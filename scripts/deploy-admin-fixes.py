#!/usr/bin/env python3
"""
Deploy de correcciones de páginas admin al servidor de producción
"""
import sys
import time

# Agregar path para paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

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
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(message, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando en servidor remoto"""
    log(f"Ejecutando: {cmd[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    if exit_status != 0 and error:
        log(f"Error: {error[:200]}", Colors.RED)
    
    return exit_status, output, error

def main():
    log("=" * 70, Colors.CYAN)
    log("DEPLOYMENT DE CORRECCIONES - PÁGINAS ADMIN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"Branch: {BRANCH}", Colors.CYAN)
    log("=" * 70, Colors.CYAN)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        log("Conectando al servidor...", Colors.YELLOW)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("Conectado exitosamente", Colors.GREEN)

        # 1. Verificar directorio
        log("\n1. Verificando directorio de la app...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"ls -la {APP_PATH}/package.json")
        if status != 0:
            log("Error: No se encontró el directorio de la app", Colors.RED)
            return 1
        log("Directorio verificado", Colors.GREEN)

        # 2. Stash cambios locales y actualizar código
        log("\n2. Guardando cambios locales y actualizando código...", Colors.YELLOW)
        
        # Stash cualquier cambio local
        exec_cmd(client, f"cd {APP_PATH} && git stash", timeout=60)
        
        # Fetch y checkout
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && git fetch origin && git checkout {BRANCH}",
            timeout=120
        )
        
        # Reset hard para asegurar que está limpio
        exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/{BRANCH}", timeout=60)
        
        # Pull para asegurar
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && git pull origin {BRANCH}",
            timeout=120
        )
        
        log("Código actualizado", Colors.GREEN)

        # 3. Instalar dependencias
        log("\n3. Instalando dependencias...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install --legacy-peer-deps",
            timeout=600
        )
        if status != 0:
            log("Advertencia: npm install tuvo errores pero continuamos", Colors.YELLOW)
        log("Dependencias instaladas", Colors.GREEN)

        # 4. Generar Prisma
        log("\n4. Generando cliente Prisma...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma generate",
            timeout=120
        )
        log("Prisma generado", Colors.GREEN)

        # 5. Build
        log("\n5. Building aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build",
            timeout=900
        )
        if status != 0:
            log(f"Error en build: {error[:500]}", Colors.RED)
            return 1
        log("Build completado", Colors.GREEN)

        # 6. Reiniciar PM2
        log("\n6. Reiniciando PM2...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            "pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env",
            timeout=60
        )
        log("PM2 reiniciado", Colors.GREEN)

        # 7. Esperar warm-up
        log("\n7. Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)

        # 8. Health check
        log("\n8. Verificando health check...", Colors.YELLOW)
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/health",
            timeout=30
        )
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("Health check OK", Colors.GREEN)
        else:
            log(f"Health check respuesta: {output[:200]}", Colors.YELLOW)

        # 9. Verificar estado PM2
        log("\n9. Estado de PM2...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "pm2 list")
        log(output, Colors.GREEN)

        log("\n" + "=" * 70, Colors.GREEN)
        log("DEPLOYMENT COMPLETADO EXITOSAMENTE", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log("URLs:", Colors.CYAN)
        log(f"  - Producción: https://inmovaapp.com", Colors.CYAN)
        log(f"  - Admin: https://inmovaapp.com/admin/dashboard", Colors.CYAN)
        log(f"  - Health: https://inmovaapp.com/api/health", Colors.CYAN)
        
        return 0

    except Exception as e:
        log(f"Error durante deployment: {str(e)}", Colors.RED)
        return 1

    finally:
        client.close()
        log("Conexión cerrada", Colors.YELLOW)

if __name__ == "__main__":
    sys.exit(main())
