#!/usr/bin/env python3
"""Fix NEXTAUTH_URL"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

def exec_cmd(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore')

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("Verificando NEXTAUTH_URL...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep NEXTAUTH_URL .env.production")
    print(f"Actual: {result}")
    
    if 'https://inmovaapp.com' not in result:
        print("\nConfigurando NEXTAUTH_URL...")
        exec_cmd(client, """cd /opt/inmova-app && sed -i '/^NEXTAUTH_URL=/d' .env.production && echo 'NEXTAUTH_URL=https://inmovaapp.com' >> .env.production""")
        print("✅ NEXTAUTH_URL configurado")
    
    print("\nReiniciando PM2...")
    exec_cmd(client, "pm2 restart inmova-app --update-env")
    print("✅ PM2 reiniciado")
    
    client.close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
