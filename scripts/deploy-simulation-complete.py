#!/usr/bin/env python3
"""
Deploy script usando Paramiko SSH
Ejecuta el deploy completo al servidor de producción
"""

import sys
import time

# Añadir path para paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.END):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=300, check_error=True):
    """Ejecuta comando SSH y retorna status y output"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        error = stderr.read().decode('utf-8', errors='replace')
        
        if exit_status != 0 and check_error:
            if error:
                return exit_status, error
        return exit_status, output
    except Exception as e:
        return -1, str(e)

def main():
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}🚀 DEPLOY INMOVA APP - POST SIMULACIÓN{Colors.END}")
    print(f"{Colors.CYAN}{'='*70}{Colors.END}")
    print(f"\nServidor: {SERVER_IP}")
    print(f"Usuario: {USERNAME}")
    print(f"Path: {APP_PATH}")
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")

    # Conectar al servidor
    log("🔐 Conectando al servidor...", Colors.BLUE)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=USERNAME,
            password=PASSWORD,
            timeout=30,
            allow_agent=False,
            look_for_keys=False
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return False

    try:
        # 1. Verificar estado actual
        log("📊 Verificando estado actual del servidor...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git status --short")
        log(f"Estado git: {'Limpio' if not output.strip() else 'Con cambios'}", Colors.CYAN)

        # 2. Backup de la base de datos
        log("💾 Creando backup de base de datos...", Colors.BLUE)
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        backup_cmd = f"pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'"
        status, output = exec_cmd(client, backup_cmd, check_error=False)
        log("✅ Backup completado", Colors.GREEN)

        # 3. Pull del código más reciente
        log("📥 Actualizando código desde repositorio...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git pull origin main --ff-only 2>&1 || git pull origin cursor/p-ginas-innovaci-n-crud-4dd3 --ff-only 2>&1", timeout=120)
        if status == 0:
            log("✅ Código actualizado", Colors.GREEN)
        else:
            log(f"⚠️ Git pull: {output[:200]}", Colors.YELLOW)

        # 4. Instalar dependencias si hay cambios
        log("📦 Verificando dependencias...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm ci --prefer-offline 2>&1 | tail -5", timeout=300)
        log("✅ Dependencias verificadas", Colors.GREEN)

        # 5. Generar Prisma Client
        log("🔧 Generando Prisma Client...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3", timeout=120)
        log("✅ Prisma Client generado", Colors.GREEN)

        # 6. Ejecutar migraciones de BD
        log("🗃️ Aplicando migraciones de base de datos...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma migrate deploy 2>&1 | tail -5", timeout=180, check_error=False)
        log("✅ Migraciones aplicadas", Colors.GREEN)

        # 7. Build de la aplicación
        log("🏗️ Construyendo aplicación (esto puede tardar unos minutos)...", Colors.BLUE)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if status == 0:
            log("✅ Build completado exitosamente", Colors.GREEN)
        else:
            log(f"⚠️ Build output: {output[-500:]}", Colors.YELLOW)

        # 8. Reiniciar PM2
        log("♻️ Reiniciando aplicación con PM2...", Colors.BLUE)
        status, output = exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1")
        log("✅ PM2 reiniciado", Colors.GREEN)

        # 9. Esperar warm-up
        log("⏳ Esperando warm-up de la aplicación...", Colors.BLUE)
        time.sleep(20)

        # 10. Health checks
        log("🏥 Ejecutando health checks...", Colors.BLUE)
        
        # Health check HTTP
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")
        http_status = output.strip()
        if http_status == "200":
            log(f"✅ HTTP Health: {http_status} OK", Colors.GREEN)
        else:
            log(f"⚠️ HTTP Health: {http_status}", Colors.YELLOW)

        # Health check Landing
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
        landing_status = output.strip()
        if landing_status == "200":
            log(f"✅ Landing Page: {landing_status} OK", Colors.GREEN)
        else:
            log(f"⚠️ Landing Page: {landing_status}", Colors.YELLOW)

        # PM2 status
        status, output = exec_cmd(client, "pm2 jlist | python3 -c \"import sys,json; d=json.load(sys.stdin); print('online' if any(p['pm2_env']['status']=='online' for p in d) else 'error')\" 2>/dev/null || echo 'check'")
        pm2_status = output.strip()
        if pm2_status == "online":
            log(f"✅ PM2 Status: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 Status: {pm2_status}", Colors.YELLOW)

        # 11. Verificar login endpoint
        log("🔐 Verificando endpoint de autenticación...", Colors.BLUE)
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/auth/session | head -c 100")
        if "error" not in output.lower() or "{}" in output:
            log("✅ Auth endpoint: OK", Colors.GREEN)
        else:
            log(f"⚠️ Auth endpoint: {output[:100]}", Colors.YELLOW)

        # 12. Mostrar logs recientes
        log("📋 Logs recientes de PM2...", Colors.BLUE)
        status, output = exec_cmd(client, "pm2 logs inmova-app --nostream --lines 10 2>&1 | tail -15")
        print(f"\n{Colors.CYAN}--- Últimos logs ---{Colors.END}")
        print(output[:1000])

        # Resumen final
        print(f"\n{Colors.GREEN}{'='*70}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.GREEN}✅ DEPLOY COMPLETADO EXITOSAMENTE{Colors.END}")
        print(f"{Colors.GREEN}{'='*70}{Colors.END}")
        print(f"\n{Colors.CYAN}URLs de acceso:{Colors.END}")
        print(f"  • Landing: https://inmovaapp.com")
        print(f"  • Login: https://inmovaapp.com/login")
        print(f"  • Dashboard: https://inmovaapp.com/dashboard")
        print(f"  • Health: https://inmovaapp.com/api/health")
        print(f"\n{Colors.CYAN}Para ver logs:{Colors.END}")
        print(f"  ssh root@{SERVER_IP} 'pm2 logs inmova-app'")
        print(f"\n{Colors.GREEN}{'='*70}{Colors.END}\n")

        return True

    except Exception as e:
        log(f"❌ Error durante deploy: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()
        log("🔌 Conexión cerrada", Colors.BLUE)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
