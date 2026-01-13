#!/usr/bin/env python3
"""
Verificar y arreglar conectividad del servidor
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

def exec_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, out, err

def main():
    log("=" * 70, Colors.CYAN)
    log("🔧 VERIFICACIÓN Y FIX DE CONECTIVIDAD", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor via SSH", Colors.GREEN)
        
        # 1. Verificar curl local
        log("\n🔍 [1/6] Verificar app local...", Colors.BLUE)
        status, out, err = exec_cmd(client, "curl -s --max-time 5 http://localhost:3000/api/health 2>&1")
        log(f"  Respuesta local: {out[:300]}", Colors.CYAN)
        
        # 2. Verificar PM2
        log("\n⚙️ [2/6] Verificar PM2...", Colors.BLUE)
        status, out, err = exec_cmd(client, "pm2 list")
        log(f"{out}", Colors.CYAN)
        
        # 3. Verificar firewall
        log("\n🔒 [3/6] Verificar firewall...", Colors.BLUE)
        status, out, err = exec_cmd(client, "ufw status")
        log(f"{out}", Colors.CYAN)
        
        # 4. Verificar puerto 3000 escuchando
        log("\n🔌 [4/6] Verificar puerto 3000...", Colors.BLUE)
        status, out, err = exec_cmd(client, "netstat -tlnp | grep 3000")
        log(f"  {out.strip()}", Colors.CYAN)
        
        # 5. Si hay problema, reiniciar PM2
        log("\n🔄 [5/6] Reiniciando PM2...", Colors.BLUE)
        exec_cmd(client, "pm2 delete all 2>/dev/null || true")
        exec_cmd(client, f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && pm2 start npm --name 'inmova-app' -- start")
        exec_cmd(client, "pm2 save")
        time.sleep(15)
        
        # 6. Verificar de nuevo
        log("\n🏥 [6/6] Verificar después de restart...", Colors.BLUE)
        status, out, err = exec_cmd(client, "curl -s --max-time 10 http://localhost:3000/api/health 2>&1")
        if '"status":"ok"' in out:
            log(f"  ✅ App respondiendo: {out[:200]}", Colors.GREEN)
        else:
            log(f"  ⚠️ Respuesta: {out[:300]}", Colors.YELLOW)
            
        # Ver logs
        log("\n📜 Últimos logs:", Colors.BLUE)
        status, out, err = exec_cmd(client, "pm2 logs inmova-app --lines 15 --nostream 2>&1")
        log(f"{out[-1000:]}", Colors.YELLOW)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ Proceso completado", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
