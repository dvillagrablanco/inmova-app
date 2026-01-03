#!/usr/bin/env python3
"""
Verificar y arreglar permisos IAM
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

def exec_cmd(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    return {
        'exit': exit_status,
        'output': stdout.read().decode('utf-8', errors='ignore'),
        'error': stderr.read().decode('utf-8', errors='ignore')
    }

def main():
    print("🔍 VERIFICANDO PERMISOS IAM\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("1. Identificar usuario IAM actual...")
    result = exec_cmd(client, "aws sts get-caller-identity 2>&1")
    
    if result['exit'] == 0:
        identity = json.loads(result['output'])
        arn = identity.get('Arn', '')
        user_name = arn.split('/')[-1] if '/' in arn else 'root'
        print(f"   Usuario: {user_name}")
        print(f"   ARN: {arn}\n")
    else:
        print(f"   ⚠️  Error: {result['error'][:100]}\n")
        user_name = None
    
    print("2. Listar policies del usuario...")
    if user_name and user_name != 'root':
        result = exec_cmd(client, f"aws iam list-attached-user-policies --user-name {user_name} 2>&1")
        
        if result['exit'] == 0:
            policies = json.loads(result['output'])
            print(f"   Policies:")
            for policy in policies.get('AttachedPolicies', []):
                print(f"   - {policy['PolicyName']}")
            print()
        else:
            print(f"   ⚠️  {result['error'][:100]}\n")
    else:
        print("   ℹ️  Usuario root - tiene todos los permisos\n")
    
    print("3. Test directo: Leer del bucket privado...")
    result = exec_cmd(client, "aws s3 ls s3://inmova-private/ 2>&1")
    
    if result['exit'] == 0:
        print("   ✅ Puede listar bucket privado")
        print(f"   Archivos: {len(result['output'].split(chr(10)))} líneas\n")
    else:
        print(f"   ❌ No puede listar: {result['error'][:100]}\n")
    
    print("4. Test: Descargar archivo del bucket privado...")
    exec_cmd(client, "echo 'test-permissions' > /tmp/perm-test.txt")
    exec_cmd(client, "aws s3 cp /tmp/perm-test.txt s3://inmova-private/perm-test.txt 2>&1")
    
    result = exec_cmd(client, "aws s3 cp s3://inmova-private/perm-test.txt /tmp/perm-download.txt 2>&1")
    
    if result['exit'] == 0:
        print("   ✅ Puede descargar archivos\n")
        can_download = True
    else:
        print(f"   ❌ No puede descargar: {result['error'][:100]}\n")
        can_download = False
    
    exec_cmd(client, "aws s3 rm s3://inmova-private/perm-test.txt 2>&1")
    exec_cmd(client, "rm /tmp/perm-test.txt /tmp/perm-download.txt 2>&1")
    
    print("=" * 70)
    
    if can_download:
        print("✅ PERMISOS IAM CORRECTOS")
        print("=" * 70)
        print()
        print("✅ El usuario puede:")
        print("   - Listar buckets")
        print("   - Subir archivos")
        print("   - Descargar archivos")
        print()
        print("⚠️  PROBLEMA CON SIGNED URLs:")
        print("   Las signed URLs generadas pueden tener un problema de región")
        print("   o de credenciales temporales.")
        print()
        print("💡 SOLUCIÓN ALTERNATIVA:")
        print("   Usar descargas directas desde el servidor (sin signed URLs)")
        print("   O generar signed URLs desde el frontend con credenciales temporales")
        print()
    else:
        print("❌ PERMISOS INSUFICIENTES")
        print("=" * 70)
        print()
        print("El usuario IAM no tiene permisos suficientes para el bucket privado.")
        print()
        if user_name and user_name != 'root':
            print(f"Necesitas añadir permisos al usuario: {user_name}")
            print()
            print("En AWS Console:")
            print("1. IAM → Users → inmova-app")
            print("2. Add permissions → Attach policies")
            print("3. Buscar: AmazonS3FullAccess")
            print("4. Attach policy")
        print()
    
    client.close()
    return 0 if can_download else 1

if __name__ == '__main__':
    sys.exit(main())
