#!/usr/bin/env python3
"""Revisar logs de error"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

def execute_command(ssh, command):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=15)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore')

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        
        print("📝 PM2 Error Logs:\n")
        output = execute_command(client, "pm2 logs inmova-app --err --lines 50 --nostream")
        print(output)
        
        print("\n" + "="*70)
        print("\n🔍 Verificando si .next existe:\n")
        output = execute_command(client, "ls -la /opt/inmova-app/.next 2>&1 | head -20")
        print(output)
        
        print("\n" + "="*70)
        print("\n📦 package.json scripts:\n")
        output = execute_command(client, "cat /opt/inmova-app/package.json | grep -A 5 '\"scripts\"'")
        print(output)
        
        print("\n" + "="*70)
        print("\n🔧 ecosystem.config.js:\n")
        output = execute_command(client, "cat /opt/inmova-app/ecosystem.config.js 2>&1")
        print(output[:1000])
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    main()
