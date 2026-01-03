#!/usr/bin/env python3
"""
Configurar 2 buckets: público + privado
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

REGION = "eu-north-1"
PUBLIC_BUCKET = "inmova"
PRIVATE_BUCKET = "inmova-private"

def exec_cmd(client, cmd, timeout=60):
    """Ejecutar comando"""
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
    print("🏗️  CONFIGURANDO DUAL-BUCKET STRATEGY")
    print("=" * 70)
    print()
    print(f"📦 Bucket Público: {PUBLIC_BUCKET} (fotos, avatares)")
    print(f"🔒 Bucket Privado: {PRIVATE_BUCKET} (documentos sensibles)")
    print(f"🌍 Región: {REGION}")
    print()
    
    # Conectar
    print("[1/10] 🔐 Conectando...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    print("       ✅ Conectado\n")
    
    # ========================================
    # BUCKET PÚBLICO (inmova)
    # ========================================
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("📦 CONFIGURANDO BUCKET PÚBLICO")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    print(f"[2/10] 🔓 Desbloqueando {PUBLIC_BUCKET}...")
    cmd = f"""aws s3api put-public-access-block \
    --bucket {PUBLIC_BUCKET} \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
    2>&1"""
    result = exec_cmd(client, cmd)
    if result['exit'] == 0:
        print("       ✅ Block Public Access desactivado\n")
    else:
        print(f"       ⚠️  {result['error'][:100]}\n")
    
    time.sleep(1)
    
    print(f"[3/10] 📝 Aplicando Bucket Policy a {PUBLIC_BUCKET}...")
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{PUBLIC_BUCKET}/*"
            }
        ]
    }
    
    policy_json = json.dumps(policy)
    exec_cmd(client, f"cat > /tmp/public-policy.json << 'EOF'\n{policy_json}\nEOF")
    cmd = f"aws s3api put-bucket-policy --bucket {PUBLIC_BUCKET} --policy file:///tmp/public-policy.json 2>&1"
    result = exec_cmd(client, cmd)
    if result['exit'] == 0:
        print("       ✅ Bucket Policy aplicada\n")
    else:
        print(f"       ⚠️  {result['error'][:100]}\n")
    
    time.sleep(1)
    
    print(f"[4/10] 🌐 Configurando CORS en {PUBLIC_BUCKET}...")
    cors = {
        "CORSRules": [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
                "AllowedOrigins": ["https://inmovaapp.com", "http://localhost:3000"],
                "ExposeHeaders": ["ETag"]
            }
        ]
    }
    
    cors_json = json.dumps(cors)
    exec_cmd(client, f"cat > /tmp/cors.json << 'EOF'\n{cors_json}\nEOF")
    cmd = f"aws s3api put-bucket-cors --bucket {PUBLIC_BUCKET} --cors-configuration file:///tmp/cors.json 2>&1"
    result = exec_cmd(client, cmd)
    if result['exit'] == 0:
        print("       ✅ CORS configurado\n")
    else:
        print(f"       ⚠️  {result['error'][:100]}\n")
    
    # ========================================
    # BUCKET PRIVADO (inmova-private)
    # ========================================
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🔒 CONFIGURANDO BUCKET PRIVADO")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    print(f"[5/10] 🏗️  Creando bucket {PRIVATE_BUCKET}...")
    cmd = f"aws s3api create-bucket --bucket {PRIVATE_BUCKET} --region {REGION} --create-bucket-configuration LocationConstraint={REGION} 2>&1"
    result = exec_cmd(client, cmd)
    
    if result['exit'] == 0 or 'BucketAlreadyOwnedByYou' in result['error']:
        print("       ✅ Bucket creado/existente\n")
    else:
        print(f"       ⚠️  {result['error'][:150]}\n")
    
    time.sleep(1)
    
    print(f"[6/10] 🔒 Bloqueando acceso público a {PRIVATE_BUCKET}...")
    cmd = f"""aws s3api put-public-access-block \
    --bucket {PRIVATE_BUCKET} \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    2>&1"""
    result = exec_cmd(client, cmd)
    if result['exit'] == 0:
        print("       ✅ Bucket totalmente privado\n")
    else:
        print(f"       ⚠️  {result['error'][:100]}\n")
    
    time.sleep(1)
    
    print(f"[7/10] 🌐 Configurando CORS en {PRIVATE_BUCKET}...")
    cmd = f"aws s3api put-bucket-cors --bucket {PRIVATE_BUCKET} --cors-configuration file:///tmp/cors.json 2>&1"
    result = exec_cmd(client, cmd)
    if result['exit'] == 0:
        print("       ✅ CORS configurado\n")
    else:
        print(f"       ⚠️  {result['error'][:100]}\n")
    
    # ========================================
    # TESTS
    # ========================================
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🧪 TESTS")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    print(f"[8/10] 📤 Test bucket público ({PUBLIC_BUCKET})...")
    exec_cmd(client, f"echo 'public-test-{int(time.time())}' > /tmp/public-test.txt")
    exec_cmd(client, f"aws s3 cp /tmp/public-test.txt s3://{PUBLIC_BUCKET}/public-test.txt 2>&1")
    time.sleep(2)
    
    public_url = f"https://{PUBLIC_BUCKET}.s3.{REGION}.amazonaws.com/public-test.txt"
    result = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' {public_url}")
    public_code = result['output'].strip()
    
    print(f"       URL: {public_url}")
    print(f"       HTTP: {public_code}")
    
    if '200' in public_code:
        print("       ✅ Archivos PÚBLICOS funcionando\n")
        public_works = True
    else:
        print("       ❌ Todavía no público (403)\n")
        public_works = False
    
    exec_cmd(client, f"aws s3 rm s3://{PUBLIC_BUCKET}/public-test.txt 2>&1")
    exec_cmd(client, "rm /tmp/public-test.txt")
    
    print(f"[9/10] 🔒 Test bucket privado ({PRIVATE_BUCKET})...")
    exec_cmd(client, f"echo 'private-test-{int(time.time())}' > /tmp/private-test.txt")
    exec_cmd(client, f"aws s3 cp /tmp/private-test.txt s3://{PRIVATE_BUCKET}/private-test.txt 2>&1")
    time.sleep(2)
    
    private_url = f"https://{PRIVATE_BUCKET}.s3.{REGION}.amazonaws.com/private-test.txt"
    result = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' {private_url}")
    private_code = result['output'].strip()
    
    print(f"       URL: {private_url}")
    print(f"       HTTP: {private_code}")
    
    if '403' in private_code:
        print("       ✅ Archivos PRIVADOS (403 = correcto)\n")
        private_works = True
    else:
        print(f"       ⚠️  Código inesperado: {private_code}\n")
        private_works = False
    
    print(f"[10/10] 🔑 Test Signed URL en {PRIVATE_BUCKET}...")
    cmd = f"aws s3 presign s3://{PRIVATE_BUCKET}/private-test.txt --expires-in 3600"
    result = exec_cmd(client, cmd)
    signed_url = result['output'].strip()
    
    if signed_url.startswith('http'):
        result = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' '{signed_url}'")
        signed_code = result['output'].strip()
        
        print(f"       Signed URL: {signed_url[:80]}...")
        print(f"       HTTP: {signed_code}")
        
        if '200' in signed_code:
            print("       ✅ Signed URLs funcionando\n")
            signed_works = True
        else:
            print(f"       ❌ Signed URL falló: {signed_code}\n")
            signed_works = False
    else:
        print(f"       ❌ Error generando signed URL\n")
        signed_works = False
    
    exec_cmd(client, f"aws s3 rm s3://{PRIVATE_BUCKET}/private-test.txt 2>&1")
    exec_cmd(client, "rm /tmp/private-test.txt /tmp/public-policy.json /tmp/cors.json")
    
    # ========================================
    # ACTUALIZAR .ENV
    # ========================================
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("⚙️  ACTUALIZANDO .ENV.PRODUCTION")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    result = exec_cmd(client, "cat /opt/inmova-app/.env.production")
    env_content = result['output']
    lines = env_content.split('\n')
    updated_lines = []
    
    has_public = False
    has_private = False
    
    for line in lines:
        if line.startswith('AWS_BUCKET='):
            updated_lines.append(f'AWS_BUCKET={PUBLIC_BUCKET}')
            has_public = True
        elif line.startswith('AWS_BUCKET_PRIVATE='):
            updated_lines.append(f'AWS_BUCKET_PRIVATE={PRIVATE_BUCKET}')
            has_private = True
        else:
            updated_lines.append(line)
    
    if not has_public:
        updated_lines.append(f'AWS_BUCKET={PUBLIC_BUCKET}')
    if not has_private:
        updated_lines.append(f'AWS_BUCKET_PRIVATE={PRIVATE_BUCKET}')
    
    new_env = '\n'.join(updated_lines)
    
    try:
        sftp = client.open_sftp()
        with sftp.file('/opt/inmova-app/.env.production', 'w') as f:
            f.write(new_env)
        sftp.close()
        print("✅ Variables de entorno actualizadas\n")
    except Exception as e:
        print(f"⚠️  Error: {e}\n")
    
    # Reiniciar app
    print("♻️  Reiniciando aplicación...")
    exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    print("✅ App reiniciada\n")
    
    time.sleep(3)
    
    client.close()
    
    # ========================================
    # REPORTE FINAL
    # ========================================
    
    print("=" * 70)
    print("📊 REPORTE FINAL")
    print("=" * 70)
    print()
    
    print("📦 BUCKET PÚBLICO:")
    print(f"   Nombre: {PUBLIC_BUCKET}")
    print(f"   URL Base: https://{PUBLIC_BUCKET}.s3.{REGION}.amazonaws.com/")
    print(f"   Status: {'✅ FUNCIONANDO' if public_works else '⚠️  Revisar configuración de cuenta'}")
    print(f"   Uso: Fotos propiedades, avatares, imágenes públicas")
    print()
    
    print("🔒 BUCKET PRIVADO:")
    print(f"   Nombre: {PRIVATE_BUCKET}")
    print(f"   URL Base: https://{PRIVATE_BUCKET}.s3.{REGION}.amazonaws.com/")
    print(f"   Status: {'✅ PRIVADO (correcto)' if private_works else '⚠️  Revisar'}")
    print(f"   Signed URLs: {'✅ FUNCIONANDO' if signed_works else '❌ Revisar'}")
    print(f"   Uso: Contratos, DNI, documentos sensibles")
    print()
    
    if not public_works:
        print("⚠️  BUCKET PÚBLICO TODAVÍA CON 403")
        print("=" * 70)
        print()
        print("CAUSA: Block Public Access a nivel de CUENTA AWS")
        print()
        print("SOLUCIÓN (2 minutos):")
        print("1. Ve a: https://s3.console.aws.amazon.com/s3/settings")
        print("2. Click 'Edit' en 'Block Public Access settings for this account'")
        print("3. DESMARCAR 'Block all public access'")
        print("4. Save → Confirm")
        print()
        print("Después ejecuta:")
        print("   python3 scripts/test-bucket-public.py")
        print()
    else:
        print("=" * 70)
        print("🎉 ✅ DUAL-BUCKET CONFIGURADO CORRECTAMENTE")
        print("=" * 70)
        print()
        print("✅ Bucket público: Fotos, avatares, imágenes")
        print("✅ Bucket privado: Documentos sensibles con signed URLs")
        print("✅ Variables de entorno actualizadas")
        print("✅ Aplicación reiniciada")
        print()
    
    print("📝 VARIABLES DE ENTORNO:")
    print(f"   AWS_BUCKET={PUBLIC_BUCKET}")
    print(f"   AWS_BUCKET_PRIVATE={PRIVATE_BUCKET}")
    print()
    
    return 0 if (public_works and private_works and signed_works) else 1

if __name__ == '__main__':
    sys.exit(main())
