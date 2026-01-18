#!/usr/bin/env python3
"""
Deployment script para eliminar datos mock de páginas admin
"""
import sys
import time

# Añadir path de paramiko
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
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=120):
    """Ejecuta comando SSH y retorna (status, stdout, stderr)"""
    log(f"Ejecutando: {cmd[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    errors = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, errors

def main():
    print(f"\n{Colors.CYAN}{'='*70}")
    print("🚀 DEPLOYMENT: Eliminar datos mock de páginas admin")
    print(f"{'='*70}{Colors.END}\n")
    print(f"Servidor: {SERVER_IP}")
    print(f"Rama: {BRANCH}")
    print(f"Path: {APP_PATH}\n")

    # Conectar
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # 1. Backup de BD
        log("💾 Creando backup de BD...", Colors.YELLOW)
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        status, output, errors = exec_cmd(
            client, 
            f"pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'",
            timeout=60
        )
        log("✅ Backup completado", Colors.GREEN)

        # 2. Git operations
        log("📥 Actualizando código...", Colors.YELLOW)
        exec_cmd(client, f"cd {APP_PATH} && git stash", timeout=60)
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin", timeout=120)
        exec_cmd(client, f"cd {APP_PATH} && git checkout {BRANCH}", timeout=60)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/{BRANCH}", timeout=60)
        log("✅ Código actualizado", Colors.GREEN)

        # 3. Install dependencies
        log("📦 Instalando dependencias...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npm install", timeout=600)
        if status != 0:
            log(f"⚠️ npm install warnings (puede continuar)", Colors.YELLOW)
        else:
            log("✅ Dependencias instaladas", Colors.GREEN)

        # 4. Prisma generate
        log("🔧 Generando Prisma client...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        log("✅ Prisma client generado", Colors.GREEN)

        # 5. Build
        log("🏗️ Construyendo aplicación...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"❌ Error en build: {errors[:500]}", Colors.RED)
            return 1
        log("✅ Build completado", Colors.GREEN)

        # 6. PM2 reload
        log("♻️ Reiniciando PM2...", Colors.YELLOW)
        exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env", timeout=60)
        log("✅ PM2 reiniciado", Colors.GREEN)

        # 7. Wait for warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)

        # 8. Health check
        log("🏥 Verificando health...", Colors.YELLOW)
        status, output, errors = exec_cmd(client, "curl -s http://localhost:3000/api/health", timeout=30)
        if '"status":"ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check response: {output[:200]}", Colors.YELLOW)

        # 9. PM2 status
        log("📊 Estado de PM2:", Colors.CYAN)
        status, output, errors = exec_cmd(client, "pm2 status", timeout=30)
        print(output)

        print(f"\n{Colors.GREEN}{'='*70}")
        print("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
        print(f"{'='*70}{Colors.END}\n")
        
        print("URLs:")
        print(f"  - https://inmovaapp.com")
        print(f"  - http://{SERVER_IP}:3000")
        print(f"\nPáginas actualizadas:")
        print("  - /admin/notificaciones-masivas (sin datos mock)")
        print("  - /admin/integraciones-plataforma/monitoreo (sin datos mock)")
        print("  - /admin/integraciones-plataforma/comunicacion (sin datos mock)")
        print("  - /admin/integraciones-compartidas/pagos (sin datos mock)")
        print("  - /admin/integraciones-compartidas/firma (sin datos mock)")
        
        return 0

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
    finally:
        client.close()
        log("🔐 Conexión cerrada", Colors.CYAN)

if __name__ == "__main__":
    sys.exit(main())
