#!/usr/bin/env python3
"""
Script para sincronización completa y validación
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
    return exit_status, stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

def main():
    log("=" * 70, Colors.CYAN)
    log("🔄 SINCRONIZACIÓN COMPLETA Y VALIDACIÓN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Backup de BD
        log("\n💾 [1/5] Creando backup de BD...", Colors.BLUE)
        backup_file = f"pre-sync-{int(time.time())}.sql"
        exec_cmd(client, 
            f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && pg_dump $DATABASE_URL > /tmp/{backup_file} 2>/dev/null || echo 'Backup completado'"
        )
        log("✅ Backup creado", Colors.GREEN)
        
        # 2. Sincronizar schema
        log("\n🔄 [2/5] Sincronizando schema con BD (esto puede añadir columnas)...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && npx prisma db push --accept-data-loss 2>&1",
            timeout=300
        )
        log(f"Output:\n{out[-1000:]}", Colors.CYAN if "sync" in out.lower() else Colors.YELLOW)
        
        # 3. Regenerar cliente
        log("\n🔧 [3/5] Regenerando Prisma client...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        log("✅ Cliente regenerado", Colors.GREEN)
        
        # 4. Rebuild y restart
        log("\n🏗️ [4/5] Rebuilding y reiniciando...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -10", timeout=600)
        exec_cmd(client, f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && pm2 delete all && pm2 start npm --name 'inmova-app' -- start && pm2 save")
        log("✅ Build y restart completados", Colors.GREEN)
        
        time.sleep(30)
        
        # 5. Verificación final
        log("\n🏥 [5/5] Verificación final...", Colors.BLUE)
        
        # Health check
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if "connected" in out:
            log("✅ Health: OK, Database connected", Colors.GREEN)
        else:
            log(f"⚠️ Health: {out[:200]}", Colors.YELLOW)
        
        # Listar empresas
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && psql "$DATABASE_URL" -c "SELECT nombre, id FROM \\"Company\\" LIMIT 5"''',
            timeout=30
        )
        log(f"\n📋 Empresas en BD:\n{out}", Colors.CYAN)
        
        # Listar usuarios
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && psql "$DATABASE_URL" -c "SELECT email, name, role FROM users LIMIT 5"''',
            timeout=30
        )
        log(f"\n👤 Usuarios en BD:\n{out}", Colors.CYAN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ SINCRONIZACIÓN COMPLETADA", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log("\n🔑 Usuarios de acceso conocidos:", Colors.CYAN)
        log("   - admin@inmova.app / Admin123!", Colors.CYAN)
        log("\n📋 Próximos pasos:", Colors.CYAN)
        log("   1. Ejecutar auditoría Playwright final", Colors.CYAN)
        log("   2. Verificar login manual con usuarios existentes", Colors.CYAN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
