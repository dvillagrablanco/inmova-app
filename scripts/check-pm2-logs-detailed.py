#!/usr/bin/env python3
"""Check PM2 logs detallados"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

def execute_command(ssh, command):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=30)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore')

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        
        print("📝 Error Logs (últimas 50 líneas):\n")
        output = execute_command(client, "tail -50 /var/log/inmova/error.log 2>&1")
        print(output)
        
        print("\n" + "="*70)
        print("\n📝 Out Logs (últimas 50 líneas):\n")
        output = execute_command(client, "tail -50 /var/log/inmova/out.log 2>&1")
        print(output)
        
        print("\n" + "="*70)
        print("\n🔍 Test manual directo (sin PM2):\n")
        output = execute_command(client, "cd /opt/inmova-app && timeout 15 npm start 2>&1 || true")
        print(output[:3000])
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    main()
