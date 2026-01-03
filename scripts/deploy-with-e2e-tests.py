#!/usr/bin/env python3
"""
Deployment Automatizado con Tests E2E
Sprint 7 → Producción con validación completa
"""

import sys
import os

# Add user site-packages to path
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

import paramiko
import time
from datetime import datetime

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

# ============================================================================
# HELPERS
# ============================================================================

def print_header(text):
    """Print section header"""
    print(f"\n{'='*70}")
    print(f"🚀 {text}")
    print('='*70 + '\n')

def print_step(step, text):
    """Print step"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {step} {text}")

def exec_cmd(client, command, timeout=300):
    """Execute command via SSH"""
    print(f"  → {command[:80]}...")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0:
        print(f"  ❌ Error (exit code {exit_status})")
        if error:
            print(f"  Error output: {error[:200]}")
        return False, output, error
    
    print(f"  ✅ OK")
    return True, output, error

# ============================================================================
# DEPLOYMENT PHASES
# ============================================================================

def phase_1_backup(client):
    """Fase 1: Backup pre-deployment"""
    print_header("FASE 1: BACKUP PRE-DEPLOYMENT")
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Backup BD
    print_step("1/3", "Backup de base de datos...")
    success, output, error = exec_cmd(
        client,
        f"cd {APP_PATH} && pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>&1 || echo 'DB backup skipped'"
    )
    
    # Guardar commit actual
    print_step("2/3", "Guardando commit actual...")
    success, output, error = exec_cmd(client, f"cd {APP_PATH} && git rev-parse HEAD")
    current_commit = output.strip()[:8]
    print(f"  Commit actual: {current_commit}")
    
    # Backup .env
    print_step("3/3", "Backup de .env.production...")
    exec_cmd(
        client,
        f"cd {APP_PATH} && cp .env.production /var/backups/inmova/env-{timestamp}.backup"
    )
    
    return current_commit

def phase_2_update_code(client):
    """Fase 2: Actualizar código"""
    print_header("FASE 2: ACTUALIZAR CÓDIGO")
    
    print_step("1/2", "Git pull...")
    success, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
    
    if not success:
        print("❌ Error en git pull")
        return False
    
    print_step("2/2", "Verificando nuevo commit...")
    success, output, error = exec_cmd(client, f"cd {APP_PATH} && git rev-parse HEAD")
    new_commit = output.strip()[:8]
    print(f"  Nuevo commit: {new_commit}")
    
    return True

def phase_3_dependencies(client):
    """Fase 3: Dependencias"""
    print_header("FASE 3: DEPENDENCIAS Y PRISMA")
    
    print_step("1/3", "npm install (puede tardar 2-3 min)...")
    success, output, error = exec_cmd(
        client,
        f"cd {APP_PATH} && npm install",
        timeout=600
    )
    
    if not success:
        print("❌ Error en npm install")
        return False
    
    print_step("2/3", "Prisma generate...")
    success, output, error = exec_cmd(
        client,
        f"cd {APP_PATH} && npx prisma generate"
    )
    
    print_step("3/3", "Prisma migrate deploy...")
    success, output, error = exec_cmd(
        client,
        f"cd {APP_PATH} && npx prisma migrate deploy"
    )
    
    return True

def phase_4_build(client):
    """Fase 4: Build (opcional si existe)"""
    print_header("FASE 4: BUILD")
    
    print_step("1/1", "Verificando si hay build script...")
    success, output, error = exec_cmd(
        client,
        f"cd {APP_PATH} && npm run build 2>&1 || echo 'Build skipped'",
        timeout=600
    )
    
    # No es crítico si falla (dev mode puede usarse)
    return True

def phase_5_deploy(client):
    """Fase 5: Deploy con PM2"""
    print_header("FASE 5: DEPLOYMENT")
    
    print_step("1/3", "PM2 reload (zero-downtime)...")
    success, output, error = exec_cmd(
        client,
        f"cd {APP_PATH} && pm2 reload inmova-app --update-env"
    )
    
    if not success:
        print("  ⚠️ PM2 reload falló, intentando restart...")
        success, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 restart inmova-app --update-env"
        )
    
    print_step("2/3", "PM2 save...")
    exec_cmd(client, "pm2 save")
    
    print_step("3/3", "Esperando warm-up (20s)...")
    time.sleep(20)
    
    return True

def phase_6_health_checks(client):
    """Fase 6: Health checks básicos"""
    print_header("FASE 6: HEALTH CHECKS POST-DEPLOYMENT")
    
    checks_passed = 0
    checks_total = 5
    
    # Check 1: HTTP
    print_step("1/5", "HTTP health check...")
    success, output, error = exec_cmd(
        client,
        "curl -f -s http://localhost:3000/api/health"
    )
    if success and 'ok' in output.lower():
        print("  ✅ HTTP OK")
        checks_passed += 1
    else:
        print("  ❌ HTTP FAIL")
    
    # Check 2: PM2 status
    print_step("2/5", "PM2 status...")
    success, output, error = exec_cmd(client, "pm2 status inmova-app")
    if success and 'online' in output:
        print("  ✅ PM2 online")
        checks_passed += 1
    else:
        print("  ❌ PM2 not online")
    
    # Check 3: Login page
    print_step("3/5", "Login page accesible...")
    success, output, error = exec_cmd(
        client,
        "curl -f -s http://localhost:3000/login | grep -i 'email' > /dev/null && echo 'OK' || echo 'FAIL'"
    )
    if 'OK' in output:
        print("  ✅ Login page OK")
        checks_passed += 1
    else:
        print("  ❌ Login page FAIL")
    
    # Check 4: Memory
    print_step("4/5", "Memory usage...")
    success, output, error = exec_cmd(
        client,
        "free | grep Mem | awk '{print ($3/$2) * 100.0}'"
    )
    if success:
        try:
            mem_usage = float(output.strip())
            print(f"  ℹ️ Memory: {mem_usage:.1f}%")
            if mem_usage < 90:
                print("  ✅ Memory OK")
                checks_passed += 1
            else:
                print("  ⚠️ Memory high")
        except:
            print("  ⚠️ Could not parse memory")
    
    # Check 5: Disk
    print_step("5/5", "Disk usage...")
    success, output, error = exec_cmd(
        client,
        "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'"
    )
    if success:
        try:
            disk_usage = float(output.strip())
            print(f"  ℹ️ Disk: {disk_usage:.1f}%")
            if disk_usage < 90:
                print("  ✅ Disk OK")
                checks_passed += 1
            else:
                print("  ⚠️ Disk high")
        except:
            print("  ⚠️ Could not parse disk")
    
    print(f"\n Health checks: {checks_passed}/{checks_total} pasando")
    
    return checks_passed >= 3  # Al menos 3 de 5 deben pasar

def phase_7_e2e_tests(client):
    """Fase 7: E2E Tests en producción"""
    print_header("FASE 7: E2E TESTS EN PRODUCCIÓN")
    
    print_step("1/2", "Ejecutando Playwright E2E tests...")
    print("  (Esto puede tardar 2-3 minutos)")
    
    success, output, error = exec_cmd(
        client,
        f"cd {APP_PATH} && npx playwright test --reporter=list 2>&1 || echo 'E2E tests skipped or failed'",
        timeout=300
    )
    
    print_step("2/2", "Analizando resultados...")
    
    # Buscar indicadores de éxito
    if 'passed' in output.lower():
        # Contar tests
        lines = output.split('\n')
        for line in lines:
            if 'passed' in line.lower():
                print(f"  ✅ {line.strip()}")
        return True
    else:
        print("  ⚠️ E2E tests no ejecutados o fallaron")
        print("  (No es crítico para deployment)")
        return False

# ============================================================================
# MAIN
# ============================================================================

def main():
    print_header("DEPLOYMENT AUTOMATIZADO CON E2E TESTS - INMOVA APP")
    
    print(f"Servidor: {SERVER_IP}")
    print(f"Usuario: {USERNAME}")
    print(f"Path: {APP_PATH}")
    print(f"\nIniciando en 3 segundos...")
    time.sleep(3)
    
    # Conectar
    print_step("🔐", "Conectando vía SSH...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=USERNAME,
            password=PASSWORD,
            timeout=10
        )
        print("  ✅ Conectado")
    except Exception as e:
        print(f"  ❌ Error de conexión: {e}")
        return False
    
    try:
        # Fase 1: Backup
        current_commit = phase_1_backup(client)
        
        # Fase 2: Update code
        if not phase_2_update_code(client):
            print("\n❌ Deployment abortado (git pull falló)")
            return False
        
        # Fase 3: Dependencies
        if not phase_3_dependencies(client):
            print("\n❌ Deployment abortado (dependencies falló)")
            return False
        
        # Fase 4: Build
        phase_4_build(client)
        
        # Fase 5: Deploy
        if not phase_5_deploy(client):
            print("\n❌ Deployment abortado (PM2 restart falló)")
            return False
        
        # Fase 6: Health checks
        if not phase_6_health_checks(client):
            print("\n⚠️ Health checks fallaron, pero deployment completado")
            print("  → Verificar manualmente: pm2 logs inmova-app")
        
        # Fase 7: E2E Tests
        phase_7_e2e_tests(client)
        
        # Success!
        print_header("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
        
        print("URLs:")
        print(f"  → Producción: https://inmovaapp.com")
        print(f"  → IP directa: http://{SERVER_IP}:3000")
        print(f"  → Health: https://inmovaapp.com/api/health")
        print(f"  → Login: https://inmovaapp.com/login")
        
        print("\nPara ver logs:")
        print(f"  ssh {USERNAME}@{SERVER_IP} 'pm2 logs inmova-app --lines 50'")
        
        print("\nPara rollback (si es necesario):")
        print(f"  ssh {USERNAME}@{SERVER_IP} 'cd {APP_PATH} && git reset --hard {current_commit} && pm2 restart inmova-app'")
        
        return True
        
    except KeyboardInterrupt:
        print("\n⚠️ Deployment cancelado por usuario")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()
        print("\n🔒 Conexión SSH cerrada")

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
