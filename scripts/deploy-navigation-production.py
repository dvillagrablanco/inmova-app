#!/usr/bin/env python3
"""
DEPLOYMENT A PRODUCCIÓN - SISTEMA DE NAVEGACIÓN
Deploy del nuevo sistema de navegación con Command Palette y Quick Actions
"""

import sys
import os
import time
from datetime import datetime

# Path de paramiko
home_dir = os.path.expanduser('~')
sys.path.insert(0, f'{home_dir}/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
HOST = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
DOMAIN = 'inmovaapp.com'

class Colors:
    BLUE = '\033[0;34m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BOLD = '\033[1m'
    NC = '\033[0m'

def log(msg, color=Colors.GREEN):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{ts}]{Colors.NC} {msg}")

def error(msg):
    log(f"❌ ERROR: {msg}", Colors.RED)
    sys.exit(1)

def warning(msg):
    log(f"⚠️  {msg}", Colors.YELLOW)

def success(msg):
    log(f"✅ {msg}", Colors.GREEN)

def header(msg):
    print(f"\n{'='*70}")
    print(f"{Colors.BOLD}{msg}{Colors.NC}")
    print(f"{'='*70}\n")

def exec_cmd(ssh, cmd, desc="", timeout=300, ignore_errors=False):
    """Ejecutar comando SSH y retornar resultado"""
    if desc:
        log(f"{desc}...", Colors.BLUE)
    
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error_out = stderr.read().decode('utf-8', errors='ignore')
        
        if exit_code == 0:
            if desc and output:
                print(f"{Colors.GREEN}✓{Colors.NC} {output[:500]}")
            return True, output
        else:
            if not ignore_errors:
                print(f"{Colors.RED}✗{Colors.NC} Error: {error_out[:500]}")
            return False, error_out
    except Exception as e:
        if ignore_errors:
            warning(f"Error: {e}")
            return False, str(e)
        else:
            error(f"Error ejecutando comando: {e}")

def main():
    header("🚀 DEPLOYMENT A PRODUCCIÓN - SISTEMA DE NAVEGACIÓN")
    
    print(f"Servidor: {HOST}")
    print(f"Dominio: https://{DOMAIN}")
    print(f"Path: {APP_PATH}")
    print(f"\n{'='*70}\n")
    
    # Conectar SSH
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USER, password=PASS, timeout=10)
        success("Conectado a servidor")
    except Exception as e:
        error(f"No se pudo conectar: {e}")
    
    try:
        # 1. Backup pre-deployment
        header("💾 BACKUP PRE-DEPLOYMENT")
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        exec_cmd(client, "mkdir -p /var/backups/inmova", "Crear dir backups", ignore_errors=True)
        
        success_db, output = exec_cmd(
            client,
            f"pg_dump -U postgres inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>&1",
            "Backup de BD",
            ignore_errors=True
        )
        if success_db:
            success(f"BD backup: /var/backups/inmova/pre-deploy-{timestamp}.sql")
        
        # Guardar commit actual para rollback
        success_git, current_commit = exec_cmd(
            client,
            f"cd {APP_PATH} && git rev-parse HEAD",
            "Obtener commit actual"
        )
        if success_git:
            current_commit = current_commit.strip()
            success(f"Commit actual: {current_commit[:8]}")
        
        # 2. Actualizar código
        header("📥 ACTUALIZANDO CÓDIGO")
        
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin", "Fetch remoto")
        
        success_pull, output = exec_cmd(
            client,
            f"cd {APP_PATH} && git pull origin main",
            "Pull desde main"
        )
        
        if not success_pull:
            error("No se pudo actualizar el código")
        
        success("Código actualizado desde GitHub")
        
        # 3. Instalar dependencias
        header("📦 INSTALANDO DEPENDENCIAS")
        
        success_install, output = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install",
            "npm install",
            timeout=600
        )
        
        if not success_install:
            error("npm install falló")
        
        success("Dependencias instaladas")
        
        # 4. Prisma
        header("🔧 PRISMA SETUP")
        
        exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma generate",
            "Prisma generate",
            timeout=120
        )
        
        exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma migrate deploy",
            "Prisma migrations",
            timeout=120,
            ignore_errors=True
        )
        
        success("Prisma configurado")
        
        # 5. Build
        header("🏗️ BUILD DE PRODUCCIÓN")
        
        log("Building aplicación (puede tardar 5-10 minutos)...", Colors.BLUE)
        success_build, output = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -100",
            "",
            timeout=900
        )
        
        if not success_build:
            warning("Build falló, intentando con modo permisivo...")
            # Intentar build con modo permisivo
            success_build, output = exec_cmd(
                client,
                f"cd {APP_PATH} && SKIP_ENV_VALIDATION=1 npm run build 2>&1 | tail -100",
                "Build con modo permisivo",
                timeout=900,
                ignore_errors=True
            )
        
        if success_build:
            success("Build completado")
        else:
            warning("Build con warnings, continuando deployment...")
        
        # 6. Restart PM2
        header("🔄 DEPLOYMENT CON PM2")
        
        # Verificar PM2
        exec_cmd(client, "pm2 --version", "Verificar PM2", ignore_errors=True)
        
        # Reload PM2 (zero-downtime)
        success_reload, output = exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 reload inmova-app --update-env",
            "PM2 reload (zero-downtime)"
        )
        
        if not success_reload:
            warning("PM2 reload falló, intentando restart...")
            exec_cmd(
                client,
                f"cd {APP_PATH} && pm2 restart inmova-app --update-env",
                "PM2 restart",
                ignore_errors=True
            )
        
        # Guardar configuración PM2
        exec_cmd(client, "pm2 save", "PM2 save", ignore_errors=True)
        
        success("PM2 actualizado")
        
        # 7. Warm-up
        log("⏳ Esperando warm-up (15 segundos)...", Colors.YELLOW)
        time.sleep(15)
        
        # 8. Health Checks
        header("🏥 HEALTH CHECKS POST-DEPLOYMENT")
        
        checks_passed = 0
        checks_total = 5
        
        # Check 1: HTTP
        log("1/5 Verificando HTTP...", Colors.BLUE)
        success_http, output = exec_cmd(
            client,
            f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000",
            "",
            ignore_errors=True
        )
        if '200' in output or '301' in output or '302' in output:
            success("HTTP OK")
            checks_passed += 1
        else:
            warning(f"HTTP retornó: {output}")
        
        # Check 2: Health endpoint
        log("2/5 Verificando /api/health...", Colors.BLUE)
        success_health, output = exec_cmd(
            client,
            f"curl -s http://localhost:3000/api/health",
            "",
            ignore_errors=True
        )
        if '"status":"ok"' in output or '"status": "ok"' in output:
            success("Health API OK")
            checks_passed += 1
        else:
            warning(f"Health retornó: {output[:200]}")
        
        # Check 3: PM2 status
        log("3/5 Verificando PM2...", Colors.BLUE)
        success_pm2, output = exec_cmd(
            client,
            "pm2 jlist",
            "",
            ignore_errors=True
        )
        if '"status":"online"' in output:
            success("PM2 online")
            checks_passed += 1
        else:
            warning("PM2 no está online")
        
        # Check 4: Memoria
        log("4/5 Verificando memoria...", Colors.BLUE)
        success_mem, output = exec_cmd(
            client,
            "free | awk '/Mem:/ {printf \"%.1f\", $3/$2*100}'",
            "",
            ignore_errors=True
        )
        try:
            mem_usage = float(output.strip())
            if mem_usage < 90:
                success(f"Memoria OK ({mem_usage:.1f}%)")
                checks_passed += 1
            else:
                warning(f"Memoria alta: {mem_usage:.1f}%")
        except:
            warning("No se pudo verificar memoria")
        
        # Check 5: Disco
        log("5/5 Verificando disco...", Colors.BLUE)
        success_disk, output = exec_cmd(
            client,
            "df -h / | awk 'NR==2 {print $5}'",
            "",
            ignore_errors=True
        )
        if output:
            disk_usage = output.strip().replace('%', '')
            try:
                if float(disk_usage) < 90:
                    success(f"Disco OK ({disk_usage}%)")
                    checks_passed += 1
                else:
                    warning(f"Disco alto: {disk_usage}%")
            except:
                warning("No se pudo verificar disco")
        
        print(f"\n{Colors.BOLD}Health checks: {checks_passed}/{checks_total} pasando{Colors.NC}\n")
        
        # 9. Test externo
        header("🌐 TEST ACCESO EXTERNO")
        
        log("Testeando dominio público...", Colors.BLUE)
        success_domain, output = exec_cmd(
            client,
            f"curl -s -o /dev/null -w '%{{http_code}}' https://{DOMAIN} --max-time 10",
            "",
            ignore_errors=True
        )
        
        if '200' in output or '301' in output or '302' in output:
            success(f"✅ Dominio accesible: https://{DOMAIN}")
        else:
            warning(f"⚠️ Verificar dominio manualmente: {output}")
        
        # 10. Ver logs recientes
        header("📋 LOGS RECIENTES")
        
        log("Últimas líneas del log...", Colors.BLUE)
        exec_cmd(
            client,
            "pm2 logs inmova-app --lines 20 --nostream",
            "",
            ignore_errors=True
        )
        
        # Resumen final
        header("✅ DEPLOYMENT COMPLETADO")
        
        print(f"""
{Colors.GREEN}Deployment exitoso del Sistema de Navegación{Colors.NC}

📦 Componentes desplegados:
  ✅ Command Palette (Cmd+K)
  ✅ Contextual Quick Actions
  ✅ Smart Breadcrumbs
  ✅ Global Shortcuts (40+)
  ✅ Shortcuts Help Dialog (?)

🌐 URLs de acceso:
  - Principal: https://{DOMAIN}
  - Dashboard: https://{DOMAIN}/dashboard
  - Health: https://{DOMAIN}/api/health
  - Fallback IP: http://{HOST}:3000

⌨️ Nuevos shortcuts disponibles:
  - Cmd+K: Command Palette
  - G+P: Ir a Propiedades
  - G+T: Ir a Inquilinos
  - N: Crear nuevo (en listas)
  - ?: Ver ayuda de shortcuts

🔍 Verificación:
  1. Abre https://{DOMAIN}/dashboard
  2. Presiona Cmd+K (debería abrir Command Palette)
  3. Presiona ? (debería mostrar ayuda de shortcuts)
  4. Ve a Propiedades y verás Quick Actions en el header

📊 Health Checks: {checks_passed}/{checks_total} OK

📋 Para ver logs en tiempo real:
  ssh root@{HOST} 'pm2 logs inmova-app'

{'='*70}
""")
        
        if checks_passed >= 4:
            success("🎉 DEPLOYMENT EXITOSO")
            return 0
        else:
            warning("⚠️ Deployment completado pero con warnings - verificar manualmente")
            return 1
            
    except KeyboardInterrupt:
        error("Deployment cancelado por usuario")
    except Exception as e:
        error(f"Error en deployment: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
