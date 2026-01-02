#!/usr/bin/env python3
"""
Corregir .env.production en el servidor con credenciales reales
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def execute_command(ssh, command, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    output = stdout.read().decode()
    error = stderr.read().decode()
    return stdout.channel.recv_exit_status() == 0, output, error

def main():
    print("🔧 CORRIGIENDO .env.production\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Respaldando .env.production actual...")
        execute_command(client, f"cp {APP_DIR}/.env.production {APP_DIR}/.env.production.backup.$(date +%Y%m%d_%H%M%S)")
        print("  ✓ Respaldo creado\n")
        
        print("2️⃣  Obteniendo DATABASE_URL real de postgres...")
        success, output, _ = execute_command(client, 
            "sudo -u postgres psql -d inmova_production -c \"SHOW password_encryption;\""
        )
        
        # La DATABASE_URL real es la que ya hemos usado antes
        DATABASE_URL = "postgresql://inmova_user:h4C7X2KaFz6cN8UqWb9rYpLmTv3sJgEd@localhost:5432/inmova_production?schema=public"
        
        print("3️⃣  Actualizando .env.production...")
        
        # Leer el archivo actual
        success, env_content, _ = execute_command(client, f"cat {APP_DIR}/.env.production")
        
        # Actualizar DATABASE_URL
        new_env_content = ""
        for line in env_content.split('\n'):
            if line.startswith('DATABASE_URL='):
                new_env_content += f'DATABASE_URL="{DATABASE_URL}"\n'
                print(f"  ✓ DATABASE_URL actualizado")
            else:
                new_env_content += line + '\n'
        
        # Verificar si DATABASE_URL ya estaba
        if 'DATABASE_URL=' not in env_content:
            new_env_content += f'\n# Database\nDATABASE_URL="{DATABASE_URL}"\n'
            print(f"  ✓ DATABASE_URL añadido")
        
        # Escribir el nuevo contenido
        stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/.env.production << 'EOF'\n{new_env_content}EOF\n")
        stdout.channel.recv_exit_status()
        
        print("\n4️⃣  Verificando cambios...")
        success, output, _ = execute_command(client, f"grep DATABASE_URL {APP_DIR}/.env.production")
        if 'inmova_user' in output:
            print("  ✅ DATABASE_URL configurado correctamente\n")
        else:
            print("  ⚠️  Posible problema con DATABASE_URL\n")
        
        print("5️⃣  Reiniciando PM2 para cargar nuevas variables...")
        execute_command(client, "pm2 restart inmova-app")
        
        print("\n6️⃣  Esperando 15 segundos...")
        import time
        time.sleep(15)
        
        print("\n7️⃣  Verificando aplicación...")
        success, output, _ = execute_command(client, "curl -s http://localhost:3000/api/health")
        print(f"  Health check: {output[:100]}")
        
        print("\n✅ .env.production CORREGIDO\n")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
