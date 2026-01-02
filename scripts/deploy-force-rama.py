#!/usr/bin/env python3
"""
Deploy forzado desde rama actual
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
    print(f"  💻 {command[:100]}...")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    output = stdout.read().decode()
    error = stderr.read().decode()
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0 and error:
        print(f"  ⚠️  {error[:200]}")
    elif output and len(output) < 200:
        print(f"  ✓ {output.strip()[:150]}")
    else:
        print(f"  ✓ OK")
    
    return exit_code == 0, output, error

def main():
    print("🔧 DEPLOY FORZADO DESDE RAMA\n")
    print(f"📍 Rama: {BRANCH}\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("1️⃣  Conectando...")
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        print("  ✓ Conectado\n")
        
        print("2️⃣  Limpiando archivos no trackeados...")
        execute_command(client, f"cd {APP_DIR} && git clean -fd")
        
        print("\n3️⃣  Descartando cambios locales...")
        execute_command(client, f"cd {APP_DIR} && git reset --hard HEAD")
        
        print("\n4️⃣  Haciendo fetch...")
        execute_command(client, f"cd {APP_DIR} && git fetch origin")
        
        print("\n5️⃣  Cambiando a rama y actualizando...")
        execute_command(client, f"cd {APP_DIR} && git checkout {BRANCH} 2>&1 || git checkout -b {BRANCH} origin/{BRANCH}")
        execute_command(client, f"cd {APP_DIR} && git reset --hard origin/{BRANCH}")
        
        print("\n6️⃣  Regenerando Prisma...")
        execute_command(client, f"cd {APP_DIR} && npx prisma generate", timeout=180)
        
        print("\n7️⃣  Limpiando cache Next.js...")
        execute_command(client, f"cd {APP_DIR} && rm -rf .next")
        
        print("\n8️⃣  Reiniciando PM2...")
        execute_command(client, "pm2 restart inmova-app")
        
        print("\n9️⃣  Esperando warm-up (20s)...")
        time.sleep(20)
        
        print("\n🔟 Verificando...")
        success, output, _ = execute_command(client, "curl -I http://localhost:3000/login")
        
        if "200" in output:
            print("  ✅ Login responde OK\n")
        
        print("✅ DEPLOY COMPLETADO\n")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
