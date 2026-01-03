#!/usr/bin/env python3
"""
Fix bucket policy para archivos públicos
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import json

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

def main():
    print("🔧 Configurando bucket policy para archivos públicos...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    # Policy
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::inmova/*"
            }
        ]
    }
    
    policy_json = json.dumps(policy).replace('"', '\\"')
    
    cmd = f'aws s3api put-bucket-policy --bucket inmova --policy "{policy_json}" 2>&1'
    
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0:
        print("✅ Bucket policy configurada correctamente")
        print("✅ Los archivos ahora son públicos\n")
        
        # Test
        print("🧪 Testeando con archivo de prueba...")
        client.exec_command("echo 'test-public' > /tmp/test-public.txt")
        client.exec_command("aws s3 cp /tmp/test-public.txt s3://inmova/test-public.txt")
        
        stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' https://inmova.s3.eu-north-1.amazonaws.com/test-public.txt")
        stdout.channel.recv_exit_status()
        code = stdout.read().decode('utf-8').strip()
        
        if '200' in code:
            print("✅ Archivos públicos funcionando correctamente\n")
        else:
            print(f"⚠️  HTTP Code: {code}\n")
        
        # Limpiar
        client.exec_command("aws s3 rm s3://inmova/test-public.txt")
        client.exec_command("rm /tmp/test-public.txt")
    else:
        print(f"❌ Error: {error}")
    
    client.close()
    return exit_status

if __name__ == '__main__':
    sys.exit(main())
