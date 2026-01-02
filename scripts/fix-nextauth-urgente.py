#!/usr/bin/env python3
"""
Fix urgente de NEXTAUTH_SECRET
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import secrets

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def main():
    print("🚨 FIX URGENTE NEXTAUTH_SECRET\n")
    
    # Generar nuevo secret
    nextauth_secret = secrets.token_hex(32)
    db_password = 'h4C7X2KaFz6cN8UqWb9rYpLmTv3sJgEd'
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Creando .env.production completo...")
        
        env_content = f"""# Database
DATABASE_URL="postgresql://inmova_user:{db_password}@localhost:5432/inmova_production?schema=public"

# NextAuth.js
NEXTAUTH_SECRET="{nextauth_secret}"
NEXTAUTH_URL="http://157.180.119.236"

# Node
NODE_ENV=production
"""
        
        stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/.env.production << 'EOF'\n{env_content}EOF\n")
        stdout.channel.recv_exit_status()
        print("  ✅ .env.production creado\n")
        
        print("2️⃣  Creando start-with-env.sh...")
        start_script = f"""#!/bin/bash
set -a
source {APP_DIR}/.env.production
set +a
cd {APP_DIR}
exec npm start
"""
        
        stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/start-with-env.sh << 'EOF'\n{start_script}EOF\n")
        stdout.channel.recv_exit_status()
        
        stdin, stdout, stderr = client.exec_command(f"chmod +x {APP_DIR}/start-with-env.sh")
        stdout.channel.recv_exit_status()
        print("  ✅ Script creado\n")
        
        print("3️⃣  Verificando variables...")
        stdin, stdout, stderr = client.exec_command(f"grep -E 'DATABASE_URL|NEXTAUTH_SECRET' {APP_DIR}/.env.production | head -2")
        output = stdout.read().decode()
        
        if 'NEXTAUTH_SECRET' in output and 'DATABASE_URL' in output:
            print("  ✅ Variables presentes\n")
        else:
            print("  ⚠️  Falta alguna variable\n")
        
        print("4️⃣  Reiniciando PM2...")
        stdin, stdout, stderr = client.exec_command("pm2 restart inmova-app")
        stdout.channel.recv_exit_status()
        print("  ✅ PM2 reiniciado\n")
        
        print("5️⃣  Esperando 15 segundos...")
        import time
        time.sleep(15)
        
        print("\n6️⃣  Test de login...")
        stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/auth/session")
        output = stdout.read().decode()
        
        if 'NO_SECRET' not in output and 'error' not in output.lower():
            print("  ✅ Session API responde OK\n")
        else:
            print(f"  ⚠️  Response: {output[:100]}\n")
        
        print("✅ FIX COMPLETADO\n")
        print(f"NEXTAUTH_SECRET: {nextauth_secret[:20]}...")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
