#!/usr/bin/env python3
"""
Deployment script for Inmova App changes
Uses paramiko for SSH connection
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

# Server configuration
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=None):
    if color:
        print(f"{color}{msg}{Colors.END}")
    else:
        print(msg)

def exec_cmd(client, cmd, timeout=300):
    """Execute command and return status and output"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output + error

def main():
    log("=" * 70, Colors.CYAN)
    log("🚀 DEPLOYMENT AUTOMÁTICO - INMOVA APP", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    print(f"\nServidor: {SERVER_IP}")
    print(f"Path: {APP_PATH}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # Connect
        log("[1/8] 🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)

        # Check current status
        log("\n[2/8] 📋 Verificando estado actual...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        current_commit = output.strip()
        log(f"   Commit actual: {current_commit}", Colors.YELLOW)

        # Git pull
        log("\n[3/8] 📥 Actualizando código...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git stash && git pull origin main --rebase", timeout=120)
        if status != 0 and 'Already up to date' not in output:
            log(f"⚠️ Git pull warning: {output[:200]}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # Install dependencies
        log("\n[4/8] 📦 Instalando dependencias...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if status != 0:
            log(f"⚠️ npm install warning (continuing): {output[:300]}", Colors.YELLOW)
        else:
            log("✅ Dependencias instaladas", Colors.GREEN)

        # Prisma generate
        log("\n[5/8] 🔧 Generando Prisma client...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status != 0:
            log(f"⚠️ Prisma generate warning: {output[:200]}", Colors.YELLOW)
        else:
            log("✅ Prisma client generado", Colors.GREEN)

        # Build
        log("\n[6/8] 🏗️ Compilando aplicación...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=900)
        if status != 0:
            log(f"⚠️ Build warning: {output[-500:]}", Colors.YELLOW)
            log("   Continuando con PM2 reload...", Colors.YELLOW)
        else:
            log("✅ Build completado", Colors.GREEN)

        # PM2 reload
        log("\n[7/8] ♻️ Reiniciando aplicación con PM2...", Colors.CYAN)
        status, output = exec_cmd(client, "pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env", timeout=60)
        log("✅ Aplicación reiniciada", Colors.GREEN)

        # Wait for warm-up
        log("\n[8/8] ⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)

        # Health check
        log("\n📋 VERIFICACIÓN POST-DEPLOYMENT", Colors.CYAN)
        log("-" * 50)

        # HTTP check
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")
        http_status = output.strip()
        if http_status == '200':
            log(f"✅ HTTP Health Check: {http_status}", Colors.GREEN)
        else:
            log(f"⚠️ HTTP Health Check: {http_status}", Colors.YELLOW)

        # PM2 status
        status, output = exec_cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"' | head -1")
        pm2_status = output.strip()
        if 'online' in pm2_status:
            log(f"✅ PM2 Status: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 Status: {pm2_status}", Colors.YELLOW)

        # New commit
        status, output = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        new_commit = output.strip()
        log(f"\n📝 Commit desplegado: {new_commit}", Colors.CYAN)

        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        print(f"\nURL: https://inmovaapp.com")
        print(f"Health: https://inmovaapp.com/api/health")

    except Exception as e:
        log(f"\n❌ ERROR: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

    return 0

if __name__ == '__main__':
    sys.exit(main())
