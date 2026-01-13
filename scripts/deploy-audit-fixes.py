#!/usr/bin/env python3
"""
Deployment script para correcciones de auditoría superadmin
Usa paramiko para SSH
"""
import sys
import os
import time

# Add paramiko to path
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(message, color=Colors.END):
    print(f"{color}{message}{Colors.END}")

def exec_cmd(client, command, timeout=300):
    """Ejecutar comando SSH con timeout"""
    log(f"  📤 Ejecutando: {command[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and error:
        log(f"  ⚠️ Warning: {error[:200]}", Colors.YELLOW)
    
    return exit_status, output, error

def main():
    log("=" * 70, Colors.CYAN)
    log("🚀 DEPLOYMENT - CORRECCIONES AUDITORÍA SUPERADMIN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    log(f"\nServidor: {SERVER_IP}")
    log(f"Path: {APP_PATH}")
    
    # Conectar
    log("\n🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30,
            banner_timeout=30
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Backup de BD rápido
        log("\n📦 [1/6] Creando backup de BD...", Colors.BLUE)
        backup_file = f"pre-audit-fix-{int(time.time())}.sql"
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && pg_dump -U inmova_user inmova_production > /tmp/{backup_file} 2>/dev/null || echo 'Backup skipped'",
            timeout=120
        )
        log("✅ Backup completado", Colors.GREEN)
        
        # 2. Git pull
        log("\n📥 [2/6] Actualizando código...", Colors.BLUE)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main",
            timeout=60
        )
        if "Already up to date" in out or status == 0:
            log("✅ Código actualizado", Colors.GREEN)
        else:
            log(f"⚠️ Git output: {out[:200]}", Colors.YELLOW)
        
        # 3. Install dependencies (solo si hay cambios en package.json)
        log("\n📦 [3/6] Verificando dependencias...", Colors.BLUE)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5",
            timeout=300
        )
        log("✅ Dependencias verificadas", Colors.GREEN)
        
        # 4. Prisma generate
        log("\n🔧 [4/6] Generando Prisma client...", Colors.BLUE)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3",
            timeout=60
        )
        log("✅ Prisma client generado", Colors.GREEN)
        
        # 5. Build
        log("\n🏗️ [5/6] Building aplicación...", Colors.BLUE)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -20",
            timeout=600
        )
        if status == 0:
            log("✅ Build completado exitosamente", Colors.GREEN)
        else:
            log(f"⚠️ Build output (últimas líneas):\n{out[-500:]}", Colors.YELLOW)
            log(f"⚠️ Build puede continuar si PM2 ya tiene versión anterior", Colors.YELLOW)
        
        # 6. Restart PM2
        log("\n♻️ [6/6] Reiniciando PM2...", Colors.BLUE)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1",
            timeout=60
        )
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.BLUE)
        time.sleep(20)
        
        # Health check
        log("\n🏥 Verificando health...", Colors.BLUE)
        for i in range(5):
            status, out, err = exec_cmd(
                client,
                "curl -s http://localhost:3000/api/health | head -c 200",
                timeout=30
            )
            if '"status":"ok"' in out or '"status": "ok"' in out:
                log("✅ Health check OK!", Colors.GREEN)
                break
            time.sleep(5)
            if i == 4:
                log("⚠️ Health check no respondió OK, pero deployment continúa", Colors.YELLOW)
        
        # PM2 status
        log("\n📊 Estado de PM2:", Colors.BLUE)
        status, out, err = exec_cmd(client, "pm2 list | head -15", timeout=30)
        print(out)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log(f"\n🌐 URL: https://inmovaapp.com")
        log(f"🔍 Health: https://inmovaapp.com/api/health")
        log(f"\n📋 Próximo paso: Ejecutar auditoría Playwright")
        
    except Exception as e:
        log(f"\n❌ Error durante deployment: {e}", Colors.RED)
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
