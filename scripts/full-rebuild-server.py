#!/usr/bin/env python3
"""
Rebuild completo del servidor
"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import secrets

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

def exec_cmd(client, cmd, timeout=600):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, out, err

def main():
    log("=" * 70, Colors.CYAN)
    log("🔧 REBUILD COMPLETO DEL SERVIDOR", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # 1. Detener app
        log("\n🛑 [1/6] Deteniendo aplicación...", Colors.BLUE)
        exec_cmd(client, "pm2 stop inmova-app 2>/dev/null || true")
        log("  ✅ App detenida", Colors.GREEN)
        
        # 2. Generar nuevo NEXTAUTH_SECRET
        log("\n🔑 [2/6] Generando nuevo NEXTAUTH_SECRET...", Colors.BLUE)
        new_secret = secrets.token_hex(32)
        exec_cmd(client, f'''cd {APP_PATH} && 
            sed -i 's/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET={new_secret}/' .env''')
        log("  ✅ Secret actualizado", Colors.GREEN)
        
        # 3. Limpiar cache y builds anteriores
        log("\n🧹 [3/6] Limpiando cache...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && rm -rf .next/cache .next/server")
        log("  ✅ Cache limpiado", Colors.GREEN)
        
        # 4. Regenerar Prisma
        log("\n📦 [4/6] Regenerando Prisma client...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && npx prisma generate 2>&1")
        if "Generated" in out:
            log("  ✅ Prisma regenerado", Colors.GREEN)
        else:
            log(f"  ⚠️ {out[-300:]}", Colors.YELLOW)
        
        # 5. Rebuild
        log("\n🏗️ [5/6] Rebuilding aplicación (esto toma ~3-5 minutos)...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && npm run build 2>&1",
            timeout=900
        )
        if "compiled" in out.lower() or "success" in out.lower() or "ready" in out.lower():
            log("  ✅ Build completado", Colors.GREEN)
        else:
            log(f"  ⚠️ Build output: {out[-500:]}", Colors.YELLOW)
        
        # 6. Reiniciar
        log("\n🔄 [6/6] Reiniciando aplicación...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && pm2 start npm --name 'inmova-app' -- start")
        exec_cmd(client, "pm2 save")
        
        # Esperar warm-up
        log("  ⏳ Esperando warm-up (30s)...", Colors.YELLOW)
        time.sleep(30)
        
        # Verificar
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in out:
            log("  ✅ App funcionando correctamente", Colors.GREEN)
            log(f"  Health: {out[:200]}", Colors.CYAN)
        else:
            log(f"  ⚠️ Health response: {out[:200]}", Colors.YELLOW)
        
        # Verificar logs
        log("\n📜 Logs recientes:", Colors.BLUE)
        status, out, err = exec_cmd(client, "pm2 logs inmova-app --lines 10 --nostream 2>&1")
        if "JWT_SESSION_ERROR" in out:
            log("  ⚠️ Aún hay errores JWT (sesiones antiguas)", Colors.YELLOW)
        else:
            log("  ✅ Sin errores JWT", Colors.GREEN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ REBUILD COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
