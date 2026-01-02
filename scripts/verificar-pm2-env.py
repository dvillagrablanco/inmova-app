#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'

def execute_command(ssh, command):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=60)
    output = stdout.read().decode()
    error = stderr.read().decode()
    return output, error

def main():
    print("🔍 Verificando configuración PM2\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Verificando proceso PM2...")
        output, _ = execute_command(client, "pm2 list")
        print(output)
        
        print("\n2️⃣  Verificando variables de entorno de PM2...")
        output, _ = execute_command(client, "pm2 env inmova-app")
        # Solo mostrar DATABASE_URL (primeros caracteres)
        for line in output.split('\n'):
            if 'DATABASE_URL' in line:
                parts = line.split('=')
                if len(parts) > 1:
                    print(f"DATABASE_URL={parts[1][:50]}...")
                else:
                    print(line)
        
        print("\n3️⃣  Verificando archivo .env.production...")
        output, _ = execute_command(client, "cat /opt/inmova-app/.env.production | grep DATABASE_URL")
        if output:
            parts = output.split('=')
            if len(parts) > 1:
                print(f"DATABASE_URL en archivo={parts[1][:50]}...")
        else:
            print("❌ No se encontró DATABASE_URL en .env.production")
        
        print("\n4️⃣  Verificando ecosystem.config.js...")
        output, _ = execute_command(client, "cat /opt/inmova-app/ecosystem.config.js 2>&1 | head -30")
        print(output[:500])
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        client.close()
    
    return True

if __name__ == '__main__':
    main()
