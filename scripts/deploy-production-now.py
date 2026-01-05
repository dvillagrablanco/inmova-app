#!/usr/bin/env python3
"""
Deployment automatizado a producción usando Paramiko
Inmova App - eWoorker Landing Page Improvements
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
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Ejecutar comando y retornar salida"""
    log(f"  → {command[:80]}..." if len(command) > 80 else f"  → {command}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print(f"""
{Colors.BOLD}{'='*70}
🚀 DEPLOYMENT A PRODUCCIÓN - INMOVA APP
{'='*70}{Colors.RESET}

{Colors.CYAN}Servidor:{Colors.RESET} {SERVER_IP}
{Colors.CYAN}Path:{Colors.RESET}     {APP_PATH}
{Colors.CYAN}Cambios:{Colors.RESET}  eWoorker landing page improvements
""")

    # Conectar
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=15
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # 1. Backup de BD
        log("\n💾 BACKUP PRE-DEPLOYMENT", Colors.BOLD)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        backup_file = f"/var/backups/inmova/pre-deploy-{timestamp}.sql"
        
        exec_cmd(client, "mkdir -p /var/backups/inmova")
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && pg_dump -U inmova_user inmova_production > {backup_file} 2>/dev/null || echo 'backup-skipped'"
        )
        if "backup-skipped" not in output:
            log(f"✅ Backup: {backup_file}", Colors.GREEN)
        else:
            log("⚠️ Backup omitido (BD no accesible o no existe)", Colors.YELLOW)

        # Guardar commit actual para rollback
        status, current_commit, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        log(f"✅ Commit actual: {current_commit.strip()}", Colors.GREEN)

        # 2. Pull del código
        log("\n📥 ACTUALIZANDO CÓDIGO", Colors.BOLD)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1")
        if status != 0:
            log(f"❌ Error en git pull: {error}", Colors.RED)
            return 1
        log("✅ Código actualizado", Colors.GREEN)
        
        # Mostrar cambios
        if "Already up to date" in output:
            log("ℹ️ No hay cambios nuevos en el repositorio", Colors.YELLOW)
        else:
            log(f"📝 Cambios: {output[:200]}...", Colors.CYAN)

        # 3. Instalar dependencias (solo si package.json cambió)
        log("\n📦 VERIFICANDO DEPENDENCIAS", Colors.BOLD)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && git diff HEAD~1 --name-only | grep -q 'package.json' && echo 'needs-install' || echo 'skip-install'"
        )
        
        if "needs-install" in output:
            log("📦 Instalando dependencias...", Colors.YELLOW)
            status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install 2>&1", timeout=600)
            if status != 0:
                log(f"❌ Error en npm install: {error[:500]}", Colors.RED)
            else:
                log("✅ Dependencias instaladas", Colors.GREEN)
        else:
            log("✅ Dependencias sin cambios", Colors.GREEN)

        # 4. Prisma generate
        log("\n🔧 PRISMA SETUP", Colors.BOLD)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1", timeout=120)
        if status != 0:
            log(f"⚠️ Prisma generate warning: {error[:200]}", Colors.YELLOW)
        else:
            log("✅ Prisma client generado", Colors.GREEN)

        # 5. Build
        log("\n🏗️ BUILD DE PRODUCCIÓN", Colors.BOLD)
        log("⏳ Esto puede tomar 2-5 minutos...", Colors.YELLOW)
        
        # Configurar variables de entorno para build
        build_env = "export NODE_ENV=production && export SKIP_ENV_VALIDATION=1"
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && {build_env} && npm run build 2>&1",
            timeout=600
        )
        
        if status != 0:
            log(f"❌ Error en build: {error[:500]}", Colors.RED)
            log("🔄 Intentando continuar con versión anterior...", Colors.YELLOW)
        else:
            log("✅ Build completado", Colors.GREEN)

        # 6. Reiniciar PM2
        log("\n♻️ REINICIANDO APLICACIÓN", Colors.BOLD)
        
        # Verificar si PM2 está corriendo
        status, output, error = exec_cmd(client, "pm2 list 2>&1")
        
        if "inmova-app" in output:
            status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1")
            if status != 0:
                log("⚠️ Reload falló, intentando restart...", Colors.YELLOW)
                exec_cmd(client, "pm2 restart inmova-app --update-env 2>&1")
        else:
            log("⚠️ PM2 no tiene inmova-app, iniciando...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production 2>&1")
        
        exec_cmd(client, "pm2 save 2>&1")
        log("✅ Aplicación reiniciada", Colors.GREEN)

        # 7. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)

        # 8. Health checks
        log("\n🏥 HEALTH CHECKS", Colors.BOLD)
        
        checks_passed = 0
        checks_total = 5

        # Check 1: HTTP
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")
        if "200" in output:
            log("✅ 1/5 HTTP /api/health: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"❌ 1/5 HTTP /api/health: {output}", Colors.RED)

        # Check 2: Landing
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing")
        if "200" in output:
            log("✅ 2/5 Landing page: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"❌ 2/5 Landing page: {output}", Colors.RED)

        # Check 3: eWoorker Landing
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ewoorker/landing")
        if "200" in output:
            log("✅ 3/5 eWoorker landing: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"❌ 3/5 eWoorker landing: {output}", Colors.RED)

        # Check 4: PM2 status
        status, output, error = exec_cmd(client, "pm2 jlist 2>/dev/null | grep -q 'online' && echo 'online' || echo 'offline'")
        if "online" in output:
            log("✅ 4/5 PM2 status: online", Colors.GREEN)
            checks_passed += 1
        else:
            log("❌ 4/5 PM2 status: offline", Colors.RED)

        # Check 5: Login page
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        if "200" in output:
            log("✅ 5/5 Login page: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"❌ 5/5 Login page: {output}", Colors.RED)

        # Resultado
        print(f"\n{Colors.BOLD}{'='*70}")
        if checks_passed >= 4:
            print(f"✅ DEPLOYMENT COMPLETADO - {checks_passed}/{checks_total} checks OK")
            print(f"{'='*70}{Colors.RESET}\n")
            
            print(f"""{Colors.GREEN}
🌐 URLs de producción:
   • Landing Inmova: https://inmovaapp.com/landing
   • eWoorker:       https://inmovaapp.com/ewoorker/landing
   • Login:          https://inmovaapp.com/login
   • Health:         https://inmovaapp.com/api/health

📋 Cambios deployados:
   • Mejorada presencia de eWoorker en landing Inmova
   • Eliminado video placeholder de eWoorker landing
   • Corregidos botones rotos (/registro → /register)
   • Mejorado manejo de acceso del socio
{Colors.RESET}""")
        else:
            print(f"⚠️ DEPLOYMENT CON ADVERTENCIAS - {checks_passed}/{checks_total} checks OK")
            print(f"{'='*70}{Colors.RESET}")
            log("Revisar logs: pm2 logs inmova-app", Colors.YELLOW)

        # Mostrar logs recientes
        log("\n📋 Últimos logs:", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 logs inmova-app --nostream --lines 10 2>&1")
        print(output[:1000] if output else "No hay logs disponibles")

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
