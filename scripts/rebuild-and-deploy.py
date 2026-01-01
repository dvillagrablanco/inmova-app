#!/usr/bin/env python3
"""Rebuild completo y deployment"""

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

def execute_command(ssh, command, timeout=600):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    log("🔨 REBUILD COMPLETO EN SERVIDOR\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        log("✅ Conectado\n")
        
        # 1. Detener procesos
        log("🛑 Deteniendo procesos...")
        execute_command(client, "pm2 delete all 2>/dev/null || true")
        execute_command(client, "fuser -k 3000/tcp 2>/dev/null || true")
        time.sleep(2)
        log("✅ Detenido\n")
        
        # 2. Limpiar builds viejos
        log("🧹 Limpiando builds anteriores...")
        execute_command(client, f"cd {APP_PATH} && rm -rf .next node_modules/.cache")
        log("✅ Limpiado\n")
        
        # 3. Rebuild completo
        log("🔨 Ejecutando npm run build (esto tardará ~5 min)...")
        status, output, error = execute_command(
            client,
            f"cd {APP_PATH} && NODE_ENV=production npm run build 2>&1",
            timeout=600
        )
        
        if status != 0:
            log("❌ Build falló")
            log(f"Error: {error[:1000]}")
            log(f"Output: {output[:1000]}")
            return False
        
        log("✅ Build completado")
        
        # Mostrar últimas líneas del build
        lines = output.split('\n')
        log("\n📊 Últimas líneas del build:")
        for line in lines[-15:]:
            if line.strip():
                print(f"  {line}")
        
        # 4. Verificar .next/server
        log("\n🔍 Verificando .next/server...")
        status, output, _ = execute_command(client, f"ls -la {APP_PATH}/.next/server | head -20")
        
        if 'pages-manifest.json' in output:
            log("✅ pages-manifest.json presente")
        else:
            log("⚠️  pages-manifest.json faltante")
            log(output)
        
        # 5. Iniciar con PM2
        log("\n🚀 Iniciando aplicación...")
        status, output, error = execute_command(
            client,
            f"""cd {APP_PATH} && pm2 start npm --name inmova-app -- start \\
                --instances 2 \\
                --max-memory-restart 1G \\
                --output /var/log/inmova/out.log \\
                --error /var/log/inmova/error.log""",
            timeout=30
        )
        
        if status != 0:
            log(f"⚠️  PM2 start warning: {error[:200]}")
        else:
            log("✅ PM2 iniciado")
        
        execute_command(client, "pm2 save")
        
        # 6. Verificar
        log("\n⏳ Esperando 30s...")
        time.sleep(30)
        
        log("\n📊 PM2 Status:")
        status, output, _ = execute_command(client, "pm2 list")
        print(output)
        
        log("\n🏥 Health Check:")
        for i in range(5):
            status, output, _ = execute_command(
                client,
                "curl -s -m 10 http://localhost:3000/api/health 2>&1"
            )
            
            if 'ok' in output.lower() or 'status' in output.lower():
                log(f"✅ Health OK: {output[:100]}")
                break
            elif i < 4:
                log(f"  Intento {i+1}/5...")
                time.sleep(5)
            else:
                log(f"⚠️  No responde: {output[:200]}")
        
        log("\n🔐 Login Test:")
        status, output, _ = execute_command(
            client,
            "curl -s -m 10 http://localhost:3000/login 2>&1 | head -5"
        )
        
        if '<html' in output.lower():
            log("✅ Login responde")
        else:
            log(f"⚠️  Login: {output[:200]}")
        
        log("\n" + "="*70)
        log("✅ REBUILD Y DEPLOYMENT COMPLETADOS")
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
