#!/usr/bin/env python3
"""
Script final para desplegar con código correcto y .env preservado
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
    log("🚀 DEPLOYMENT FINAL CON CÓDIGO Y ENV CORRECTOS", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Guardar .env actual
        log("\n💾 [1/7] Guardando .env actual...", Colors.BLUE)
        exec_cmd(client, f"cp {APP_PATH}/.env {APP_PATH}/.env.backup_final")
        log("✅ .env guardado", Colors.GREEN)
        
        # 2. Git pull del código más reciente
        log("\n📥 [2/7] Actualizando código...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main")
        log("✅ Código actualizado", Colors.GREEN)
        
        # 3. Restaurar .env
        log("\n🔧 [3/7] Restaurando .env...", Colors.BLUE)
        exec_cmd(client, f"cp {APP_PATH}/.env.backup_final {APP_PATH}/.env")
        log("✅ .env restaurado", Colors.GREEN)
        
        # 4. Instalar dependencias si es necesario
        log("\n📦 [4/7] Verificando dependencias...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -3", timeout=300)
        log("✅ Dependencias verificadas", Colors.GREEN)
        
        # 5. Prisma generate
        log("\n🔧 [5/7] Generando Prisma client...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3", timeout=60)
        log("✅ Prisma client generado", Colors.GREEN)
        
        # 6. Build
        log("\n🏗️ [6/7] Building aplicación...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -15", timeout=600)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"⚠️ Build output:\n{out[-500:]}", Colors.YELLOW)
        
        # 7. Reiniciar PM2
        log("\n♻️ [7/7] Reiniciando PM2...", Colors.BLUE)
        restart_cmd = f"""
cd {APP_PATH}
export $(grep -v '^#' .env | xargs)
pm2 delete all 2>/dev/null
pm2 start npm --name 'inmova-app' -- start
pm2 save
"""
        status, out, err = exec_cmd(client, restart_cmd, timeout=120)
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # Esperar warm-up
        log("\n⏳ Esperando warm-up (30s)...", Colors.BLUE)
        time.sleep(30)
        
        # Verificaciones
        log("\n🏥 Verificación final...", Colors.BLUE)
        
        # Health check
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if "connected" in out:
            log(f"✅ Health: OK, Database connected", Colors.GREEN)
        else:
            log(f"⚠️ Health: {out[:200]}", Colors.YELLOW)
        
        # PM2 status
        status, out, err = exec_cmd(client, "pm2 list | head -10")
        log(f"PM2 Status:\n{out}", Colors.CYAN)
        
        # Errores recientes
        status, out, err = exec_cmd(client, "pm2 logs inmova-app --err --nostream --lines 5 | grep -v '^$'")
        if out.strip():
            log(f"Últimos errores:\n{out[-300:]}", Colors.YELLOW)
        else:
            log("✅ No hay errores en logs", Colors.GREEN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ DEPLOYMENT FINAL COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log(f"\n🌐 URL: https://inmovaapp.com", Colors.CYAN)
        log(f"📋 Próximo paso: Ejecutar auditoría final", Colors.CYAN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
