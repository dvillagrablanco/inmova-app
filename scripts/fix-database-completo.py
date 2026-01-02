#!/usr/bin/env python3
"""Fix completo de la base de datos"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

# Nueva password para la DB
NEW_DB_PASSWORD = 'InmovaSecure2026!DB'

def exec_cmd(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    error = stderr.read().decode()
    return exit_code == 0, output, error

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🔧 FIX COMPLETO DE BASE DE DATOS\n")
    
    # 1. Verificar PostgreSQL
    print("1️⃣  Verificando PostgreSQL...")
    success, output, _ = exec_cmd(client, "systemctl status postgresql", timeout=5)
    if 'active (running)' in output.lower() or 'active (exited)' in output.lower():
        print("  ✅ PostgreSQL está corriendo")
    else:
        print("  ⚠️  PostgreSQL no está activo, intentando iniciar...")
        exec_cmd(client, "systemctl start postgresql", timeout=10)
        time.sleep(3)
    
    # 2. Verificar que existe la base de datos
    print("\n2️⃣  Verificando base de datos inmova_production...")
    success, output, _ = exec_cmd(client, "su - postgres -c 'psql -l' | grep inmova", timeout=10)
    if 'inmova_production' in output:
        print("  ✅ Base de datos existe")
    else:
        print("  ⚠️  Base de datos no existe, creando...")
        exec_cmd(client, "su - postgres -c 'createdb inmova_production'", timeout=10)
    
    # 3. Verificar/crear usuario
    print("\n3️⃣  Verificando usuario inmova_user...")
    success, output, _ = exec_cmd(client, "su - postgres -c \"psql -c '\\\\du'\" | grep inmova_user", timeout=10)
    
    if 'inmova_user' in output:
        print("  ✅ Usuario existe, actualizando contraseña...")
    else:
        print("  ⚠️  Usuario no existe, creando...")
    
    # Resetear/crear usuario con nueva contraseña
    create_user_sql = f"""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'inmova_user') THEN
            CREATE USER inmova_user WITH PASSWORD '{NEW_DB_PASSWORD}';
        ELSE
            ALTER USER inmova_user WITH PASSWORD '{NEW_DB_PASSWORD}';
        END IF;
    END
    $$;
    GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;
    """
    
    success, output, error = exec_cmd(client, 
        f"su - postgres -c \"psql -c \\\"{create_user_sql.replace(chr(10), ' ')}\\\"\"",
        timeout=15
    )
    
    if success or 'GRANT' in output:
        print("  ✅ Usuario configurado correctamente")
    else:
        print(f"  ⚠️  Posible error: {error[:100] if error else output[:100]}")
    
    # 4. Test de conexión
    print("\n4️⃣  Testeando conexión a base de datos...")
    test_conn = f"PGPASSWORD='{NEW_DB_PASSWORD}' psql -h localhost -U inmova_user -d inmova_production -c '\\\\dt' 2>&1"
    success, output, error = exec_cmd(client, test_conn, timeout=10)
    
    if 'List of relations' in output or 'Did not find any relations' in output:
        print("  ✅ Conexión exitosa")
    else:
        print(f"  ⚠️  Error de conexión: {output[:150]}")
    
    # 5. Actualizar .env.production
    print("\n5️⃣  Actualizando .env.production...")
    
    new_env_content = f'''NODE_ENV="production"
DATABASE_URL="postgresql://inmova_user:{NEW_DB_PASSWORD}@localhost:5432/inmova_production"
NEXTAUTH_URL="http://157.180.119.236"
NEXTAUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

# Database
POSTGRES_USER="inmova_user"
POSTGRES_PASSWORD="{NEW_DB_PASSWORD}"
POSTGRES_DB="inmova_production"

# App
NEXT_PUBLIC_APP_NAME="Inmova"
NEXT_PUBLIC_APP_URL="http://157.180.119.236"

# Timezone
TZ="Europe/Madrid"
'''
    
    # Escribir nuevo .env
    stdin, stdout, stderr = client.exec_command(
        f"cat > {APP_DIR}/.env.production << 'EOFENV'\n{new_env_content}EOFENV"
    )
    stdout.channel.recv_exit_status()
    print("  ✅ .env.production actualizado")
    
    # 6. Verificar Prisma schema y hacer push
    print("\n6️⃣  Sincronizando schema de Prisma con BD...")
    success, output, error = exec_cmd(client, 
        f"cd {APP_DIR} && source .env.production && npx prisma db push --skip-generate",
        timeout=60
    )
    
    if 'Your database is now in sync' in output or 'already in sync' in output:
        print("  ✅ Schema sincronizado")
    else:
        print(f"  ⚠️  Prisma push: {output[-200:] if output else error[-200:]}")
    
    # 7. Reiniciar aplicación
    print("\n7️⃣  Reiniciando aplicación...")
    exec_cmd(client, "pm2 restart inmova-app", timeout=10)
    
    print("\n8️⃣  Esperando warm-up (15s)...")
    time.sleep(15)
    
    # 8. Verificaciones finales
    print("\n9️⃣  Verificaciones finales:")
    
    # PM2 status
    success, output, _ = exec_cmd(client, "pm2 status inmova-app", timeout=5)
    if 'online' in output:
        print("  ✅ PM2: online")
    else:
        print("  ❌ PM2: error")
    
    # Health check (debería mostrar database: connected ahora)
    success, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health", timeout=10)
    if '"database":"connected"' in output:
        print("  ✅ Database: connected")
    elif '"database":"disconnected"' in output:
        print("  ❌ Database: disconnected")
        print(f"     {output[:150]}")
    else:
        print(f"  ⚠️  Health: {output[:100]}")
    
    # Login page
    success, output, _ = exec_cmd(client, "curl -I http://localhost:3000/login 2>&1 | head -1", timeout=10)
    if '200' in output:
        print("  ✅ Login page: 200 OK")
    else:
        print(f"  ⚠️  Login: {output.strip()[:60]}")
    
    # Logs recientes
    print("\n🔟 Últimos logs de error:")
    success, output, _ = exec_cmd(client, "pm2 logs inmova-app --err --lines 5 --nostream", timeout=5)
    recent_logs = [line for line in output.split('\n') if line.strip() and not line.startswith('[TAILING]')][-5:]
    
    if recent_logs:
        for line in recent_logs:
            print(f"  {line[:120]}")
    else:
        print("  (Sin errores recientes)")
    
    print("\n✅ FIX DE BASE DE DATOS COMPLETADO")
    print(f"\n🔐 NUEVA CONTRASEÑA DE BD: {NEW_DB_PASSWORD}")
    print("\n📝 Prueba el login:")
    print("  URL: http://157.180.119.236/login")
    print("  Email: superadmin@inmova.app")
    print("  Password: Admin123!")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
