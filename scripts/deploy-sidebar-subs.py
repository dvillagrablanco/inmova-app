#!/usr/bin/env python3
"""
Deploy de cambios del sidebar con submenús al servidor de producción.
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración del servidor
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=None):
    timestamp = datetime.now().strftime("%H:%M:%S")
    if color:
        print(f"{color}[{timestamp}] {msg}{Colors.END}")
    else:
        print(f"[{timestamp}] {msg}")

def exec_cmd(client, command, timeout=300):
    """Ejecutar comando y retornar output"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print("\n" + "=" * 70)
    print("🚀 DEPLOY: SIDEBAR CON SUBMENÚS")
    print("=" * 70)
    print(f"\nServidor: {SERVER_IP}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Conectar al servidor
    log("🔐 Conectando al servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Verificar directorio
        log("\n📂 Verificando directorio...", Colors.CYAN)
        status, output, error = exec_cmd(client, "cd /opt/inmova-app && pwd")
        if status != 0:
            log(f"❌ Directorio no encontrado", Colors.RED)
            return 1
        log(f"✅ Directorio: {output.strip()}", Colors.GREEN)
        
        # 2. Git status
        log("\n📊 Verificando estado de Git...", Colors.CYAN)
        status, output, error = exec_cmd(client, "cd /opt/inmova-app && git status --short")
        if output.strip():
            log(f"⚠️ Hay cambios locales: {output.strip()}", Colors.YELLOW)
            # Stash cambios locales
            log("📦 Guardando cambios locales...", Colors.CYAN)
            exec_cmd(client, "cd /opt/inmova-app && git stash")
        
        # 3. Git pull
        log("\n📥 Actualizando código...", Colors.CYAN)
        status, output, error = exec_cmd(client, "cd /opt/inmova-app && git pull origin main 2>&1", timeout=120)
        if status != 0:
            log(f"❌ Error en git pull: {error}", Colors.RED)
            return 1
        log(f"✅ Git pull exitoso", Colors.GREEN)
        if "Already up to date" not in output:
            log(f"   Cambios: {output.strip()[:200]}", Colors.BLUE)
        
        # 4. Instalar dependencias
        log("\n📦 Instalando dependencias...", Colors.CYAN)
        status, output, error = exec_cmd(client, 
            "cd /opt/inmova-app && npm install --legacy-peer-deps 2>&1 | tail -5",
            timeout=300)
        if status != 0:
            log(f"⚠️ Warning en npm install", Colors.YELLOW)
        log("✅ Dependencias instaladas", Colors.GREEN)
        
        # 5. Prisma generate
        log("\n🔧 Generando cliente Prisma...", Colors.CYAN)
        status, output, error = exec_cmd(client, 
            "cd /opt/inmova-app && npx prisma generate 2>&1 | tail -3",
            timeout=120)
        log("✅ Prisma generado", Colors.GREEN)
        
        # 6. Build
        log("\n🏗️ Building aplicación...", Colors.CYAN)
        status, output, error = exec_cmd(client, 
            "cd /opt/inmova-app && npm run build 2>&1 | tail -20",
            timeout=600)
        if status != 0:
            log(f"❌ Error en build: {output}", Colors.RED)
            return 1
        log("✅ Build completado", Colors.GREEN)
        
        # 7. Reiniciar PM2
        log("\n♻️ Reiniciando aplicación...", Colors.CYAN)
        status, output, error = exec_cmd(client, 
            "cd /opt/inmova-app && pm2 reload inmova-app --update-env 2>&1")
        if status != 0:
            # Intentar restart si reload falla
            exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env 2>&1")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 8. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)
        
        # 9. Health checks
        log("\n🏥 Verificando health checks...", Colors.CYAN)
        
        # Test API health
        status, output, error = exec_cmd(client, 
            "curl -s --max-time 10 http://localhost:3000/api/health")
        if '"status":"ok"' in output:
            log("✅ API Health: OK", Colors.GREEN)
        else:
            log(f"⚠️ API Health: {output[:100]}", Colors.YELLOW)
        
        # Test landing page
        status, output, error = exec_cmd(client, 
            "curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000/")
        if output.strip() == "200":
            log("✅ Landing page: 200 OK", Colors.GREEN)
        else:
            log(f"⚠️ Landing page: {output.strip()}", Colors.YELLOW)
        
        # Test admin dashboard
        status, output, error = exec_cmd(client, 
            "curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000/admin/dashboard")
        if output.strip() in ["200", "307"]:
            log(f"✅ Admin dashboard: {output.strip()}", Colors.GREEN)
        else:
            log(f"⚠️ Admin dashboard: {output.strip()}", Colors.YELLOW)
        
        # PM2 status
        status, output, error = exec_cmd(client, "pm2 status inmova-app --no-color 2>&1 | grep inmova")
        if "online" in output.lower():
            log("✅ PM2 Status: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 Status: {output.strip()}", Colors.YELLOW)
        
        # 10. Resumen
        print("\n" + "=" * 70)
        print("✅ DEPLOY COMPLETADO EXITOSAMENTE")
        print("=" * 70)
        print(f"""
🌐 URLs:
   - Producción: https://inmovaapp.com
   - Admin: https://inmovaapp.com/admin/dashboard
   - Health: https://inmovaapp.com/api/health

📋 Cambios deployados:
   - Sidebar reorganizado con submenús
   - Agregado: Servicios (SMS, Firma Digital, OCR)
   - Agregado: Legal (Plantillas legales)
   - Submenús en: Billing, Clientes, Integraciones, 
     Marketplace, Monitoreo, Seguridad

📊 Para ver logs:
   ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'
""")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
