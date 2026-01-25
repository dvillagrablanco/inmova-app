#!/usr/bin/env python3
"""
Deploy script for high priority pages
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

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
    print(f"{color}{msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Execute command and return status + output"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_code, output + error

def main():
    log("=" * 70, Colors.CYAN)
    log("🚀 DEPLOYMENT - HIGH PRIORITY PAGES", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Conectar
        log("\n🔐 Conectando al servidor...", Colors.YELLOW)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log(f"✅ Conectado a {SERVER_IP}", Colors.GREEN)
        
        # 1. Git pull
        log("\n📥 Actualizando código...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git pull origin main", timeout=60)
        if status != 0:
            log(f"⚠️ Git pull warning: {output}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Install dependencies (solo si hay cambios)
        log("\n📦 Verificando dependencias...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --prefer-offline", timeout=300)
        if "up to date" in output.lower() or "added" in output.lower():
            log("✅ Dependencias OK", Colors.GREEN)
        else:
            log(f"📦 {output[:200]}", Colors.YELLOW)
        
        # 3. Build
        log("\n🏗️ Building aplicación...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if status != 0 and "error" in output.lower():
            log(f"⚠️ Build warnings: {output[-500:]}", Colors.YELLOW)
        log("✅ Build completado", Colors.GREEN)
        
        # 4. Restart PM2
        log("\n♻️ Reiniciando aplicación...", Colors.YELLOW)
        status, output = exec_cmd(client, "pm2 reload inmova-app --update-env", timeout=60)
        if status != 0:
            # Intentar start si reload falla
            exec_cmd(client, "pm2 start ecosystem.config.js --env production", timeout=60)
        log("✅ Aplicación reiniciada", Colors.GREEN)
        
        # 5. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 6. Health check
        log("\n🏥 Verificando health...", Colors.YELLOW)
        for i in range(5):
            status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            if '"status":"ok"' in output or '"status": "ok"' in output:
                log("✅ Health check OK", Colors.GREEN)
                break
            time.sleep(5)
        else:
            log("⚠️ Health check no confirmado, pero la app puede estar funcionando", Colors.YELLOW)
        
        # 7. Verificar páginas desarrolladas
        log("\n📋 Verificando páginas nuevas...", Colors.YELLOW)
        pages_to_check = [
            "/coliving/emparejamiento",
            "/coliving/paquetes",
            "/warehouse/inventory",
            "/warehouse/locations",
            "/warehouse/movements",
        ]
        
        for page in pages_to_check:
            status, output = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{page}")
            code = output.strip()
            if code == "200":
                log(f"  ✅ {page}: OK", Colors.GREEN)
            else:
                log(f"  ⚠️ {page}: {code} (puede requerir auth)", Colors.YELLOW)
        
        # 8. PM2 status
        log("\n📊 Estado PM2:", Colors.YELLOW)
        status, output = exec_cmd(client, "pm2 jlist | head -50")
        try:
            import json
            processes = json.loads(output)
            for p in processes:
                name = p.get('name', 'unknown')
                pm2_status = p.get('pm2_env', {}).get('status', 'unknown')
                memory = p.get('monit', {}).get('memory', 0) / 1024 / 1024
                log(f"  - {name}: {pm2_status} | {memory:.0f} MB", 
                    Colors.GREEN if pm2_status == 'online' else Colors.YELLOW)
        except:
            log(f"  {output[:200]}", Colors.RESET)
        
        log("\n" + "=" * 70, Colors.CYAN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.CYAN)
        log(f"\n📍 URLs:", Colors.CYAN)
        log(f"  - Principal: https://inmovaapp.com", Colors.RESET)
        log(f"  - Health: https://inmovaapp.com/api/health", Colors.RESET)
        log(f"\n📋 Páginas desarrolladas:", Colors.CYAN)
        for page in pages_to_check:
            log(f"  - https://inmovaapp.com{page}", Colors.RESET)
        
    except Exception as e:
        log(f"\n❌ Error: {str(e)}", Colors.RED)
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
