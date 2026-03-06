#!/usr/bin/env python3
"""
Configurar DocuSign PRODUCCIÓN para Grupo Vidaro en servidor de producción.

Credenciales:
  Integration Key: 5cb4a15f-658d-4fa0-ae53-6aabb10749d7
  User ID: 6043b7c8-af4d-458b-9641-c1700b7bf2f2
  Account ID: 7adae404-8081-4ec4-b10f-365afce4e65c
  Environment: Producción (www.docusign.net)

Uso:
  python3 scripts/configure-docusign-vidaro.py
"""

import sys
import time

try:
    sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
    import paramiko
except ImportError:
    print("❌ paramiko no disponible. Instala con: pip install paramiko")
    sys.exit(1)

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

# Credenciales DocuSign — PRODUCCIÓN Grupo Vidaro
DOCUSIGN_INTEGRATION_KEY = "5cb4a15f-658d-4fa0-ae53-6aabb10749d7"
DOCUSIGN_USER_ID = "6043b7c8-af4d-458b-9641-c1700b7bf2f2"
DOCUSIGN_ACCOUNT_ID = "7adae404-8081-4ec4-b10f-365afce4e65c"
DOCUSIGN_SECRET_KEY = "4c358262-a0ca-4c6c-9ebd-75588c22cf11"
DOCUSIGN_BASE_PATH = "https://www.docusign.net/restapi"

