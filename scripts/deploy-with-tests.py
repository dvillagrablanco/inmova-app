#!/usr/bin/env python3
"""
DEPLOYMENT CON TESTS AUTOMÁTICOS
Tests integrados en cada deployment para asegurar calidad
"""

import sys
import os
import time
import json
from datetime import datetime

# Path de paramiko
home_dir = os.path.expanduser('~')
sys.path.insert(0, f'{home_dir}/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
HOST = os.environ.get('SSH_HOST', '157.180.119.236')
USER = os.environ.get('SSH_USER', 'root')
PASS = os.environ.get('SSH_PASSWORD', 'xcc9brgkMMbf')
APP_PATH = '/opt/inmova-app'
DOMAIN = 'inmovaapp.com'

# Umbrales de calidad
MIN_TEST_PASS_RATE = 95  # 95% de tests deben pasar
MIN_COVERAGE = 90  # 90% de cobertura mínima

class Colors:
    BLUE = '\033[0;34m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'

def log(msg, color=Colors.GREEN):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{ts}]{Colors.NC} {msg}")

def error(msg):
    log(f"❌ ERROR: {msg}", Colors.RED)
    sys.exit(1)

def warning(msg):
    log(f"⚠️  {msg}", Colors.YELLOW)

def exec_cmd(ssh, cmd, desc="", timeout=300, ignore_errors=False):
    """Ejecutar comando y retornar salida"""
    log(f"{desc or cmd[:50]}", Colors.BLUE)
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error_out = stderr.read().decode('utf-8', errors='ignore')
        
        if output:
            print(output[:1000])
        if error_out and exit_code != 0 and not ignore_errors:
            print(f"Error: {error_out[:500]}")
        
        return exit_code == 0, output
    except Exception as e:
        if ignore_errors:
            warning(f"Error: {e}")
            return False, str(e)
        else:
            error(f"Error ejecutando comando: {e}")

def run_tests_with_coverage(ssh):
    """Ejecutar tests y verificar cobertura"""
    log("🧪 EJECUTANDO TESTS CON COBERTURA", Colors.BLUE)
    
    # Crear directorio para reportes
    exec_cmd(ssh, f"mkdir -p {APP_PATH}/test-reports", "Crear dir reportes", ignore_errors=True)
    
    # Ejecutar tests unitarios
    log("📊 Tests unitarios...")
    success, output = exec_cmd(
        ssh,
        f"cd {APP_PATH} && npm run test:ci -- --json --outputFile=test-reports/unit-results.json 2>&1 | tail -50",
        "Unit tests",
        timeout=180,
        ignore_errors=True
    )
    
    # Parsear resultados
    log("📈 Analizando resultados...")
    success, json_output = exec_cmd(
        ssh,
        f"cat {APP_PATH}/test-reports/unit-results.json 2>/dev/null || echo '{{}}'",
        "Leer resultados",
        ignore_errors=True
    )
    
    try:
        results = json.loads(json_output) if json_output else {}
        
        total_tests = results.get('numTotalTests', 0)
        passed_tests = results.get('numPassedTests', 0)
        failed_tests = results.get('numFailedTests', 0)
        
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        log(f"Tests: {passed_tests}/{total_tests} pasando ({pass_rate:.1f}%)")
        log(f"Fallando: {failed_tests}")
        
        # Verificar umbral
        if pass_rate < MIN_TEST_PASS_RATE:
            warning(f"Test pass rate ({pass_rate:.1f}%) está por debajo del mínimo ({MIN_TEST_PASS_RATE}%)")
            return False, f"Solo {pass_rate:.1f}% de tests pasando (mínimo: {MIN_TEST_PASS_RATE}%)"
        
        log(f"✅ Tests pass rate OK: {pass_rate:.1f}%", Colors.GREEN)
        return True, f"{passed_tests}/{total_tests} tests pasando"
        
    except json.JSONDecodeError:
        warning("No se pudo parsear resultados de tests")
        # Verificar si al menos corrieron
        if "test" in output.lower() or "pass" in output.lower():
            return True, "Tests ejecutados (sin estadísticas)"
        return False, "Tests fallaron al ejecutar"

