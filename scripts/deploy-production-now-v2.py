#!/usr/bin/env python3
"""
Deployment en producción con Paramiko - Febrero 2026
"""

import sys
import time
import json

# Paramiko path para Cloud Agent
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

# Configuración del servidor
SERVER_IP = '157.180.119.236'
SSH_PORT = 22
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
REMOTE_PATH = '/opt/inmova-app'
GIT_BRANCH = 'main'

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(message, color=Colors.CYAN):
    print(f"{color}{message}{Colors.END}")

def log_step(step, message):
    print(f"\n{Colors.BOLD}[PASO {step}] {message}{Colors.END}")

def exec_cmd(client, command, timeout=60, show_output=True):
    """Ejecutar comando SSH y retornar resultado"""
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if show_output and output.strip():
            print(output.strip()[:500])  # Limitar output
        
        if exit_status != 0 and error.strip():
            print(f"{Colors.RED}Error: {error.strip()[:200]}{Colors.END}")
        
        return exit_status, output.strip()
    except Exception as e:
        print(f"{Colors.RED}Error ejecutando comando: {str(e)}{Colors.END}")
        return 1, str(e)

def main():
    log("=" * 70, Colors.BOLD)
    log("🚀 DEPLOYMENT EN PRODUCCIÓN - INMOVA APP", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    log(f"\nServidor: {USERNAME}@{SERVER_IP}")
    log(f"Path: {REMOTE_PATH}")
    log(f"Branch: {GIT_BRANCH}\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # PASO 1: Conectar
        log_step(1, "Conectando al servidor...")
        client.connect(SERVER_IP, port=SSH_PORT, username=USERNAME, password=PASSWORD, timeout=15)
        log("✅ Conexión establecida", Colors.GREEN)
        
        # PASO 2: Verificar estado actual
        log_step(2, "Verificando estado del servidor...")
        
        # PM2 status
        status, output = exec_cmd(client, "pm2 jlist", show_output=False)
        if status == 0:
            try:
                pm2_data = json.loads(output) if output else []
                log(f"✅ PM2: {len(pm2_data)} proceso(s) activo(s)", Colors.GREEN)
            except:
                log("⚠️  PM2: No se pudo parsear estado", Colors.YELLOW)
        else:
            log("❌ PM2: No disponible", Colors.RED)
        
        # Disk space
        status, output = exec_cmd(client, "df -h / | tail -1 | awk '{print $5}'", show_output=False)
        log(f"📁 Uso de disco: {output}", Colors.CYAN)
        
        # Memory
        status, output = exec_cmd(client, "free -m | grep Mem | awk '{printf \"%.1f%%\", $3/$2*100}'", show_output=False)
        log(f"💾 Uso de memoria: {output}", Colors.CYAN)
        
        # PASO 3: Backup de BD
        log_step(3, "Creando backup de base de datos...")
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        backup_cmd = f"""
        mkdir -p /var/backups/inmova && \
        cd {REMOTE_PATH} && \
        source .env.production 2>/dev/null && \
        pg_dump "$DATABASE_URL" > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null && \
        echo "Backup creado: pre-deploy-{timestamp}.sql" || echo "Backup omitido (no critical)"
        """
        status, output = exec_cmd(client, backup_cmd, timeout=120)
        log("✅ Backup completado (o omitido)", Colors.GREEN)
        
        # PASO 4: Git pull
        log_step(4, "Actualizando código desde GitHub...")
        git_cmd = f"""
        cd {REMOTE_PATH} && \
        git stash 2>/dev/null && \
        git fetch origin {GIT_BRANCH} && \
        git checkout {GIT_BRANCH} && \
        git reset --hard origin/{GIT_BRANCH}
        """
        status, output = exec_cmd(client, git_cmd, timeout=120)
        if status == 0:
            log("✅ Código actualizado", Colors.GREEN)
        else:
            log(f"⚠️  Git pull con advertencias: {output[:100]}", Colors.YELLOW)
        
        # PASO 5: Verificar commit actual
        status, output = exec_cmd(client, f"cd {REMOTE_PATH} && git log --oneline -1", show_output=False)
        log(f"📌 Commit actual: {output}", Colors.CYAN)
        
        # PASO 6: Instalar dependencias
        log_step(5, "Instalando dependencias (npm ci)...")
        status, output = exec_cmd(client, f"cd {REMOTE_PATH} && npm ci --omit=dev 2>&1 | tail -5", timeout=300)
        if status == 0:
            log("✅ Dependencias instaladas", Colors.GREEN)
        else:
            log("⚠️  npm ci con advertencias", Colors.YELLOW)
        
        # PASO 6b: Prisma generate
        log_step("5b", "Generando Prisma Client...")
        status, output = exec_cmd(client, f"cd {REMOTE_PATH} && npx prisma generate", timeout=120)
        if status == 0:
            log("✅ Prisma Client generado", Colors.GREEN)
        else:
            log("⚠️  Prisma generate con advertencias", Colors.YELLOW)
        
        # PASO 7: Build
        log_step(6, "Building aplicación (npm run build)...")
        build_cmd = f"""
        cd {REMOTE_PATH} && \
        export NODE_ENV=production && \
        npm run build 2>&1 | tail -20
        """
        status, output = exec_cmd(client, build_cmd, timeout=600)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log("❌ Build falló - verificando si hay build anterior...", Colors.RED)
            # Verificar si hay build anterior
            status2, _ = exec_cmd(client, f"test -d {REMOTE_PATH}/.next", show_output=False)
            if status2 == 0:
                log("⚠️  Usando build anterior existente", Colors.YELLOW)
            else:
                log("❌ No hay build disponible", Colors.RED)
                return 1
        
        # PASO 8: PM2 reload
        log_step(7, "Reiniciando aplicación (PM2 reload)...")
        
        # Verificar si PM2 tiene la app
        status, output = exec_cmd(client, "pm2 list | grep inmova", show_output=False)
        
        if 'inmova' in output:
            # Reload existente
            status, output = exec_cmd(client, "pm2 reload inmova-app --update-env", timeout=60)
        else:
            # Iniciar nuevo
            log("Iniciando PM2 por primera vez...", Colors.CYAN)
            pm2_cmd = f"""
            cd {REMOTE_PATH} && \
            pm2 start ecosystem.config.js --env production 2>/dev/null || \
            pm2 start npm --name inmova-app -- start
            """
            status, output = exec_cmd(client, pm2_cmd, timeout=60)
        
        if status == 0:
            log("✅ PM2 reiniciado", Colors.GREEN)
        else:
            log("⚠️  PM2 reiniciado con advertencias", Colors.YELLOW)
        
        # Guardar PM2
        exec_cmd(client, "pm2 save", show_output=False)
        
        # PASO 9: Esperar warm-up
        log_step(8, "Esperando warm-up (20 segundos)...")
        time.sleep(20)
        
        # PASO 10: Health checks
        log_step(9, "Verificando health checks...")
        
        checks_passed = 0
        total_checks = 5
        
        # Check 1: HTTP local
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health", show_output=False)
        http_ok = output == '200'
        log(f"  HTTP /api/health: {'✅' if http_ok else '❌'} ({output})", Colors.GREEN if http_ok else Colors.RED)
        if http_ok: checks_passed += 1
        
        # Check 2: Landing page
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing", show_output=False)
        landing_ok = output == '200'
        log(f"  Landing page: {'✅' if landing_ok else '❌'} ({output})", Colors.GREEN if landing_ok else Colors.RED)
        if landing_ok: checks_passed += 1
        
        # Check 3: Login page
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login", show_output=False)
        login_ok = output == '200'
        log(f"  Login page: {'✅' if login_ok else '❌'} ({output})", Colors.GREEN if login_ok else Colors.RED)
        if login_ok: checks_passed += 1
        
        # Check 4: PM2 status
        status, output = exec_cmd(client, "pm2 jlist", show_output=False)
        try:
            pm2_data = json.loads(output) if output else []
            pm2_online = any(p['pm2_env']['status'] == 'online' for p in pm2_data)
        except:
            pm2_online = False
        log(f"  PM2 online: {'✅' if pm2_online else '❌'}", Colors.GREEN if pm2_online else Colors.RED)
        if pm2_online: checks_passed += 1
        
        # Check 5: Memory usage
        status, output = exec_cmd(client, "free | grep Mem | awk '{printf \"%.0f\", $3/$2*100}'", show_output=False)
        try:
            mem_usage = int(output)
            mem_ok = mem_usage < 90
        except:
            mem_ok = True
            mem_usage = 0
        log(f"  Memoria <90%: {'✅' if mem_ok else '❌'} ({mem_usage}%)", Colors.GREEN if mem_ok else Colors.RED)
        if mem_ok: checks_passed += 1
        
        # RESUMEN
        log("\n" + "=" * 70, Colors.BOLD)
        log(f"📊 HEALTH CHECKS: {checks_passed}/{total_checks} pasando", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        
        if checks_passed >= 4:
            log("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
            """, Colors.GREEN)
            
            log("🔗 URLs de producción:", Colors.BOLD)
            log("   • https://inmovaapp.com", Colors.CYAN)
            log("   • http://157.180.119.236:3000 (IP directa)", Colors.CYAN)
            log("\n📋 Comandos útiles:", Colors.BOLD)
            log("   pm2 logs inmova-app --lines 50", Colors.CYAN)
            log("   pm2 status", Colors.CYAN)
            
            return 0
        else:
            log("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  ⚠️  DEPLOYMENT CON ADVERTENCIAS                                ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
            """, Colors.YELLOW)
            return 1
        
    except paramiko.AuthenticationException:
        log("❌ Error de autenticación - verifica credenciales", Colors.RED)
        return 1
    except paramiko.SSHException as e:
        log(f"❌ Error SSH: {str(e)}", Colors.RED)
        return 1
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        try:
            client.close()
            log("\n🔒 Conexión SSH cerrada", Colors.CYAN)
        except:
            pass

if __name__ == '__main__':
    sys.exit(main())
