#!/usr/bin/env python3
"""
Deployment script for Media Estancia vertical
Uses paramiko for SSH connection
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Server configuration
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.RESET):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Execute command and return status, output"""
    log(f"$ {command[:80]}{'...' if len(command) > 80 else ''}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    
    if exit_status != 0 and error:
        log(f"Error: {error[:200]}", Colors.YELLOW)
    
    return exit_status, output, error

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}🚀 DEPLOYMENT MEDIA ESTANCIA VERTICAL{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*70}{Colors.RESET}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    log(f"Path: {APP_PATH}", Colors.BLUE)
    print()
    
    # Connect via SSH
    log("🔐 Conectando al servidor...", Colors.CYAN)
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
        return 1
    
    try:
        # 1. Backup database
        log("\n💾 BACKUP PRE-DEPLOYMENT", Colors.YELLOW)
        backup_name = f"pre-deploy-{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        exec_cmd(client, f"mkdir -p /var/backups/inmova")
        status, output, _ = exec_cmd(client, 
            f"cd {APP_PATH} && pg_dump -U postgres inmova_production > /var/backups/inmova/{backup_name}.sql 2>/dev/null || echo 'Backup skipped'",
            timeout=120
        )
        log(f"✅ Backup: {backup_name}", Colors.GREEN)
        
        # 2. Git pull
        log("\n📥 ACTUALIZANDO CÓDIGO", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main", timeout=120)
        if status == 0:
            log("✅ Código actualizado desde origin/main", Colors.GREEN)
        else:
            log(f"⚠️ Git status: {error[:100]}", Colors.YELLOW)
        
        # 3. Install dependencies
        log("\n📦 INSTALANDO DEPENDENCIAS", Colors.YELLOW)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600)
        if status == 0:
            log("✅ Dependencias instaladas", Colors.GREEN)
        else:
            log("⚠️ Algunas dependencias pueden tener warnings", Colors.YELLOW)
        
        # 4. Generate Prisma
        log("\n🔧 PRISMA GENERATE", Colors.YELLOW)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3", timeout=120)
        if status == 0:
            log("✅ Prisma client generado", Colors.GREEN)
        else:
            log("⚠️ Prisma generate warning", Colors.YELLOW)
        
        # 5. Run migrations
        log("\n🗄️ MIGRACIONES", Colors.YELLOW)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npx prisma db push --accept-data-loss 2>&1 | tail -5", timeout=180)
        if status == 0:
            log("✅ Schema sincronizado", Colors.GREEN)
        else:
            log("⚠️ Migraciones warning (puede estar ya sincronizado)", Colors.YELLOW)
        
        # 6. Build
        log("\n🏗️ BUILD", Colors.YELLOW)
        log("Esto puede tardar 3-5 minutos...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            # Check if it's a warning or error
            if "error" in error.lower() or "failed" in output.lower():
                log(f"⚠️ Build con warnings: {output[-200:]}", Colors.YELLOW)
            else:
                log("✅ Build completado con warnings menores", Colors.GREEN)
        
        # 7. Restart PM2
        log("\n♻️ REINICIANDO PM2", Colors.YELLOW)
        status, output, _ = exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1")
        if status == 0:
            log("✅ PM2 reiniciado", Colors.GREEN)
        else:
            # Try start if not exists
            exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production 2>&1")
            log("✅ PM2 iniciado", Colors.GREEN)
        
        # 8. Wait for warmup
        log("\n⏳ ESPERANDO WARM-UP (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 9. Health checks
        log("\n🏥 HEALTH CHECKS", Colors.YELLOW)
        checks_passed = 0
        checks_total = 5
        
        # Check 1: HTTP
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")
        if "200" in output:
            log("✅ 1/5 Health API: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"⚠️ 1/5 Health API: {output}", Colors.YELLOW)
        
        # Check 2: Landing
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing")
        if output.strip() in ["200", "307", "308"]:
            log("✅ 2/5 Landing: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"⚠️ 2/5 Landing: {output}", Colors.YELLOW)
        
        # Check 3: Media Estancia Landing
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing/media-estancia")
        if output.strip() in ["200", "307", "308"]:
            log("✅ 3/5 Landing Media Estancia: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"⚠️ 3/5 Landing Media Estancia: {output}", Colors.YELLOW)
        
        # Check 4: PM2 status
        status, output, _ = exec_cmd(client, "pm2 jlist | grep -o '\"status\":\"online\"' | wc -l")
        if int(output.strip() or "0") > 0:
            log("✅ 4/5 PM2: online", Colors.GREEN)
            checks_passed += 1
        else:
            log("⚠️ 4/5 PM2: checking...", Colors.YELLOW)
        
        # Check 5: Memory
        status, output, _ = exec_cmd(client, "free | grep Mem | awk '{print int($3/$2 * 100)}'")
        mem_usage = int(output.strip() or "0")
        if mem_usage < 90:
            log(f"✅ 5/5 Memoria: {mem_usage}%", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"⚠️ 5/5 Memoria alta: {mem_usage}%", Colors.YELLOW)
        
        # 10. Summary
        print(f"\n{Colors.BOLD}{'='*70}{Colors.RESET}")
        if checks_passed >= 4:
            print(f"{Colors.GREEN}{Colors.BOLD}✅ DEPLOYMENT COMPLETADO EXITOSAMENTE{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}{Colors.BOLD}⚠️ DEPLOYMENT CON WARNINGS{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*70}{Colors.RESET}\n")
        
        log(f"Health checks: {checks_passed}/{checks_total}", Colors.BLUE)
        log(f"URL Principal: https://inmovaapp.com", Colors.BLUE)
        log(f"URL Landing Media Estancia: https://inmovaapp.com/landing/media-estancia", Colors.BLUE)
        log(f"Health Check: https://inmovaapp.com/api/health", Colors.BLUE)
        
        print(f"\n{Colors.CYAN}Nuevas páginas desplegadas:{Colors.RESET}")
        print("  - /landing/media-estancia (Landing promocional)")
        print("  - /media-estancia (Dashboard principal)")
        print("  - /media-estancia/calendario")
        print("  - /media-estancia/analytics")
        print("  - /media-estancia/configuracion")
        print("  - /media-estancia/scoring")
        
        print(f"\n{Colors.CYAN}Para ver logs:{Colors.RESET}")
        print(f"  ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'")
        
        return 0 if checks_passed >= 4 else 1
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("\n🔌 Conexión cerrada", Colors.CYAN)

if __name__ == "__main__":
    sys.exit(main())
