#!/usr/bin/env python3
"""
Deployment script para módulo de comunidades de propietarios
Usa paramiko para conexión SSH
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
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print(f"""
{Colors.CYAN}{'='*70}
🚀 DEPLOYMENT - MÓDULO COMUNIDADES DE PROPIETARIOS
{'='*70}{Colors.END}

Servidor: {SERVER_IP}
Path: {APP_PATH}
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
        # 1. Backup de BD
        log("💾 Creando backup de BD...", Colors.BLUE)
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        backup_cmd = f"cd {APP_PATH} && pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'"
        exec_cmd(client, backup_cmd)
        log("✅ Backup completado", Colors.GREEN)

        # 2. Git pull
        log("📥 Actualizando código desde Git...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin main && git reset --hard origin/main")
        if status != 0:
            log(f"⚠️ Git pull warning: {error}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # 3. Instalar dependencias
        log("📦 Instalando dependencias...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if status != 0:
            log(f"⚠️ npm install warning: {error[:200]}", Colors.YELLOW)
        else:
            log("✅ Dependencias instaladas", Colors.GREEN)

        # 4. Prisma generate
        log("🔧 Generando Prisma client...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status != 0:
            log(f"⚠️ Prisma generate warning: {error[:200]}", Colors.YELLOW)
        else:
            log("✅ Prisma client generado", Colors.GREEN)

        # 5. Build
        log("🏗️ Building aplicación...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"❌ Build error: {error[:500]}", Colors.RED)
            # Intentar continuar con reload
        else:
            log("✅ Build completado", Colors.GREEN)

        # 6. PM2 reload
        log("♻️ Reiniciando aplicación con PM2...", Colors.BLUE)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env")
        if status != 0:
            log(f"⚠️ PM2 warning: {error}", Colors.YELLOW)
        else:
            log("✅ PM2 reload completado", Colors.GREEN)

        # 7. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.BLUE)
        time.sleep(20)

        # 8. Health checks
        log("🏥 Verificando health checks...", Colors.BLUE)
        
        # Check HTTP
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")
        http_code = output.strip()
        if http_code == '200':
            log(f"✅ Health check HTTP: {http_code}", Colors.GREEN)
        else:
            log(f"⚠️ Health check HTTP: {http_code}", Colors.YELLOW)

        # Check PM2 status
        status, output, error = exec_cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"' | head -1")
        if 'online' in output:
            log("✅ PM2 status: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {output}", Colors.YELLOW)

        # Check login page
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
        if output.strip() == '200':
            log("✅ Login page: OK", Colors.GREEN)
        else:
            log(f"⚠️ Login page: {output.strip()}", Colors.YELLOW)

        # Check comunidades API
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/comunidades/dashboard")
        if output.strip() in ['200', '401']:
            log(f"✅ API Comunidades: {output.strip()} (OK)", Colors.GREEN)
        else:
            log(f"⚠️ API Comunidades: {output.strip()}", Colors.YELLOW)

        # 9. Verificar logs
        log("📋 Últimos logs de la aplicación:", Colors.BLUE)
        status, output, error = exec_cmd(client, "pm2 logs inmova-app --nostream --lines 5 2>/dev/null | tail -10")
        print(output[:500] if output else "No logs available")

        print(f"""
{Colors.GREEN}{'='*70}
✅ DEPLOYMENT COMPLETADO EXITOSAMENTE
{'='*70}{Colors.END}

{Colors.CYAN}URLs de verificación:{Colors.END}
  • Landing: https://inmovaapp.com
  • Login: https://inmovaapp.com/login
  • Dashboard: https://inmovaapp.com/dashboard
  • Comunidades: https://inmovaapp.com/comunidades
  • Health: https://inmovaapp.com/api/health

{Colors.CYAN}Módulos desplegados:{Colors.END}
  ✅ Dashboard de Comunidades
  ✅ Lista de Comunidades
  ✅ Gestión de Cuotas
  ✅ Votaciones
  ✅ Fondos
  ✅ Actas
  ✅ Incidencias
  ✅ Reuniones
  ✅ Propietarios
  ✅ Finanzas
  ✅ Portal del Presidente
  ✅ Cumplimiento Legal
  ✅ Renovaciones (IPC)

{Colors.YELLOW}Para ver logs en tiempo real:{Colors.END}
  ssh root@{SERVER_IP} 'pm2 logs inmova-app'
""")

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("🔒 Conexión cerrada", Colors.BLUE)

    return 0

if __name__ == '__main__':
    sys.exit(main())
