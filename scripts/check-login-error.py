#!/usr/bin/env python3
"""
Check Login Error - Investigar error de servidor en login
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
    END = '\033[0m'

def log(message, color=Colors.CYAN):
    print(f"{color}[{time.strftime('%H:%M:%S')}] {message}{Colors.END}")

def exec_cmd(client, command, description="", timeout=30):
    if description:
        log(f"📋 {description}...", Colors.CYAN)
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    return exit_status, output, error

def main():
    log("🔍 INVESTIGANDO ERROR DE LOGIN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # 1. Ver últimos logs de PM2
        log("📋 LOGS DE PM2 (últimos 50 errores)", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            "pm2 logs inmova-app --err --lines 50 --nostream",
            ""
        )
        
        if output:
            print(output)
        
        log("\n" + "=" * 70, Colors.CYAN)
        
        # 2. Verificar status de PM2
        log("📊 STATUS DE PM2", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 status inmova-app", "")
        print(output)
        
        # 3. Test de API de login
        log("\n📋 TEST DE API DE LOGIN", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        
        # Test 1: GET /api/auth/callback/credentials
        status, output, error = exec_cmd(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/auth/callback/credentials",
            "Test GET /api/auth/callback/credentials"
        )
        log(f"   HTTP Status: {output.strip()}", Colors.YELLOW)
        
        # Test 2: GET /api/auth/session
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/auth/session",
            "Test GET /api/auth/session"
        )
        log(f"   Response: {output.strip()[:200]}", Colors.YELLOW)
        
        # Test 3: POST /api/auth/signin/credentials (simulado)
        status, output, error = exec_cmd(
            client,
            """curl -s -X POST http://localhost:3000/api/auth/signin/credentials \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@inmova.app","password":"Admin123!","json":true}' \\
  | head -20""",
            "Test POST /api/auth/signin/credentials"
        )
        if output:
            print(f"   {output}")
        
        # 4. Verificar archivo de auth
        log("\n📋 VERIFICAR RUNTIME EN AUTH ROUTE", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cat {APP_PATH}/app/api/auth/[...nextauth]/route.ts",
            ""
        )
        print(output)
        
        # 5. Test de Prisma
        log("\n📋 TEST DE PRISMA CONNECTION", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && node -e \"const {{prisma}} = require('./lib/db'); prisma.\\$queryRaw\\`SELECT 1 as test\\`.then(r => console.log('DB OK:', r)).catch(e => console.log('DB ERROR:', e.message))\"",
            "Test Prisma connection",
            timeout=10
        )
        print(f"   {output}")
        if error:
            print(f"   ERROR: {error}")
        
        # 6. Verificar variables de entorno
        log("\n📋 VERIFICAR ENV VARS", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            "pm2 env 0 | grep -E '(DATABASE_URL|NEXTAUTH_URL|NEXTAUTH_SECRET)' | head -3",
            ""
        )
        print(output)
        
        # 7. Últimos logs de Next.js
        log("\n📋 ÚLTIMOS LOGS DE NEXT.JS", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            "pm2 logs inmova-app --lines 30 --nostream | grep -i 'error\\|nextauth\\|prisma' | tail -20",
            ""
        )
        if output:
            print(output)
        else:
            log("   No se encontraron errores recientes", Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        
    finally:
        client.close()

if __name__ == '__main__':
    main()
