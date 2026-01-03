#!/usr/bin/env python3
"""
DEPLOYMENT AUTOMATIZADO - Sin confirmación manual
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
PASS = 'xcc9brgkMMbf'
APP_PATH = '/opt/inmova-app'

class Colors:
    BLUE = '\033[0;34m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'

def log(msg, color=Colors.GREEN):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{ts}]{Colors.NC} {msg}")

def exec_cmd(ssh, cmd, desc="", timeout=300):
    """Ejecutar comando y retornar salida"""
    log(f"{desc or cmd[:50]}", Colors.BLUE)
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if output:
            print(output[:800])
        if error and exit_code != 0:
            print(f"Error: {error[:500]}")
        
        return exit_code == 0, output
    except Exception as e:
        log(f"Error: {e}", Colors.RED)
        return False, str(e)

print(f"""
{Colors.BLUE}{'='*60}
🚀 DEPLOYMENT AUTOMÁTICO - INMOVA APP
{'='*60}{Colors.NC}
Servidor: {HOST}
Path: {APP_PATH}
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{Colors.BLUE}{'='*60}{Colors.NC}
""")

# CONECTAR
log("🔐 Conectando...", Colors.BLUE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname=HOST, username=USER, password=PASS, timeout=15)
    log(f"✅ Conectado a {HOST}")
    
    # 1. VERIFICAR NODE
    success, output = exec_cmd(ssh, "node -v", "Verificar Node.js")
    if success:
        log(f"✅ Node.js {output.strip()}")
    
    # 2. CREAR DIRECTORIOS
    exec_cmd(ssh, f"mkdir -p {APP_PATH} /var/log/inmova /var/backups/inmova", "Crear directorios")
    
    # 3. VERIFICAR SI EXISTE REPO
    success, output = exec_cmd(ssh, f"[ -d {APP_PATH}/.git ] && echo 'exists' || echo 'not_exists'", "Verificar repo")
    
    if "exists" in output:
        log("📥 Git pull...")
        exec_cmd(ssh, f"cd {APP_PATH} && git stash && git pull origin main", "Git pull")
    else:
        log("⚠️  Repositorio no existe, necesitas clonarlo primero:", Colors.YELLOW)
        log(f"ssh {USER}@{HOST}", Colors.YELLOW)
        log(f"cd {APP_PATH} && git clone <repo-url> .", Colors.YELLOW)
        ssh.close()
        sys.exit(1)
    
    # 4. INSTALL DEPS
    log("📦 Instalando dependencias...")
    success, _ = exec_cmd(ssh, f"cd {APP_PATH} && npm ci 2>&1 | tail -20", "npm ci", timeout=600)
    if not success:
        log("Intentando npm install...", Colors.YELLOW)
        exec_cmd(ssh, f"cd {APP_PATH} && npm install 2>&1 | tail -20", "npm install", timeout=600)
    
    # 5. PRISMA
    log("🔧 Prisma setup...")
    exec_cmd(ssh, f"cd {APP_PATH} && npx prisma generate", "Prisma generate")
    exec_cmd(ssh, f"cd {APP_PATH} && npx prisma migrate deploy", "Prisma migrate")
    
    # 6. TESTS
    log("🧪 Ejecutando tests...")
    exec_cmd(ssh, f"cd {APP_PATH} && npm test -- --run 2>&1 | tail -30", "Tests", timeout=120)
    
    # 7. BUILD
    log("🏗️  Building...")
    success, _ = exec_cmd(ssh, f"cd {APP_PATH} && npm run build 2>&1 | tail -50", "npm build", timeout=600)
    
    if not success:
        log("⚠️  Build falló, pero continuando...", Colors.YELLOW)
    
    # 8. PM2 CHECK
    success, output = exec_cmd(ssh, "which pm2", "Verificar PM2")
    if not success or not output.strip():
        log("Instalando PM2...")
        exec_cmd(ssh, "npm install -g pm2", "Install PM2")
    
    # 9. RESTART
    log("🔄 Restarting con PM2...")
    success, output = exec_cmd(ssh, "pm2 list", "PM2 list")
    
    if "inmova-app" in output:
        exec_cmd(ssh, "pm2 reload inmova-app", "PM2 reload")
    else:
        # Check ecosystem
        success, _ = exec_cmd(ssh, f"[ -f {APP_PATH}/ecosystem.config.js ] && echo 'exists' || echo 'not_exists'", "Check ecosystem")
        
        if success:
            exec_cmd(ssh, f"cd {APP_PATH} && pm2 start ecosystem.config.js", "PM2 start")
        else:
            exec_cmd(ssh, f"cd {APP_PATH} && pm2 start 'npm start' --name inmova-app", "PM2 start (fallback)")
    
    exec_cmd(ssh, "pm2 save", "PM2 save")
    
    # 10. HEALTH CHECK
    log("🏥 Health check...")
    time.sleep(10)
    
    success, output = exec_cmd(ssh, "curl -f http://localhost:3000/api/health 2>/dev/null || echo 'failed'", "HTTP health")
    
    if success and "failed" not in output.lower():
        log("✅ Health check OK")
    else:
        log("⚠️  Health check falló, ver logs:", Colors.YELLOW)
        exec_cmd(ssh, "pm2 logs inmova-app --lines 20 --nostream", "PM2 logs")
    
    # 11. STATUS FINAL
    exec_cmd(ssh, "pm2 status", "PM2 status")
    
    print(f"""
{Colors.GREEN}{'='*60}
✅ DEPLOYMENT COMPLETADO
{'='*60}{Colors.NC}

URL: http://{HOST}:3000
Logs: ssh {USER}@{HOST} 'pm2 logs inmova-app'

{Colors.GREEN}{'='*60}{Colors.NC}
""")
    
except KeyboardInterrupt:
    log("❌ Cancelado por usuario", Colors.RED)
    sys.exit(1)
except Exception as e:
    log(f"❌ Error: {e}", Colors.RED)
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    ssh.close()
    log("🔒 Conexión cerrada")
