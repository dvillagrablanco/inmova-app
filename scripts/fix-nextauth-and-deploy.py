#!/usr/bin/env python3
"""
Script para arreglar NEXTAUTH_SECRET y desplegar
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
    log("🔧 FIX NEXTAUTH_SECRET + DEPLOYMENT", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Verificar NEXTAUTH_SECRET actual
        log("\n🔍 [1/6] Verificando NEXTAUTH_SECRET...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"grep NEXTAUTH_SECRET {APP_PATH}/.env.production 2>/dev/null | head -1")
        
        if "NEXTAUTH_SECRET=" in out and len(out.strip().split('=')[1]) > 10:
            log(f"  📋 NEXTAUTH_SECRET existe: {out.strip()[:50]}...", Colors.GREEN)
        else:
            log("  ⚠️ NEXTAUTH_SECRET no encontrado, generando...", Colors.YELLOW)
            status, out, err = exec_cmd(client, 
                f"openssl rand -base64 32 | xargs -I {{}} sh -c 'echo NEXTAUTH_SECRET={{}} >> {APP_PATH}/.env.production'"
            )
            log("  ✅ NEXTAUTH_SECRET generado", Colors.GREEN)
        
        # 2. Verificar NEXTAUTH_URL
        log("\n🔍 [2/6] Verificando NEXTAUTH_URL...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"grep NEXTAUTH_URL {APP_PATH}/.env.production 2>/dev/null | head -1")
        if "NEXTAUTH_URL=" in out:
            log(f"  📋 NEXTAUTH_URL: {out.strip()}", Colors.GREEN)
        else:
            log("  ⚠️ NEXTAUTH_URL no encontrado, añadiendo...", Colors.YELLOW)
            exec_cmd(client, f"echo 'NEXTAUTH_URL=https://inmovaapp.com' >> {APP_PATH}/.env.production")
            log("  ✅ NEXTAUTH_URL añadido", Colors.GREEN)
        
        # 3. Git pull
        log("\n📥 [3/6] Actualizando código...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main")
        log("✅ Código actualizado", Colors.GREEN)
        
        # 4. Build
        log("\n🏗️ [4/6] Building aplicación...", Colors.BLUE)
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -10", timeout=600)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"⚠️ Build warning: {out[-300:]}", Colors.YELLOW)
        
        # 5. Reiniciar PM2 con --update-env
        log("\n♻️ [5/6] Reiniciando PM2 con variables actualizadas...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && source .env.production 2>/dev/null || true")
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && pm2 delete inmova-app 2>/dev/null; pm2 start npm --name 'inmova-app' -- start 2>&1 | tail -5")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # Esperar warm-up
        log("\n⏳ Esperando warm-up (25s)...", Colors.BLUE)
        time.sleep(25)
        
        # 6. Verificación
        log("\n🏥 [6/6] Verificando...", Colors.BLUE)
        
        # Check logs de NextAuth
        status, out, err = exec_cmd(client, "pm2 logs inmova-app --err --nostream --lines 10 | grep -i 'NO_SECRET' | wc -l")
        error_count = int(out.strip()) if out.strip().isdigit() else 0
        
        if error_count == 0:
            log("  ✅ No hay errores de NEXTAUTH_SECRET", Colors.GREEN)
        else:
            log(f"  ⚠️ Aún hay {error_count} errores de secret", Colors.YELLOW)
        
        # Health check
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health | head -c 100")
        if "ok" in out.lower():
            log("  ✅ Health check OK", Colors.GREEN)
        else:
            log(f"  ⚠️ Health: {out[:100]}", Colors.YELLOW)
        
        # Test API companies
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/admin/companies | head -c 200")
        log(f"  📋 API Companies: {out[:150]}", Colors.CYAN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ PROCESO COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log("\n📋 Próximo paso: Ejecutar auditoría Playwright", Colors.CYAN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
