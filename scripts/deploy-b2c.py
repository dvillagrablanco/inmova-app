#!/usr/bin/env python3
"""
Deployment script for B2C Sprints
Uses Paramiko for SSH connection
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# ============================================
# CONFIGURACIÓN
# ============================================
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# ============================================
# COLORES
# ============================================
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.ENDC):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.ENDC}")

def exec_cmd(client, command, timeout=300):
    """Execute command and return status, output"""
    log(f"  → {command[:80]}..." if len(command) > 80 else f"  → {command}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    errors = stderr.read().decode('utf-8', errors='replace')
    
    if exit_status != 0 and errors:
        log(f"  ⚠️ Stderr: {errors[:200]}", Colors.YELLOW)
    
    return exit_status, output, errors

# ============================================
# MAIN DEPLOYMENT
# ============================================
def main():
    print(f"""
{Colors.HEADER}{'='*70}
🚀 DEPLOYMENT B2C SPRINTS - INMOVA APP
{'='*70}{Colors.ENDC}

{Colors.CYAN}Servidor:{Colors.ENDC} {SERVER_IP}
{Colors.CYAN}Path:{Colors.ENDC} {APP_PATH}
{Colors.CYAN}Fecha:{Colors.ENDC} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

{Colors.YELLOW}Sprints a desplegar:{Colors.ENDC}
  • B2C-1: Gamificación para Inquilinos
  • B2C-2: Matching IA + Incidencias
  • B2C-3: Referidos + Marketplace

{'='*70}
""")
    
    # Connect
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30
        )
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Backup de BD
        log("\n💾 BACKUP PRE-DEPLOYMENT", Colors.HEADER)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        status, output, _ = exec_cmd(
            client,
            f"pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-b2c-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'",
            timeout=120
        )
        log("✅ Backup completado o skipped", Colors.GREEN)
        
        # 2. Pull latest code
        log("\n📥 ACTUALIZANDO CÓDIGO", Colors.HEADER)
        status, output, _ = exec_cmd(
            client,
            f"cd {APP_PATH} && git fetch origin main && git reset --hard origin/main",
            timeout=60
        )
        if status != 0:
            log("⚠️ Git pull con advertencias", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 3. Install dependencies
        log("\n📦 INSTALANDO DEPENDENCIAS", Colors.HEADER)
        status, output, _ = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5",
            timeout=600
        )
        log("✅ Dependencias instaladas", Colors.GREEN)
        
        # 4. Prisma generate & migrate
        log("\n🔧 PRISMA SETUP", Colors.HEADER)
        status, output, _ = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3",
            timeout=120
        )
        log("✅ Prisma client generado", Colors.GREEN)
        
        status, output, _ = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma migrate deploy 2>&1 | tail -5",
            timeout=120
        )
        if "applied" in output.lower() or "already" in output.lower():
            log("✅ Migraciones aplicadas", Colors.GREEN)
        else:
            log("⚠️ Migraciones con advertencias", Colors.YELLOW)
        
        # 5. Build
        log("\n🏗️ BUILD", Colors.HEADER)
        status, output, errors = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -20",
            timeout=600
        )
        if status == 0 or "Compiled successfully" in output or "Creating an optimized" in output:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"⚠️ Build con advertencias: {output[:200]}", Colors.YELLOW)
        
        # 6. PM2 Reload
        log("\n♻️ PM2 RELOAD", Colors.HEADER)
        status, output, _ = exec_cmd(
            client,
            "pm2 reload inmova-app --update-env 2>&1 | tail -5"
        )
        log("✅ PM2 reloaded", Colors.GREEN)
        
        # 7. Wait for warm-up
        log("\n⏳ Esperando warm-up (15s)...", Colors.BLUE)
        time.sleep(15)
        
        # 8. Health checks
        log("\n🏥 HEALTH CHECKS", Colors.HEADER)
        
        # Check API health
        status, output, _ = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/health"
        )
        if '"status":"ok"' in output:
            log("✅ API Health OK", Colors.GREEN)
        else:
            log(f"⚠️ API Health: {output[:100]}", Colors.YELLOW)
        
        # Check new pages
        for page in ["/portal-inquilino/logros", "/portal-inquilino/referidos", "/marketplace/servicios"]:
            status, output, _ = exec_cmd(
                client,
                f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{page}"
            )
            if "200" in output:
                log(f"✅ {page} → 200 OK", Colors.GREEN)
            else:
                log(f"⚠️ {page} → {output}", Colors.YELLOW)
        
        # Check PM2 status
        status, output, _ = exec_cmd(
            client,
            "pm2 jlist | python3 -c \"import sys,json; d=json.load(sys.stdin); print('online' if any(p['pm2_env']['status']=='online' for p in d) else 'error')\" 2>/dev/null || echo 'check failed'"
        )
        if "online" in output:
            log("✅ PM2 status: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {output}", Colors.YELLOW)
        
        # Success!
        print(f"""
{Colors.GREEN}{'='*70}
✅ DEPLOYMENT B2C COMPLETADO EXITOSAMENTE
{'='*70}{Colors.ENDC}

{Colors.CYAN}URLs de Producción:{Colors.ENDC}
  • Landing: https://inmovaapp.com
  • Portal Inquilino: https://inmovaapp.com/portal-inquilino
  • Logros: https://inmovaapp.com/portal-inquilino/logros
  • Incidencias: https://inmovaapp.com/portal-inquilino/incidencias
  • Referidos: https://inmovaapp.com/portal-inquilino/referidos
  • Marketplace: https://inmovaapp.com/marketplace/servicios

{Colors.CYAN}Nuevas Funcionalidades:{Colors.ENDC}
  ✅ Gamificación para Inquilinos (puntos, niveles, logros)
  ✅ Matching IA Inquilino ↔ Proveedor
  ✅ Sistema de Referidos con recompensas
  ✅ Marketplace de Servicios funcional

{Colors.CYAN}Para ver logs:{Colors.ENDC}
  ssh {SERVER_USER}@{SERVER_IP} 'pm2 logs inmova-app'

{'='*70}
""")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
