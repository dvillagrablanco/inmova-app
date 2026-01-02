#!/usr/bin/env python3
"""Crear usuario superadmin"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("👤 CREANDO USUARIO SUPERADMIN\n")
    
    # Ejecutar script de fix-auth
    print("1️⃣  Ejecutando fix-auth-complete.ts...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && source .env.production && npx tsx scripts/fix-auth-complete.ts",
        timeout=60
    )
    
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    print(output)
    if error and 'error' in error.lower():
        print(f"Errores: {error[:500]}")
    
    # Verificar que se creó
    print("\n2️⃣  Verificando usuarios creados:")
    stdin, stdout, stderr = client.exec_command(
        "PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production -c \"SELECT email, activo, role FROM users WHERE email IN ('superadmin@inmova.app', 'admin@inmova.app');\"",
        timeout=10
    )
    print(stdout.read().decode())
    
    print("\n✅ PROCESO COMPLETADO")
    print("\n📝 Prueba con uno de estos usuarios:")
    print("  - superadmin@inmova.app / Admin123!")
    print("  - admin@inmova.app / Admin123!")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
finally:
    client.close()
