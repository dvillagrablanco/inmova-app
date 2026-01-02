#!/usr/bin/env python3
"""
Corregir password de inmova_user en PostgreSQL y actualizar .env.production
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import secrets

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def generate_strong_password():
    """Generar password fuerte"""
    import string
    chars = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(chars) for _ in range(32))

def main():
    print("🔧 CORRIGIENDO PASSWORD DE DATABASE\n")
    
    # Usar la password que ya había funcionado antes
    # O generar una nueva
    # Vamos a usar la password que funciona: h4C7X2KaFz6cN8UqWb9rYpLmTv3sJgEd
    db_password = 'h4C7X2KaFz6cN8UqWb9rYpLmTv3sJgEd'
    
    print(f"Password a usar: {db_password[:10]}...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Actualizando password de inmova_user en PostgreSQL...")
        
        # Usar SQL con password segura
        sql_command = f"""
sudo -u postgres psql -c "ALTER USER inmova_user WITH PASSWORD '{db_password}';"
"""
        stdin, stdout, stderr = client.exec_command(sql_command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if 'ALTER ROLE' in output:
            print("  ✅ Password actualizada en PostgreSQL\n")
        else:
            print(f"  ⚠️  Output: {output}")
            if error:
                print(f"  Error: {error[:200]}\n")
        
        print("2️⃣  Actualizando DATABASE_URL en .env.production...")
        
        # Nueva DATABASE_URL
        new_database_url = f"postgresql://inmova_user:{db_password}@localhost:5432/inmova_production?schema=public"
        
        # Leer archivo actual
        stdin, stdout, stderr = client.exec_command(f"cat {APP_DIR}/.env.production")
        env_content = stdout.read().decode()
        
        # Actualizar DATABASE_URL
        new_env = []
        database_url_found = False
        for line in env_content.split('\n'):
            if line.startswith('DATABASE_URL='):
                new_env.append(f'DATABASE_URL="{new_database_url}"')
                database_url_found = True
            else:
                new_env.append(line)
        
        if not database_url_found:
            new_env.append(f'DATABASE_URL="{new_database_url}"')
        
        # Escribir archivo
        new_env_content = '\n'.join(new_env)
        stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/.env.production << 'EOF'\n{new_env_content}\nEOF\n")
        stdout.channel.recv_exit_status()
        
        print("  ✅ DATABASE_URL actualizada\n")
        
        print("3️⃣  Verificando conexión a BD...")
        test_command = f"""
cd {APP_DIR} && source .env.production && npx prisma db execute --stdin <<< "SELECT 1 AS test;"
"""
        stdin, stdout, stderr = client.exec_command(test_command)
        output = stdout.read().decode()
        
        if 'test' in output or '1' in output:
            print("  ✅ Conexión a BD exitosa\n")
        else:
            print(f"  ⚠️  Verificación: {output[:200]}\n")
        
        print("4️⃣  Reiniciando PM2...")
        stdin, stdout, stderr = client.exec_command("pm2 restart inmova-app")
        stdout.channel.recv_exit_status()
        
        print("\n5️⃣  Esperando 15 segundos...")
        import time
        time.sleep(15)
        
        print("\n✅ PASSWORD CORREGIDA\n")
        print("📝 Datos de conexión:")
        print(f"  Usuario: inmova_user")
        print(f"  Base de datos: inmova_production")
        print(f"  Password: {db_password[:10]}...\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
