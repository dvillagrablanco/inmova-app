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
    print("🔍 Verificando companies en el servidor...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Verificando subscriptionPlanId en companies...")
        sql_command = """
sudo -u postgres psql -d inmova_production -c "
SELECT 
    id, 
    nombre,
    CASE WHEN \\\"subscriptionPlanId\\\" IS NULL THEN 'NULL' ELSE 'SET' END as plan_status
FROM company
ORDER BY nombre
LIMIT 10;"
"""
        output, error = execute_command(client, sql_command)
        print(output)
        if error and 'Permission denied' not in error:
            print(f"Error: {error}\n")
        
        print("\n2️⃣  Verificando si existen planes de suscripción...")
        sql_command2 = """
sudo -u postgres psql -d inmova_production -c "
SELECT id, name, price, interval FROM subscription_plans LIMIT 5;"
"""
        output2, error2 = execute_command(client, sql_command2)
        print(output2)
        if error2 and 'Permission denied' not in error2:
            print(f"Error: {error2}\n")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        client.close()
    
    return True

if __name__ == '__main__':
    main()
