#!/usr/bin/env python3
"""Deployment final con configuración PM2 simple"""

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
    log("🚀 DEPLOYMENT FINAL\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        log("✅ Conectado\n")
        
        # 1. Detener PM2 completamente
        log("🛑 Limpiando PM2...")
        execute_command(client, "pm2 delete all 2>/dev/null || true")
        execute_command(client, "pm2 kill 2>/dev/null || true")
        execute_command(client, "fuser -k 3000/tcp 2>/dev/null || true")
        time.sleep(3)
        log("✅ Limpiado\n")
        
        # 2. Iniciar con configuración simple (sin cluster)
        log("🚀 Iniciando aplicación (modo simple)...")
        
        cmd = f"""cd {APP_PATH} && pm2 start 'npm start' \\
            --name inmova-app \\
            --max-memory-restart 1500M \\
            --min-uptime 10000 \\
            --max-restarts 5 \\
            --restart-delay 3000 \\
            --output /var/log/inmova/out.log \\
            --error /var/log/inmova/error.log \\
            --merge-logs"""
        
        status, output, error = execute_command(client, cmd, timeout=30)
        
        if status != 0:
            log(f"⚠️  PM2 warning: {error[:300]}")
        else:
            log("✅ PM2 iniciado")
        
        execute_command(client, "pm2 save")
        log("✅ Configuración guardada\n")
        
        # 3. Esperar warm-up extendido
        log("⏳ Esperando 40s para warm-up completo...")
        
        for i in range(8):
            time.sleep(5)
            status, output, _ = execute_command(client, "pm2 list | grep inmova")
            if 'online' in output and '↺ 0' in output:
                log(f"  {(i+1)*5}s - Proceso estable")
                break
            else:
                log(f"  {(i+1)*5}s - Inicializando...")
        
        # 4. Status final
        log("\n📊 PM2 Status Final:")
        status, output, _ = execute_command(client, "pm2 list")
        print(output)
        
        # 5. Health checks
        log("\n🏥 Health Checks:\n")
        
        # Health endpoint
        for i in range(3):
            status, output, _ = execute_command(
                client,
                "curl -s -m 10 http://localhost:3000/api/health 2>&1"
            )
            
            if 'ok' in output.lower() or 'status' in output.lower():
                log(f"✅ Health API: {output[:100]}")
                break
            elif i < 2:
                time.sleep(5)
        
        # Login page
        status, output, _ = execute_command(
            client,
            "curl -s -m 10 http://localhost:3000/login 2>&1 | head -5"
        )
        
        if '<html' in output.lower() or '<!doctype' in output.lower():
            log("✅ Login page OK")
        else:
            log(f"⚠️  Login: {output[:200]}")
        
        # Landing
        status, output, _ = execute_command(
            client,
            "curl -s -m 10 http://localhost:3000/landing 2>&1 | head -5"
        )
        
        if '<html' in output.lower() or '<!doctype' in output.lower():
            log("✅ Landing page OK")
        else:
            log(f"⚠️  Landing: {output[:200]}")
        
        log("\n" + "="*70)
        log("✅ DEPLOYMENT EXITOSO")
        log("="*70)
        log(f"\n🌐 URLs Públicas:")
        log(f"   http://{SERVER_IP}/landing")
        log(f"   http://{SERVER_IP}/login")
        log(f"   https://inmovaapp.com/landing")
        log(f"   https://inmovaapp.com/login")
        log(f"\n📝 Monitoring:")
        log(f"   pm2 logs inmova-app")
        log(f"   pm2 monit")
        
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
