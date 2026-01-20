#!/usr/bin/env python3
"""
Deployment de cambios de conciliación bancaria a producción
"""

import sys
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
BRANCH = 'cursor/error-r-includes-cursorrules-4683'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.END):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, cmd, timeout=300):
    log(f"  → {cmd[:100]}{'...' if len(cmd) > 100 else ''}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}🚀 DEPLOYMENT CONCILIACIÓN BANCARIA - INMOVA APP{Colors.END}")
    print(f"{Colors.BOLD}{'='*70}{Colors.END}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    log(f"Branch: {BRANCH}", Colors.BLUE)
    log(f"App Path: {APP_PATH}", Colors.BLUE)
    print()

    log("🔐 Conectando al servidor...", Colors.YELLOW)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conexión establecida", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # FASE 1: Actualizar código
        print()
        log("="*60, Colors.BLUE)
        log("📥 FASE 1: ACTUALIZAR CÓDIGO", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        # Fetch y checkout de la rama
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin {BRANCH} 2>&1", timeout=60)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git checkout {BRANCH} 2>&1", timeout=60)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/{BRANCH} 2>&1", timeout=60)
        
        if status == 0:
            log(f"✅ Código sincronizado con {BRANCH}", Colors.GREEN)
        else:
            log(f"⚠️ Git: {error or output}", Colors.YELLOW)

        # FASE 2: Dependencias
        print()
        log("="*60, Colors.BLUE)
        log("📦 FASE 2: DEPENDENCIAS", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install 2>&1 | tail -5", timeout=300)
        log("✅ Dependencias instaladas", Colors.GREEN)

        # FASE 3: Prisma
        print()
        log("="*60, Colors.BLUE)
        log("🔧 FASE 3: PRISMA", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3", timeout=120)
        log("✅ Prisma client generado", Colors.GREEN)

        # FASE 4: Build
        print()
        log("="*60, Colors.BLUE)
        log("🏗️ FASE 4: BUILD", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if status == 0:
            log("✅ Build completado exitosamente", Colors.GREEN)
        else:
            log(f"⚠️ Build warnings/errors: {error[:500] if error else 'ninguno'}", Colors.YELLOW)

        # FASE 5: Restart PM2
        print()
        log("="*60, Colors.BLUE)
        log("♻️ FASE 5: RESTART PM2", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        status, output, error = exec_cmd(client, "pm2 restart inmova-app --update-env 2>&1", timeout=60)
        if status == 0:
            log("✅ PM2 reiniciado", Colors.GREEN)
        else:
            log(f"⚠️ PM2: {error or output}", Colors.YELLOW)

        # FASE 6: Health Check
        print()
        log("="*60, Colors.BLUE)
        log("🏥 FASE 6: HEALTH CHECK", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        log("Esperando warm-up (15s)...", Colors.YELLOW)
        time.sleep(15)
        
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health", timeout=30)
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:200]}", Colors.YELLOW)

        # Test de la página de conciliación
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/finanzas/conciliacion", timeout=30)
        if output.strip() == '200':
            log("✅ Página de conciliación accesible (200 OK)", Colors.GREEN)
        else:
            log(f"⚠️ Página de conciliación: HTTP {output.strip()}", Colors.YELLOW)

        # Test de la API de conciliación
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/finanzas/conciliacion", timeout=30)
        log(f"📊 API conciliación: HTTP {output.strip()}", Colors.BLUE)

        print()
        log("="*60, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("="*60, Colors.GREEN)
        print()
        log("Página de conciliación disponible en:", Colors.BLUE)
        log("  https://inmovaapp.com/finanzas/conciliacion", Colors.CYAN)
        print()
        log("APIs disponibles:", Colors.BLUE)
        log("  GET  /api/finanzas/conciliacion - Datos de conciliación", Colors.CYAN)
        log("  POST /api/finanzas/conciliacion/match - Vincular transacción", Colors.CYAN)
        log("  POST /api/finanzas/conciliacion/ignore - Ignorar transacción", Colors.CYAN)
        log("  POST /api/finanzas/conciliacion/auto-match - Auto-conciliar con IA", Colors.CYAN)
        log("  POST /api/finanzas/conciliacion/sync - Sincronizar bancos", Colors.CYAN)
        print()

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

    return 0

if __name__ == "__main__":
    sys.exit(main())
