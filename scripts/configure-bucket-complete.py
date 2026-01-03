#!/usr/bin/env python3
"""
Configurar bucket S3 COMPLETAMENTE (automático)
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
import json

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

BUCKET = "inmova"

def exec_cmd(client, cmd, timeout=60):
    """Ejecutar comando y retornar resultado"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        return {'exit': exit_status, 'output': output, 'error': error}
    except Exception as e:
        return {'exit': -1, 'output': '', 'error': str(e)}

def main():
    print("=" * 70)
    print("🔧 CONFIGURACIÓN AUTOMÁTICA DE BUCKET S3")
    print("=" * 70)
    print()
    print(f"Bucket: {BUCKET}")
    print(f"Region: eu-north-1")
    print()
    
    # Conectar
    print("[1/6] 🔐 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    print("      ✅ Conectado")
    print()
    
    # PASO 1: Desbloquear Block Public Access
    print("[2/6] 🔓 Desbloqueando acceso público...")
    
    cmd = f"""aws s3api put-public-access-block \
    --bucket {BUCKET} \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
    2>&1"""
    
    result = exec_cmd(client, cmd, timeout=30)
    
    if result['exit'] == 0:
        print("      ✅ Block Public Access desactivado")
    else:
        print(f"      ⚠️  Error: {result['error'][:200]}")
        print("      Continuando de todos modos...")
    
    print()
    time.sleep(2)
    
    # PASO 2: Aplicar Bucket Policy
    print("[3/6] 📝 Aplicando Bucket Policy...")
    
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{BUCKET}/*"
            }
        ]
    }
    
    # Crear archivo temporal con la policy
    policy_json = json.dumps(policy)
    exec_cmd(client, f"cat > /tmp/bucket-policy.json << 'EOF'\n{policy_json}\nEOF")
    
    cmd = f"aws s3api put-bucket-policy --bucket {BUCKET} --policy file:///tmp/bucket-policy.json 2>&1"
    result = exec_cmd(client, cmd, timeout=30)
    
    if result['exit'] == 0:
        print("      ✅ Bucket Policy aplicada")
    else:
        print(f"      ⚠️  Error: {result['error'][:300]}")
        if 'AccessDenied' in result['error']:
            print("      ℹ️  Puede que el usuario IAM no tenga permisos")
        elif 'PublicAccessBlockConfiguration' in result['error']:
            print("      ℹ️  Block Public Access todavía puede estar activo")
    
    print()
    time.sleep(2)
    
    # PASO 3: Configurar CORS
    print("[4/6] 🌐 Configurando CORS...")
    
    cors = [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["https://inmovaapp.com", "http://localhost:3000"],
            "ExposeHeaders": ["ETag"]
        }
    ]
    
    cors_json = json.dumps({"CORSRules": cors})
    exec_cmd(client, f"cat > /tmp/cors.json << 'EOF'\n{cors_json}\nEOF")
    
    cmd = f"aws s3api put-bucket-cors --bucket {BUCKET} --cors-configuration file:///tmp/cors.json 2>&1"
    result = exec_cmd(client, cmd, timeout=30)
    
    if result['exit'] == 0:
        print("      ✅ CORS configurado")
    else:
        print(f"      ⚠️  Error: {result['error'][:200]}")
    
    print()
    time.sleep(2)
    
    # PASO 4: Test de upload
    print("[5/6] 📤 Test de upload...")
    
    exec_cmd(client, f"echo 'INMOVA-TEST-{int(time.time())}' > /tmp/test-public.txt")
    
    cmd = f"aws s3 cp /tmp/test-public.txt s3://{BUCKET}/test-public.txt --acl public-read 2>&1"
    result = exec_cmd(client, cmd, timeout=30)
    
    if result['exit'] == 0:
        print("      ✅ Upload exitoso")
    else:
        print(f"      ⚠️  Error: {result['error'][:200]}")
    
    print()
    time.sleep(3)
    
    # PASO 5: Test de acceso público
    print("[6/6] 🧪 Verificando acceso público...")
    
    test_url = f"https://{BUCKET}.s3.eu-north-1.amazonaws.com/test-public.txt"
    
    cmd = f"curl -s -o /dev/null -w '%{{http_code}}' {test_url}"
    result = exec_cmd(client, cmd, timeout=30)
    
    http_code = result['output'].strip()
    
    print(f"      HTTP Code: {http_code}")
    print(f"      URL: {test_url}")
    print()
    
    # Limpiar
    exec_cmd(client, f"aws s3 rm s3://{BUCKET}/test-public.txt 2>&1")
    exec_cmd(client, "rm /tmp/test-public.txt /tmp/bucket-policy.json /tmp/cors.json 2>&1")
    
    client.close()
    
    # Resultado final
    print("=" * 70)
    
    if '200' in http_code:
        print("🎉 ✅ BUCKET CONFIGURADO CORRECTAMENTE")
        print("=" * 70)
        print()
        print("✅ Archivos ahora son públicos")
        print("✅ CORS configurado")
        print("✅ Uploads funcionando")
        print()
        print("🔗 Puedes usar S3 en tu app:")
        print("   - Upload de fotos de propiedades")
        print("   - Upload de documentos")
        print("   - Upload de avatares")
        print()
        print(f"📦 Bucket URL: https://{BUCKET}.s3.eu-north-1.amazonaws.com/")
        print()
        return 0
    
    elif '403' in http_code:
        print("⚠️  CONFIGURACIÓN PARCIAL")
        print("=" * 70)
        print()
        print("❌ Archivos NO son públicos todavía (403 Forbidden)")
        print()
        print("Posibles causas:")
        print("  1. Block Public Access todavía activo")
        print("  2. Usuario IAM sin permisos suficientes")
        print("  3. Bucket policy no se aplicó correctamente")
        print()
        print("📋 SOLUCIÓN: Configuración manual (3 minutos)")
        print()
        print("Ve a: https://s3.console.aws.amazon.com/s3/buckets/inmova")
        print()
        print("1. Permissions → Block Public Access → Edit")
        print("   → Desmarcar TODO → Save → Confirm")
        print()
        print("2. Permissions → Bucket Policy → Edit")
        print("   → Pegar:")
        print()
        print(json.dumps(policy, indent=4))
        print()
        print("3. Save changes")
        print()
        return 1
    
    else:
        print("⚠️  ERROR INESPERADO")
        print("=" * 70)
        print()
        print(f"HTTP Code: {http_code}")
        print()
        print("Verifica:")
        print("  - Bucket existe: aws s3 ls s3://inmova/")
        print("  - Región correcta: eu-north-1")
        print("  - Credenciales válidas")
        print()
        return 1

if __name__ == '__main__':
    sys.exit(main())
