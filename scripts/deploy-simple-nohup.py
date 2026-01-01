#!/usr/bin/env python3
"""Deployment simple con nohup (sin PM2)"""

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
    return exit_status, output

def main():
    log("🚀 DEPLOYMENT SIMPLE (NOHUP)\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        log("✅ Conectado\n")
        
        # 1. Limpiar procesos
        log("🛑 Limpiando procesos...")
        execute_command(client, "pm2 kill 2>/dev/null || true")
        execute_command(client, "fuser -k 3000/tcp 2>/dev/null || true")
        execute_command(client, "pkill -f 'next-server' 2>/dev/null || true")
        time.sleep(3)
        log("✅ Limpiado\n")
        
        # 2. Iniciar con nohup
        log("🚀 Iniciando con nohup...")
        execute_command(
            client,
            f"cd {APP_PATH} && nohup npm start > /var/log/inmova/app.log 2>&1 &",
            timeout=5
        )
        log("✅ Iniciado\n")
        
        # 3. Esperar warm-up
        log("⏳ Esperando 25s para warm-up...")
        time.sleep(25)
        
        # 4. Verificar proceso
        log("\n🔍 Verificando proceso...")
        status, output = execute_command(
            client,
            "ps aux | grep -E '[n]ode.*next-server|[n]ext start' | head -3"
        )
        
        if output.strip():
            log("✅ Proceso corriendo:")
            for line in output.strip().split('\n')[:2]:
                print(f"  {line[:100]}")
        else:
            log("⚠️  No se detectó proceso")
        
        # 5. Verificar puerto
        status, output = execute_command(client, "ss -tlnp | grep :3000")
        if output.strip():
            log("✅ Puerto 3000 listening")
        else:
            log("⚠️  Puerto 3000 no detectado")
        
        # 6. Health checks
        log("\n🏥 Health Checks:\n")
        
        checks = [
            ('Health API', 'curl -s -m 10 http://localhost:3000/api/health 2>&1'),
            ('Login', 'curl -s -m 10 http://localhost:3000/login 2>&1 | head -5'),
            ('Landing', 'curl -s -m 10 http://localhost:3000/landing 2>&1 | head -5'),
            ('Dashboard', 'curl -s -m 10 http://localhost:3000/dashboard 2>&1 | head -5'),
        ]
        
        for name, cmd in checks:
            status, output = execute_command(client, cmd)
            
            if 'ok' in output.lower() or '<html' in output.lower() or '<!doctype' in output.lower():
                log(f"✅ {name} OK")
            elif 'redirect' in output.lower() or '302' in output or '301' in output:
                log(f"✅ {name} OK (redirect)")
            else:
                log(f"⚠️  {name}: {output[:100]}")
        
        # 7. Ver logs recientes
        log("\n📝 Logs recientes:")
        status, output = execute_command(client, "tail -20 /var/log/inmova/app.log 2>&1")
        print(output)
        
        log("\n" + "="*70)
        log("✅ DEPLOYMENT COMPLETADO")
        log("="*70)
        log(f"\n🌐 URLs:")
        log(f"   http://{SERVER_IP}/")
        log(f"   https://inmovaapp.com/")
        log(f"\n📝 Ver logs:")
        log(f"   tail -f /var/log/inmova/app.log")
        log(f"\n🔄 Reiniciar:")
        log(f"   fuser -k 3000/tcp && cd {APP_PATH} && nohup npm start > /var/log/inmova/app.log 2>&1 &")
        
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