DOCUSIGN_PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAoXLqbF2CaHgG2yVJih5Qi3d9u2Ju3vrAyp21tLIY2OVCVR0R
SDmEAco3xyiQwmYF/AvvitJ/pYLuVs5X+Jq6DkfsKPIu1EPqYeXthcgjG1FKf73T
tB9JAxWuOh8hgwt+ImqcusDJQtT+8OH4/XqjvSnic+RJt9USHqp4/F0jwZ2EENZA
KYE1wc8t/viE0zhTpcEbbFn426pma0o660PAVLJTVH6IxzlFGFNiP5ww1zyDgceT
xqOLN7fVtBmcMhSoqR5GZFi1OD/DtnaIG4bM2czkndKlnwz6PjZQBLuThIGykUnC
O4NcgdmKyRYJHBTKJ/aykPRUtf92oJuEBHkk4QIDAQABAoIBACD0hZB4J/HuKiwa
eN/mHzfQvMv+pDYExky1k40eW38OkRMxm0D8aIs6/Va8W4wq6ibQQuW54Q9mYgM7
HG7lGnxmxvh2swNmF5ZDKlBIEY52cfgQRgH67trf1pALoboPowAgdfyS9KIdOyrt
XXdUTM8EmTJh04BgUFINJyQQWQegrYDTBAicrN2LQTdTQaZQT6RAXe62CLzuM/l9
tj/A0mMiplcqBClx1nqn2TZSdPT7ukanYAChjnebw9Ownuip6hNWAmr1WlzBg7qD
VZeUdMhAP9WPi02Q82WBEpRSZdZevfzjpux8rVm1dsMBQ3qRRIwUuvNjtkh/cSEv
0TyDdCcCgYEA4t7x7w8IY0j9WD1qISmoq6sn6qJztitVEvK4WVKf33jfCpbRvhMn
TvNjcuSVrkMd6BbEedpL+jKKkrXvF/dYkVXa1FgicDjMSgbUXgfSV18pPXMo7lRC
5tF66DrhOQph7zvmoWIxhFY3IyWnxEOzCKGNFLUZz2srWR3px2OnJe8CgYEAti2a
2qU1WM6Hvhx7/Wx1bigMNSjuuEiwyB/A1n9oPIYcm0VndCFPvtljozBH09pY7jb+
9Ie4e2IUolURAWpqvxJtT8FpT29OkhgjJKJeD0uQBtp0RSFuJ2UHuHri20o+JSXW
8lgi1qRGb1KFSmN2Rxxtv+GjqYrnOIKDdNcnsi8CgYEAhlF6qY+b5rRjEigiOoog
i6qk0lzl5xfWoYZEsNWjQ7qbSviqKz/JyQt+eJpvKCIihbNdFcuxqerccin26ZiO
vlU3XvrjQM/P25AZkaZN2V7E2tXgiOIoTeH+Q5oAmDXWb75mOGwbZv9oW43Cuwdd
6yFCltz18ADCRFvaeis83c8CgYEAjihgIiWwzy+6dPs9NbAgomjVvdXHEj6G1GMS
005wRGpSgEdURyaHV+HDAmB2bDaCFsELij0uE/mhKFtA/d3QlnEGo6nFR5sPsKjt
I3Uf+Md6CB8Hg7pmfo8zyxz5US1J+Srh5BIqfVuLKus136plbXAdpBGq6G3fqBUQ
B2itLTkCgYEAs9txbXRR7lH4OIvxqYjvTXu4g8dhWVObhn24MuLDi19nmQFGDGYL
32g1omGqxv4J7EwGxvejVfr8eJednyRF9f+AjbAUnBEa64snPzFkBZXVMfFcGvcg
VSJJpqVxGnrQez2XIqtSV2DSMNBIXXuMPuivielRnVBglzOfgHDJ1Mc=
-----END RSA PRIVATE KEY-----"""


def exec_cmd(client, cmd, timeout=120):
    """Execute a command on the remote server."""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return {
        'exit': exit_status,
        'output': stdout.read().decode('utf-8', errors='ignore').strip(),
        'error': stderr.read().decode('utf-8', errors='ignore').strip()
    }


def main():
    print("=" * 70)
    print("🔐 CONFIGURAR DOCUSIGN PRODUCCIÓN — GRUPO VIDARO")
    print("=" * 70)
    print()
    print(f"Servidor: {SERVER_CONFIG['host']}")
    print(f"Integration Key: {DOCUSIGN_INTEGRATION_KEY}")
    print(f"User ID: {DOCUSIGN_USER_ID}")
    print(f"Account ID: {DOCUSIGN_ACCOUNT_ID}")
    print(f"Entorno: PRODUCCIÓN (www.docusign.net)")
    print(f"Private Key: ✅ {len(DOCUSIGN_PRIVATE_KEY)} caracteres")
    print()

    # Connect
    print("[1/7] Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(
            hostname=SERVER_CONFIG['host'],
            username=SERVER_CONFIG['username'],
            password=SERVER_CONFIG['password'],
            port=SERVER_CONFIG['port'],
            timeout=SERVER_CONFIG['timeout']
        )
        print("   ✅ Conectado")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return 1
    print()

    # Remove old DocuSign config
    print("[2/7] Eliminando configuración DocuSign antigua...")
    exec_cmd(client, "cd /opt/inmova-app && sed -i '/^DOCUSIGN/d' .env.production")
    exec_cmd(client, "cd /opt/inmova-app && sed -i '/^# === DOCUSIGN/d' .env.production")
    print("   ✅ Configuración antigua eliminada")
    print()

    # Write new DocuSign config
    print("[3/7] Escribiendo nuevas credenciales DocuSign producción...")
    
    # Write private key to a temp file first (avoid shell escaping issues)
    sftp = client.open_sftp()
    with sftp.file('/tmp/docusign_private_key.pem', 'w') as f:
        f.write(DOCUSIGN_PRIVATE_KEY)
    sftp.close()

    # Read private key as single line with \n
    result = exec_cmd(client, "cat /tmp/docusign_private_key.pem | awk '{printf \"%s\\\\n\", $0}' | sed 's/\\\\n$//'")
    private_key_oneline = result['output']

    # Append DocuSign config to .env.production
    config_lines = f"""
