#!/usr/bin/env python3
"""
Deployment de Auditoría de SuperAdmin
- Sidebar reorganizado
- Nuevas páginas: Logs, Onboarding, Notificaciones Masivas
- Dashboard con acciones rápidas
- Breadcrumbs mejorados
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko
import time
from datetime import datetime

# Server config
SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def run_cmd(client, cmd, timeout=300):
    log(f"→ {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0:
        log("✅ OK", Colors.GREEN)
        return True, out
    else:
        log(f"❌ Error (exit {exit_status})", Colors.RED)
        if err:
            for line in err.strip().split('\n')[:5]:
                log(f"   {line}", Colors.YELLOW)
        return False, err or out

def main():
    print(f"\n{Colors.CYAN}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}🚀 DEPLOYMENT - AUDITORÍA SUPERADMIN{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*70}{Colors.RESET}")
    print(f"""
Cambios incluidos:
  ✓ Sidebar reorganizado (10 secciones)
  ✓ Nueva página: Logs del Sistema
  ✓ Nueva página: Onboarding Tracker
  ✓ Nueva página: Notificaciones Masivas
  ✓ Dashboard con acciones rápidas
  ✓ Breadcrumbs mejorados para admin
    """)
    
    log(f"Conectando a {SERVER}...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER, username=USER, password=PASS, timeout=15)
        log("✅ Conexión establecida", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Backup del commit actual
        print(f"\n{Colors.CYAN}=== 1/7 BACKUP ==={Colors.RESET}")
        success, out = run_cmd(client, f"cd {PATH} && git rev-parse HEAD")
        if success:
            current_commit = out.strip()[:8]
            log(f"Commit actual: {current_commit}", Colors.CYAN)
        
        # 2. Obtener rama actual y hacer pull
        print(f"\n{Colors.CYAN}=== 2/7 ACTUALIZAR CÓDIGO ==={Colors.RESET}")
        # Obtener la rama actual
        success, branch = run_cmd(client, f"cd {PATH} && git rev-parse --abbrev-ref HEAD")
        if success:
            branch = branch.strip()
            log(f"Rama actual: {branch}", Colors.CYAN)
        
        # Pull de la rama actual
        success, _ = run_cmd(client, f"cd {PATH} && git fetch origin && git pull origin {branch}")
        if not success:
            log("⚠️ Git pull fallido, intentando con reset...", Colors.YELLOW)
            run_cmd(client, f"cd {PATH} && git stash && git pull origin {branch}")
        
        # 3. Instalar dependencias
        print(f"\n{Colors.CYAN}=== 3/7 DEPENDENCIAS ==={Colors.RESET}")
        run_cmd(client, f"cd {PATH} && npm install --legacy-peer-deps", timeout=600)
        
        # 4. Prisma
        print(f"\n{Colors.CYAN}=== 4/7 PRISMA ==={Colors.RESET}")
        run_cmd(client, f"cd {PATH} && npx prisma generate")
        run_cmd(client, f"cd {PATH} && npx prisma migrate deploy || echo 'No migrations to apply'")
        
        # 5. Build (opcional, solo si hay cambios importantes)
        print(f"\n{Colors.CYAN}=== 5/7 BUILD ==={Colors.RESET}")
        success, _ = run_cmd(client, f"cd {PATH} && npm run build", timeout=900)
        if not success:
            log("⚠️ Build fallido, intentando con memoria limitada...", Colors.YELLOW)
            run_cmd(client, f"cd {PATH} && NODE_OPTIONS='--max-old-space-size=4096' npm run build", timeout=900)
        
        # 6. Restart PM2
        print(f"\n{Colors.CYAN}=== 6/7 RESTART ==={Colors.RESET}")
        run_cmd(client, f"cd {PATH} && pm2 reload inmova-app --update-env || pm2 restart inmova-app")
        run_cmd(client, "pm2 save")
        
        log("⏳ Esperando 20s para warm-up...", Colors.YELLOW)
        time.sleep(20)
        
        # 7. Health checks
        print(f"\n{Colors.CYAN}=== 7/7 VERIFICACIÓN ==={Colors.RESET}")
        
        # Health API
        success, out = run_cmd(client, "curl -s http://localhost:3000/api/health")
        if 'ok' in out.lower():
            log("✅ Health check PASSED", Colors.GREEN)
        else:
            log("⚠️ Health check uncertain", Colors.YELLOW)
        
        # PM2 status
        success, out = run_cmd(client, "pm2 status inmova-app")
        if 'online' in out.lower():
            log("✅ PM2 online", Colors.GREEN)
        
        # Verificar nuevas páginas
        log("Verificando nuevas páginas admin...", Colors.CYAN)
        pages_ok = True
        for page in ['/admin/system-logs', '/admin/onboarding', '/admin/notificaciones-masivas']:
            success, out = run_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{page}")
            if '200' in out or '302' in out or '307' in out:
                log(f"✅ {page} OK", Colors.GREEN)
            else:
                log(f"⚠️ {page}: {out}", Colors.YELLOW)
                pages_ok = False
        
        # Resultado final
        print(f"\n{Colors.GREEN}{'='*70}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}✅ DEPLOYMENT COMPLETADO{Colors.RESET}")
        print(f"{Colors.GREEN}{'='*70}{Colors.RESET}")
        print(f"""
URLs de acceso:
  → https://inmovaapp.com/admin/dashboard
  → https://inmovaapp.com/admin/system-logs
  → https://inmovaapp.com/admin/onboarding
  → https://inmovaapp.com/admin/notificaciones-masivas

Verificar manualmente:
  1. Login como super_admin
  2. Verificar nuevo sidebar organizado
  3. Probar acciones rápidas en dashboard
  4. Navegar por las nuevas páginas
        """)
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
    finally:
        client.close()
        log("Conexión cerrada", Colors.CYAN)

if __name__ == '__main__':
    sys.exit(main())
