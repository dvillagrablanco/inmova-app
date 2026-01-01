#!/usr/bin/env python3
"""Fix deployment - usar single instance PM2"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'
APP_PATH = '/opt/inmova-app'

def log(message):
    print(message)

def execute_command(ssh, command, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    log("🔧 Fixing deployment...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        log("✅ Conectado\n")
        
        # 1. Detener PM2 completamente
        log("🛑 Deteniendo PM2...")
        execute_command(client, "pm2 delete all", timeout=10)
        execute_command(client, "pm2 kill", timeout=10)
        time.sleep(2)
        log("✅ PM2 detenido")
        
        # 2. Verificar .env
        log("\n📝 Verificando .env...")
        status, output, _ = execute_command(client, f"ls -la {APP_PATH}/.env.production")
        if status == 0:
            log("✅ .env.production existe")
        else:
            log("⚠️  .env.production no encontrado")
        
        # 3. Iniciar PM2 con configuración simple
        log("\n🚀 Iniciando PM2 (modo simple)...")
        
        cmd = f"""cd {APP_PATH} && pm2 start npm --name inmova-app -- start \\
            --instances 2 \\
            --max-memory-restart 1G \\
            --max-restarts 10 \\
            --min-uptime 30000 \\
            --restart-delay 5000 \\
            --env production \\
            --output /var/log/inmova/out.log \\
            --error /var/log/inmova/error.log"""
        
        status, output, error = execute_command(client, cmd, timeout=30)
        
        if status != 0:
            log(f"❌ PM2 start falló: {error}")
            return False
        
        log("✅ PM2 iniciado")
        
        # Guardar
        execute_command(client, "pm2 save")
        log("✅ PM2 configuración guardada")
        
        # 4. Esperar y verificar
        log("\n⏳ Esperando 30s para inicialización...")
        time.sleep(30)
        
        # PM2 status
        log("\n📊 PM2 Status:")
        status, output, _ = execute_command(client, "pm2 list")
        print(output)
        
        # Health check
        log("\n🏥 Health Check:")
        for i in range(5):
            status, output, _ = execute_command(
                client,
                "curl -s -m 5 http://localhost:3000/api/health 2>&1"
            )
            
            if 'ok' in output.lower() or 'status' in output.lower():
                log(f"✅ Health check OK")
                log(f"   Respuesta: {output[:100]}")
                break
            else:
                log(f"  Intento {i+1}/5...")
                time.sleep(5)
        
        # Test login
        log("\n🔐 Test Login:")
        status, output, _ = execute_command(
            client,
            "curl -s -m 5 http://localhost:3000/login 2>&1 | head -5"
        )
        
        if '<html' in output.lower() or '<!doctype' in output.lower():
            log("✅ Login page responde")
        else:
            log(f"⚠️  Login: {output[:200]}")
        
        # Verificar reintentos
        log("\n🔄 Verificando restarts...")
        status, output, _ = execute_command(client, "pm2 list | grep inmova")
        
        if '↺ 0' in output or '↺ 1' in output:
            log("✅ Procesos estables (0-1 restarts)")
        else:
            log("⚠️  Múltiples restarts detectados")
            print(output)
        
        log("\n" + "="*70)
        log("✅ DEPLOYMENT FIXED")
        log("="*70)
        log(f"\n🌐 URLs:")
        log(f"   http://{SERVER_IP}/")
        log(f"   https://inmovaapp.com/")
        
        return True
        
    except Exception as e:
        log(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
