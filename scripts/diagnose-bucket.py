#!/usr/bin/env python3
"""
Diagnosticar estado del bucket
"""

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
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore')

def main():
    print("🔍 DIAGNÓSTICO DEL BUCKET\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("1. Block Public Access (bucket):")
    result = exec_cmd(client, "aws s3api get-public-access-block --bucket inmova 2>&1")
    print(result)
    print()
    
    print("2. Bucket Policy:")
    result = exec_cmd(client, "aws s3api get-bucket-policy --bucket inmova 2>&1")
    print(result)
    print()
    
    print("3. CORS:")
    result = exec_cmd(client, "aws s3api get-bucket-cors --bucket inmova 2>&1")
    print(result)
    print()
    
    print("4. ACL del bucket:")
    result = exec_cmd(client, "aws s3api get-bucket-acl --bucket inmova 2>&1")
    print(result)
    print()
    
    print("5. Test con ACL public-read explícito:")
    exec_cmd(client, "echo 'test-acl' > /tmp/test-acl.txt")
    exec_cmd(client, "aws s3 cp /tmp/test-acl.txt s3://inmova/test-acl.txt --acl public-read 2>&1")
    result = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' https://inmova.s3.eu-north-1.amazonaws.com/test-acl.txt")
    print(f"HTTP Code: {result.strip()}")
    
    if '200' in result:
        print("✅ Con ACL funciona - Problema es en la bucket policy")
    else:
        print("❌ Ni con ACL funciona - Block Public Access activo a nivel de cuenta")
    
    exec_cmd(client, "aws s3 rm s3://inmova/test-acl.txt 2>&1")
    exec_cmd(client, "rm /tmp/test-acl.txt")
    
    client.close()

if __name__ == '__main__':
    main()
