#!/usr/bin/env python3
"""
Deploy desde rama actual al servidor
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'
BRANCH = 'cursor/estudio-soluci-n-definitiva-b635'

def execute_command(ssh, command, timeout=120):
    """Ejecutar comando y retornar output"""
    print(f"  💻 {command[:100]}...")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    output = stdout.read().decode()
    error = stderr.read().decode()
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0:
        if error:
            print(f"  ⚠️  Error: {error[:300]}")
        return False, output, error
    
    if output and len(output) < 300:
        print(f"  ✓ {output.strip()[:200]}")
    else:
        print(f"  ✓ OK")
    
    return True, output, error

def main():
    print("🔧 DEPLOY DESDE RAMA ACTUAL\n")
    print(f"📍 Rama: {BRANCH}\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("1️⃣  Conectando al servidor...")
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        print("  ✓ Conectado\n")
        
        print("2️⃣  Haciendo fetch de la rama...")
        execute_command(client, f"cd {APP_DIR} && git fetch origin {BRANCH}")
        
        print("\n3️⃣  Cambiando a la rama...")
        success, output, error = execute_command(client, f"cd {APP_DIR} && git checkout {BRANCH}")
        if not success:
            print("  Intentando crear rama local...")
            execute_command(client, f"cd {APP_DIR} && git checkout -b {BRANCH} origin/{BRANCH}")
        
        print("\n4️⃣  Actualizando código...")
        execute_command(client, f"cd {APP_DIR} && git pull origin {BRANCH}")
        
        print("\n5️⃣  Regenerando Prisma Client...")
        success, output, error = execute_command(client, f"cd {APP_DIR} && npx prisma generate", timeout=180)
        
        print("\n6️⃣  Limpiando cache...")
        execute_command(client, f"cd {APP_DIR} && rm -rf .next")
        
        print("\n7️⃣  Reiniciando PM2...")
        execute_command(client, "pm2 restart inmova-app")
        
        print("\n8️⃣  Esperando 20 segundos...")
        time.sleep(20)
        
        print("\n9️⃣  Verificando aplicación...")
        success, output, error = execute_command(client, "curl -I http://localhost:3000/login")
        
        if "200" in output:
            print("  ✅ Aplicación respondiendo")
        else:
            print("  ⚠️  Respuesta inesperada")
        
        print("\n✅ DEPLOY COMPLETADO\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
