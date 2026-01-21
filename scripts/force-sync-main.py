#!/usr/bin/env python3
"""
Forzar sincronización del servidor con main - Reset agresivo
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

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class C:
    G = '\033[92m'
    R = '\033[91m'
    Y = '\033[93m'
    B = '\033[94m'
    C = '\033[96m'
    E = '\033[0m'
    BOLD = '\033[1m'

def log(msg, c=C.E):
    print(f"{c}[{datetime.now().strftime('%H:%M:%S')}] {msg}{C.E}")

def cmd(client, command, timeout=300):
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        return status, out, err
    except Exception as e:
        return -1, "", str(e)

def main():
    print(f"\n{C.C}{'='*60}\n🔄 FORZAR SINCRONIZACIÓN CON MAIN\n{'='*60}{C.E}\n")

    log("🔐 Conectando...", C.B)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado", C.G)
    except Exception as e:
        log(f"❌ Error: {e}", C.R)
        return False

    try:
        # 1. Commit actual
        _, out, _ = cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        old_commit = out.strip()
        log(f"📌 Commit actual: {old_commit}", C.Y)

        # 2. Limpiar cambios locales y fetch
        log("🧹 Limpiando cambios locales...", C.C)
        cmd(client, f"cd {APP_PATH} && git stash --all 2>/dev/null || true")
        cmd(client, f"cd {APP_PATH} && git clean -fd 2>/dev/null || true")
        
        # 3. Fetch con prune
        log("📥 Fetching origin/main...", C.C)
        cmd(client, f"cd {APP_PATH} && git fetch origin main --prune", timeout=120)
        
        # 4. Reset HARD a origin/main
        log("🔄 Reset hard a origin/main...", C.C)
        status, out, err = cmd(client, f"cd {APP_PATH} && git reset --hard origin/main")
        if status != 0:
            log(f"⚠️ Reset warning: {err[:100]}", C.Y)
        
        # 5. Verificar nuevo commit
        _, out, _ = cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        new_commit = out.strip()
        log(f"📌 Nuevo commit: {new_commit}", C.G)

        # 6. Mostrar últimos commits
        log("\n📊 Últimos commits en servidor:", C.C)
        _, out, _ = cmd(client, f"cd {APP_PATH} && git log --oneline -5")
        for line in out.strip().split('\n')[:5]:
            print(f"  {line}")

        if old_commit != new_commit:
            log(f"\n✅ Servidor actualizado: {old_commit} → {new_commit}", C.G)
            
            # Rebuild
            log("\n📦 Instalando dependencias...", C.C)
            cmd(client, f"cd {APP_PATH} && npm ci --legacy-peer-deps 2>&1 | tail -2", timeout=600)
            
            log("🔧 Generando Prisma...", C.C)
            cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
            
            log("🏗️ Building...", C.C)
            status, out, err = cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
            if status != 0:
                log(f"❌ Build falló: {err[:200]}", C.R)
                return False
            log("✅ Build OK", C.G)
            
            log("♻️ Reiniciando PM2...", C.C)
            cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env", timeout=60)
            cmd(client, "pm2 save")
            
            log("⏳ Warm-up (25s)...", C.C)
            time.sleep(25)
        else:
            log("ℹ️ Servidor ya está en la versión correcta", C.Y)

        # Health check
        log("\n🏥 Health check...", C.C)
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/health")
        if '"status":"ok"' in out:
            log("✅ Health OK", C.G)
        else:
            log(f"⚠️ Health: {out[:100]}", C.Y)

        _, out, _ = cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"' | head -1")
        if "online" in out:
            log("✅ PM2 online", C.G)

        print(f"\n{C.G}{'='*60}\n✅ SINCRONIZACIÓN COMPLETADA\n{'='*60}{C.E}")
        print(f"\n{C.BOLD}Versión:{C.E} {new_commit}")
        print(f"{C.BOLD}URL:{C.E} https://inmovaapp.com\n")
        return True

    except Exception as e:
        log(f"❌ Error: {e}", C.R)
        return False
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
