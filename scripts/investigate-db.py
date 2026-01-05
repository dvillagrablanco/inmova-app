#!/usr/bin/env python3
"""
Investigar base de datos y corregir problema de enum
"""

import sys
import subprocess

try:
    import paramiko
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

def exec_cmd(client, command, timeout=120):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print("🔐 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=15)
    print("✅ Conectado\n")

    try:
        # 1. Ver todas las bases de datos
        print("📋 Bases de datos:")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -c "\\l" 2>/dev/null | grep inmova'''
        )
        print(output)
        
        # 2. Ver tablas en cada BD
        for db in ['inmova_production', 'inmova_production_v2', 'inmova_production_v3']:
            print(f"\n📋 Tablas en {db}:")
            status, output, error = exec_cmd(
                client,
                f'''sudo -u postgres psql -d {db} -c "\\dt" 2>/dev/null | grep -i user | head -5'''
            )
            if output.strip():
                print(f"  {output.strip()}")
            else:
                print(f"  (No hay tabla User)")
        
        # 3. Ver enum UserRole en cada BD
        for db in ['inmova_production', 'inmova_production_v2', 'inmova_production_v3']:
            print(f"\n📋 Enum UserRole en {db}:")
            status, output, error = exec_cmd(
                client,
                f'''sudo -u postgres psql -d {db} -c "SELECT unnest(enum_range(NULL::\\"UserRole\\"));" 2>/dev/null'''
            )
            if 'does not exist' not in str(error) and output.strip():
                print(f"  {output}")
            else:
                print(f"  (Enum no existe o error)")
        
        # 4. Buscar usuarios existentes en cada BD
        for db in ['inmova_production', 'inmova_production_v2', 'inmova_production_v3']:
            print(f"\n📋 Usuarios admin en {db}:")
            status, output, error = exec_cmd(
                client,
                f'''sudo -u postgres psql -d {db} -c "SELECT email, role FROM \\"User\\" WHERE role LIKE '%admin%' LIMIT 5;" 2>/dev/null'''
            )
            if 'does not exist' not in str(error) and output.strip():
                print(f"  {output}")
            else:
                print(f"  (Tabla no existe o error)")
        
        # 5. Verificar qué BD usa PM2 realmente
        print("\n📋 DATABASE_URL en PM2:")
        status, output, error = exec_cmd(
            client,
            "pm2 env 0 2>/dev/null | grep DATABASE"
        )
        print(output)
        
        # 6. Ver schema de prisma
        print("\n📋 Enum UserRole en schema.prisma:")
        status, output, error = exec_cmd(
            client,
            "grep -A 30 'enum UserRole' /opt/inmova-app/prisma/schema.prisma | head -35"
        )
        print(output)
        
        # 7. Ver si necesita migración
        print("\n📋 Estado de migraciones Prisma:")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" npx prisma migrate status 2>&1 | head -20'''
        )
        print(output)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
