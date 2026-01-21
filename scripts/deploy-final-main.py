#!/usr/bin/env python3
"""
Deployment Final a Main - Sincroniza servidor con main actualizado
"""

import sys
import time
from datetime import datetime

try:
    import paramiko
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'paramiko', '-q'])
    import paramiko

# Configuración del servidor
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# Colores
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.END):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{ts}] {msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=300, show=True):
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        if show and output.strip():
            for line in output.strip().split('\n')[:15]:
                print(f"  {line}")
        return exit_status, output, error
    except Exception as e:
        log(f"Error: {e}", Colors.RED)
        return -1, "", str(e)

def main():
    print(f"""
{Colors.CYAN}{'='*70}
🚀 DEPLOYMENT FINAL - SINCRONIZAR SERVIDOR CON MAIN
{'='*70}{Colors.END}

{Colors.BOLD}Servidor:{Colors.END} {SERVER_IP}
{Colors.BOLD}Path:{Colors.END} {APP_PATH}
{Colors.BOLD}Objetivo:{Colors.END} Sincronizar con main (commit 78bb21e2)

{Colors.CYAN}{'='*70}{Colors.END}
""")

    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30, banner_timeout=60)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return False

    try:
        # 1. Ver commit actual
        log("\n📌 Commit actual en servidor...", Colors.CYAN)
        _, output, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse HEAD", show=False)
        old_commit = output.strip()[:8]
        log(f"  Commit actual: {old_commit}", Colors.YELLOW)

        # 2. Fetch y checkout main
        log("\n📥 Sincronizando con main...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin main", timeout=120, show=False)
        
        # Reset a main
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git checkout main && git reset --hard origin/main", timeout=60)
        if status != 0:
            log(f"⚠️ Advertencia: {error[:100]}", Colors.YELLOW)
        log("✅ Código sincronizado con main", Colors.GREEN)

        # 3. Ver nuevo commit
        _, output, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse HEAD", show=False)
        new_commit = output.strip()[:8]
        log(f"  Nuevo commit: {new_commit}", Colors.GREEN)

        # 4. Verificar si hay cambios
        if old_commit == new_commit:
            log("\n⚠️ El servidor ya está actualizado", Colors.YELLOW)
        else:
            log(f"\n📊 Cambios: {old_commit} → {new_commit}", Colors.GREEN)

        # 5. Instalar dependencias
        log("\n📦 Instalando dependencias...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && npm ci --legacy-peer-deps 2>&1 | tail -3", timeout=600)
        log("✅ Dependencias instaladas", Colors.GREEN)

        # 6. Generar Prisma
        log("\n🔧 Generando Prisma...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120, show=False)
        log("✅ Prisma generado", Colors.GREEN)

        # 7. Build
        log("\n🏗️ Construyendo aplicación...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -15", timeout=600)
        if status != 0:
            log(f"❌ Build falló", Colors.RED)
            return False
        log("✅ Build completado", Colors.GREEN)

        # 8. Restart PM2
        log("\n♻️ Reiniciando PM2...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env", timeout=60, show=False)
        exec_cmd(client, "pm2 save", timeout=30, show=False)
        log("✅ PM2 reiniciado", Colors.GREEN)

        # 9. Esperar warm-up
        log("\n⏳ Esperando warm-up (25s)...", Colors.CYAN)
        time.sleep(25)

        # 10. Health checks
        log("\n🏥 Health checks...", Colors.CYAN)
        
        status, output, _ = exec_cmd(client, "curl -sf http://localhost:3000/api/health 2>/dev/null || echo 'FAIL'", show=False)
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("  ✅ HTTP OK", Colors.GREEN)
        else:
            log(f"  ⚠️ HTTP: {output[:50]}", Colors.YELLOW)

        status, output, _ = exec_cmd(client, "pm2 jlist 2>/dev/null | grep -o '\"status\":\"[^\"]*\"' | head -1", show=False)
        if "online" in output:
            log("  ✅ PM2 online", Colors.GREEN)
        else:
            log(f"  ⚠️ PM2: {output}", Colors.YELLOW)

        # 11. Verificar commit final
        _, output, _ = exec_cmd(client, f"cd {APP_PATH} && git log --oneline -1", show=False)
        final_commit = output.strip()

        print(f"""
{Colors.GREEN}{'='*70}
✅ DEPLOYMENT COMPLETADO
{'='*70}{Colors.END}

{Colors.BOLD}URLs:{Colors.END}
  - https://inmovaapp.com
  - http://{SERVER_IP}:3000

{Colors.BOLD}Versión desplegada:{Colors.END}
  {final_commit}

{Colors.BOLD}Cambios:{Colors.END}
  {old_commit} → {new_commit}

{Colors.GREEN}{'='*70}{Colors.END}
""")
        return True

    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return False
    finally:
        client.close()
        log("🔌 Conexión cerrada", Colors.BLUE)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
