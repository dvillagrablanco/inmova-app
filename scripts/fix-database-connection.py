#!/usr/bin/env python3
"""
FIX DATABASE CONNECTION
Corrige el DATABASE_URL con URL encoding para caracteres especiales
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
from urllib.parse import quote_plus

# Configuración
SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',  # Nuevo password
    'port': 22,
    'timeout': 30
}

# Password de DB con caracteres especiales
DB_PASSWORD = 'GBTwDE/HrcEJTiybX2SQZoUQAFKRNZgXMZAoZVTe+WI='
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)

print("=" * 70)
print("🔧 FIX: DATABASE CONNECTION")
print("=" * 70)
print()
print(f"DB Password original: {DB_PASSWORD}")
print(f"DB Password encoded:  {DB_PASSWORD_ENCODED}")
print()

try:
    # Conectar
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("✅ Conectado al servidor")
    
    # Actualizar DATABASE_URL con password encoded
    new_database_url = f"postgresql://inmova_user:{DB_PASSWORD_ENCODED}@localhost:5432/inmova_production?schema=public"
    
    print()
    print("Actualizando DATABASE_URL en .env.production...")
    
    # Leer .env actual
    sftp = client.open_sftp()
    with sftp.file('/opt/inmova-app/.env.production', 'r') as f:
        env_content = f.read().decode('utf-8')
    
    # Reemplazar DATABASE_URL
    lines = env_content.split('\n')
    new_lines = []
    for line in lines:
        if line.startswith('DATABASE_URL='):
            new_lines.append(f'DATABASE_URL={new_database_url}')
        else:
            new_lines.append(line)
    
    # Escribir nuevo .env
    with sftp.file('/opt/inmova-app/.env.production', 'w') as f:
        f.write('\n'.join(new_lines))
    
    sftp.close()
    
    print("✅ DATABASE_URL actualizado")
    
    # Reiniciar PM2
    print()
    print("Reiniciando PM2...")
    stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    stdout.channel.recv_exit_status()
    
    print("✅ PM2 reiniciado")
    
    # Esperar warm-up
    import time
    print("⏳ Esperando warm-up (10 segundos)...")
    time.sleep(10)
    
    # Verificar health check
    print()
    print("Verificando health check...")
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    output = stdout.read().decode('utf-8')
    
    print()
    print("Health Check Response:")
    print(output)
    print()
    
    if '"status":"ok"' in output and '"database":"connected"' in output:
        print("=" * 70)
        print("✅ FIX COMPLETADO - DATABASE CONECTADA")
        print("=" * 70)
        return_code = 0
    else:
        print("=" * 70)
        print("⚠️  Database aún no conecta - verificar manualmente")
        print("=" * 70)
        return_code = 1
    
    client.close()
    sys.exit(return_code)
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
