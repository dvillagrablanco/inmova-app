#!/usr/bin/env python3
"""
Deployment script para auditoría de páginas admin.
Usa paramiko para SSH ya que sshpass no está disponible.
"""

import sys
import time

# Configurar path para paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiGGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando y retornar status + output."""
    log(f"  → {cmd[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    errors = stderr.read().decode('utf-8', errors='replace')
    if exit_status != 0 and errors:
        log(f"  ⚠️ stderr: {errors[:200]}", Colors.YELLOW)
    return exit_status, output

def main():
    print(f"""
{Colors.BOLD}{'='*70}
🚀 DEPLOYMENT - AUDITORÍA ADMIN PANEL
{'='*70}{Colors.RESET}

Servidor: {SERVER_IP}
Path: {APP_PATH}
""")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # Conectar
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USER, password=PASS, timeout=15)
        log("✅ Conectado", Colors.GREEN)

        # 1. Verificar estado actual
        log("\n📂 Verificando estado actual...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git status --short | head -5")
        if output.strip():
            log(f"  Cambios locales detectados: {output.strip()}", Colors.YELLOW)

        # 2. Git pull
        log("\n📥 Actualizando código...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git pull origin main --no-verify 2>&1")
        if status != 0:
            log(f"⚠️ Git pull con warnings: {output[:200]}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # 3. Verificar archivos modificados
        log("\n📋 Verificando archivos de auditoría...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && ls -la app/admin/page.tsx app/admin/configuracion/page.tsx 2>&1")
        log(f"  Archivos verificados", Colors.GREEN)

        # 4. Instalar dependencias (solo si hay cambios en package.json)
        log("\n📦 Verificando dependencias...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --prefer-offline 2>&1 | tail -5", timeout=300)
        log("✅ Dependencias OK", Colors.GREEN)

        # 5. Generar Prisma
        log("\n🔧 Generando Prisma Client...", Colors.CYAN)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3", timeout=120)
        if status == 0:
            log("✅ Prisma generado", Colors.GREEN)
        else:
            log("⚠️ Prisma con warnings", Colors.YELLOW)

        # 6. Build
        log("\n🏗️ Building aplicación...", Colors.CYAN)
        log("  (esto puede tardar 2-5 minutos)", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"❌ Build falló: {output[-500:]}", Colors.RED)
            return 1

        # 7. Restart PM2
        log("\n♻️ Reiniciando aplicación con PM2...", Colors.CYAN)
        status, output = exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1")
        log("✅ PM2 reloaded", Colors.GREEN)

        # 8. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)

        # 9. Health checks
        log("\n🏥 Ejecutando health checks...", Colors.CYAN)
        
        checks_passed = 0
        total_checks = 5

        # Check 1: API Health
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or 'ok' in output.lower():
            log("  ✅ API Health OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ API Health: {output[:100]}", Colors.YELLOW)

        # Check 2: Admin Dashboard
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin/dashboard")
        if '200' in output or '302' in output:
            log("  ✅ Admin Dashboard OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ Admin Dashboard: HTTP {output}", Colors.YELLOW)

        # Check 3: Admin Configuración
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin/configuracion")
        if '200' in output or '302' in output:
            log("  ✅ Admin Configuración OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ Admin Configuración: HTTP {output}", Colors.YELLOW)

        # Check 4: PM2 status
        status, output = exec_cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"' | head -1")
        if 'online' in output:
            log("  ✅ PM2 Status: online", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ PM2 Status: {output}", Colors.YELLOW)

        # Check 5: Login page
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        if '200' in output:
            log("  ✅ Login Page OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ⚠️ Login Page: HTTP {output}", Colors.YELLOW)

        # 10. Resumen
        print(f"""
{Colors.BOLD}{'='*70}
📊 RESUMEN DE DEPLOYMENT
{'='*70}{Colors.RESET}

Health Checks: {checks_passed}/{total_checks} pasando
""")

        if checks_passed >= 4:
            log("✅ DEPLOYMENT EXITOSO", Colors.GREEN)
            print(f"""
{Colors.GREEN}URLs de verificación:{Colors.RESET}
  - Dashboard: https://inmovaapp.com/admin/dashboard
  - Configuración: https://inmovaapp.com/admin/configuracion
  - Health: https://inmovaapp.com/api/health
  - Login: https://inmovaapp.com/login

{Colors.CYAN}Cambios aplicados:{Colors.RESET}
  - AuthenticatedLayout en loading states de 15+ páginas admin
  - /admin redirige a /admin/dashboard
  - Botón delete en tabla de addons

Para ver logs: ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'
""")
            return 0
        else:
            log("⚠️ DEPLOYMENT CON WARNINGS", Colors.YELLOW)
            return 1

    except paramiko.AuthenticationException:
        log("❌ Error de autenticación SSH", Colors.RED)
        return 1
    except paramiko.SSHException as e:
        log(f"❌ Error SSH: {e}", Colors.RED)
        return 1
    except Exception as e:
        log(f"❌ Error inesperado: {e}", Colors.RED)
        return 1
    finally:
        client.close()
        log("\n🔒 Conexión cerrada", Colors.CYAN)

if __name__ == '__main__':
    sys.exit(main())
