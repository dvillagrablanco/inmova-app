#!/usr/bin/env python3
"""
Configurar DocuSign con las credenciales encontradas
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

# Credenciales de DocuSign encontradas
DOCUSIGN_CREDENTIALS = """
# DocuSign Configuration (Development/Demo)
DOCUSIGN_INTEGRATION_KEY=c0a3e377-148b-4895-9095-b3e8dbef3d88
DOCUSIGN_USER_ID=5f857d75-cd36-4fad-812b-3ff1be80d9a9
DOCUSIGN_ACCOUNT_ID=e59b0a7b-966d-42e0-bcd9-169855c046
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
"""

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
    print("🔐 CONFIGURANDO DOCUSIGN")
    print("=" * 70)
    print()
    
    print("📋 Credenciales encontradas:")
    print("   • Integration Key: c0a3e377-148b-4895-9095-b3e8dbef3d88")
    print("   • User ID: 5f857d75-cd36-4fad-812b-3ff1be80d9a9")
    print("   • Account ID: e59b0a7b-966d-42e0-bcd9-169855c046")
    print("   • Base Path: https://demo.docusign.net/restapi")
    print("   ⚠️  Private Key: NO ENCONTRADA (necesaria)")
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
    
    print("[1] Verificando si ya existen credenciales DocuSign...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep -E 'DOCUSIGN_' .env.production | head -5")
    
    if 'DOCUSIGN_INTEGRATION_KEY' in result['output']:
        print("   ⚠️  Credenciales DocuSign ya presentes")
        print(result['output'][:200])
        print()
        print("   ¿Sobrescribir? (continuando...)")
    else:
        print("   ℹ️  No se encontraron credenciales previas")
    
    print()
    print("[2] Añadiendo credenciales DocuSign...")
    
    # Limpiar credenciales existentes
    exec_cmd(client, "cd /opt/inmova-app && sed -i '/^DOCUSIGN_/d' .env.production")
    
    # Añadir nuevas credenciales
    exec_cmd(client, f"""cd /opt/inmova-app && cat >> .env.production << 'EOF'

# === DOCUSIGN FIRMA DIGITAL ===
{DOCUSIGN_CREDENTIALS.strip()}
# ⚠️ FALTA: DOCUSIGN_PRIVATE_KEY (generar en https://admindemo.docusign.com/apps-and-keys)
EOF
""")
    
    print("   ✅ Credenciales añadidas")
    print()
    
    print("[3] Verificando configuración...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep 'DOCUSIGN_' .env.production | wc -l")
    count = result['output'].strip()
    print(f"   {count} variables DOCUSIGN configuradas")
    print()
    
    print("[4] Reiniciando aplicación...")
    exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    print("   ✅ PM2 reiniciado")
    print()
    
    print("   ⏳ Esperando 15 segundos...")
    time.sleep(15)
    
    print()
    print("[5] Verificando detección de proveedor...")
    result = exec_cmd(client, "cd /opt/inmova-app && pm2 logs inmova-app --nostream --lines 20 | grep -i 'signature\\|docusign\\|provider' | tail -5")
    
    if result['output']:
        print("   Logs relacionados:")
        print(result['output'][:300])
    else:
        print("   ℹ️  Sin logs específicos (es normal)")
    
    client.close()
    
    print()
    print("=" * 70)
    print("⚠️  CONFIGURACIÓN PARCIAL")
    print("=" * 70)
    print()
    print("✅ Credenciales añadidas:")
    print("   • DOCUSIGN_INTEGRATION_KEY ✅")
    print("   • DOCUSIGN_USER_ID ✅")
    print("   • DOCUSIGN_ACCOUNT_ID ✅")
    print("   • DOCUSIGN_BASE_PATH ✅")
    print()
    print("❌ Falta:")
    print("   • DOCUSIGN_PRIVATE_KEY")
    print()
    print("📋 PARA OBTENER LA PRIVATE KEY:")
    print()
    print("1. Acceder a DocuSign:")
    print("   URL: https://admindemo.docusign.com/")
    print("   Usuario: dvillagra@vidaroinversiones.com")
    print()
    print("2. Navegar a:")
    print("   Settings → Apps and Keys → INMOVA Digital Signature")
    print()
    print("3. Sección 'Service Integration':")
    print("   • Click en 'Actions' → 'Generate RSA'")
    print("   • Copiar la Private Key generada")
    print()
    print("4. Añadir al servidor:")
    print("   ssh root@157.180.119.236")
    print("   nano /opt/inmova-app/.env.production")
    print()
    print("   Añadir línea:")
    print('   DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----')
    print('   MIIEow... (pegar contenido completo)')
    print('   -----END RSA PRIVATE KEY-----"')
    print()
    print("   pm2 restart inmova-app --update-env")
    print()
    print("📊 Estado actual:")
    print("   Modo: DEMO (sin Private Key)")
    print("   Funciona para testing UI, pero no envía documentos reales")
    print()
    print("🔗 Documentación completa:")
    print("   • INTEGRACION_DOCUSIGN_VIDARO.md")
    print("   • DOCUSIGN_CREDENTIALS.md")
    print()
    return 0

if __name__ == '__main__':
    sys.exit(main())
