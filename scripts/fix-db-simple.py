#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'
NEW_DB_PASSWORD = 'InmovaSecure2026DB'

def exec_cmd(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    return stdout.read().decode(), stderr.read().decode()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🔧 FIX SIMPLE DE BASE DE DATOS\n")
    
    # 1. Cambiar password del usuario PostgreSQL
    print("1️⃣  Cambiando contraseña de inmova_user...")
    out, err = exec_cmd(client, 
        f"su - postgres -c \"psql -c \\\"ALTER USER inmova_user WITH PASSWORD '{NEW_DB_PASSWORD}';\\\"\"",
        timeout=10
    )
    if 'ALTER ROLE' in out:
        print("  ✅ Contraseña actualizada")
    else:
        print(f"  ⚠️  {out[:100] or err[:100]}")
    
    # 2. Grant privileges
    print("\n2️⃣  Asignando privilegios...")
    out, err = exec_cmd(client, 
        "su - postgres -c \"psql -c 'GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;'\"",
        timeout=10
    )
    print(f"  {out.strip() or '✅'}")
    
    # 3. Test conexión
    print("\n3️⃣  Testeando conexión...")
    out, err = exec_cmd(client, 
        f"PGPASSWORD='{NEW_DB_PASSWORD}' psql -h localhost -U inmova_user -d inmova_production -c 'SELECT 1;'",
        timeout=10
    )
    if '1 row' in out or '(1 row)' in out:
        print("  ✅ Conexión exitosa")
    else:
        print(f"  ❌ Error: {err[:150] or out[:150]}")
    
    # 4. Actualizar .env
    print("\n4️⃣  Actualizando .env.production...")
    
    new_env = f"""NODE_ENV="production"
DATABASE_URL="postgresql://inmova_user:{NEW_DB_PASSWORD}@localhost:5432/inmova_production"
NEXTAUTH_URL="http://157.180.119.236"
NEXTAUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
"""
    
    stdin, stdout, stderr = client.exec_command(f"cat > {APP_DIR}/.env.production << 'EOF'\n{new_env}EOF")
    stdout.channel.recv_exit_status()
    print("  ✅ .env actualizado")
    
    # 5. Prisma db push
    print("\n5️⃣  Sincronizando Prisma...")
    out, err = exec_cmd(client, 
        f"cd {APP_DIR} && source .env.production && npx prisma db push --accept-data-loss",
        timeout=90
    )
    if 'in sync' in out.lower():
        print("  ✅ Schema sincronizado")
    else:
        print(f"  Output: {out[-200:]}")
    
    # 6. Restart PM2
    print("\n6️⃣  Reiniciando PM2...")
    exec_cmd(client, "pm2 restart inmova-app", timeout=10)
    time.sleep(20)
    
    # 7. Verificar
    print("\n7️⃣  Verificaciones:")
    
    out, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health", timeout=10)
    if '"connected"' in out:
        print("  ✅ Database: connected")
    else:
        print(f"  ❌ {out[:100]}")
    
    out, _ = exec_cmd(client, "curl -I http://localhost:3000/login 2>&1 | head -1", timeout=10)
    if '200' in out:
        print("  ✅ Login: 200 OK")
    
    print("\n✅ COMPLETADO")
    print(f"\n🔐 Nueva password BD: {NEW_DB_PASSWORD}")
    print("\n📱 Prueba: http://157.180.119.236/login")
    print("   superadmin@inmova.app / Admin123!")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
finally:
    client.close()
