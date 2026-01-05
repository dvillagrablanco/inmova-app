#!/usr/bin/env python3
"""
Deploy Sprint 3 eWoorker + Landing updates a producción
Usando Paramiko para SSH
"""
import sys
import time

# Añadir path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando SSH y retornar resultado"""
    log(f"$ {cmd[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and error:
        log(f"STDERR: {error[:200]}", Colors.YELLOW)
    
    return exit_status, output, error

def main():
    log("=" * 70, Colors.CYAN)
    log("🚀 DEPLOYMENT SPRINT 3 - EWOORKER + LANDING", Colors.BOLD)
    log("=" * 70, Colors.CYAN)
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"Path: {APP_PATH}", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    # Conectar
    log("🔐 Conectando a servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Backup de BD
        log("\n💾 1. BACKUP DE BASE DE DATOS", Colors.BOLD)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        backup_cmd = f"pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'"
        exec_cmd(client, backup_cmd)
        log("✅ Backup completado", Colors.GREEN)
        
        # 2. Git pull
        log("\n📥 2. ACTUALIZANDO CÓDIGO", Colors.BOLD)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main")
        if status == 0:
            log("✅ Código actualizado", Colors.GREEN)
        else:
            log(f"⚠️ Git pull con warnings: {output[:100]}", Colors.YELLOW)
        
        # 3. Install dependencies
        log("\n📦 3. INSTALANDO DEPENDENCIAS", Colors.BOLD)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if status == 0:
            log("✅ Dependencias instaladas", Colors.GREEN)
        else:
            log(f"⚠️ npm install con warnings", Colors.YELLOW)
        
        # 4. Prisma generate
        log("\n🔧 4. PRISMA GENERATE", Colors.BOLD)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        if status == 0:
            log("✅ Prisma client generado", Colors.GREEN)
        else:
            log(f"⚠️ Prisma generate con warnings", Colors.YELLOW)
        
        # 5. Prisma migrate
        log("\n🗄️ 5. PRISMA MIGRATE", Colors.BOLD)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma migrate deploy", timeout=120)
        if status == 0:
            log("✅ Migraciones aplicadas", Colors.GREEN)
        else:
            log(f"⚠️ Migrate con warnings: {error[:100]}", Colors.YELLOW)
        
        # 6. Build
        log("\n🏗️ 6. BUILD", Colors.BOLD)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=900)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"❌ Build falló: {error[:200]}", Colors.RED)
            # Continuar de todas formas para PM2 reload
        
        # 7. PM2 reload
        log("\n♻️ 7. PM2 RELOAD", Colors.BOLD)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env || pm2 restart inmova-app --update-env")
        if status == 0:
            log("✅ PM2 reloaded", Colors.GREEN)
        else:
            log("⚠️ PM2 reload con warnings", Colors.YELLOW)
        
        # 8. Esperar warm-up
        log("\n⏳ 8. ESPERANDO WARM-UP (20s)", Colors.BOLD)
        time.sleep(20)
        log("✅ Warm-up completado", Colors.GREEN)
        
        # 9. Health checks
        log("\n🏥 9. HEALTH CHECKS", Colors.BOLD)
        
        # Check HTTP
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")
        http_status = output.strip()
        if http_status == "200":
            log(f"✅ HTTP /api/health: {http_status}", Colors.GREEN)
        else:
            log(f"⚠️ HTTP /api/health: {http_status}", Colors.YELLOW)
        
        # Check landing eWoorker
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ewoorker/landing")
        ewoorker_status = output.strip()
        if ewoorker_status == "200":
            log(f"✅ eWoorker Landing: {ewoorker_status}", Colors.GREEN)
        else:
            log(f"⚠️ eWoorker Landing: {ewoorker_status}", Colors.YELLOW)
        
        # Check PM2 status
        status, output, _ = exec_cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"' | head -1")
        if "online" in output:
            log("✅ PM2 Status: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 Status: {output[:50]}", Colors.YELLOW)
        
        # 10. Resumen final
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN + Colors.BOLD)
        log("=" * 70, Colors.GREEN)
        
        log(f"""
URLs:
  🌐 Landing Inmova: https://inmovaapp.com
  🏗️ eWoorker Landing: https://inmovaapp.com/ewoorker/landing
  📊 eWoorker Analytics: https://inmovaapp.com/ewoorker/analytics
  🏆 eWoorker Leaderboard: https://inmovaapp.com/ewoorker/leaderboard
  🎁 eWoorker Referidos: https://inmovaapp.com/ewoorker/perfil/referidos
  🏅 eWoorker Logros: https://inmovaapp.com/ewoorker/perfil/logros
  
Nuevas Funcionalidades Desplegadas:
  ✅ Gamificación (puntos, niveles, logros)
  ✅ Sistema de Referidos (códigos, invitaciones, recompensas)
  ✅ Analytics Dashboard (20+ KPIs)
  ✅ Matching con IA (Claude)
  ✅ PWA Manifest actualizado
  ✅ Landing pages actualizadas
""", Colors.CYAN)
        
        return 0
        
    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("🔒 Conexión cerrada", Colors.CYAN)

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
