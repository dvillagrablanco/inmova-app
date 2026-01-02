#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'

def execute_command(ssh, command):
    """Ejecutar comando y retornar output"""
    print(f"  Ejecutando: {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=60)
    output = stdout.read().decode()
    error = stderr.read().decode()
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0 and error:
        print(f"  ⚠️  Error: {error}")
    if output:
        print(f"  ✓ Output: {output.strip()}")
    
    return exit_code, output, error

def main():
    print("🔄 Reiniciando servidor remoto...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"\n1. Conectando a {SERVER_HOST}...")
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        print("  ✓ Conectado")
        
        print("\n2. Limpiando cache de Next.js...")
        execute_command(client, "cd /opt/inmova-app && rm -rf .next/cache")
        
        print("\n3. Reiniciando PM2...")
        execute_command(client, "pm2 restart inmova-app")
        
        print("\n4. Esperando 10 segundos para warm-up...")
        import time
        time.sleep(10)
        
        print("\n5. Verificando estado de PM2...")
        execute_command(client, "pm2 status inmova-app")
        
        print("\n6. Verificando que la aplicación responde...")
        exit_code, output, error = execute_command(client, "curl -I http://localhost:3000/login")
        
        if "HTTP" in output:
            print("  ✓ Aplicación respondiendo correctamente")
        else:
            print("  ⚠️  Aplicación puede no estar lista")
        
        print("\n✅ Servidor reiniciado exitosamente")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == '__main__':
    main()
