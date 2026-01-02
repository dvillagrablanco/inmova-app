#!/usr/bin/env python3
"""
Deploy de fix de Prisma al servidor
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

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
    print("🔧 DEPLOY DE FIX DE PRISMA\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("1️⃣  Conectando al servidor...")
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        print("  ✓ Conectado\n")
        
        print("2️⃣  Actualizando código desde git...")
        execute_command(client, f"cd {APP_DIR} && git fetch origin")
        execute_command(client, f"cd {APP_DIR} && git reset --hard origin/main")
        
        print("\n3️⃣  Regenerando Prisma Client...")
        success, output, error = execute_command(client, f"cd {APP_DIR} && npx prisma generate", timeout=180)
        if not success:
            print("  ❌ Error al generar Prisma Client")
            print(f"  Error: {error}")
            return False
        
        print("\n4️⃣  Limpiando cache de Next.js...")
        execute_command(client, f"cd {APP_DIR} && rm -rf .next")
        
        print("\n5️⃣  Reiniciando PM2...")
        execute_command(client, "pm2 restart inmova-app")
        
        print("\n6️⃣  Esperando 20 segundos para warm-up...")
        time.sleep(20)
        
        print("\n7️⃣  Verificando aplicación...")
        success, output, error = execute_command(client, "curl -I http://localhost:3000/login")
        
        if "200" in output:
            print("  ✅ Login responde correctamente")
        else:
            print("  ⚠️  Respuesta inesperada")
        
        print("\n8️⃣  Test de la API de session...")
        success, output, error = execute_command(client, "curl -s http://localhost:3000/api/auth/session")
        print(f"  Session: {output[:100]}")
        
        print("\n✅ DEPLOY DE FIX COMPLETADO\n")
        print("📝 Próximos pasos:")
        print("  1. Ejecutar test de login")
        print("  2. Verificar tours virtuales")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
