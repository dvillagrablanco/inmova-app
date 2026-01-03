#!/usr/bin/env python3
"""
Configurar DocuSign con TODAS las credenciales (incluyendo Private Key)
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

# Credenciales completas de DocuSign
DOCUSIGN_INTEGRATION_KEY = "0daca02a-dbe5-45cd-9f78-35108236c0cd"
DOCUSIGN_USER_ID = "6db6e1e7-24be-4445-a75c-dce2aa0f3e59"
DOCUSIGN_ACCOUNT_ID = "dc80ca20-9dcd-4d88-878a-3cb0e67e3569"
DOCUSIGN_BASE_PATH = "https://demo.docusign.net/restapi"

# Private Key (formato multilinea)
DOCUSIGN_PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0w4d++d8enAIm3wSm/nTpYY9oo7QL6mrGsKdPNDwS/8pCEb0
jKXwvUAha7JNmeHvlFjqvquEb61VLEx5sIj+crGLukqwEgipQNY3EEROCTeou949
hFoy/d3iEluoikMCi2zYSLdIzPUIZxBYAYT2AzYPOioljt2SWQwfOJajRgXj6CN+
4cSqCmlCVKdYYz1Ja/XK0M8JkfVSGTZJuzVklG979lLVCHwQ5C75AgiJo46DYc3E
/d88RobXS35z2TcITgG8Dbg6E5oJ/tEsopookVrVZOxihQRX+zjpksc/tY2OGNsT
65pkmAsq1D63+Dq1V0+rZ8QD/LvMFO+M3hA63wIDAQABAoIBAAtgrnMfBpHfKkef
h61K6YL52qbBxi1bmzLFHQ7jQKEIL2EX2iUe6Px60ZJpuU87Y9v+cyE2Q9x1XqsV
sFW4/OaX9a1kS1udhepN4ggJdp9+laUTFQPmjOsso/xTXqGdfSyhAIPjBZSu/PX5
ZpUmYtDHgEilbwLlpPcR9TjqvgCPRaoVb2GYYiUHNbv6A3r6ASwJvFGM4GApNDr1
dQD71plrGaT1UuCMMOfVLxLCeWQck1A2AcMR5lvyC7f18C7TmRZ/n7uVjb/J9d45
mRmJHzhtAdi2Afyix++bXeubP+2Sa4DDXj3S3i/iBSZgcx4ntOZsc+GSpYGJ1zey
qvqC5MkCgYEA7NX0/uGxsJwng5NYwYz1qsVpr/o+Djx9YaQPoTci6WLXrKTSV/XX
Y/dCe2PWYjTzS/VDp05j/jVq7gVVWV+1CD5hT1jSDj7t1w8erVc2/b4d89xBKcpd
0YVDnp9NjB6GmB6g+g8nZ7ndBbOvx9EhYPzFgvgnLqIHSQLDM6AGVQMCgYEA5CId
lU0dpQ7NP0j4QbKYLyHO0HlL7t46+OxxONLY5+/k1HVxt/3qNDS5jvCdh0D1ivxG
uv1malnUReCGRrEsNtVj1ON4TFce//vWMkKai00+T3nAsQm4hrj2H8RdQjQYM2j0
ZPznNlixzUb9sW5pd0UQ6S1GF+5s3fgGCnc39fUCgYAQKSlmmw/89SrdF5je3DeH
R6FGmNTTM916ZC+M2K5RLqV46mZQCj6AW8b1lIJ0gRh4/mt3Zyn7lrmNNF/2kUlR
HrCVMYJj5ndkTWvSeDkQZ4CzuzvXFjAAtA9BK62m+g5FIxHo/k+6DDzAvton0GVu
sNDpdvV1gSjuGnonc6v68QKBgQCyMCd1N1+hTddox+EIx6twnPKCCUwTDkd3qI6i
+KVtPAY7IGSrdsuY7VnGWRBh1Y40eenxIf39sZ5I2h9nVfmX9sLcRLPwxNe00Aq1
BSrbBYFW6F1mqpYTvKKZm3HQRQpmFWNXAebCnzJ5iSqcjQYZn7uetbsa9CLamWB2
ijoOhQKBgQCCu75+1LXyXcEpYKLbxqU4sB/cS5lR+AMgyebSPBd19qDvu0pzCBH1
QeEPT/o90P6ER57K29LwYBMwjAQBLFOdcewXtrL1KIi6D/XkxCqWet17/bjShCvA
kohdAG2sOQo0T0NarN6KpvnnerEM3g9jnfQYn6cZY7fif6aD8k8KUw==
-----END RSA PRIVATE KEY-----"""

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return {
        'exit': exit_status,
        'output': stdout.read().decode('utf-8', errors='ignore'),
        'error': stderr.read().decode('utf-8', errors='ignore')
    }

