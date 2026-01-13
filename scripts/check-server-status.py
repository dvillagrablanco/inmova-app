#!/usr/bin/env python3
"""
Verificar estado del servidor y configuración
"""
import sys
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

def exec_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, out, err

def main():
    log("=" * 70, Colors.CYAN)
    log("🔍 VERIFICACIÓN DE ESTADO DEL SERVIDOR", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # 1. Verificar archivos .env
        log("\n📄 [1/7] Verificando archivos .env...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"ls -la {APP_PATH}/.env* 2>&1")
        log(f"{out}", Colors.CYAN)
        
        # 2. Verificar DATABASE_URL en .env
        log("\n🔑 [2/7] Verificando DATABASE_URL...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && grep -E 'DATABASE_URL' .env 2>/dev/null | head -1")
        if 'DATABASE_URL' in out:
            # Ocultar password
            db_url = out.strip()
            if '@' in db_url:
                parts = db_url.split('@')
                log(f"  DATABASE_URL=***@{parts[-1][:50]}...", Colors.GREEN)
            else:
                log(f"  {db_url[:60]}...", Colors.GREEN)
        else:
            log("  ❌ DATABASE_URL no encontrado en .env", Colors.RED)
            
            # Verificar en .env.production
            status, out, err = exec_cmd(client, f"cd {APP_PATH} && grep -E 'DATABASE_URL' .env.production 2>/dev/null | head -1")
            if 'DATABASE_URL' in out:
                log("  ℹ️ DATABASE_URL encontrado en .env.production", Colors.YELLOW)
        
        # 3. Verificar PostgreSQL corriendo
        log("\n🐘 [3/7] Verificando PostgreSQL...", Colors.BLUE)
        status, out, err = exec_cmd(client, "systemctl status postgresql 2>&1 | head -10")
        if 'active (running)' in out.lower():
            log("  ✅ PostgreSQL está activo", Colors.GREEN)
        else:
            log(f"  ⚠️ PostgreSQL status:\n{out[:300]}", Colors.YELLOW)
        
        # 4. Verificar PM2
        log("\n⚙️ [4/7] Verificando PM2...", Colors.BLUE)
        status, out, err = exec_cmd(client, "pm2 list")
        log(f"{out}", Colors.CYAN)
        
        # 5. Verificar puerto 3000
        log("\n🔌 [5/7] Verificando puerto 3000...", Colors.BLUE)
        status, out, err = exec_cmd(client, "netstat -tlnp | grep 3000")
        if '3000' in out:
            log(f"  ✅ Puerto 3000 escuchando: {out.strip()}", Colors.GREEN)
        else:
            log("  ❌ Puerto 3000 no está escuchando", Colors.RED)
        
        # 6. Verificar health check
        log("\n🏥 [6/7] Verificando health check...", Colors.BLUE)
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health 2>&1")
        log(f"  Respuesta: {out[:500]}", Colors.CYAN)
        
        # 7. Verificar logs recientes
        log("\n📜 [7/7] Logs recientes de PM2...", Colors.BLUE)
        status, out, err = exec_cmd(client, "pm2 logs inmova-app --lines 20 --nostream 2>&1")
        log(f"{out[-1500:]}", Colors.YELLOW)
        
        # Resumen
        log("\n" + "=" * 70, Colors.CYAN)
        log("📊 ACCIONES RECOMENDADAS", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