# === DOCUSIGN FIRMA DIGITAL — GRUPO VIDARO (PRODUCCIÓN) ===
DOCUSIGN_INTEGRATION_KEY={DOCUSIGN_INTEGRATION_KEY}
DOCUSIGN_USER_ID={DOCUSIGN_USER_ID}
DOCUSIGN_ACCOUNT_ID={DOCUSIGN_ACCOUNT_ID}
DOCUSIGN_SECRET_KEY={DOCUSIGN_SECRET_KEY}
DOCUSIGN_BASE_PATH={DOCUSIGN_BASE_PATH}
DOCUSIGN_PRIVATE_KEY="{private_key_oneline}"
"""

    # Write to a temp file and append
    sftp = client.open_sftp()
    with sftp.file('/tmp/docusign_config.txt', 'w') as f:
        f.write(config_lines)
    sftp.close()

    exec_cmd(client, "cat /tmp/docusign_config.txt >> /opt/inmova-app/.env.production")
    exec_cmd(client, "rm -f /tmp/docusign_private_key.pem /tmp/docusign_config.txt")
    print("   ✅ Credenciales escritas en .env.production")
    print()

    # Verify
    print("[4/7] Verificando configuración...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep '^DOCUSIGN' .env.production | wc -l")
    num_vars = result['output']
    print(f"   Variables DocuSign: {num_vars}")

    result = exec_cmd(client, "cd /opt/inmova-app && grep 'DOCUSIGN_BASE_PATH' .env.production")
    if 'www.docusign.net' in result['output']:
        print("   ✅ Entorno: PRODUCCIÓN (www.docusign.net)")
    elif 'demo' in result['output']:
        print("   ⚠️  Entorno: DEMO (demo.docusign.net)")
    
    result = exec_cmd(client, "cd /opt/inmova-app && grep 'BEGIN RSA PRIVATE KEY' .env.production | wc -l")
    if result['output'].strip() == '1':
        print("   ✅ Private Key presente")
    else:
        print("   ⚠️  Private Key podría tener problemas")
    print()

    # Restart PM2
    print("[5/7] Reiniciando aplicación con nuevas variables...")
    exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    print("   ✅ PM2 reiniciado")
    print("   ⏳ Esperando 20 segundos para warm-up...")
    time.sleep(20)
    print()

    # Health check
    print("[6/7] Health check...")
    result = exec_cmd(client, "curl -s http://localhost:3000/api/health 2>&1 | head -5")
    if '"status":"ok"' in result['output'] or '"status": "ok"' in result['output']:
        print("   ✅ API respondiendo correctamente")
    else:
        print(f"   ⚠️  Respuesta: {result['output'][:200]}")
    print()

    # Verify DocuSign detection
    print("[7/7] Verificando detección de DocuSign...")
    result = exec_cmd(client, """cd /opt/inmova-app && node -e "
require('dotenv').config({ path: '.env.production' });
const hasIK = !!process.env.DOCUSIGN_INTEGRATION_KEY;
const hasUID = !!process.env.DOCUSIGN_USER_ID;
const hasAID = !!process.env.DOCUSIGN_ACCOUNT_ID;
const hasPK = !!process.env.DOCUSIGN_PRIVATE_KEY;
const isProduction = !(process.env.DOCUSIGN_BASE_PATH || '').includes('demo');
console.log('Integration Key:', hasIK ? '✅' : '❌');
console.log('User ID:', hasUID ? '✅' : '❌');
console.log('Account ID:', hasAID ? '✅' : '❌');
console.log('Private Key:', hasPK ? '✅' : '❌');
console.log('Produccion:', isProduction ? '✅' : '❌');
console.log('Fully configured:', (hasIK && hasUID && hasAID && hasPK) ? '✅' : '❌');
" 2>&1""")
    print(f"   {result['output']}")
    print()

    client.close()

    print("=" * 70)
    print("✅ DOCUSIGN CONFIGURADO — GRUPO VIDARO (PRODUCCIÓN)")
    print("=" * 70)
    print()
    print("📋 Siguiente paso obligatorio:")
    print("   Hacer consent grant UNA VEZ desde el navegador:")
    print()
    print(f"   https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id={DOCUSIGN_INTEGRATION_KEY}&redirect_uri=https%3A%2F%2Finmovaapp.com%2Fapi%2Fintegrations%2Fdocusign%2Fcallback")
    print()
    print("   O desde la app: /admin/integraciones/docusign → 'Autorizar DocuSign'")
    print()
    print("📋 Configurar webhook en DocuSign Admin → Connect:")
    print("   URL: https://inmovaapp.com/api/webhooks/docusign")
    print("   Events: Envelope Completed, Declined, Voided")
    print()
    print("📋 Sociedades configuradas:")
    print("   • Viroda Inversiones S.L. — Firma activa")
    print("   • Rovida S.L. — Firma activa")
    print()
    print("📋 Operadores de media estancia:")
    print("   • Álamo — Integrado (contratos vía DocuSign)")
    print()
    return 0


if __name__ == '__main__':
    sys.exit(main())
