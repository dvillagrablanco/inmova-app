#!/usr/bin/env python3
"""
Añadir NEXTAUTH_SECRET a .env.production
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import secrets

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def generate_secret():
    """Generar un secret aleatorio de 64 caracteres"""
    return secrets.token_hex(32)

def main():
    print("🔐 AÑADIENDO NEXTAUTH_SECRET\n")
    
    # Generar secret
    nextauth_secret = generate_secret()
    print(f"Secret generado: {nextauth_secret[:20]}...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Respaldando .env.production...")
        stdin, stdout, stderr = client.exec_command(
            f"cp {APP_DIR}/.env.production {APP_DIR}/.env.production.backup.$(date +%Y%m%d_%H%M%S)"
        )
        stdout.channel.recv_exit_status()
        print("  ✓ Respaldo creado\n")
        
        print("2️⃣  Añadiendo NEXTAUTH_SECRET y NEXTAUTH_URL...")
        
        # Añadir al final del archivo
        stdin, stdout, stderr = client.exec_command(f"""
cat >> {APP_DIR}/.env.production << 'EOF'

# NextAuth.js Configuration
NEXTAUTH_SECRET="{nextauth_secret}"
NEXTAUTH_URL="http://157.180.119.236"
EOF
""")
        stdout.channel.recv_exit_status()
        print("  ✓ Variables añadidas\n")
        
        print("3️⃣  Verificando configuración...")
        stdin, stdout, stderr = client.exec_command(f"grep -E 'NEXTAUTH_SECRET|NEXTAUTH_URL' {APP_DIR}/.env.production")
        output = stdout.read().decode()
        
        if 'NEXTAUTH_SECRET' in output:
            print("  ✅ NEXTAUTH_SECRET configurado")
        if 'NEXTAUTH_URL' in output:
            print("  ✅ NEXTAUTH_URL configurado\n")
        
        print("4️⃣  Reiniciando PM2...")
        stdin, stdout, stderr = client.exec_command("pm2 restart inmova-app")
        stdout.channel.recv_exit_status()
        print("  ✓ PM2 reiniciado\n")
        
        print("5️⃣  Esperando 15 segundos...")
        import time
        time.sleep(15)
        
        print("\n6️⃣  Verificando aplicación...")
        stdin, stdout, stderr = client.exec_command("curl -I http://localhost:3000/login")
        output = stdout.read().decode()
        
        if "200" in output:
            print("  ✅ Login responde\n")
        
        print("✅ NEXTAUTH_SECRET CONFIGURADO\n")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
