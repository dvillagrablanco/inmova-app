#!/usr/bin/env python3
"""
Deploy de Add-ons a Producción
Ejecuta: python3 scripts/deploy-addons.py
"""

import sys
import time
from datetime import datetime

# Agregar path para paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

# Configuración del servidor
SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.ENDC):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.ENDC}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecuta comando y retorna status y output"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print("")
    print("=" * 70)
    log("🚀 DEPLOYMENT: Add-ons PropTech - INMOVA", Colors.CYAN)
    print("=" * 70)
    print("")
    log(f"Servidor: {SERVER}", Colors.BLUE)
    log(f"Path: {APP_PATH}", Colors.BLUE)
    print("")
    
    # Conectar
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER, username=USER, password=PASS, timeout=30)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Git pull
        log("📥 Actualizando código...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log(f"⚠️ Git pull warning: {error}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Install dependencies (solo si hay cambios en package.json)
        log("📦 Verificando dependencias...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if status == 0:
            log("✅ Dependencias OK", Colors.GREEN)
        else:
            log(f"⚠️ npm install warning: {error[:200]}", Colors.YELLOW)
        
        # 3. Prisma generate
        log("🔧 Generando Prisma Client...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        if status == 0:
            log("✅ Prisma Client generado", Colors.GREEN)
        else:
            log(f"⚠️ Prisma warning: {error[:200]}", Colors.YELLOW)
        
        # 4. Seed de add-ons
        log("🌱 Ejecutando seed de add-ons...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx tsx prisma/seed-addons.ts", timeout=120)
        if status == 0:
            log("✅ Add-ons seeded", Colors.GREEN)
            # Mostrar resumen del seed
            if "RESUMEN" in output:
                print(output[output.find("RESUMEN"):])
        else:
            log(f"⚠️ Seed warning: {error[:300]}", Colors.YELLOW)
        
        # 5. Build
        log("🏗️ Building aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"❌ Build failed: {error[:500]}", Colors.RED)
            return 1
        log("✅ Build completado", Colors.GREEN)
        
        # 6. PM2 reload
        log("♻️ Reiniciando aplicación...", Colors.YELLOW)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app")
        if status != 0:
            # Intentar restart si reload falla
            log("⚠️ Reload falló, intentando restart...", Colors.YELLOW)
            status, output, error = exec_cmd(client, "pm2 restart inmova-app")
        
        if status == 0:
            log("✅ Aplicación reiniciada", Colors.GREEN)
        else:
            log(f"⚠️ PM2 warning: {error}", Colors.YELLOW)
        
        # 7. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 8. Health checks
        log("🏥 Verificando health...", Colors.YELLOW)
        
        # Health check básico
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health: {output[:100]}", Colors.YELLOW)
        
        # Verificar API de add-ons
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/addons | head -c 200")
        if '"success":true' in output or '"success": true' in output:
            log("✅ API Add-ons OK", Colors.GREEN)
        else:
            log(f"⚠️ API Add-ons: {output[:100]}", Colors.YELLOW)
        
        # Verificar landing de precios
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing/precios")
        if output.strip() == '200':
            log("✅ Landing precios OK (200)", Colors.GREEN)
        else:
            log(f"⚠️ Landing precios: HTTP {output.strip()}", Colors.YELLOW)
        
        # 9. Verificar PM2 status
        log("📊 Estado PM2:", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 status")
        print(output)
        
        print("")
        print("=" * 70)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        print("=" * 70)
        print("")
        log("URLs:", Colors.CYAN)
        log("  - Landing Precios: https://inmovaapp.com/landing/precios", Colors.BLUE)
        log("  - API Add-ons: https://inmovaapp.com/api/addons", Colors.BLUE)
        log("  - Admin Add-ons: https://inmovaapp.com/admin/addons", Colors.BLUE)
        print("")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()

if __name__ == '__main__':
    sys.exit(main())
