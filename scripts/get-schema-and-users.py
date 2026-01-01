#!/usr/bin/env python3
"""
Obtener esquema de tabla User y listar usuarios
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'

def execute_command(client, command):
    """Ejecuta comando y retorna output"""
    stdin, stdout, stderr = client.exec_command(command, timeout=30)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if output:
        print(output)
    if error and exit_status != 0:
        print(f"Error: {error[:500]}")
    
    return exit_status == 0, output

print("=" * 60)
print("🔍 VERIFICANDO ESQUEMA Y USUARIOS")
print("=" * 60)

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("\n📡 Conectando...")
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
    print("✅ Conectado")
    
    # Leer DATABASE_URL
    print("\n📋 Leyendo DATABASE_URL...")
    success, output = execute_command(client, "grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1")
    
    if not success or not output:
        print("❌ No se pudo leer DATABASE_URL")
        sys.exit(1)
    
    db_url = output.strip().split('=', 1)[1].strip('"').strip("'")
    
    # Ver estructura de tabla User
    print("\n📋 Estructura de tabla User:")
    sql1 = "\\d \\\"User\\\""
    execute_command(client, f"psql '{db_url}' -c \"{sql1}\"")
    
    # Listar tablas disponibles
    print("\n📋 Tablas disponibles:")
    sql2 = "\\dt"
    execute_command(client, f"psql '{db_url}' -c \"{sql2}\"")
    
    # Buscar usuarios (sin case-sensitive)
    print("\n🔍 Buscando usuarios con email like 'principiante%':")
    sql3 = "SELECT * FROM \\\"User\\\" WHERE email LIKE 'principiante%' LIMIT 5;"
    execute_command(client, f"psql '{db_url}' -c \"{sql3}\"")
    
    # Listar primeros 5 usuarios
    print("\n📋 Primeros 5 usuarios en la tabla:")
    sql4 = "SELECT * FROM \\\"User\\\" LIMIT 5;"
    execute_command(client, f"psql '{db_url}' -c \"{sql4}\"")
    
    client.close()
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
