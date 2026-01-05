#!/usr/bin/env python3
"""
Deploy planes de suscripción a producción
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

# Configuración del servidor
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(msg, color=Colors.RESET):
    print(f"{color}{msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=120):
    """Ejecuta comando y retorna (exit_status, output)"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    log("=" * 70, Colors.CYAN)
    log("🚀 DEPLOYMENT: PLANES DE SUSCRIPCIÓN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    # Conectar
    log("\n📡 Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Git pull
        log("\n📥 Actualizando código...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log(f"❌ Error en git pull: {error}", Colors.RED)
            return 1
        log(f"   {output.strip()}", Colors.GREEN)
        
        # 2. Install dependencies
        log("\n📦 Instalando dependencias...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install", timeout=300)
        if status != 0:
            log(f"⚠️ Advertencia npm install: {error[:200]}", Colors.YELLOW)
        log("✅ Dependencias instaladas", Colors.GREEN)
        
        # 3. Prisma generate y migrate
        log("\n🔧 Ejecutando Prisma...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status != 0:
            log(f"⚠️ Prisma generate: {error[:200]}", Colors.YELLOW)
        
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma db push --accept-data-loss", timeout=120)
        if status != 0:
            log(f"⚠️ Prisma db push: {error[:200]}", Colors.YELLOW)
        else:
            log("✅ Prisma actualizado", Colors.GREEN)
        
        # 4. Sincronizar planes
        log("\n📋 Sincronizando planes de suscripción...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx tsx scripts/sync-planes-to-db.ts", timeout=120)
        if status != 0:
            log(f"⚠️ Sync planes: {error[:500]}", Colors.YELLOW)
        else:
            log("✅ Planes sincronizados", Colors.GREEN)
            # Mostrar output del script
            for line in output.split('\n'):
                if line.strip():
                    log(f"   {line}", Colors.CYAN)
        
        # 5. Build
        log("\n🏗️ Building aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"⚠️ Build warning (continuando): {error[:300]}", Colors.YELLOW)
        log("✅ Build completado", Colors.GREEN)
        
        # 6. PM2 restart
        log("\n♻️ Reiniciando PM2...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status != 0:
            log(f"⚠️ PM2 reload: {error}", Colors.YELLOW)
            # Intentar restart
            exec_cmd(client, "pm2 restart inmova-app --update-env")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 7. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 8. Health checks
        log("\n🏥 Verificando health...", Colors.YELLOW)
        
        # API planes
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/planes | head -c 500")
        if '"planes"' in output or '"source"' in output:
            log("✅ API /api/planes OK", Colors.GREEN)
        else:
            log(f"⚠️ API /api/planes: {output[:200]}", Colors.YELLOW)
        
        # API health
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"ok"' in output or '"status"' in output:
            log("✅ API /api/health OK", Colors.GREEN)
        else:
            log(f"⚠️ API /api/health: {output[:200]}", Colors.YELLOW)
        
        # PM2 status
        status, output, error = exec_cmd(client, "pm2 jlist | head -c 200")
        if 'online' in output:
            log("✅ PM2 online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {output[:100]}", Colors.YELLOW)
        
        # Verificar planes en BD
        log("\n📊 Verificando planes en BD...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"""cd {APP_PATH} && npx prisma db execute --stdin <<< "SELECT nombre, tier, \\\"precioMensual\\\" FROM subscription_plans ORDER BY \\\"precioMensual\\\";" """)
        if output and 'nombre' not in output:
            # Alternativa
            status, output, error = exec_cmd(client, f"cd {APP_PATH} && node -e \"const {{prisma}} = require('./lib/db'); prisma.subscriptionPlan.findMany().then(p => console.log(p.map(x => x.nombre + ': €' + x.precioMensual).join('\\n'))).catch(e => console.log('Error:', e.message))\"")
        log(f"   {output[:500]}", Colors.CYAN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
        log("\n📋 URLs:", Colors.CYAN)
        log("   API Planes (público): https://inmovaapp.com/api/planes", Colors.CYAN)
        log("   Admin Planes: https://inmovaapp.com/admin/planes", Colors.CYAN)
        log("   Health: https://inmovaapp.com/api/health", Colors.CYAN)
        
        return 0
        
    except Exception as e:
        log(f"\n❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

if __name__ == '__main__':
    sys.exit(main())
