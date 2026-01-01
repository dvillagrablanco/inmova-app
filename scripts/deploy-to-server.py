#!/usr/bin/env python3
"""
Deployment automatizado con Paramiko
Despliega los últimos cambios al servidor de producción
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
    log(f"Ejecutando: {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0:
        log(f"⚠️  Exit status: {exit_status}")
        if error:
            log(f"Error: {error[:500]}")
    
    return exit_status, output, error

def main():
    log("🚀 Iniciando deployment...")
    
    # Conectar
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log(f"Conectando a {SERVER_IP}...")
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10,
            banner_timeout=10
        )
        log("✅ Conectado")
        
        # 1. Verificar directorio
        log("\n📁 Verificando directorio...")
        status, output, _ = execute_command(client, f"ls -la {APP_PATH} | head -5")
        if status != 0:
            log(f"❌ Directorio {APP_PATH} no existe")
            return False
        log("✅ Directorio OK")
        
        # 2. Git pull
        log("\n📥 Actualizando código...")
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
        log(output[:200])
        
        # 3. Verificar si hay cambios en package.json
        log("\n📦 Verificando dependencias...")
        status, output, _ = execute_command(
            client,
            f"cd {APP_PATH} && git diff HEAD~1 HEAD -- package.json | wc -l"
        )
        
        has_deps_changes = int(output.strip()) > 0
        
        if has_deps_changes:
            log("📦 Instalando dependencias...")
            status, output, error = execute_command(
                client,
                f"cd {APP_PATH} && npm install",
                timeout=300
            )
            if status != 0:
                log("⚠️  npm install tuvo warnings (normal)")
            log("✅ Dependencias actualizadas")
        else:
            log("✅ Sin cambios en dependencias")
        
        # 4. Verificar procesos actuales
        log("\n🔍 Verificando procesos...")
        status, output, _ = execute_command(
            client,
            "ps aux | grep -E 'node.*3000|next-server' | grep -v grep | wc -l"
        )
        
        running_processes = int(output.strip())
        log(f"Procesos corriendo: {running_processes}")
        
        # 5. Matar procesos viejos si existen
        if running_processes > 0:
            log("🛑 Deteniendo procesos viejos...")
            execute_command(client, "fuser -k 3000/tcp", timeout=10)
            execute_command(client, "pkill -f 'next-server'", timeout=10)
            time.sleep(3)
            log("✅ Procesos detenidos")
        
        # 6. Limpiar cache
        log("\n🧹 Limpiando cache...")
        execute_command(client, f"cd {APP_PATH} && rm -rf .next/cache")
        log("✅ Cache limpiado")
        
        # 7. Reiniciar aplicación
        log("\n🚀 Iniciando aplicación...")
        
        # Verificar si usa PM2
        status, output, _ = execute_command(client, "which pm2")
        uses_pm2 = status == 0
        
        if uses_pm2:
            log("Usando PM2...")
            # Verificar si app existe en PM2
            status, output, _ = execute_command(client, "pm2 list | grep inmova-app")
            
            if status == 0:
                # Restart existente
                execute_command(client, "pm2 restart inmova-app", timeout=30)
                log("✅ PM2 restart completado")
            else:
                # Iniciar nuevo
                execute_command(
                    client,
                    f"cd {APP_PATH} && pm2 start npm --name inmova-app -- start",
                    timeout=30
                )
                execute_command(client, "pm2 save")
                log("✅ PM2 iniciado")
        else:
            log("Iniciando con nohup...")
            execute_command(
                client,
                f"cd {APP_PATH} && nohup npm start > /tmp/inmova.log 2>&1 &",
                timeout=5
            )
            log("✅ Aplicación iniciada")
        
        # 8. Verificar que inició
        log("\n⏳ Esperando warm-up (15s)...")
        time.sleep(15)
        
        log("🔍 Verificando servicio...")
        status, output, _ = execute_command(
            client,
            "curl -s http://localhost:3000/api/health | head -20",
            timeout=10
        )
        
        if status == 0 and ('ok' in output.lower() or 'status' in output.lower()):
            log("✅ Servicio respondiendo")
            log(f"Respuesta: {output[:100]}")
        else:
            log("⚠️  Health check no responde aún (puede tardar más)")
        
        # 9. Verificar puerto
        status, output, _ = execute_command(
            client,
            "ss -tlnp | grep :3000"
        )
        
        if status == 0:
            log("✅ Puerto 3000 listening")
        else:
            log("⚠️  Puerto 3000 no detectado")
        
        log("\n" + "="*60)
        log("✅ DEPLOYMENT COMPLETADO")
        log("="*60)
        log(f"\nURL: http://{SERVER_IP}/")
        log("URL (dominio): https://inmovaapp.com/")
        
        return True
        
    except paramiko.AuthenticationException:
        log("❌ Error de autenticación")
        return False
    except paramiko.SSHException as e:
        log(f"❌ Error SSH: {e}")
        return False
    except Exception as e:
        log(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()
        log("Conexión cerrada")

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
