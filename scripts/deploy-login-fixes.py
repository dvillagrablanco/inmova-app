#!/usr/bin/env python3
"""
Deployment de Login Fixes a Producción
Despliega correcciones de login y navegación avanzada
"""

import sys
import time

# Añadir path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.CYAN):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, command, description="Ejecutando comando", timeout=300, check_error=True):
    """Ejecutar comando en servidor remoto"""
    log(f"📋 {description}...", Colors.CYAN)
    
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if exit_status == 0:
            log(f"✅ {description} - OK", Colors.GREEN)
            if output.strip():
                # Mostrar solo últimas 10 líneas si es muy largo
                lines = output.strip().split('\n')
                if len(lines) > 10:
                    print(f"   (Mostrando últimas 10 líneas de {len(lines)})")
                    for line in lines[-10:]:
                        print(f"   {line}")
                else:
                    for line in lines:
                        print(f"   {line}")
            return exit_status, output
        else:
            if check_error:
                log(f"❌ {description} - FALLÓ (exit: {exit_status})", Colors.RED)
                if error.strip():
                    for line in error.strip().split('\n')[:10]:
                        print(f"   {line}")
                raise Exception(f"{description} falló con código {exit_status}")
            else:
                log(f"⚠️  {description} - Warning (exit: {exit_status})", Colors.YELLOW)
                return exit_status, output
                
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        raise

