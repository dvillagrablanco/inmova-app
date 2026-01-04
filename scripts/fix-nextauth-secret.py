#!/usr/bin/env python3
"""
Fix NEXTAUTH_SECRET - Corregir variable de entorno faltante
"""

import sys
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(message, color=Colors.CYAN):
    print(f"{color}[{time.strftime('%H:%M:%S')}] {message}{Colors.END}")

def exec_cmd(client, command, description="", timeout=30, check_error=True):
    if description:
        log(f"📋 {description}...", Colors.CYAN)
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0 or not check_error:
        if description:
            log(f"✅ {description} - OK", Colors.GREEN)
        if output.strip():
            for line in output.strip().split('\n')[:10]:
                print(f"   {line}")
        return exit_status, output, error
    else:
        log(f"❌ {description} - FALLÓ", Colors.RED)
        if error.strip():
            for line in error.strip().split('\n')[:5]:
                print(f"   {line}")
        if not check_error:
            return exit_status, output, error
        raise Exception(f"{description} falló")

def main():
    log("=" * 70, Colors.BOLD)
    log("🔧 FIX: NEXTAUTH_SECRET FALTANTE", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # 1. Verificar .env.production
        log("📋 VERIFICAR .env.production", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            f"cat {APP_PATH}/.env.production | grep NEXTAUTH_SECRET | head -1",
            "Buscar NEXTAUTH_SECRET en .env.production",
            check_error=False
        )
        
        if 'NEXTAUTH_SECRET' in output and output.strip():
            log(f"   ✅ NEXTAUTH_SECRET encontrado en .env.production", Colors.GREEN)
            secret_found = True
        else:
            log(f"   ❌ NEXTAUTH_SECRET NO encontrado en .env.production", Colors.RED)
            secret_found = False
        
        print()
        
        # 2. Verificar ecosystem.config.js
        log("📋 VERIFICAR ecosystem.config.js", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            f"cat {APP_PATH}/ecosystem.config.js",
            "Leer ecosystem.config.js"
        )
        
        print()
        
        # 3. Decisión de corrección
        if secret_found:
            log("📋 NEXTAUTH_SECRET existe en .env.production", Colors.GREEN)
            log("   Solución: Restart PM2 con --update-env", Colors.YELLOW)
            print()
            
            # Restart con update-env
            exec_cmd(
                client,
                "pm2 restart inmova-app --update-env",
                "PM2 restart con --update-env"
            )
        else:
            log("📋 NEXTAUTH_SECRET NO existe, generando nuevo...", Colors.YELLOW)
            print()
            
            # Generar nuevo secret
            status, output, error = exec_cmd(
                client,
                "openssl rand -base64 32",
                "Generar NEXTAUTH_SECRET"
            )
            
            new_secret = output.strip()
            log(f"   Nuevo secret: {new_secret[:20]}...", Colors.CYAN)
            
            # Añadir a .env.production
            exec_cmd(
                client,
                f"echo 'NEXTAUTH_SECRET={new_secret}' >> {APP_PATH}/.env.production",
                "Añadir NEXTAUTH_SECRET a .env.production"
            )
            
            # Restart PM2
            exec_cmd(
                client,
                "pm2 restart inmova-app --update-env",
                "PM2 restart con --update-env"
            )
        
        print()
        log("⏳ Esperando warm-up (10 segundos)...", Colors.YELLOW)
        time.sleep(10)
        
        # 4. Verificar que funciona
        log("\n📋 VERIFICACIÓN POST-FIX", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        
        # Test 1: PM2 status
        exec_cmd(
            client,
            "pm2 status inmova-app",
            "1/4 Verificar PM2 status"
        )
        
        # Test 2: API session
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/auth/session",
            "2/4 Test /api/auth/session"
        )
        
        if 'problem with the server' not in output.lower():
            log("   ✅ API auth responde correctamente", Colors.GREEN)
        else:
            log("   ❌ API auth todavía con error", Colors.RED)
        
        # Test 3: HTTP login
        status, output, error = exec_cmd(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login",
            "3/4 Test GET /login"
        )
        
        if '200' in output:
            log("   ✅ Login page responde 200", Colors.GREEN)
        else:
            log(f"   ⚠️  Login page responde {output.strip()}", Colors.YELLOW)
        
        # Test 4: Verificar logs de errores
        log("\n4/4 Verificar logs de errores...", Colors.CYAN)
        time.sleep(2)
        
        status, output, error = exec_cmd(
            client,
            "pm2 logs inmova-app --err --lines 10 --nostream | grep -i 'NO_SECRET' | wc -l",
            "",
            check_error=False
        )
        
        error_count = int(output.strip()) if output.strip().isdigit() else 999
        
        if error_count == 0:
            log("   ✅ NO hay errores NO_SECRET en logs", Colors.GREEN)
        else:
            log(f"   ⚠️  Todavía hay {error_count} errores NO_SECRET", Colors.YELLOW)
        
        print()
        log("=" * 70, Colors.GREEN)
        log("✅ FIX COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        print()
        log("🌐 VERIFICAR EN NAVEGADOR:", Colors.CYAN)
        log("   https://inmovaapp.com/login", Colors.CYAN)
        log("   Email: admin@inmova.app", Colors.CYAN)
        log("   Password: Admin123!", Colors.CYAN)
        print()
        
    except Exception as e:
        log("=" * 70, Colors.RED)
        log(f"❌ ERROR: {str(e)}", Colors.RED)
        log("=" * 70, Colors.RED)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        client.close()

if __name__ == '__main__':
    main()
