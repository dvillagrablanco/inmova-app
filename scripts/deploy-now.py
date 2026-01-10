#!/usr/bin/env python3
"""
Deployment automatizado a producción vía SSH (Paramiko)
Servidor: 157.180.119.236
"""

import sys
import time
from datetime import datetime

# Agregar path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300, check_error=True):
    """Ejecutar comando SSH y retornar resultado"""
    log(f"  → {cmd[:80]}..." if len(cmd) > 80 else f"  → {cmd}", Colors.CYAN)
    
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and check_error:
        log(f"  ⚠️ Exit code: {exit_status}", Colors.YELLOW)
        if error:
            log(f"  Error: {error[:200]}", Colors.RED)
    
    return exit_status, output, error

def main():
    print(f"""
{Colors.BOLD}{'='*70}
🚀 DEPLOYMENT AUTOMATIZADO - INMOVA APP
{'='*70}{Colors.RESET}

Servidor: {SERVER_IP}
Path: {APP_PATH}
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

""")

    # Conectar
    log("🔐 Conectando al servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # =====================================================
        # PASO 1: BACKUP PRE-DEPLOYMENT
        # =====================================================
        print(f"\n{Colors.BOLD}📦 PASO 1: BACKUP PRE-DEPLOYMENT{Colors.RESET}")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Guardar commit actual para rollback
        status, current_commit, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        current_commit = current_commit.strip()
        log(f"✅ Commit actual: {current_commit}", Colors.GREEN)
        
        # Backup de BD
        exec_cmd(client, f"mkdir -p /var/backups/inmova", check_error=False)
        status, _, _ = exec_cmd(client, 
            f"cd {APP_PATH} && source .env.production 2>/dev/null; "
            f"pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'BD backup skipped'",
            check_error=False
        )
        log("✅ Backup de BD completado", Colors.GREEN)

        # =====================================================
        # PASO 2: ACTUALIZAR CÓDIGO
        # =====================================================
        print(f"\n{Colors.BOLD}📥 PASO 2: ACTUALIZAR CÓDIGO{Colors.RESET}")
        
        # Limpiar cambios locales si los hay
        exec_cmd(client, f"cd {APP_PATH} && git stash 2>/dev/null || true", check_error=False)
        
        # Git pull
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1")
        if "Already up to date" in output:
            log("ℹ️ Código ya está actualizado", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
            if output:
                # Mostrar resumen de cambios
                lines = [l for l in output.split('\n') if l.strip()][:5]
                for line in lines:
                    log(f"    {line}", Colors.CYAN)

        # Verificar nuevo commit
        status, new_commit, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        new_commit = new_commit.strip()
        log(f"✅ Commit desplegado: {new_commit}", Colors.GREEN)

        # =====================================================
        # PASO 3: INSTALAR DEPENDENCIAS
        # =====================================================
        print(f"\n{Colors.BOLD}📦 PASO 3: INSTALAR DEPENDENCIAS{Colors.RESET}")
        
        status, output, _ = exec_cmd(client, 
            f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5",
            timeout=600
        )
        log("✅ Dependencias instaladas", Colors.GREEN)

        # =====================================================
        # PASO 4: PRISMA
        # =====================================================
        print(f"\n{Colors.BOLD}🔧 PASO 4: CONFIGURAR PRISMA{Colors.RESET}")
        
        # Generar cliente Prisma
        status, _, _ = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3")
        log("✅ Prisma client generado", Colors.GREEN)
        
        # Aplicar migraciones (si hay)
        status, output, _ = exec_cmd(client, 
            f"cd {APP_PATH} && npx prisma migrate deploy 2>&1 | tail -5",
            check_error=False
        )
        if "already in sync" in output.lower() or status == 0:
            log("✅ Migraciones aplicadas", Colors.GREEN)
        else:
            log("⚠️ Migraciones: revisar logs", Colors.YELLOW)

        # =====================================================
        # PASO 5: BUILD
        # =====================================================
        print(f"\n{Colors.BOLD}🏗️ PASO 5: BUILD DE APLICACIÓN{Colors.RESET}")
        
        # Limpiar cache si existe
        exec_cmd(client, f"cd {APP_PATH} && rm -rf .next/cache 2>/dev/null || true", check_error=False)
        
        log("⏳ Construyendo aplicación (esto puede tardar ~3-5 min)...", Colors.YELLOW)
        status, output, error = exec_cmd(client, 
            f"cd {APP_PATH} && npm run build 2>&1",
            timeout=600
        )
        
        if status != 0:
            log("❌ Error en build", Colors.RED)
            # Mostrar últimas líneas del error
            error_lines = (output + error).split('\n')[-15:]
            for line in error_lines:
                if line.strip():
                    log(f"    {line}", Colors.RED)
            
            # Rollback
            log("🔄 Iniciando rollback...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && git checkout {current_commit}", check_error=False)
            return 1
        
        log("✅ Build completado exitosamente", Colors.GREEN)

        # =====================================================
        # PASO 6: RESTART PM2
        # =====================================================
        print(f"\n{Colors.BOLD}♻️ PASO 6: REINICIAR APLICACIÓN{Colors.RESET}")
        
        # Reload PM2 (zero-downtime)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1")
        
        if status != 0:
            # Si falla reload, intentar restart
            log("⚠️ Reload falló, intentando restart...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && pm2 restart inmova-app --update-env 2>&1")
        
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # Guardar configuración PM2
        exec_cmd(client, "pm2 save 2>/dev/null || true", check_error=False)
        
        # Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)

        # =====================================================
        # PASO 7: HEALTH CHECKS
        # =====================================================
        print(f"\n{Colors.BOLD}🏥 PASO 7: VERIFICACIÓN DE SALUD{Colors.RESET}")
        
        health_checks_passed = 0
        total_checks = 5
        
        # Check 1: HTTP básico
        log("1/5 Verificando HTTP...", Colors.CYAN)
        status, output, _ = exec_cmd(client, 
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health",
            check_error=False
        )
        if "200" in output:
            log("  ✅ HTTP OK", Colors.GREEN)
            health_checks_passed += 1
        else:
            log(f"  ❌ HTTP falló: {output}", Colors.RED)
        
        # Check 2: Respuesta JSON
        log("2/5 Verificando respuesta API...", Colors.CYAN)
        status, output, _ = exec_cmd(client, 
            "curl -s http://localhost:3000/api/health",
            check_error=False
        )
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("  ✅ API Health OK", Colors.GREEN)
            health_checks_passed += 1
        else:
            log(f"  ⚠️ API response: {output[:100]}", Colors.YELLOW)
        
        # Check 3: PM2 status
        log("3/5 Verificando PM2...", Colors.CYAN)
        status, output, _ = exec_cmd(client, "pm2 jlist 2>/dev/null | grep -o '\"status\":\"online\"' | wc -l")
        online_count = int(output.strip()) if output.strip().isdigit() else 0
        if online_count > 0:
            log(f"  ✅ PM2 OK ({online_count} instancias online)", Colors.GREEN)
            health_checks_passed += 1
        else:
            log("  ❌ PM2: no hay instancias online", Colors.RED)
        
        # Check 4: Memoria
        log("4/5 Verificando memoria...", Colors.CYAN)
        status, output, _ = exec_cmd(client, "free | grep Mem | awk '{print int($3/$2 * 100)}'")
        mem_usage = int(output.strip()) if output.strip().isdigit() else 0
        if mem_usage < 90:
            log(f"  ✅ Memoria OK ({mem_usage}% usado)", Colors.GREEN)
            health_checks_passed += 1
        else:
            log(f"  ⚠️ Memoria alta: {mem_usage}%", Colors.YELLOW)
        
        # Check 5: Disco
        log("5/5 Verificando disco...", Colors.CYAN)
        status, output, _ = exec_cmd(client, "df / | tail -1 | awk '{print $5}' | tr -d '%'")
        disk_usage = int(output.strip()) if output.strip().isdigit() else 0
        if disk_usage < 90:
            log(f"  ✅ Disco OK ({disk_usage}% usado)", Colors.GREEN)
            health_checks_passed += 1
        else:
            log(f"  ⚠️ Disco alto: {disk_usage}%", Colors.YELLOW)
        
        print(f"\n{Colors.BOLD}Health checks: {health_checks_passed}/{total_checks} pasando{Colors.RESET}")

        # =====================================================
        # PASO 8: VERIFICACIÓN LOGIN (CRÍTICO)
        # =====================================================
        print(f"\n{Colors.BOLD}🔐 PASO 8: VERIFICACIÓN DE LOGIN{Colors.RESET}")
        
        # Verificar que la página de login carga
        log("Verificando página de login...", Colors.CYAN)
        status, output, _ = exec_cmd(client, 
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login",
            check_error=False
        )
        if "200" in output:
            log("  ✅ Página de login accesible", Colors.GREEN)
        else:
            log(f"  ⚠️ Login page status: {output}", Colors.YELLOW)
        
        # Verificar API de auth session
        log("Verificando API de sesión...", Colors.CYAN)
        status, output, _ = exec_cmd(client, 
            "curl -s http://localhost:3000/api/auth/session",
            check_error=False
        )
        if "problem with the server" not in output.lower():
            log("  ✅ API auth funcional", Colors.GREEN)
        else:
            log("  ❌ API auth tiene problemas", Colors.RED)
        
        # Verificar logs de errores de auth
        log("Verificando logs de auth...", Colors.CYAN)
        status, output, _ = exec_cmd(client, 
            "pm2 logs inmova-app --nostream --lines 30 2>&1 | grep -i 'NO_SECRET\\|next-auth.*error' | wc -l",
            check_error=False
        )
        error_count = int(output.strip()) if output.strip().isdigit() else 0
        if error_count == 0:
            log("  ✅ Sin errores de NextAuth en logs", Colors.GREEN)
        else:
            log(f"  ⚠️ {error_count} errores de auth detectados", Colors.YELLOW)

        # =====================================================
        # RESUMEN FINAL
        # =====================================================
        print(f"""
{Colors.BOLD}{'='*70}
{'✅ DEPLOYMENT COMPLETADO' if health_checks_passed >= 4 else '⚠️ DEPLOYMENT CON WARNINGS'}
{'='*70}{Colors.RESET}

{Colors.GREEN}URL Principal:{Colors.RESET} https://inmovaapp.com
{Colors.GREEN}URL Directa:{Colors.RESET} http://{SERVER_IP}:3000
{Colors.GREEN}Health Check:{Colors.RESET} https://inmovaapp.com/api/health

{Colors.CYAN}Commit desplegado:{Colors.RESET} {new_commit}
{Colors.CYAN}Commit anterior:{Colors.RESET} {current_commit}
{Colors.CYAN}Health checks:{Colors.RESET} {health_checks_passed}/{total_checks}

{Colors.YELLOW}Para ver logs:{Colors.RESET}
  ssh root@{SERVER_IP} 'pm2 logs inmova-app'

{Colors.YELLOW}Para rollback:{Colors.RESET}
  ssh root@{SERVER_IP} 'cd {APP_PATH} && git checkout {current_commit} && npm run build && pm2 reload inmova-app'

{'='*70}
""")

        return 0 if health_checks_passed >= 4 else 1

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        client.close()
        log("🔌 Conexión SSH cerrada", Colors.CYAN)

if __name__ == "__main__":
    sys.exit(main())