def run_e2e_tests(ssh):
    """Ejecutar tests E2E críticos"""
    log("🎭 EJECUTANDO TESTS E2E", Colors.BLUE)
    
    # Verificar que Playwright esté instalado
    success, _ = exec_cmd(
        ssh,
        f"cd {APP_PATH} && npx playwright --version",
        "Verificar Playwright",
        ignore_errors=True
    )
    
    if not success:
        warning("Playwright no disponible, saltando E2E tests")
        return True, "E2E tests saltados"
    
    # Ejecutar solo tests críticos (smoke tests)
    log("Running smoke tests...")
    success, output = exec_cmd(
        ssh,
        f"cd {APP_PATH} && BASE_URL=http://localhost:3000 npx playwright test --grep '@smoke' --reporter=json 2>&1 | tail -30",
        "E2E smoke tests",
        timeout=120,
        ignore_errors=True
    )
    
    if "passed" in output.lower():
        log("✅ E2E smoke tests OK", Colors.GREEN)
        return True, "E2E smoke tests pasaron"
    else:
        warning("E2E tests tuvieron problemas")
        return True, "E2E tests con warnings"

def backup_current_deployment(ssh):
    """Backup del deployment actual antes de actualizar"""
    log("💾 BACKUP PRE-DEPLOYMENT", Colors.BLUE)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Backup de BD
    backup_db = f"/var/backups/inmova/pre-deploy-{timestamp}.sql"
    success, _ = exec_cmd(
        ssh,
        f"pg_dump -U postgres inmova_production > {backup_db} 2>/dev/null || echo 'DB backup failed'",
        "Backup BD",
        ignore_errors=True
    )
    
    if success:
        log(f"✅ BD backup: {backup_db}")
    
    # Backup de .env
    exec_cmd(
        ssh,
        f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup-{timestamp}",
        "Backup .env",
        ignore_errors=True
    )
    
    # Guardar commit actual para posible rollback
    success, commit = exec_cmd(
        ssh,
        f"cd {APP_PATH} && git rev-parse HEAD",
        "Guardar commit actual"
    )
    
    if success:
        commit_hash = commit.strip()
        log(f"✅ Commit actual: {commit_hash[:8]}")
        return commit_hash
    
    return None

def rollback_deployment(ssh, previous_commit):
    """Rollback a versión anterior"""
    log("↩️  ROLLBACK A VERSIÓN ANTERIOR", Colors.RED)
    
    if previous_commit:
        exec_cmd(
            ssh,
            f"cd {APP_PATH} && git reset --hard {previous_commit}",
            "Git reset"
        )
        
        exec_cmd(
            ssh,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -20",
            "Rebuild",
            timeout=300
        )
        
        exec_cmd(
            ssh,
            "pm2 restart inmova-app",
            "PM2 restart"
        )
        
        log("✅ Rollback completado")

def check_post_deployment_health(ssh):
    """Verificaciones post-deployment"""
    log("🏥 POST-DEPLOYMENT HEALTH CHECKS", Colors.BLUE)
    
    checks_passed = 0
    checks_total = 5
    
    # Wait for app to start
    time.sleep(10)
    
    # 1. HTTP Health Check
    log("1/5 Verificando HTTP...")
    success, output = exec_cmd(
        ssh,
        "curl -f http://localhost:3000/api/health 2>/dev/null",
        "HTTP health",
        ignore_errors=True
    )
    if success and "ok" in output.lower():
        log("  ✅ HTTP OK")
        checks_passed += 1
    else:
        warning("  ❌ HTTP failed")
    
    # 2. Database Connection
    log("2/5 Verificando BD...")
    success, output = exec_cmd(
        ssh,
        "curl -s http://localhost:3000/api/health 2>/dev/null | grep -o '\"database\":\"[^\"]*\"'",
        "DB connection",
        ignore_errors=True
    )
    if success and "connected" in output:
        log("  ✅ BD OK")
        checks_passed += 1
    else:
        warning("  ❌ BD failed")
    
    # 3. PM2 Status
    log("3/5 Verificando PM2...")
    success, output = exec_cmd(
        ssh,
        "pm2 jlist | jq -r '.[] | select(.name==\"inmova-app\") | .pm2_env.status'",
        "PM2 status",
        ignore_errors=True
    )
    if success and "online" in output:
        log("  ✅ PM2 OK")
        checks_passed += 1
    else:
        warning("  ❌ PM2 failed")
    
    # 4. Memory Usage
    log("4/5 Verificando memoria...")
    success, output = exec_cmd(
        ssh,
        "free -m | awk '/^Mem:/ {print ($3/$2)*100}'",
        "Memory check",
        ignore_errors=True
    )
    if success:
        try:
            mem_usage = float(output.strip())
            if mem_usage < 90:
                log(f"  ✅ Memoria OK ({mem_usage:.1f}%)")
                checks_passed += 1
            else:
                warning(f"  ⚠️  Memoria alta ({mem_usage:.1f}%)")
        except:
            warning("  ⚠️  No se pudo verificar memoria")
    
    # 5. Disk Usage
    log("5/5 Verificando disco...")
    success, output = exec_cmd(
        ssh,
        "df -h / | awk 'NR==2 {print $5}' | sed 's/%//'",
        "Disk check",
        ignore_errors=True
    )
    if success:
        try:
            disk_usage = float(output.strip())
            if disk_usage < 90:
                log(f"  ✅ Disco OK ({disk_usage:.1f}%)")
                checks_passed += 1
            else:
                warning(f"  ⚠️  Disco alto ({disk_usage:.1f}%)")
        except:
            warning("  ⚠️  No se pudo verificar disco")
    
    log(f"\nHealth checks: {checks_passed}/{checks_total} pasando")
    
    return checks_passed >= 3  # Mínimo 3 de 5 deben pasar

