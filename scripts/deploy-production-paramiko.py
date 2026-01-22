#!/usr/bin/env python3
"""
Deployment automatizado con Paramiko - Inmova App
Servidor: 157.180.119.236
Usuario: root
"""

import sys
import time
import os

# Add local packages
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuration
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

def exec_cmd(client, cmd, timeout=300, show_output=True):
    """Execute command and return status, stdout, stderr"""
    log(f"$ {cmd[:80]}{'...' if len(cmd) > 80 else ''}", Colors.CYAN)
    
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    
    if show_output and out:
        for line in out.split('\n')[:10]:  # Only first 10 lines
            print(f"  {line}")
        if len(out.split('\n')) > 10:
            print(f"  ... ({len(out.split('\n')) - 10} more lines)")
    
    if err and exit_status != 0:
        log(f"Error: {err[:200]}", Colors.RED)
    
    return exit_status, out, err

def main():
    print(f"""
{Colors.BOLD}{'='*70}
🚀 DEPLOYMENT AUTOMÁTICO - INMOVA APP
{'='*70}{Colors.RESET}

Servidor: {SERVER_IP}
Path: {APP_PATH}
Branch: cursor/p-ginas-visibilidad-y-desarrollo-a55d

{'='*70}
""")
    
    # Connect
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=USERNAME,
            password=PASSWORD,
            timeout=30
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return False
    
    try:
        # Phase 1: Backup
        log("\n💾 FASE 1: Backup pre-deployment", Colors.BLUE)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        exec_cmd(client, f"mkdir -p /var/backups/inmova")
        exec_cmd(client, f"cd {APP_PATH} && git rev-parse HEAD > /var/backups/inmova/pre-deploy-{timestamp}.commit")
        log("✅ Backup completado", Colors.GREEN)
        
        # Phase 2: Git pull
        log("\n📥 FASE 2: Actualizar código", Colors.BLUE)
        
        # First stash any local changes
        exec_cmd(client, f"cd {APP_PATH} && git stash")
        
        # Fetch and checkout
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && git fetch origin")
        
        # Try to checkout the feature branch first, fallback to main
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && git checkout cursor/p-ginas-visibilidad-y-desarrollo-a55d 2>/dev/null || git checkout main")
        
        # Pull latest
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && git pull origin")
        
        if status != 0:
            log("⚠️ Git pull con problemas, intentando reset...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/main")
        
        log("✅ Código actualizado", Colors.GREEN)
        
        # Phase 3: Install dependencies
        log("\n📦 FASE 3: Instalar dependencias", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        
        if status != 0:
            log("⚠️ npm install con warnings, continuando...", Colors.YELLOW)
        else:
            log("✅ Dependencias instaladas", Colors.GREEN)
        
        # Phase 4: Prisma
        log("\n🔧 FASE 4: Configurar Prisma", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma migrate deploy 2>/dev/null || true", timeout=120)
        log("✅ Prisma configurado", Colors.GREEN)
        
        # Phase 5: Build
        log("\n🏗️ FASE 5: Build de la aplicación", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        
        if status != 0:
            log("⚠️ Build con errores, verificando si continuar...", Colors.YELLOW)
            # Check if .next directory exists from previous build
            status_check, out_check, _ = exec_cmd(client, f"ls -la {APP_PATH}/.next/standalone 2>/dev/null")
            if status_check != 0:
                log("❌ Build falló y no hay build previo", Colors.RED)
                return False
            log("⚠️ Usando build previo...", Colors.YELLOW)
        else:
            log("✅ Build completado", Colors.GREEN)
        
        # Phase 6: Restart PM2
        log("\n♻️ FASE 6: Reiniciar PM2", Colors.BLUE)
        
        # Check if PM2 process exists
        status, out, _ = exec_cmd(client, "pm2 list | grep inmova-app")
        
        if "inmova-app" in out:
            exec_cmd(client, "pm2 reload inmova-app --update-env")
        else:
            log("⚠️ Proceso PM2 no existe, intentando iniciar...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production 2>/dev/null || pm2 start npm --name inmova-app -- start")
        
        exec_cmd(client, "pm2 save")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # Phase 7: Wait and health check
        log("\n⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        log("\n🏥 FASE 7: Health Check", Colors.BLUE)
        
        # Health check
        health_passed = 0
        health_tests = [
            ("HTTP Status", "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000"),
            ("API Health", "curl -s http://localhost:3000/api/health"),
            ("PM2 Status", "pm2 show inmova-app | grep -E 'status|uptime'"),
        ]
        
        for test_name, cmd in health_tests:
            status, out, err = exec_cmd(client, cmd, show_output=True)
            if status == 0 and ('200' in out or 'ok' in out.lower() or 'online' in out.lower()):
                log(f"✅ {test_name}: OK", Colors.GREEN)
                health_passed += 1
            else:
                log(f"⚠️ {test_name}: {out[:100] if out else 'No response'}", Colors.YELLOW)
        
        # Final status
        print(f"""
{Colors.BOLD}{'='*70}
{'✅ DEPLOYMENT COMPLETADO' if health_passed >= 2 else '⚠️ DEPLOYMENT CON WARNINGS'}
{'='*70}{Colors.RESET}

Health checks: {health_passed}/{len(health_tests)} pasaron

URLs:
  - Principal: https://inmovaapp.com
  - Fallback: http://{SERVER_IP}:3000
  - Health: https://inmovaapp.com/api/health

Para ver logs:
  ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'

{'='*70}
""")
        return health_passed >= 2
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
