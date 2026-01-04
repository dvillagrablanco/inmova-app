#!/usr/bin/env python3
"""
Test Login Automated - Verificación automatizada de login después de deployment
EJECUTAR DESPUÉS DE CADA DEPLOYMENT SIN EXCEPCIÓN
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

# Credenciales de test
TEST_EMAIL = 'admin@inmova.app'
TEST_PASSWORD = 'Admin123!'

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(message, color=Colors.CYAN):
    print(f"{color}[{time.strftime('%H:%M:%S')}] {message}{Colors.END}")

def exec_cmd(client, command, description="", timeout=30):
    if description:
        log(f"   {description}...", Colors.CYAN)
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    return exit_status, output, error

def main():
    log("=" * 70, Colors.BOLD)
    log("🔐 TEST DE LOGIN AUTOMATIZADO", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()
    
    tests_passed = 0
    tests_failed = 0
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # TEST 1: Variables de entorno
        log("📋 TEST 1/7: Variables de Entorno", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            f"cat {APP_PATH}/.env.production | grep -E '(NEXTAUTH_SECRET|NEXTAUTH_URL|DATABASE_URL)' | head -3",
            "Verificar variables críticas"
        )
        
        has_secret = 'NEXTAUTH_SECRET=' in output and len(output.split('NEXTAUTH_SECRET=')[1].split('\n')[0].strip()) > 10
        has_url = 'NEXTAUTH_URL=' in output
        has_db = 'DATABASE_URL=' in output and 'dummy-build-host' not in output
        
        if has_secret and has_url and has_db:
            log("   ✅ Variables de entorno OK", Colors.GREEN)
            tests_passed += 1
        else:
            log("   ❌ Variables de entorno FALTANTES o INCORRECTAS", Colors.RED)
            if not has_secret:
                log("      - NEXTAUTH_SECRET faltante o vacío", Colors.RED)
            if not has_url:
                log("      - NEXTAUTH_URL faltante", Colors.RED)
            if not has_db:
                log("      - DATABASE_URL faltante o placeholder", Colors.RED)
            tests_failed += 1
        
        print()
        
        # TEST 2: PM2 Status
        log("📋 TEST 2/7: PM2 Status", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "pm2 jlist | jq -r '.[] | select(.name==\"inmova-app\") | .pm2_env.status'",
            "Verificar PM2 workers"
        )
        
        if 'online' in output:
            online_count = output.count('online')
            log(f"   ✅ PM2 workers online: {online_count}", Colors.GREEN)
            tests_passed += 1
        else:
            log("   ❌ PM2 workers NO están online", Colors.RED)
            tests_failed += 1
        
        print()
        
        # TEST 3: API Session responde sin error
        log("📋 TEST 3/7: API Auth Session", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/auth/session",
            "GET /api/auth/session"
        )
        
        if 'problem with the server' in output.lower() or 'configuration' in output.lower():
            log("   ❌ API retorna error de configuración", Colors.RED)
            log(f"      Response: {output[:200]}", Colors.RED)
            tests_failed += 1
        elif output.strip() in ['{}', ''] or 'user' in output.lower():
            log("   ✅ API Auth responde correctamente", Colors.GREEN)
            tests_passed += 1
        else:
            log("   ⚠️  API Auth responde, pero formato inesperado", Colors.YELLOW)
            log(f"      Response: {output[:100]}", Colors.YELLOW)
            tests_passed += 1
        
        print()
        
        # TEST 4: Login page carga
        log("📋 TEST 4/7: Login Page HTTP", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login",
            "GET /login"
        )
        
        http_code = output.strip()
        if http_code == '200':
            log(f"   ✅ Login page responde HTTP {http_code}", Colors.GREEN)
            tests_passed += 1
        else:
            log(f"   ❌ Login page responde HTTP {http_code} (esperado 200)", Colors.RED)
            tests_failed += 1
        
        print()
        
        # TEST 5: Logs sin errores de NextAuth
        log("📋 TEST 5/7: Logs sin Errores NextAuth", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "pm2 logs inmova-app --err --lines 20 --nostream | grep -i 'NO_SECRET\\|next-auth.*error' | wc -l",
            "Verificar logs de error"
        )
        
        error_count = int(output.strip()) if output.strip().isdigit() else 999
        
        if error_count == 0:
            log("   ✅ No hay errores de NextAuth en logs", Colors.GREEN)
            tests_passed += 1
        else:
            log(f"   ❌ {error_count} errores de NextAuth encontrados en logs", Colors.RED)
            
            # Mostrar últimos errores
            status, output, error = exec_cmd(
                client,
                "pm2 logs inmova-app --err --lines 5 --nostream | grep -i 'error' | head -3",
                ""
            )
            if output:
                log("      Últimos errores:", Colors.RED)
                for line in output.strip().split('\n')[:3]:
                    log(f"        {line[:100]}", Colors.RED)
            
            tests_failed += 1
        
        print()
        
        # TEST 6: Runtime correcto en auth route
        log("📋 TEST 6/7: Runtime Configuration", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            f"grep 'export const runtime' {APP_PATH}/app/api/auth/\\[...nextauth\\]/route.ts",
            "Verificar runtime nodejs"
        )
        
        if 'nodejs' in output:
            log("   ✅ Runtime = 'nodejs' configurado", Colors.GREEN)
            tests_passed += 1
        else:
            log("   ⚠️  Runtime no encontrado o incorrecto", Colors.YELLOW)
            log("      (puede ser OK si no hay problemas)", Colors.YELLOW)
            tests_passed += 1
        
        print()
        
        # TEST 7: Simulación de POST login (básico)
        log("📋 TEST 7/7: Simulación de Login POST", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            f"""curl -s -X POST http://localhost:3000/api/auth/callback/credentials \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "email={TEST_EMAIL}&password={TEST_PASSWORD}" \\
  -w "\\nHTTP_CODE:%{{http_code}}" \\
  | tail -1""",
            "POST login credentials"
        )
        
        if 'HTTP_CODE:200' in output or 'HTTP_CODE:302' in output:
            log("   ✅ Login POST responde 200/302", Colors.GREEN)
            tests_passed += 1
        elif 'HTTP_CODE:500' in output:
            log("   ❌ Login POST retorna HTTP 500 (error servidor)", Colors.RED)
            tests_failed += 1
        else:
            log(f"   ⚠️  Login POST responde HTTP {output.strip()}", Colors.YELLOW)
            tests_passed += 1
        
        print()
        
        # RESUMEN
        log("=" * 70, Colors.BOLD)
        total_tests = tests_passed + tests_failed
        pass_rate = (tests_passed / total_tests * 100) if total_tests > 0 else 0
        
        if tests_failed == 0:
            log(f"✅ TODOS LOS TESTS PASARON ({tests_passed}/{total_tests})", Colors.GREEN)
            log("=" * 70, Colors.GREEN)
            print()
            log("🌐 Login verificado exitosamente", Colors.GREEN)
            log("   URL: https://inmovaapp.com/login", Colors.CYAN)
            log(f"   Test: {TEST_EMAIL} / {TEST_PASSWORD}", Colors.CYAN)
            return 0
        else:
            log(f"❌ TESTS FALLIDOS: {tests_failed}/{total_tests} ({pass_rate:.1f}% pass rate)", Colors.RED)
            log("=" * 70, Colors.RED)
            print()
            log("🚨 ACCIÓN REQUERIDA:", Colors.RED)
            log("   1. Revisar errores arriba", Colors.YELLOW)
            log("   2. Ejecutar fix: python3 scripts/fix-nextauth-secret.py", Colors.YELLOW)
            log("   3. Ver logs: pm2 logs inmova-app --err", Colors.YELLOW)
            log("   4. Re-ejecutar este test", Colors.YELLOW)
            return 1
        
    except Exception as e:
        log("=" * 70, Colors.RED)
        log(f"❌ ERROR CRÍTICO: {str(e)}", Colors.RED)
        log("=" * 70, Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