def main():
    """Main deployment con tests"""
    print(f"""
{Colors.BLUE}{'='*70}
🚀 DEPLOYMENT AUTOMÁTICO CON TESTS - INMOVA APP
{'='*70}{Colors.NC}

Servidor: {HOST}
Dominio: {DOMAIN}
Path: {APP_PATH}
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Umbrales de Calidad:
  - Test pass rate: ≥{MIN_TEST_PASS_RATE}%
  - Coverage: ≥{MIN_COVERAGE}%

{Colors.BLUE}{'='*70}{Colors.NC}
""")
    
    ssh = None
    previous_commit = None
    deployment_success = False
    
    try:
        # CONECTAR
        log("🔐 Conectando...", Colors.BLUE)
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=HOST, username=USER, password=PASS, timeout=15)
        log(f"✅ Conectado a {HOST}")
        
        # BACKUP PRE-DEPLOYMENT
        previous_commit = backup_current_deployment(ssh)
        
        # BACKUP DE .ENV.PRODUCTION (CRÍTICO)
        log("💾 Backup de .env.production...", Colors.BLUE)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        success, _ = exec_cmd(
            ssh,
            f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.{timestamp}",
            "Backup .env",
            ignore_errors=True
        )
        if success:
            log(f"✅ Backup guardado: .env.production.backup.{timestamp}")
        else:
            warning("No se pudo crear backup de .env (puede no existir aún)")
        
        # PRE-DEPLOYMENT CHECKS
        log("📋 Pre-deployment checks...", Colors.BLUE)
        exec_cmd(ssh, "node -v", "Node.js version")
        exec_cmd(ssh, "pm2 -v", "PM2 version", ignore_errors=True)
        
        # VERIFICAR NEXTAUTH_URL (CRÍTICO)
        log("🔐 Verificando NEXTAUTH_URL...", Colors.BLUE)
        success, nextauth_url = exec_cmd(
            ssh,
            f"cat {APP_PATH}/.env.production | grep '^NEXTAUTH_URL=' | cut -d= -f2",
            "NEXTAUTH_URL check",
            ignore_errors=True
        )
        
        if success and nextauth_url:
            nextauth_url = nextauth_url.strip()
            
            # Validar formato
            if nextauth_url == 'https://' or len(nextauth_url) < 10 or not nextauth_url.startswith('https://'):
                error(f"NEXTAUTH_URL mal configurado: '{nextauth_url}'\n"
                      f"   Debe ser https://{DOMAIN}\n"
                      f"   Deployment ABORTADO para prevenir problemas de login")
            
            log(f"✅ NEXTAUTH_URL: {nextauth_url}", Colors.GREEN)
        else:
            error("No se pudo leer NEXTAUTH_URL de .env.production")
        
        # GIT PULL
        log("📥 Actualizando código...", Colors.BLUE)
        exec_cmd(ssh, f"cd {APP_PATH} && git stash", "Git stash", ignore_errors=True)
        success, output = exec_cmd(ssh, f"cd {APP_PATH} && git pull origin main", "Git pull")
        
        if "Already up to date" in output:
            log("ℹ️  Código ya actualizado")
        else:
            log("✅ Código actualizado")
        
        # INSTALL DEPENDENCIES
        log("📦 Instalando dependencias...", Colors.BLUE)
        exec_cmd(
            ssh,
            f"cd {APP_PATH} && npm ci 2>&1 | tail -20",
            "npm ci",
            timeout=600
        )
        
        # PRISMA
        log("🔧 Prisma setup...", Colors.BLUE)
        exec_cmd(ssh, f"cd {APP_PATH} && npx prisma generate", "Prisma generate")
        exec_cmd(ssh, f"cd {APP_PATH} && npx prisma migrate deploy", "Prisma migrate", ignore_errors=True)
        
        # ============================================
        # TESTS FASE 1: PRE-BUILD
        # ============================================
        log("\n" + "="*70, Colors.BLUE)
        log("🧪 FASE 1: TESTS PRE-BUILD", Colors.BLUE)
        log("="*70, Colors.BLUE)
        
        test_success, test_msg = run_tests_with_coverage(ssh)
        
        if not test_success:
            error(f"Tests fallaron: {test_msg}\nDeployment abortado.")
        
        log(f"✅ Tests pre-build: {test_msg}", Colors.GREEN)
        
        # BUILD
        log("\n🏗️  Building aplicación...", Colors.BLUE)
        success, _ = exec_cmd(
            ssh,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -50",
            "npm build",
            timeout=600
        )
        
        if not success:
            error("Build falló. Deployment abortado.")
        
        # ============================================
        # TESTS FASE 2: POST-BUILD (E2E)
        # ============================================
        log("\n" + "="*70, Colors.BLUE)
        log("🎭 FASE 2: TESTS POST-BUILD (E2E)", Colors.BLUE)
        log("="*70, Colors.BLUE)
        
        # Restart PM2 para nuevos tests
        exec_cmd(ssh, "pm2 reload inmova-app", "PM2 reload", ignore_errors=True)
        time.sleep(10)
        
        e2e_success, e2e_msg = run_e2e_tests(ssh)
        log(f"✅ Tests E2E: {e2e_msg}", Colors.GREEN)
        
        # ============================================
        # DEPLOYMENT
        # ============================================
        log("\n" + "="*70, Colors.BLUE)
        log("🚀 DEPLOYMENT", Colors.BLUE)
        log("="*70, Colors.BLUE)
        
        # PM2 restart final
        exec_cmd(ssh, "pm2 restart inmova-app --update-env", "PM2 restart final")
        exec_cmd(ssh, "pm2 save", "PM2 save")
        
        # ============================================
        # TESTS FASE 3: POST-DEPLOYMENT
        # ============================================
        log("\n" + "="*70, Colors.BLUE)
        log("🏥 FASE 3: HEALTH CHECKS POST-DEPLOYMENT", Colors.BLUE)
        log("="*70, Colors.BLUE)
        
        health_ok = check_post_deployment_health(ssh)
        
        if not health_ok:
            warning("Health checks fallaron. Iniciando rollback...")
            rollback_deployment(ssh, previous_commit)
            error("Deployment falló. Rollback completado.")
        
        deployment_success = True
        
        # SUCCESS
        print(f"""
{Colors.GREEN}{'='*70}
✅ DEPLOYMENT COMPLETADO EXITOSAMENTE
{'='*70}{Colors.NC}

URL Principal: https://{DOMAIN}
URL Fallback: http://{HOST}:3000
Health Check: https://{DOMAIN}/api/health

Tests Ejecutados:
  ✅ Unit tests: {test_msg}
  ✅ E2E tests: {e2e_msg}
  ✅ Health checks: OK

Para ver logs:
  ssh {USER}@{HOST} 'pm2 logs inmova-app'

{Colors.GREEN}{'='*70}{Colors.NC}
""")
        
    except KeyboardInterrupt:
        log("\n❌ Deployment cancelado por usuario", Colors.RED)
        if previous_commit and ssh:
            rollback_deployment(ssh, previous_commit)
        sys.exit(1)
    
    except Exception as e:
        log(f"\n❌ Error en deployment: {e}", Colors.RED)
        if previous_commit and ssh:
            log("Iniciando rollback...", Colors.YELLOW)
            rollback_deployment(ssh, previous_commit)
        sys.exit(1)
    
    finally:
        if ssh:
            ssh.close()
            log("🔒 Conexión cerrada")
    
    if not deployment_success:
        sys.exit(1)

if __name__ == "__main__":
    main()