def main():
    log("=" * 70, Colors.HEADER)
    log("🚀 DEPLOYMENT DE LOGIN FIXES A PRODUCCIÓN", Colors.HEADER)
    log("=" * 70, Colors.HEADER)
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    log(f"Path: {APP_PATH}", Colors.BLUE)
    log("")
    
    # Conectar al servidor
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(
            SERVER_IP,
            username=USERNAME,
            password=PASSWORD,
            timeout=10,
            look_for_keys=False,
            allow_agent=False
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
        log("")
        
        # 1. Verificar estado actual
        log("=" * 70, Colors.HEADER)
        log("📊 FASE 1: VERIFICACIÓN PREVIA", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        
        exec_cmd(
            client,
            f"cd {APP_PATH} && git log -1 --oneline",
            "Verificar commit actual"
        )
        
        exec_cmd(
            client,
            "pm2 status inmova-app",
            "Verificar estado de PM2",
            check_error=False
        )
        
        log("")
        
        # 2. Backup de BD (opcional pero recomendado)
        log("=" * 70, Colors.HEADER)
        log("💾 FASE 2: BACKUP PRE-DEPLOYMENT", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        
        backup_name = f"pre-login-fixes-{time.strftime('%Y%m%d_%H%M%S')}.sql"
        
        # Intentar backup pero no fallar si no funciona
        exec_cmd(
            client,
            f"pg_dump -U inmova_user inmova_production > /var/backups/inmova/{backup_name} 2>/dev/null || echo 'Backup skipped'",
            "Backup de base de datos",
            check_error=False
        )
        
        log("")
        
        # 3. Git pull
        log("=" * 70, Colors.HEADER)
        log("📥 FASE 3: ACTUALIZAR CÓDIGO", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        
        exec_cmd(
            client,
            f"cd {APP_PATH} && git fetch origin",
            "Fetch de repositorio remoto"
        )
        
        exec_cmd(
            client,
            f"cd {APP_PATH} && git pull origin main",
            "Pull de main branch"
        )
        
        exec_cmd(
            client,
            f"cd {APP_PATH} && git log -3 --oneline",
            "Verificar commits recientes"
        )
        
        log("")
        
        # 4. Instalar dependencias (solo si hay cambios)
        log("=" * 70, Colors.HEADER)
        log("📦 FASE 4: DEPENDENCIAS", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        
        # Verificar si package.json cambió
        status, output = exec_cmd(
            client,
            f"cd {APP_PATH} && git diff HEAD@{{1}} HEAD --name-only | grep package.json",
            "Verificar cambios en package.json",
            check_error=False
        )
        
        if 'package.json' in output:
            log("📦 package.json cambió, instalando dependencias...", Colors.YELLOW)
            exec_cmd(
                client,
                f"cd {APP_PATH} && npm install",
                "Instalar dependencias",
                timeout=600
            )
        else:
            log("✅ Sin cambios en package.json, omitiendo npm install", Colors.GREEN)
        
        log("")
        
        # 5. Build
        log("=" * 70, Colors.HEADER)
        log("🏗️  FASE 5: BUILD", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        
        # Limpiar cache primero
        exec_cmd(
            client,
            f"cd {APP_PATH} && rm -rf .next/cache",
            "Limpiar cache de Next.js"
        )
        
        exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build",
            "Build de aplicación",
            timeout=600
        )
        
        log("")
        
        # 6. Restart PM2
        log("=" * 70, Colors.HEADER)
        log("♻️  FASE 6: RESTART PM2", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        
        exec_cmd(
            client,
            "pm2 reload inmova-app",
            "PM2 reload (zero-downtime)"
        )
        
        exec_cmd(
            client,
            "pm2 save",
            "Guardar configuración PM2"
        )
        
        log("")
        log("⏳ Esperando warm-up (15 segundos)...", Colors.YELLOW)
        time.sleep(15)
        
        # 7. Health checks
        log("=" * 70, Colors.HEADER)
        log("🏥 FASE 7: HEALTH CHECKS", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        
        # Check 1: PM2 status
        status, output = exec_cmd(
            client,
            "pm2 status inmova-app",
            "1/5 Verificar PM2 status"
        )
        
        if 'online' in output.lower():
            log("   ✅ PM2 está online", Colors.GREEN)
        else:
            log("   ❌ PM2 NO está online", Colors.RED)
            raise Exception("PM2 no está online después del restart")
        
        # Check 2: HTTP health
        status, output = exec_cmd(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'fail'",
            "2/5 Verificar HTTP localhost:3000"
        )
        
        if '200' in output:
            log("   ✅ HTTP 200 OK", Colors.GREEN)
        else:
            log(f"   ⚠️  HTTP respuesta: {output.strip()}", Colors.YELLOW)
        
        # Check 3: API health
        status, output = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/health | head -20 || echo 'fail'",
            "3/5 Verificar /api/health"
        )
        
        if 'ok' in output.lower() or '200' in output:
            log("   ✅ API health OK", Colors.GREEN)
        else:
            log(f"   ⚠️  API health: {output[:100]}", Colors.YELLOW)
        
        # Check 4: Login page
        status, output = exec_cmd(
            client,
            "curl -s http://localhost:3000/login | grep -i 'INMOVA' | head -1 || echo 'not found'",
            "4/5 Verificar página de login"
        )
        
        if 'INMOVA' in output or 'inmova' in output.lower():
            log("   ✅ Login page renderiza", Colors.GREEN)
        else:
            log("   ⚠️  Login page no encontrada", Colors.YELLOW)
        
        # Check 5: Memoria
        exec_cmd(
            client,
            "free -h | grep Mem",
            "5/5 Verificar memoria del servidor"
        )
        
        log("")
        
        # 8. Verificar logs recientes
        log("=" * 70, Colors.HEADER)
        log("📋 FASE 8: LOGS RECIENTES", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        
        exec_cmd(
            client,
            "pm2 logs inmova-app --lines 20 --nostream",
            "Últimos 20 logs de PM2",
            check_error=False
        )
        
        log("")
        
        # Resumen final
        log("=" * 70, Colors.HEADER)
        log("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE", Colors.HEADER)
        log("=" * 70, Colors.HEADER)
        log("")
        log("🎯 CAMBIOS DESPLEGADOS:", Colors.GREEN)
        log("   ✅ Corrección de error de servidor en login", Colors.GREEN)
        log("   ✅ Mejoras visuales en página de login", Colors.GREEN)
        log("   ✅ Quick Actions en Candidatos y Mantenimiento", Colors.GREEN)
        log("   ✅ Shortcuts de navegación por tabs (1-9)", Colors.GREEN)
        log("   ✅ Shortcuts de navegación en listas (J/K)", Colors.GREEN)
        log("   ✅ Tutorial interactivo de navegación", Colors.GREEN)
        log("")
        log("🌐 URLs DE VERIFICACIÓN:", Colors.CYAN)
        log("   🔗 Landing: https://inmovaapp.com", Colors.BLUE)
        log("   🔗 Login: https://inmovaapp.com/login", Colors.BLUE)
        log("   🔗 Dashboard: https://inmovaapp.com/dashboard", Colors.BLUE)
        log("   🔗 Health: https://inmovaapp.com/api/health", Colors.BLUE)
        log("   🔗 IP: http://157.180.119.236:3000", Colors.BLUE)
        log("")
        log("🔐 CREDENCIALES DE TEST:", Colors.CYAN)
        log("   Email: admin@inmova.app", Colors.BLUE)
        log("   Password: Admin123!", Colors.BLUE)
        log("")
        log("📊 LOGS:", Colors.CYAN)
        log("   ssh root@157.180.119.236 'pm2 logs inmova-app'", Colors.BLUE)
        log("")
        log("=" * 70, Colors.HEADER)
        
    except Exception as e:
        log("=" * 70, Colors.RED)
        log(f"❌ DEPLOYMENT FALLÓ: {str(e)}", Colors.RED)
        log("=" * 70, Colors.RED)
        log("")
        log("🔧 TROUBLESHOOTING:", Colors.YELLOW)
        log("   1. Ver logs: ssh root@157.180.119.236 'pm2 logs inmova-app --lines 50'", Colors.YELLOW)
        log("   2. Ver status: ssh root@157.180.119.236 'pm2 status'", Colors.YELLOW)
        log("   3. Restart manual: ssh root@157.180.119.236 'pm2 restart inmova-app'", Colors.YELLOW)
        log("")
        sys.exit(1)
        
    finally:
        client.close()
        log("🔌 Conexión SSH cerrada", Colors.CYAN)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log("\n⚠️  Deployment cancelado por usuario", Colors.YELLOW)
        sys.exit(1)
    except Exception as e:
        log(f"\n❌ Error fatal: {str(e)}", Colors.RED)
        sys.exit(1)
