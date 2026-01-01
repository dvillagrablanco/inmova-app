#!/usr/bin/env python3
"""
Verificar usuario usando psql directamente
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'

def execute_command(client, command):
    """Ejecuta comando y retorna output"""
    print(f"   $ {command[:100]}...")
    stdin, stdout, stderr = client.exec_command(command, timeout=30)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if output:
        print(output)
    if error and exit_status != 0:
        print(f"   Error: {error[:500]}")
    
    return exit_status == 0, output

print("=" * 60)
print("🔍 VERIFICANDO USUARIOS EN BASE DE DATOS")
print("=" * 60)

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("\n📡 Conectando al servidor...")
    client.connect(
        SERVER_IP,
        username=USERNAME,
        password=PASSWORD,
        timeout=30,
        look_for_keys=False,
        allow_agent=False
    )
    print("✅ Conectado")
    
    # Leer DATABASE_URL de .env.production
    print("\n📋 Leyendo DATABASE_URL...")
    success, output = execute_command(
        client,
        "grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1"
    )
    
    if not success or not output:
        print("❌ No se pudo leer DATABASE_URL")
        sys.exit(1)
    
    # Extraer nombre de base de datos
    db_url = output.strip().split('=', 1)[1].strip('"').strip("'")
    
    # Buscar usuario principiante@gestor.es
    print("\n🔍 Buscando: principiante@gestor.es")
    
    sql = """SELECT email, name, role, activo, "companyId", 
             SUBSTRING(password, 1, 10) as pass_start, 
             LENGTH(password) as pass_length,
             "createdAt"
             FROM "User" 
             WHERE email = 'principiante@gestor.es';"""
    
    success, output = execute_command(
        client,
        f"psql '{db_url}' -c \"{sql}\""
    )
    
    # Listar primeros 10 usuarios activos
    print("\n📋 Primeros 10 usuarios activos:")
    
    sql2 = """SELECT email, name, role, activo 
              FROM "User" 
              WHERE activo = true 
              ORDER BY "createdAt" DESC 
              LIMIT 10;"""
    
    success, output = execute_command(
        client,
        f"psql '{db_url}' -c \"{sql2}\""
    )
    
    # Contar usuarios totales
    print("\n📊 Estadísticas:")
    
    sql3 = """SELECT 
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE activo = true) as activos,
              COUNT(*) FILTER (WHERE email LIKE '%@gestor.es') as gestores
              FROM "User";"""
    
    success, output = execute_command(
        client,
        f"psql '{db_url}' -c \"{sql3}\""
    )
    
    client.close()
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
