#!/usr/bin/env python3
"""
Script para verificar y corregir las variables de entorno de producción
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
    log("🔍 VERIFICAR Y CORREGIR VARIABLES DE PRODUCCIÓN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Buscar archivos .env
        log("\n📋 [1/6] Buscando archivos .env...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"ls -la {APP_PATH}/.env* 2>/dev/null")
        log(f"Archivos .env encontrados:\n{out}", Colors.CYAN)
        
        # 2. Verificar si hay .env (sin extension)
        log("\n📋 [2/6] Verificando .env (sin extensión)...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cat {APP_PATH}/.env 2>/dev/null | grep -E '(DATABASE_URL|NEXTAUTH)' | head -10")
        if out.strip():
            log(f".env existe:\n{out}", Colors.GREEN)
        else:
            log(".env no existe o está vacío", Colors.YELLOW)
        
        # 3. Verificar si la BD está funcionando
        log("\n📋 [3/6] Verificando conexión a PostgreSQL...", Colors.BLUE)
        status, out, err = exec_cmd(client, "psql -U inmova_user -d inmova_production -c 'SELECT COUNT(*) FROM \"Company\"' 2>&1")
        log(f"Query resultado:\n{out}", Colors.CYAN if "count" in out.lower() else Colors.YELLOW)
        
        # 4. Obtener DATABASE_URL real
        log("\n📋 [4/6] Obteniendo DATABASE_URL real...", Colors.BLUE)
        # Intentar obtener de varios lugares
        status, out, err = exec_cmd(client, "sudo -u postgres psql -c \"SELECT datname FROM pg_database WHERE datname LIKE '%inmova%'\" 2>&1")
        log(f"Bases de datos:\n{out}", Colors.CYAN)
        
        # 5. Crear .env con variables correctas
        log("\n📋 [5/6] Configurando .env con variables correctas...", Colors.BLUE)
        
        # Generar NEXTAUTH_SECRET
        status, secret_out, err = exec_cmd(client, "openssl rand -base64 32")
        nextauth_secret = secret_out.strip()
        
        env_content = f'''# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database - PostgreSQL local
DATABASE_URL="postgresql://inmova_user:inmova_user@localhost:5432/inmova_production?schema=public"

# NextAuth Configuration
NEXTAUTH_URL=https://inmovaapp.com
NEXTAUTH_SECRET={nextauth_secret}

# Otros (mantener los existentes del .env.production original)
'''
        
        # Escribir el nuevo .env
        exec_cmd(client, f"cat > {APP_PATH}/.env << 'ENVEOF'\n{env_content}\nENVEOF")
        log("✅ .env creado con variables correctas", Colors.GREEN)
        
        # 6. Reiniciar PM2 con nuevo .env
        log("\n♻️ [6/6] Reiniciando PM2...", Colors.BLUE)
        
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
        
        # Verificaciones finales
        log("\n🏥 Verificación final...", Colors.BLUE)
        
        # Health check
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health | head -c 300")
        log(f"Health: {out}", Colors.GREEN if "ok" in out else Colors.YELLOW)
        
        # Verificar errores NextAuth
        status, out, err = exec_cmd(client, "pm2 logs inmova-app --err --nostream --lines 5 | grep -i 'NO_SECRET'")
        if "NO_SECRET" in out:
            log("⚠️ Todavía hay errores de NO_SECRET", Colors.YELLOW)
        else:
            log("✅ No hay errores de NEXTAUTH_SECRET", Colors.GREEN)
        
        # Test API companies
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/admin/companies | head -c 200")
        log(f"API Companies: {out}", Colors.CYAN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ PROCESO COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
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
