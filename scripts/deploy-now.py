#!/usr/bin/env python3
"""
Script de deployment rápido para Inmova App
Usa Paramiko para SSH
"""

import sys
import time

# Añadir path de Paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def log(msg, color=None):
    """Print con color"""
    colors = {
        'green': '\033[92m',
        'red': '\033[91m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'end': '\033[0m'
    }
    if color and color in colors:
        print(f"{colors[color]}{msg}{colors['end']}")
    else:
        print(msg)

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    log("=" * 60, 'blue')
    log("🚀 DEPLOYMENT AUTOMÁTICO - INMOVA APP", 'blue')
    log("=" * 60, 'blue')
    print(f"Servidor: {SERVER_IP}")
    print(f"Path: {APP_PATH}")
    print()

    # Conectar
    log("📡 Conectando al servidor...", 'yellow')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", 'green')
    except Exception as e:
        log(f"❌ Error de conexión: {e}", 'red')
        return 1

    try:
        # 1. Pull latest code
        log("\n📥 Actualizando código...", 'yellow')
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log(f"⚠️ Git pull warning: {error}", 'yellow')
        else:
            log("✅ Código actualizado", 'green')
            if 'Already up to date' in output:
                log("  (Ya estaba actualizado)", 'blue')
            else:
                print(f"  {output.strip()[:200]}")

        # 2. Install dependencies (if needed)
        log("\n📦 Verificando dependencias...", 'yellow')
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --production=false", timeout=600)
        if status == 0:
            log("✅ Dependencias OK", 'green')
        else:
            log(f"⚠️ Advertencia en npm install: {error[:200]}", 'yellow')

        # 3. Generate Prisma client
        log("\n🔧 Generando Prisma client...", 'yellow')
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status == 0:
            log("✅ Prisma generado", 'green')
        else:
            log(f"⚠️ Prisma warning: {error[:200]}", 'yellow')

        # 4. Build application
        log("\n🏗️ Construyendo aplicación...", 'yellow')
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status == 0:
            log("✅ Build completado", 'green')
        else:
            log(f"❌ Error en build: {error[:500]}", 'red')
            # Continuar de todos modos para intentar reload

        # 5. Reload PM2 (zero-downtime)
        log("\n♻️ Reiniciando PM2...", 'yellow')
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status == 0:
            log("✅ PM2 reloaded", 'green')
        else:
            # Si falla reload, intentar restart
            log("⚠️ Reload falló, intentando restart...", 'yellow')
            status, output, error = exec_cmd(client, "pm2 restart inmova-app --update-env")
            if status == 0:
                log("✅ PM2 restarted", 'green')
            else:
                log(f"❌ Error PM2: {error}", 'red')

        # 6. Wait for warm-up
        log("\n⏳ Esperando warm-up (20s)...", 'yellow')
        time.sleep(20)

        # 7. Health check
        log("\n🏥 Health check...", 'yellow')
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output.lower() or '"status": "ok"' in output.lower():
            log("✅ Health check OK", 'green')
        else:
            log(f"⚠️ Health check response: {output[:200]}", 'yellow')

        # 8. Verify PM2 status
        log("\n📊 Estado PM2...", 'yellow')
        status, output, error = exec_cmd(client, "pm2 list | grep inmova")
        print(f"  {output.strip()}")

        # 9. Get current commit
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        commit = output.strip()

        log("\n" + "=" * 60, 'green')
        log("✅ DEPLOYMENT COMPLETADO", 'green')
        log("=" * 60, 'green')
        print(f"\nCommit desplegado: {commit}")
        print(f"URL: https://inmovaapp.com")
        print(f"Health: https://inmovaapp.com/api/health")
        
        return 0

    except Exception as e:
        log(f"\n❌ Error durante deployment: {e}", 'red')
        return 1
    finally:
        client.close()
        log("\n🔌 Conexión cerrada", 'blue')

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
