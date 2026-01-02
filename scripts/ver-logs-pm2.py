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
    return output

def main():
    print("📋 LOGS DE PM2\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Estado de PM2:")
        output = execute_command(client, "pm2 status")
        print(output)
        
        print("\n2️⃣  Últimas 30 líneas de error log:")
        output = execute_command(client, "tail -30 /var/log/inmova/error.log")
        print(output)
        
        print("\n3️⃣  Últimas 30 líneas de out log:")
        output = execute_command(client, "tail -30 /var/log/inmova/out.log")
        print(output)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        client.close()

if __name__ == '__main__':
    main()
