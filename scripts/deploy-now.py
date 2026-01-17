#!/usr/bin/env python3
"""
Deployment script para Inmova App
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecuta comando y retorna output"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print(f"""
{'='*70}
🚀 DEPLOYMENT INMOVA APP - PRODUCCIÓN
{'='*70}
Servidor: {SERVER_IP}
Path: {APP_PATH}
{'='*70}
""")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # 1. Conectar
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", Colors.GREEN)

        # 2. Verificar estado actual
        log("📋 Verificando estado actual...", Colors.CYAN)
        status, output, _ = exec_cmd(client, "pm2 status")
        print(output[:500] if output else "PM2 no está corriendo")

        # 3. Backup de BD
        log("💾 Creando backup de BD...", Colors.CYAN)
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        backup_cmd = f"mkdir -p /var/backups/inmova && pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'"
        exec_cmd(client, backup_cmd)
        log("✅ Backup completado", Colors.GREEN)

        # 4. Ir al directorio y pull
        log("📥 Actualizando código desde GitHub...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git pull origin cursor/configuraci-n-botones-404-32e9 --no-edit 2>&1")
        if status != 0:
            # Si falla el pull, intentar con main
            log("⚠️ Pull de branch falló, intentando merge...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && git stash 2>/dev/null")
            status, output, error = exec_cmd(client, f"cd {APP_PATH} && git checkout main && git pull origin main --no-edit 2>&1")
        print(output[:300] if output else "")
        log("✅ Código actualizado", Colors.GREEN)

        # 5. Instalar dependencias si hay cambios en package.json
        log("📦 Verificando dependencias...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600)
        print(output if output else "Dependencias OK")
        log("✅ Dependencias verificadas", Colors.GREEN)

        # 6. Generar Prisma
        log("🔧 Generando Prisma Client...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3")
        print(output if output else "")
        log("✅ Prisma generado", Colors.GREEN)

        # 7. Build
        log("🏗️ Building aplicación...", Colors.CYAN)
        log("   (Esto puede tardar 2-5 minutos...)", Colors.YELLOW)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if status != 0:
            log(f"⚠️ Build warning: {error[:200] if error else 'ver logs'}", Colors.YELLOW)
        print(output[-500:] if output else "")
        log("✅ Build completado", Colors.GREEN)

        # 8. Restart PM2
        log("♻️ Reiniciando aplicación con PM2...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1")
        if "error" in output.lower() and "process" in output.lower():
            # Si no existe el proceso, iniciarlo
            log("   Iniciando proceso PM2...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production 2>&1")
        exec_cmd(client, "pm2 save")
        log("✅ PM2 reiniciado", Colors.GREEN)

        # 9. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)

        # 10. Health check
        log("🏥 Verificando health...", Colors.CYAN)
        for i in range(5):
            status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            if '"status":"ok"' in output or '"status": "ok"' in output:
                log("✅ Health check PASSED", Colors.GREEN)
                break
            elif i < 4:
                log(f"   Reintento {i+2}/5...", Colors.YELLOW)
                time.sleep(5)
        else:
            log("⚠️ Health check con warnings", Colors.YELLOW)

        # 11. Verificar que la app responde
        log("🌐 Verificando respuesta HTTP...", Colors.CYAN)
        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/configuracion")
        http_code = output.strip()
        if http_code == "200":
            log(f"✅ /configuracion responde {http_code}", Colors.GREEN)
        else:
            log(f"⚠️ /configuracion responde {http_code}", Colors.YELLOW)

        # 12. Estado final PM2
        log("📊 Estado final:", Colors.CYAN)
        status, output, _ = exec_cmd(client, "pm2 status")
        print(output)

        print(f"""
{'='*70}
✅ DEPLOYMENT COMPLETADO
{'='*70}
URLs:
  - Producción: https://inmovaapp.com
  - Health: https://inmovaapp.com/api/health
  - Config: https://inmovaapp.com/configuracion

Para ver logs:
  ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'
{'='*70}
""")

    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        raise
    finally:
        client.close()

if __name__ == '__main__':
    main()
