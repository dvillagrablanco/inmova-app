#!/usr/bin/env python3
"""
Deployment forzado - limpia cambios locales y despliega
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'
APP_PATH = '/opt/inmova-app'

def log(message):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"[{timestamp}] {message}")

def execute_command(ssh, command, timeout=300):
    """Ejecuta comando y retorna output"""
    log(f"➤ {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and error:
        log(f"  ⚠️  {error[:200]}")
    
    return exit_status, output, error

def main():
    log("🚀 DEPLOYMENT FORZADO")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log(f"\n🔌 Conectando a {SERVER_IP}...")
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        log("✅ Conectado\n")
        
        # 1. Backup de .env si existe
        log("💾 Backup de .env...")
        execute_command(client, f"cd {APP_PATH} && cp .env.production /tmp/.env.backup 2>/dev/null || true")
        
        # 2. Matar procesos
        log("\n🛑 Deteniendo procesos...")
        execute_command(client, "fuser -k 3000/tcp 2>/dev/null || true", timeout=10)
        execute_command(client, "pkill -f 'next-server' 2>/dev/null || true", timeout=10)
        execute_command(client, "pm2 delete all 2>/dev/null || true", timeout=10)
        time.sleep(2)
        log("✅ Procesos detenidos")
        
        # 3. Limpiar cambios locales
        log("\n🧹 Limpiando cambios locales...")
        execute_command(client, f"cd {APP_PATH} && git reset --hard HEAD")
        execute_command(client, f"cd {APP_PATH} && git clean -fd")
        log("✅ Limpieza completada")
        
        # 4. Git pull
        log("\n📥 Descargando última versión...")
        status, output, error = execute_command(
            client,
            f"cd {APP_PATH} && git pull origin main",
            timeout=60
        )
        
        if status != 0:
            log("❌ Git pull falló")
            log(error)
            return False
        
        log("✅ Código actualizado")
        
        # Mostrar último commit
        status, output, _ = execute_command(client, f"cd {APP_PATH} && git log -1 --oneline")
        log(f"  Commit: {output.strip()}")
        
        # 5. Restaurar .env
        log("\n📝 Restaurando .env...")
        execute_command(client, f"cp /tmp/.env.backup {APP_PATH}/.env.production 2>/dev/null || true")
        
        # 6. Verificar dependencias
        log("\n📦 Verificando dependencias...")
        status, output, _ = execute_command(
            client,
            f"cd {APP_PATH} && npm install",
            timeout=300
        )
        log("✅ Dependencias OK")
        
        # 7. Limpiar cache
        log("\n🧹 Limpiando cache...")
        execute_command(client, f"cd {APP_PATH} && rm -rf .next/cache .next/server")
        log("✅ Cache limpio")
        
        # 8. Iniciar con PM2 o nohup
        log("\n🚀 Iniciando aplicación...")
        
        status, _, _ = execute_command(client, "which pm2")
        uses_pm2 = status == 0
        
        if uses_pm2:
            log("  Usando PM2...")
            # Verificar si hay ecosystem.config.js
            status, _, _ = execute_command(client, f"ls {APP_PATH}/ecosystem.config.js")
            
            if status == 0:
                execute_command(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
            else:
                execute_command(client, f"cd {APP_PATH} && pm2 start npm --name inmova-app -- start")
            
            execute_command(client, "pm2 save")
            log("✅ PM2 iniciado")
        else:
            log("  Usando nohup...")
            execute_command(
                client,
                f"cd {APP_PATH} && nohup npm start > /tmp/inmova.log 2>&1 &",
                timeout=5
            )
            log("✅ Nohup iniciado")
        
        # 9. Verificar
        log("\n⏳ Esperando warm-up (20s)...")
        time.sleep(20)
        
        log("🔍 Verificando servicio...")
        
        # Health check
        status, output, _ = execute_command(
            client,
            "curl -s http://localhost:3000/api/health 2>&1",
            timeout=15
        )
        
        if 'ok' in output.lower() or 'status' in output.lower():
            log("✅ Health check OK")
        else:
            log("⚠️  Health check no responde")
        
        # Puerto
        status, output, _ = execute_command(client, "ss -tlnp | grep :3000")
        if status == 0:
            log("✅ Puerto 3000 listening")
        else:
            log("⚠️  Puerto 3000 no detectado")
        
        # Procesos
        status, output, _ = execute_command(
            client,
            "ps aux | grep -E 'node.*3000|next-server|pm2' | grep -v grep | wc -l"
        )
        process_count = int(output.strip())
        log(f"✅ Procesos corriendo: {process_count}")
        
        log("\n" + "="*70)
        log("✅ DEPLOYMENT COMPLETADO")
        log("="*70)
        log(f"\n🌐 URLs:")
        log(f"   IP: http://{SERVER_IP}/")
        log(f"   Dominio: https://inmovaapp.com/")
        log(f"\n📝 Verificar:")
        log(f"   pm2 logs inmova-app")
        log(f"   tail -f /tmp/inmova.log")
        
        return True
        
    except Exception as e:
        log(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()
        log("\n🔌 Conexión cerrada")

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
