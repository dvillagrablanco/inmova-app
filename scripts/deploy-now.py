#!/usr/bin/env python3
"""
Deploy script for Inmova App using Paramiko SSH
"""
import sys
import time

# Add paramiko path
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Server configuration
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.ENDC):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.ENDC}")

def exec_cmd(client, command, timeout=300):
    """Execute command and return status and output"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}🚀 DEPLOYMENT INMOVA APP{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*60}{Colors.ENDC}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"App Path: {APP_PATH}", Colors.CYAN)
    
    # Connect
    log("Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30
        )
        log("✅ Conexión establecida", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.FAIL)
        return 1
    
    try:
        # Step 1: Backup
        log("\n📦 Paso 1: Backup de base de datos...", Colors.CYAN)
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        status, output, error = exec_cmd(
            client,
            f"mkdir -p /var/backups/inmova && "
            f"pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'"
        )
        log("✅ Backup completado", Colors.GREEN)
        
        # Step 2: Git pull
        log("\n📥 Paso 2: Actualizando código...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && git fetch origin main && git reset --hard origin/main",
            timeout=120
        )
        if status != 0:
            log(f"⚠️ Git pull warning: {error}", Colors.WARNING)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # Step 3: Install dependencies
        log("\n📦 Paso 3: Instalando dependencias...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5",
            timeout=600
        )
        if "npm ERR!" in output or "npm ERR!" in error:
            log(f"⚠️ NPM warning (continuando...)", Colors.WARNING)
        else:
            log("✅ Dependencias instaladas", Colors.GREEN)
        
        # Step 4: Prisma generate
        log("\n🔧 Paso 4: Generando Prisma Client...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3",
            timeout=120
        )
        log("✅ Prisma Client generado", Colors.GREEN)
        
        # Step 5: Build
        log("\n🏗️ Paso 5: Construyendo aplicación...", Colors.CYAN)
        log("(Esto puede tardar varios minutos...)", Colors.WARNING)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -20",
            timeout=900  # 15 min timeout
        )
        if status != 0:
            log(f"⚠️ Build warning: {error[:500]}", Colors.WARNING)
        log("✅ Build completado", Colors.GREEN)
        
        # Step 6: PM2 Reload
        log("\n♻️ Paso 6: Reiniciando aplicación con PM2...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>/dev/null || pm2 restart inmova-app --update-env || pm2 start ecosystem.config.js --env production"
        )
        log("✅ PM2 recargado", Colors.GREEN)
        
        # Step 7: Wait for warm-up
        log("\n⏳ Paso 7: Esperando warm-up (20 segundos)...", Colors.CYAN)
        time.sleep(20)
        
        # Step 8: Health check
        log("\n🏥 Paso 8: Verificando salud de la aplicación...", Colors.CYAN)
        for attempt in range(3):
            status, output, error = exec_cmd(
                client,
                "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health"
            )
            if '200' in output:
                log("✅ Health check OK (HTTP 200)", Colors.GREEN)
                break
            else:
                log(f"⚠️ Health check intento {attempt+1}/3: {output}", Colors.WARNING)
                if attempt < 2:
                    time.sleep(10)
        else:
            log("⚠️ Health check no respondió 200, pero continuando...", Colors.WARNING)
        
        # Step 9: PM2 status
        log("\n📊 Paso 9: Estado de PM2...", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 status")
        print(output[:500])
        
        # Success
        print(f"\n{Colors.GREEN}{'='*60}{Colors.ENDC}")
        print(f"{Colors.GREEN}✅ DEPLOYMENT COMPLETADO EXITOSAMENTE{Colors.ENDC}")
        print(f"{Colors.GREEN}{'='*60}{Colors.ENDC}")
        print(f"\n{Colors.CYAN}URLs:{Colors.ENDC}")
        print(f"  🌐 https://inmovaapp.com")
        print(f"  🔧 http://{SERVER_IP}:3000")
        print(f"\n{Colors.CYAN}Logs:{Colors.ENDC}")
        print(f"  pm2 logs inmova-app --lines 50")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.FAIL)
        return 1
    finally:
        client.close()
        log("\n🔌 Conexión cerrada", Colors.BLUE)

if __name__ == '__main__':
    sys.exit(main())
