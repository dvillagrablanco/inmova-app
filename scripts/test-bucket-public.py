#!/usr/bin/env python3
"""
Test que el bucket está configurado correctamente
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

def main():
    print("🧪 TESTEANDO CONFIGURACIÓN DE BUCKET")
    print("=" * 60)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("1. Creando archivo de prueba...")
    client.exec_command("echo 'INMOVA-TEST-$(date +%s)' > /tmp/test-bucket.txt")
    
    print("2. Subiendo a S3...")
    stdin, stdout, stderr = client.exec_command(
        "aws s3 cp /tmp/test-bucket.txt s3://inmova/test-bucket.txt 2>&1",
        timeout=30
    )
    exit_status = stdout.channel.recv_exit_status()
    
    if exit_status != 0:
        print("   ❌ Error subiendo archivo")
        print(stderr.read().decode())
        client.close()
        return 1
    
    print("   ✅ Archivo subido")
    
    print("3. Testeando acceso público...")
    time.sleep(2)
    
    stdin, stdout, stderr = client.exec_command(
        "curl -s -o /dev/null -w '%{http_code}' https://inmova.s3.eu-north-1.amazonaws.com/test-bucket.txt",
        timeout=30
    )
    stdout.channel.recv_exit_status()
    code = stdout.read().decode().strip()
    
    print(f"   HTTP Code: {code}")
    
    if '200' in code:
        print("   ✅ ACCESO PÚBLICO FUNCIONA")
        print()
        print("=" * 60)
        print("🎉 ✅ BUCKET CONFIGURADO CORRECTAMENTE")
        print("=" * 60)
        print()
        print("URLs de test:")
        print("   https://inmova.s3.eu-north-1.amazonaws.com/test-bucket.txt")
        print()
        print("✅ Ya puedes usar S3 en tu app:")
        print("   - Sube fotos de propiedades")
        print("   - Sube documentos")
        print("   - Sube avatares")
        print()
        success = True
    elif '403' in code:
        print("   ❌ ACCESO DENEGADO (403 Forbidden)")
        print()
        print("⚠️  Esto significa que falta configurar:")
        print("   → Bucket Policy (Paso 3)")
        print("   O")
        print("   → Block Public Access todavía activo (Paso 2)")
        print()
        success = False
    elif '404' in code:
        print("   ❌ ARCHIVO NO ENCONTRADO (404)")
        print("   Esto es raro, el archivo se subió pero no se encuentra")
        success = False
    else:
        print(f"   ⚠️  Código inesperado: {code}")
        success = False
    
    # Limpiar
    print()
    print("4. Limpiando archivos de prueba...")
    client.exec_command("aws s3 rm s3://inmova/test-bucket.txt 2>&1")
    client.exec_command("rm /tmp/test-bucket.txt")
    print("   ✅ Limpieza completada")
    
    client.close()
    
    if success:
        print()
        print("🎉 TODO LISTO PARA USAR S3")
        return 0
    else:
        print()
        print("⚠️  Verifica los pasos 2 y 3 en AWS Console")
        return 1

if __name__ == '__main__':
    sys.exit(main())
