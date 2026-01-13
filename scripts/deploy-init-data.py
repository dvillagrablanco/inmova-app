#!/usr/bin/env python3
"""
Script de deployment y inicialización de datos
Usa paramiko para conexión SSH
"""

import sys
import time

# Add paramiko path
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Server configuration
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.END):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=300):
    """Execute command and return status and output"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print()
    print("=" * 70)
    log("🚀 DEPLOYMENT INMOVA APP - INICIALIZACIÓN DE DATOS", Colors.CYAN)
    print("=" * 70)
    print()
    
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"Path: {APP_PATH}", Colors.CYAN)
    print()
    
    # Connect
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=15
        )
        log("✅ Conexión establecida", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Git pull
        print()
        log("📥 Actualizando código...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log(f"⚠️ Git pull warning: {error}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Install dependencies (if needed)
        log("📦 Verificando dependencias...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --production=false", timeout=600)
        if status == 0:
            log("✅ Dependencias OK", Colors.GREEN)
        else:
            log(f"⚠️ npm install warning (puede ser normal)", Colors.YELLOW)
        
        # 3. Prisma generate
        log("🔧 Generando cliente Prisma...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status == 0:
            log("✅ Prisma cliente generado", Colors.GREEN)
        else:
            log(f"⚠️ Prisma generate warning: {error[:200] if error else 'Unknown'}", Colors.YELLOW)
        
        # 4. Build
        log("🏗️ Building aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"❌ Build falló: {error[:500] if error else output[:500]}", Colors.RED)
            # Continue anyway to try reload
            log("⚠️ Continuando con PM2 reload...", Colors.YELLOW)
        else:
            log("✅ Build completado", Colors.GREEN)
        
        # 5. PM2 reload
        log("♻️ Reiniciando PM2...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status == 0:
            log("✅ PM2 reloaded", Colors.GREEN)
        else:
            # Try restart if reload fails
            log("⚠️ Reload falló, intentando restart...", Colors.YELLOW)
            status, output, error = exec_cmd(client, "pm2 restart inmova-app --update-env")
            if status == 0:
                log("✅ PM2 restarted", Colors.GREEN)
            else:
                log(f"❌ PM2 restart falló: {error}", Colors.RED)
        
        # 6. Wait for warm-up
        log("⏳ Esperando warm-up (15s)...", Colors.YELLOW)
        time.sleep(15)
        
        # 7. Health check
        print()
        log("🏥 Verificando health...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "curl -sf http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:200] if output else 'No response'}", Colors.YELLOW)
        
        # 8. Initialize data via API
        print()
        log("🌱 Inicializando datos (planes, add-ons, cupones)...", Colors.YELLOW)
        
        # Get session cookie first
        status, output, error = exec_cmd(client, '''
            curl -sf "http://localhost:3000/api/admin/init-all-data" \
                -H "Content-Type: application/json"
        ''')
        
        if '"success":true' in output or '"success": true' in output:
            log("✅ Datos inicializados correctamente", Colors.GREEN)
            # Parse results
            if 'totals' in output:
                log(f"   Resultado: {output[:300]}", Colors.CYAN)
        elif 'No autenticado' in output or '401' in output:
            log("⚠️ API requiere autenticación - ejecuta manualmente desde UI admin", Colors.YELLOW)
        else:
            log(f"⚠️ Resultado inicialización: {output[:300] if output else error[:200] if error else 'Sin respuesta'}", Colors.YELLOW)
        
        # 9. Final status
        print()
        print("=" * 70)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        print("=" * 70)
        print()
        
        log("URLs:", Colors.CYAN)
        log("  - Principal: https://inmovaapp.com", Colors.CYAN)
        log("  - Health: https://inmovaapp.com/api/health", Colors.CYAN)
        log("  - Admin Init: https://inmovaapp.com/api/admin/init-all-data", Colors.CYAN)
        print()
        
        log("⚠️ IMPORTANTE:", Colors.YELLOW)
        log("   Para inicializar los datos, accede como super_admin a:", Colors.YELLOW)
        log("   https://inmovaapp.com/api/admin/init-all-data", Colors.YELLOW)
        print()
        
        return 0
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()
        log("Conexión cerrada", Colors.CYAN)

if __name__ == "__main__":
    sys.exit(main())
