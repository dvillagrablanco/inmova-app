#!/usr/bin/env python3
"""
Deploy: Actualización de Pricing Strategy
- Landing PricingSection
- Backend seed subscription plans
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time
from datetime import datetime

# ═══════════════════════════════════════════════════════════════
# CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════════
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

# ═══════════════════════════════════════════════════════════════
# COLORES
# ═══════════════════════════════════════════════════════════════
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300, ignore_errors=False):
    """Ejecutar comando SSH con timeout"""
    log(f"  → {cmd[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and not ignore_errors:
        if err:
            log(f"  ⚠️ Warning: {err[:200]}", Colors.YELLOW)
    
    return exit_status, out, err

def main():
    print(f"\n{Colors.BOLD}{'═' * 70}")
    print("🚀 DEPLOYMENT: Actualización Pricing Strategy")
    print(f"{'═' * 70}{Colors.RESET}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    log(f"Path: {APP_PATH}", Colors.BLUE)
    
    # Conectar SSH
    log("🔐 Conectando al servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=15
        )
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return False
    
    try:
        # 1. Git Pull
        log("\n📥 Actualizando código...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin main")
        exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/main")
        log("✅ Código actualizado", Colors.GREEN)
        
        # 2. Install dependencies (por si hay cambios)
        log("\n📦 Verificando dependencias...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm install --prefer-offline", timeout=120, ignore_errors=True)
        log("✅ Dependencias OK", Colors.GREEN)
        
        # 3. Build
        log("\n🏗️ Building aplicación...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log("❌ Build falló", Colors.RED)
            log(err[:500] if err else out[:500], Colors.RED)
            return False
        log("✅ Build completado", Colors.GREEN)
        
        # 4. Ejecutar seed de planes (opcional - actualiza BD)
        log("\n🌱 Ejecutando seed de subscription plans...", Colors.BLUE)
        status, out, err = exec_cmd(
            client, 
            f"cd {APP_PATH} && npx tsx prisma/seed-subscription-plans.ts",
            timeout=60,
            ignore_errors=True
        )
        if "✅" in out or "Seed completado" in out:
            log("✅ Planes actualizados en BD", Colors.GREEN)
        else:
            log("⚠️ Seed ejecutado (revisar logs)", Colors.YELLOW)
        
        # 5. PM2 Reload
        log("\n♻️ Reiniciando aplicación...", Colors.BLUE)
        exec_cmd(client, "pm2 reload inmova-app --update-env")
        log("✅ PM2 reloaded", Colors.GREEN)
        
        # 6. Esperar warm-up
        log("\n⏳ Esperando warm-up (15s)...", Colors.CYAN)
        time.sleep(15)
        
        # 7. Health Check
        log("\n🏥 Health check...", Colors.BLUE)
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in out:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {out[:100]}", Colors.YELLOW)
        
        # 8. Verificar landing
        log("\n🌐 Verificando landing...", Colors.BLUE)
        status, out, err = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing")
        if "200" in out:
            log("✅ Landing accesible", Colors.GREEN)
        else:
            log(f"⚠️ Landing status: {out}", Colors.YELLOW)
        
        print(f"\n{Colors.BOLD}{Colors.GREEN}{'═' * 70}")
        print("✅ DEPLOYMENT COMPLETADO")
        print(f"{'═' * 70}{Colors.RESET}\n")
        
        print(f"{Colors.CYAN}📊 Nueva Estructura de Precios (vs Homming):{Colors.RESET}")
        print(f"  • Starter:      €29/mes (1-5 props)   → -51% vs Homming €59")
        print(f"  • Professional: €49/mes (6-25 props)  → -38% vs Homming €79")
        print(f"  • Business:     €99/mes (26-100 props)→ 2x props vs Homming")
        print(f"  • Enterprise:   A cotizar (100+)      → Personalizado")
        print(f"\n{Colors.CYAN}🔗 URLs:{Colors.RESET}")
        print(f"  • Landing: https://inmovaapp.com/landing#pricing")
        print(f"  • Admin:   https://inmovaapp.com/admin/planes")
        
        return True
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return False
    finally:
        client.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
