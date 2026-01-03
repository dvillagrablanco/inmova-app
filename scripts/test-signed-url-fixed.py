#!/usr/bin/env python3
"""
Test signed URL con región correcta
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
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore')

def main():
    print("🔑 TEST SIGNED URL CON REGIÓN\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("1. Subiendo archivo de test...")
    exec_cmd(client, "echo 'signed-url-test' > /tmp/signed-test.txt")
    exec_cmd(client, "aws s3 cp /tmp/signed-test.txt s3://inmova-private/signed-test.txt 2>&1")
    print("   ✅ Archivo subido\n")
    
    print("2. Generando Signed URL (con región explícita)...")
    cmd = "aws s3 presign s3://inmova-private/signed-test.txt --expires-in 3600 --region eu-north-1"
    signed_url = exec_cmd(client, cmd).strip()
    
    print(f"   Signed URL:\n   {signed_url}\n")
    
    print("3. Testeando acceso con signed URL...")
    result = exec_cmd(client, f"curl -L -s -o /dev/null -w '%{{http_code}}' '{signed_url}'")
    code = result.strip()
    
    print(f"   HTTP Code: {code}")
    
    if '200' in code:
        print("   ✅ SIGNED URL FUNCIONANDO CORRECTAMENTE\n")
        success = True
    else:
        print(f"   ⚠️  Código inesperado: {code}\n")
        success = False
    
    print("4. Verificando que URL directa NO funciona...")
    direct_url = "https://inmova-private.s3.eu-north-1.amazonaws.com/signed-test.txt"
    result = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' {direct_url}")
    code = result.strip()
    
    print(f"   HTTP Code: {code}")
    
    if '403' in code:
        print("   ✅ URL directa bloqueada (correcto)\n")
    else:
        print(f"   ⚠️  URL directa accesible: {code}\n")
    
    # Limpiar
    exec_cmd(client, "aws s3 rm s3://inmova-private/signed-test.txt 2>&1")
    exec_cmd(client, "rm /tmp/signed-test.txt")
    
    client.close()
    
    if success:
        print("=" * 70)
        print("🎉 ✅ SIGNED URLs FUNCIONANDO PERFECTAMENTE")
        print("=" * 70)
        return 0
    else:
        print("⚠️  Revisar configuración")
        return 1

if __name__ == '__main__':
    sys.exit(main())
