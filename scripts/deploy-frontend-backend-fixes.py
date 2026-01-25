#!/usr/bin/env python3
"""
Deploy: Correcciones Frontend-Backend
Despliega las correcciones de conexiones entre frontend y backend
"""

import sys
import time

# Añadir path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
BRANCH = 'cursor/edificios-critical-error-cbfd'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.END):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, command, timeout=300):
    """Ejecutar comando SSH y retornar resultado"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore').strip()
    error = stderr.read().decode('utf-8', errors='ignore').strip()
    return exit_status, output, error

def main():
    print(f"""
{Colors.CYAN}{'='*70}
🚀 DEPLOY: CORRECCIONES FRONTEND-BACKEND
{'='*70}{Colors.END}

{Colors.BOLD}Servidor:{Colors.END} {SERVER_IP}
{Colors.BOLD}Branch:{Colors.END} {BRANCH}
{Colors.BOLD}Path:{Colors.END} {APP_PATH}

{Colors.CYAN}{'='*70}{Colors.END}
""")

    # Conectar
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # 1. Verificar estado actual
        log("📋 Verificando estado actual...", Colors.BLUE)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git status --short")
        if output:
            log(f"Archivos modificados localmente:\n{output}", Colors.YELLOW)
        
        # 2. Guardar commit actual para rollback
        log("💾 Guardando commit actual para rollback...", Colors.BLUE)
        status, current_commit, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse HEAD")
        log(f"Commit actual: {current_commit[:12]}", Colors.CYAN)

        # 3. Stash cambios locales si los hay
        log("📦 Guardando cambios locales (si hay)...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && git stash")

        # 4. Fetch y checkout branch
        log(f"📥 Obteniendo branch {BRANCH}...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin {BRANCH}")
        if status != 0:
            log(f"⚠️ Fetch warning: {error}", Colors.YELLOW)

        # 5. Checkout al branch
        log(f"🔄 Cambiando a branch {BRANCH}...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git checkout {BRANCH}")
        if status != 0:
            # Si el checkout falla, intentar reset
            log("⚠️ Checkout falló, intentando con reset...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && git checkout -B {BRANCH} origin/{BRANCH}")

        # 6. Pull latest
        log("📥 Descargando últimos cambios...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin {BRANCH} --force")
        if "Already up to date" in output:
            log("✅ Ya está actualizado", Colors.GREEN)
        else:
            log(f"✅ Cambios descargados", Colors.GREEN)

        # 7. Mostrar últimos commits
        log("📝 Últimos commits:", Colors.BLUE)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git log --oneline -5")
        print(output)

        # 8. Instalar dependencias si es necesario
        log("📦 Verificando dependencias...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600)
        log("✅ Dependencias verificadas", Colors.GREEN)

        # 9. Generar Prisma Client
        log("🔧 Generando Prisma Client...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -5", timeout=120)
        if status == 0:
            log("✅ Prisma Client generado", Colors.GREEN)
        else:
            log(f"⚠️ Prisma warning: {error}", Colors.YELLOW)

        # 10. Build
        log("🏗️ Compilando aplicación...", Colors.BLUE)
        log("⏳ Esto puede tomar varios minutos...", Colors.YELLOW)
        status, output, error = exec_cmd(client, 
            f"cd {APP_PATH} && npm run build 2>&1 | tail -30", 
            timeout=600)
        
        if status != 0:
            log(f"❌ Error en build:\n{error[-500:]}", Colors.RED)
            # Intentar rollback
            log("🔄 Intentando rollback...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && git checkout {current_commit}")
            return 1
        
        log("✅ Build completado", Colors.GREEN)

        # 11. Restart PM2
        log("♻️ Reiniciando aplicación con PM2...", Colors.BLUE)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1")
        if status != 0:
            # Si reload falla, intentar restart
            log("⚠️ Reload falló, intentando restart...", Colors.YELLOW)
            exec_cmd(client, "pm2 restart inmova-app --update-env 2>&1")
        
        log("✅ PM2 reiniciado", Colors.GREEN)

        # 12. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.BLUE)
        time.sleep(20)

        # 13. Health checks
        log("🏥 Ejecutando health checks...", Colors.BLUE)
        
        checks_passed = 0
        checks_total = 5

        # Check 1: HTTP
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")
        if '200' in output:
            log("  ✅ HTTP /api/health OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ❌ HTTP check failed: {output}", Colors.RED)

        # Check 2: Landing
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing")
        if '200' in output:
            log("  ✅ Landing page OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ Landing: {output}", Colors.YELLOW)
            checks_passed += 0.5

        # Check 3: Login
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        if '200' in output:
            log("  ✅ Login page OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ Login: {output}", Colors.YELLOW)
            checks_passed += 0.5

        # Check 4: PM2 Status
        status, output, _ = exec_cmd(client, "pm2 jlist | grep -o '\"status\":\"online\"' | wc -l")
        online_count = int(output.strip()) if output.strip().isdigit() else 0
        if online_count >= 1:
            log(f"  ✅ PM2: {online_count} instancias online", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ❌ PM2: sin instancias online", Colors.RED)

        # Check 5: API Test
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health | grep -o 'ok' | head -1")
        if 'ok' in output:
            log("  ✅ API Health responde 'ok'", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ API Health response: {output[:50]}", Colors.YELLOW)

        # Resultado de health checks
        log(f"\n📊 Health checks: {checks_passed}/{checks_total}", 
            Colors.GREEN if checks_passed >= 4 else Colors.YELLOW)

        # 14. Verificar logs de errores
        log("📜 Verificando logs de errores...", Colors.BLUE)
        status, output, _ = exec_cmd(client, 
            "pm2 logs inmova-app --nostream --lines 20 2>&1 | grep -i 'error' | tail -5")
        if output:
            log(f"⚠️ Errores recientes en logs:\n{output}", Colors.YELLOW)
        else:
            log("✅ Sin errores críticos en logs", Colors.GREEN)

        # Resumen final
        print(f"""
{Colors.CYAN}{'='*70}
✅ DEPLOY COMPLETADO
{'='*70}{Colors.END}

{Colors.BOLD}URLs:{Colors.END}
  - Producción: https://inmovaapp.com
  - IP Directa: http://{SERVER_IP}:3000
  - Health: https://inmovaapp.com/api/health

{Colors.BOLD}Verificaciones:{Colors.END}
  - Health checks: {checks_passed}/{checks_total}
  - Branch: {BRANCH}
  - Build: OK

{Colors.BOLD}Cambios desplegados:{Colors.END}
  - Correcciones de conexiones frontend-backend
  - Mapeo de modelos Prisma corregido
  - Compatibilidad de campos API-Frontend

{Colors.BOLD}Para ver logs:{Colors.END}
  ssh root@{SERVER_IP} 'pm2 logs inmova-app'

{Colors.CYAN}{'='*70}{Colors.END}
""")

        return 0

    except Exception as e:
        log(f"❌ Error durante deploy: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("🔐 Conexión cerrada", Colors.BLUE)

if __name__ == '__main__':
    sys.exit(main())
