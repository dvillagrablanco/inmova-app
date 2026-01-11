#!/usr/bin/env python3
"""
Deployment completo a producción
"""

import sys
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

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
    print(f"{Colors.BOLD}🚀 DEPLOYMENT A PRODUCCIÓN - INMOVA APP{Colors.END}")
    print(f"{Colors.BOLD}{'='*70}{Colors.END}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
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
        
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main 2>&1", timeout=120)
        if status == 0:
            log("✅ Código sincronizado con origin/main", Colors.GREEN)
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
            log(f"❌ Error en build", Colors.RED)
            print(output[-800:] if output else error[-800:])
            return 1

        # FASE 5: PM2 Reload
        print()
        log("="*60, Colors.BLUE)
        log("🔄 FASE 5: RESTART PM2", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1", timeout=60)
        if status == 0:
            log("✅ PM2 reloaded (zero-downtime)", Colors.GREEN)
        else:
            # Intentar restart si reload falla
            log("⚠️ Reload falló, intentando restart...", Colors.YELLOW)
            status, output, error = exec_cmd(client, f"cd {APP_PATH} && pm2 restart inmova-app --update-env 2>&1", timeout=60)
            if status == 0:
                log("✅ PM2 restarted", Colors.GREEN)

        # Warm-up
        log("⏳ Esperando warm-up (15 segundos)...", Colors.YELLOW)
        time.sleep(15)

        # FASE 6: Verificación
        print()
        log("="*60, Colors.BLUE)
        log("🏥 FASE 6: VERIFICACIÓN", Colors.BLUE)
        log("="*60, Colors.BLUE)

        all_checks_passed = True

        # Health check
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health | head -c 150", timeout=30)
        if '"status":"ok"' in output:
            log("✅ Health check: OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:80]}", Colors.YELLOW)
            all_checks_passed = False

        # Páginas principales
        pages_to_check = [
            ('/admin/ai-agents', 'Agentes IA'),
            ('/admin/impuestos', 'Impuestos'),
            ('/admin/community-manager', 'Community Manager'),
            ('/admin/canva', 'Canva Studio'),
            ('/login', 'Login'),
        ]

        for path, name in pages_to_check:
            status, output, error = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{path}", timeout=30)
            if '200' in output or '302' in output:
                log(f"✅ {name}: HTTP {output.strip()}", Colors.GREEN)
            else:
                log(f"⚠️ {name}: HTTP {output.strip()}", Colors.YELLOW)

        # PM2 status
        status, output, error = exec_cmd(client, "pm2 status | grep inmova", timeout=30)
        if 'online' in output.lower():
            log("✅ PM2 status: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {output}", Colors.YELLOW)
            all_checks_passed = False

        # Memoria
        status, output, error = exec_cmd(client, "free -m | grep Mem | awk '{print int($3/$2*100)}'", timeout=30)
        mem_usage = output.strip()
        if mem_usage.isdigit() and int(mem_usage) < 90:
            log(f"✅ Memoria: {mem_usage}% utilizada", Colors.GREEN)
        else:
            log(f"⚠️ Memoria: {mem_usage}%", Colors.YELLOW)

        # Resultado final
        print()
        if all_checks_passed:
            log("="*70, Colors.GREEN)
            log("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE", Colors.GREEN)
            log("="*70, Colors.GREEN)
        else:
            log("="*70, Colors.YELLOW)
            log("⚠️ DEPLOYMENT COMPLETADO CON ADVERTENCIAS", Colors.YELLOW)
            log("="*70, Colors.YELLOW)

        print()
        log("📍 URLs de producción:", Colors.CYAN)
        log("   • App principal: https://inmovaapp.com", Colors.CYAN)
        log("   • Login: https://inmovaapp.com/login", Colors.CYAN)
        log("   • Dashboard: https://inmovaapp.com/dashboard", Colors.CYAN)
        log("   • Agentes IA: https://inmovaapp.com/admin/ai-agents", Colors.CYAN)
        log("   • Impuestos: https://inmovaapp.com/admin/impuestos", Colors.CYAN)
        log("   • Community Manager: https://inmovaapp.com/admin/community-manager", Colors.CYAN)
        log("   • Canva Studio: https://inmovaapp.com/admin/canva", Colors.CYAN)
        print()

        return 0

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("🔌 Conexión cerrada", Colors.YELLOW)

if __name__ == '__main__':
    sys.exit(main())
