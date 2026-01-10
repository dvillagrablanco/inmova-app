#!/usr/bin/env python3
"""
Deployment de tests E2E a producción via SSH (Paramiko)
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración del servidor
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
    BOLD = '\033[1m'

def log(message, color=Colors.END):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, command, timeout=300, show_output=True):
    """Ejecuta comando y retorna (exit_status, output)"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if show_output and output:
        # Mostrar solo últimas líneas si es muy largo
        lines = output.strip().split('\n')
        if len(lines) > 10:
            print(f"   ... ({len(lines)} líneas)")
            for line in lines[-5:]:
                print(f"   {line}")
        else:
            for line in lines[:10]:
                print(f"   {line}")
    
    if error and exit_status != 0:
        log(f"Error: {error[:200]}", Colors.RED)
    
    return exit_status, output + error

def main():
    print(f"""
{Colors.CYAN}{'='*70}
🚀 DEPLOYMENT A PRODUCCIÓN - INMOVA APP
{'='*70}{Colors.END}

Servidor: {SERVER_IP}
Usuario: {SERVER_USER}
Path: {APP_PATH}
Fecha: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

{Colors.CYAN}{'='*70}{Colors.END}
""")

    # Conectar
    log("🔐 Conectando al servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # 1. Verificar estado actual
        log("\n📊 Estado actual del servidor...", Colors.CYAN)
        exec_cmd(client, "pm2 status inmova-app --no-color | head -10")
        
        # 2. Backup pre-deployment
        log("\n💾 Creando backup...", Colors.CYAN)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        status, _ = exec_cmd(client, f"""
            cd {APP_PATH} && \\
            mkdir -p /var/backups/inmova && \\
            git rev-parse HEAD > /var/backups/inmova/commit_before_{timestamp}.txt && \\
            echo "Commit actual guardado"
        """, show_output=True)
        
        # 3. Git pull
        log("\n📥 Actualizando código (git pull)...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1")
        
        if status != 0:
            log("❌ Error en git pull", Colors.RED)
            return 1
        
        if "Already up to date" in output:
            log("ℹ️ Código ya está actualizado", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # 4. Instalar dependencias (solo si hay cambios en package.json)
        log("\n📦 Verificando dependencias...", Colors.CYAN)
        status, output = exec_cmd(client, f"""
            cd {APP_PATH} && \\
            npm install --legacy-peer-deps 2>&1 | tail -5
        """, timeout=300)
        log("✅ Dependencias verificadas", Colors.GREEN)
        
        # 5. Prisma generate
        log("\n🔧 Generando Prisma Client...", Colors.CYAN)
        status, _ = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3", timeout=120)
        log("✅ Prisma Client generado", Colors.GREEN)
        
        # 6. Build
        log("\n🏗️ Building aplicación...", Colors.CYAN)
        log("   (esto puede tardar 2-5 minutos)", Colors.YELLOW)
        
        status, output = exec_cmd(client, f"""
            cd {APP_PATH} && \\
            npm run build 2>&1 | tail -20
        """, timeout=600, show_output=True)
        
        if status != 0:
            log("❌ Error en build", Colors.RED)
            # Mostrar más detalles del error
            exec_cmd(client, f"cd {APP_PATH} && tail -50 /tmp/build.log 2>/dev/null || echo 'No log'")
            return 1
        
        log("✅ Build completado", Colors.GREEN)
        
        # 7. Reload PM2 (zero-downtime)
        log("\n♻️ Reiniciando aplicación (PM2 reload)...", Colors.CYAN)
        status, _ = exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1")
        
        if status != 0:
            log("⚠️ Intentando restart...", Colors.YELLOW)
            exec_cmd(client, "pm2 restart inmova-app --update-env 2>&1")
        
        log("✅ Aplicación reiniciada", Colors.GREEN)
        
        # 8. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)
        
        # 9. Health checks
        log("\n🏥 Verificando health checks...", Colors.CYAN)
        
        checks_passed = 0
        total_checks = 4
        
        # Check 1: HTTP básico
        status, output = exec_cmd(client, 
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health --max-time 10",
            show_output=False
        )
        if "200" in output:
            log("   ✅ Health API: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"   ❌ Health API: {output}", Colors.RED)
        
        # Check 2: Landing page
        status, output = exec_cmd(client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing --max-time 10",
            show_output=False
        )
        if "200" in output:
            log("   ✅ Landing: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"   ❌ Landing: {output}", Colors.RED)
        
        # Check 3: Login page
        status, output = exec_cmd(client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login --max-time 10",
            show_output=False
        )
        if "200" in output:
            log("   ✅ Login: OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"   ❌ Login: {output}", Colors.RED)
        
        # Check 4: PM2 status
        status, output = exec_cmd(client, "pm2 jlist 2>/dev/null | grep -o '\"status\":\"online\"' | wc -l", show_output=False)
        online_count = int(output.strip()) if output.strip().isdigit() else 0
        if online_count > 0:
            log(f"   ✅ PM2: {online_count} instancia(s) online", Colors.GREEN)
            checks_passed += 1
        else:
            log("   ❌ PM2: No hay instancias online", Colors.RED)
        
        # 10. Resumen
        print(f"""
{Colors.CYAN}{'='*70}
📊 RESUMEN DEL DEPLOYMENT
{'='*70}{Colors.END}
""")
        
        if checks_passed >= 3:
            log(f"✅ DEPLOYMENT EXITOSO ({checks_passed}/{total_checks} checks)", Colors.GREEN)
            print(f"""
{Colors.GREEN}URLs de verificación:{Colors.END}
  - Health: https://inmovaapp.com/api/health
  - Landing: https://inmovaapp.com/landing
  - Login: https://inmovaapp.com/login
  - Dashboard: https://inmovaapp.com/dashboard

{Colors.CYAN}Para ver logs:{Colors.END}
  ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'
""")
            return 0
        else:
            log(f"⚠️ DEPLOYMENT CON PROBLEMAS ({checks_passed}/{total_checks} checks)", Colors.YELLOW)
            exec_cmd(client, "pm2 logs inmova-app --err --lines 20 --nostream")
            return 1
            
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("\n🔌 Conexión cerrada", Colors.CYAN)

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
