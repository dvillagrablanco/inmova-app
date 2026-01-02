#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'

def execute_command(ssh, command):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=60)
    output = stdout.read().decode()
    error = stderr.read().decode()
    return output, error

def main():
    print("🔍 Verificando usuarios en el servidor...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Verificando usuarios admin y test...")
        sql_command = """
sudo -u postgres psql -d inmova_production -c "
SELECT 
    email, 
    role, 
    activo, 
    LENGTH(password) as pass_length,
    SUBSTRING(password, 1, 10) as pass_start,
    CASE WHEN company_id IS NULL THEN 'NULL' ELSE 'SET' END as company_status
FROM users 
WHERE email IN ('admin@inmova.app', 'test@inmova.app')
ORDER BY email;"
"""
        output, error = execute_command(client, sql_command)
        print(output)
        if error:
            print(f"Error: {error}")
        
        print("\n2️⃣  Verificando total de usuarios activos...")
        sql_command2 = """
sudo -u postgres psql -d inmova_production -c "
SELECT COUNT(*) as total_users, 
       SUM(CASE WHEN activo = true THEN 1 ELSE 0 END) as active_users
FROM users;"
"""
        output2, error2 = execute_command(client, sql_command2)
        print(output2)
        
        print("\n3️⃣  Verificando si existe el usuario superadmin...")
        sql_command3 = """
sudo -u postgres psql -d inmova_production -c "
SELECT email, role, activo FROM users WHERE role = 'super_admin' LIMIT 5;"
"""
        output3, error3 = execute_command(client, sql_command3)
        print(output3)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        client.close()
    
    return True

if __name__ == '__main__':
    main()
