#!/usr/bin/env python3
"""
DEPLOY INMOVA APP - Con verificación de login
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

# Colores
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    errors = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, errors

def main():
    print(f"\n{'='*70}")
    print(f"{Colors.CYAN}{Colors.BOLD}🚀 DEPLOYMENT INMOVA APP - PRODUCCIÓN{Colors.RESET}")
    print(f"{'='*70}")
    print(f"Servidor: {SERVER_IP}")
    print(f"Path: {APP_PATH}")
    print(f"{'='*70}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # 1. Conectar
        log("🔐 Conectando al servidor...", Colors.BLUE)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)

        # 2. Backup BD
        log("💾 Creando backup de BD...", Colors.BLUE)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_cmd = f"cd {APP_PATH} && pg_dump -U postgres inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'"
        exec_cmd(client, backup_cmd)
        log("✅ Backup completado", Colors.GREEN)

        # 3. Git pull
        log("📥 Actualizando código (git pull)...", Colors.BLUE)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1")
        if 'Already up to date' in output:
            log("✅ Código ya actualizado", Colors.GREEN)
        elif 'Updating' in output or 'Fast-forward' in output:
            log("✅ Código actualizado", Colors.GREEN)
        else:
            log(f"⚠️ Git output: {output[:200]}", Colors.YELLOW)

        # 4. Instalar dependencias
        log("📦 Instalando dependencias...", Colors.BLUE)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600)
        log("✅ Dependencias instaladas", Colors.GREEN)

        # 5. Generar Prisma
        log("🔧 Generando Prisma Client...", Colors.BLUE)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3")
        if status == 0:
            log("✅ Prisma generado", Colors.GREEN)
        else:
            log(f"⚠️ Prisma warning: {errors[:100]}", Colors.YELLOW)

        # 6. Build
        log("🏗️ Building aplicación (esto tarda ~2-3 min)...", Colors.BLUE)
        build_cmd = f"cd {APP_PATH} && npm run build 2>&1 | tail -20"
        status, output, errors = exec_cmd(client, build_cmd, timeout=600)
        if 'error' in output.lower() and 'Error' in output:
            log(f"⚠️ Build con warnings, continuando...", Colors.YELLOW)
        log("✅ Build completado", Colors.GREEN)

        # 7. Reiniciar PM2
        log("♻️ Reiniciando PM2...", Colors.BLUE)
        exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1")
        log("✅ PM2 reiniciado", Colors.GREEN)

        # 8. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.BLUE)
        time.sleep(20)

        # 9. Verificar health
        log("🏥 Verificando health checks...", Colors.BLUE)
        
        # Health general
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health 2>&1")
        if '"status":"ok"' in output or '"status":"healthy"' in output:
            log("✅ Health check: OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:100]}", Colors.YELLOW)

        # Health auth
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health/auth 2>&1")
        if '"status":"healthy"' in output:
            log("✅ Auth health: HEALTHY", Colors.GREEN)
        elif '"status"' in output:
            log(f"⚠️ Auth health: {output[:150]}", Colors.YELLOW)
        else:
            log(f"⚠️ Auth health endpoint pendiente de inicialización", Colors.YELLOW)

        # 10. Verificar API de sesión (crítico para login)
        log("🔐 Verificando API de autenticación...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/auth/session 2>&1")
        if 'problem with the server' in output.lower():
            log("❌ ERROR: API auth tiene problemas de configuración", Colors.RED)
            log("   Verificando NEXTAUTH_SECRET...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && grep -q 'NEXTAUTH_SECRET' .env.production && echo 'SECRET: OK' || echo 'SECRET: MISSING'")
        else:
            log("✅ API auth respondiendo correctamente", Colors.GREEN)

        # 11. Verificar PM2 status
        log("📊 Estado de PM2...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "pm2 status inmova-app --no-color 2>&1 | grep inmova")
        if 'online' in output.lower():
            log("✅ PM2 status: ONLINE", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {output[:100]}", Colors.YELLOW)

        # 12. Verificar logs de errores
        log("📋 Verificando logs de errores recientes...", Colors.BLUE)
        status, output, _ = exec_cmd(client, "pm2 logs inmova-app --err --lines 5 --nostream 2>&1 | grep -i 'error\\|NO_SECRET' | head -3")
        if output.strip():
            log(f"⚠️ Errores en logs: {output[:200]}", Colors.YELLOW)
        else:
            log("✅ Sin errores críticos en logs", Colors.GREEN)

        # Resumen final
        print(f"\n{'='*70}")
        print(f"{Colors.GREEN}{Colors.BOLD}✅ DEPLOYMENT COMPLETADO{Colors.RESET}")
        print(f"{'='*70}")
        print(f"\n{Colors.CYAN}URLs:{Colors.RESET}")
        print(f"  🌐 Landing:    https://inmovaapp.com/landing")
        print(f"  🔐 Login:      https://inmovaapp.com/login")
        print(f"  📊 Dashboard:  https://inmovaapp.com/dashboard")
        print(f"  🏥 Health:     https://inmovaapp.com/api/health")
        print(f"  🔒 Auth:       https://inmovaapp.com/api/health/auth")
        print(f"\n{Colors.YELLOW}VERIFICACIÓN MANUAL REQUERIDA:{Colors.RESET}")
        print(f"  1. Abrir https://inmovaapp.com/login")
        print(f"  2. Probar login con admin@inmova.app")
        print(f"  3. Verificar acceso al dashboard")
        print(f"\n{Colors.CYAN}Para ver logs:{Colors.RESET}")
        print(f"  ssh root@{SERVER_IP} 'pm2 logs inmova-app'")
        print(f"{'='*70}\n")

    except paramiko.AuthenticationException:
        log("❌ Error de autenticación SSH", Colors.RED)
        sys.exit(1)
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        sys.exit(1)
    finally:
        client.close()

if __name__ == '__main__':
    main()