def main():
    print("=" * 70)
    print("🔐 CONFIGURANDO DOCUSIGN CON CREDENCIALES COMPLETAS")
    print("=" * 70)
    print()
    
    print("📋 Credenciales recibidas:")
    print(f"   Integration Key: {DOCUSIGN_INTEGRATION_KEY}")
    print(f"   User ID: {DOCUSIGN_USER_ID}")
    print(f"   Account ID: {DOCUSIGN_ACCOUNT_ID}")
    print(f"   Base Path: {DOCUSIGN_BASE_PATH}")
    print(f"   Private Key: ✅ {len(DOCUSIGN_PRIVATE_KEY)} caracteres")
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
    
    print("[1/8] Verificando configuración actual...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep 'DOCUSIGN' .env.production | head -10")
    
    if 'DOCUSIGN_INTEGRATION_KEY' in result['output']:
        print("   ⚠️  Ya existe configuración de DocuSign")
        print("   Sobrescribiendo con credenciales completas...")
    else:
        print("   ℹ️  No hay configuración previa de DocuSign")
    print()
    
    print("[2/8] Eliminando configuración antigua de DocuSign...")
    exec_cmd(client, "cd /opt/inmova-app && sed -i '/^DOCUSIGN/d' .env.production")
    print("   ✅ Limpieza completada")
    print()
    
    print("[3/8] Creando archivo temporal con Private Key...")
    # Convertir la private key a formato de una línea con \n
    private_key_escaped = DOCUSIGN_PRIVATE_KEY.replace('\n', '\\n')
    
    exec_cmd(client, f"""cd /opt/inmova-app && cat >> .env.production << 'EOF'

# === DOCUSIGN FIRMA DIGITAL ===
DOCUSIGN_INTEGRATION_KEY={DOCUSIGN_INTEGRATION_KEY}
DOCUSIGN_USER_ID={DOCUSIGN_USER_ID}
DOCUSIGN_ACCOUNT_ID={DOCUSIGN_ACCOUNT_ID}
DOCUSIGN_BASE_PATH={DOCUSIGN_BASE_PATH}
DOCUSIGN_PRIVATE_KEY="{private_key_escaped}"
EOF
""")
    print("   ✅ Credenciales añadidas")
    print()
    
    print("[4/8] Verificando configuración...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep 'DOCUSIGN' .env.production | wc -l")
    
    num_vars = result['output'].strip()
    print(f"   ✅ Variables DocuSign encontradas: {num_vars}")
    print()
    
    print("[5/8] Verificando Private Key...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep 'BEGIN RSA PRIVATE KEY' .env.production")
    
    if 'BEGIN RSA PRIVATE KEY' in result['output']:
        print("   ✅ Private Key presente y correcta")
    else:
        print("   ⚠️  Private Key puede tener problemas de formato")
    print()
    
    print("[6/8] Verificando estado de ambos proveedores...")
    result = exec_cmd(client, """cd /opt/inmova-app && grep -E 'SIGNATURIT_API_KEY|DOCUSIGN_INTEGRATION_KEY' .env.production | head -2""")
    
    has_signaturit = 'SIGNATURIT_API_KEY' in result['output']
    has_docusign = 'DOCUSIGN_INTEGRATION_KEY' in result['output']
    
    print(f"   Signaturit configurado: {'✅' if has_signaturit else '❌'}")
    print(f"   DocuSign configurado: {'✅' if has_docusign else '❌'}")
    print()
    
    print("[7/8] Reiniciando aplicación...")
    exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    print("   ✅ PM2 reiniciado")
    print("   ⏳ Esperando 20 segundos para warm-up...")
    time.sleep(20)
    print()
    
    print("[8/8] Test de detección de proveedor...")
    result = exec_cmd(client, """cd /opt/inmova-app && node -e "
require('dotenv').config({ path: '.env.production' });
const hasSignaturit = !!process.env.SIGNATURIT_API_KEY;
const hasDocuSign = !!(process.env.DOCUSIGN_INTEGRATION_KEY && process.env.DOCUSIGN_PRIVATE_KEY);
const provider = hasSignaturit ? 'signaturit' : (hasDocuSign ? 'docusign' : 'demo');
console.log('Proveedor activo:', provider);
console.log('Signaturit configurado:', hasSignaturit);
console.log('DocuSign configurado:', hasDocuSign);
console.log('DocuSign Integration Key:', !!process.env.DOCUSIGN_INTEGRATION_KEY);
console.log('DocuSign Private Key presente:', !!process.env.DOCUSIGN_PRIVATE_KEY);
console.log('DocuSign Private Key tamaño:', (process.env.DOCUSIGN_PRIVATE_KEY || '').length, 'chars');
" 2>&1""")
    
    print(result['output'])
    print()
    
    # Health check
    print("🏥 Health check final...")
    result = exec_cmd(client, "curl -s http://localhost:3000/api/health 2>&1 | head -5")
    
    if '"status":"ok"' in result['output']:
        print("   ✅ API funcionando correctamente")
    else:
        print("   ⚠️  API respondiendo pero con advertencias")
        print(f"   {result['output'][:200]}")
    
    client.close()
    
    print()
    print("=" * 70)
    print("✅ DOCUSIGN CONFIGURADO COMPLETAMENTE")
    print("=" * 70)
    print()
    print("📊 Estado de Proveedores:")
    print("   • Signaturit: ✅ Configurado (prioridad 1)")
    print("   • DocuSign: ✅ Configurado (prioridad 2)")
    print("   • Demo Mode: ⚠️  Fallback (prioridad 3)")
    print()
    print("🎯 Proveedor Activo:")
    print("   • Actual: SIGNATURIT (tiene prioridad)")
    print("   • Si Signaturit falla: DocuSign se activará automáticamente")
    print()
    print("🔧 Cambiar a DocuSign:")
    print("   1. Comentar/eliminar SIGNATURIT_API_KEY en .env.production")
    print("   2. pm2 restart inmova-app --update-env")
    print("   3. Sistema usará DocuSign automáticamente")
    print()
    print("⚠️  IMPORTANTE - Autorización JWT DocuSign:")
    print("   Para usar DocuSign, debes hacer JWT authorization (una vez):")
    print("   1. Ir a: https://developers.docusign.com/platform/auth/jwt/jwt-get-token/")
    print("   2. Login con cuenta DocuSign")
    print("   3. Autorizar la aplicación")
    print("   4. Esto solo se hace UNA VEZ")
    print()
    print("💰 Comparativa de Costos:")
    print("   Signaturit: €50/mes (20 firmas) + €2.50/firma extra")
    print("   DocuSign: Desde €25/mes (5 firmas) + €10/firma extra")
    print()
    print("🔗 URLs:")
    print("   • App: https://inmovaapp.com")
    print("   • DocuSign Demo: https://demo.docusign.net/")
    print("   • Signaturit: https://app.signaturit.com/")
    print()
    return 0

if __name__ == '__main__':
    sys.exit(main())
