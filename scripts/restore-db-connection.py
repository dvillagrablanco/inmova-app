#!/usr/bin/env python3
"""
Script para restaurar la conexión a BD con credenciales correctas
"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

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

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return exit_status, stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

def main():
    log("=" * 70, Colors.CYAN)
    log("🔧 RESTAURAR CONEXIÓN A BASE DE DATOS", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Buscar DATABASE_URL en backups
        log("\n📋 [1/5] Buscando DATABASE_URL en backups...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"grep -h 'DATABASE_URL' {APP_PATH}/.env.production.backup* 2>/dev/null | grep -v dummy | head -5")
        log(f"DATABASE_URLs encontradas:\n{out}", Colors.CYAN)
        
        # Buscar en .env.local también
        status, local_out, err = exec_cmd(client, f"grep 'DATABASE_URL' {APP_PATH}/.env.local 2>/dev/null | head -1")
        if local_out.strip():
            log(f".env.local DATABASE_URL: {local_out}", Colors.GREEN)
        
        # 2. Obtener DATABASE_URL del safe_backup
        log("\n📋 [2/5] Obteniendo DATABASE_URL del safe_backup...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"grep 'DATABASE_URL' {APP_PATH}/.env.production.safe_backup | head -1")
        db_url = out.strip()
        log(f"DATABASE_URL: {db_url[:80]}..." if len(db_url) > 80 else f"DATABASE_URL: {db_url}", Colors.CYAN)
        
        # 3. Obtener todas las variables del safe_backup
        log("\n📋 [3/5] Restaurando .env desde safe_backup...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cp {APP_PATH}/.env.production.safe_backup {APP_PATH}/.env")
        log("✅ .env restaurado desde safe_backup", Colors.GREEN)
        
        # 4. Reiniciar PM2
        log("\n♻️ [4/5] Reiniciando PM2 con nuevas variables...", Colors.BLUE)
        restart_cmd = f"""
cd {APP_PATH}
export $(grep -v '^#' .env | xargs)
pm2 delete all 2>/dev/null
pm2 start npm --name 'inmova-app' -- start
pm2 save
"""
        status, out, err = exec_cmd(client, restart_cmd, timeout=120)
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # Esperar
        log("\n⏳ Esperando warm-up (30s)...", Colors.BLUE)
        time.sleep(30)
        
        # 5. Verificación
        log("\n🏥 [5/5] Verificación final...", Colors.BLUE)
        
        # Health check
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        log(f"Health: {out}", Colors.CYAN)
        
        # Verificar conexión BD
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health | jq -r '.checks.database' 2>/dev/null || echo 'jq not available'")
        log(f"Database status: {out.strip()}", Colors.GREEN if "connected" in out else Colors.YELLOW)
        
        # PM2 status
        status, out, err = exec_cmd(client, "pm2 list | head -10")
        log(f"PM2 Status:\n{out}", Colors.CYAN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ PROCESO COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
