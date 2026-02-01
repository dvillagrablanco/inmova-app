#!/usr/bin/env python3
"""
Buscar DocuSign Private Key
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import re

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def main():
    print("=" * 70)
    print("🔍 BUSCANDO DOCUSIGN PRIVATE KEY")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    try:
        # Buscar en archivos de documentación
        print("🔍 Buscando en documentación...")
        
        # Leer el archivo de guía de DocuSign
        status, output = exec_cmd(client, f"cat {APP_PATH}/docs/DOCUSIGN_JWT_AUTH_GUIDE.md 2>/dev/null")
        
        if output:
            # Buscar la sección de private key
            if 'PRIVATE KEY' in output:
                print("\n✅ Encontrada referencia a Private Key en documentación")
                
                # Extraer la key si está completa
                match = re.search(r'-----BEGIN RSA PRIVATE KEY-----[^-]+-----END RSA PRIVATE KEY-----', output, re.DOTALL)
                if match:
                    key = match.group()
                    print(f"\n✅ Private Key encontrada ({len(key)} caracteres)")
                    print(key[:100] + "...")
        
        # Buscar en otros lugares
        print("\n🔍 Buscando en backups y otros archivos...")
        
        status, output = exec_cmd(client, "grep -r 'BEGIN RSA PRIVATE KEY' /opt/inmova-app /root --include='*.env*' --include='*.md' --include='*.pem' --include='*.key' 2>/dev/null | head -20")
        if output:
            print(output[:1000])
        
        # Buscar archivos .pem de DocuSign
        print("\n🔍 Buscando archivos .pem de DocuSign...")
        status, output = exec_cmd(client, "find /opt /root /home -name '*docusign*.pem' -o -name '*private*.pem' 2>/dev/null | grep -v node_modules | head -10")
        if output.strip():
            print(output)
            for f in output.strip().split('\n'):
                if f:
                    print(f"\n📄 Contenido de {f}:")
                    status, content = exec_cmd(client, f"cat '{f}' 2>/dev/null")
                    print(content[:500] if content else "  (vacío)")
        
        # Buscar en backups de env
        print("\n🔍 Buscando en backups de .env...")
        status, output = exec_cmd(client, f"ls -la {APP_PATH}/.env*.backup* 2>/dev/null | head -10")
        if output:
            print(output)
        
        # Verificar documentación específica
        print("\n🔍 Verificando si existe archivo de instrucciones...")
        status, output = exec_cmd(client, "cat /opt/inmova-app/docs/DOCUSIGN_JWT_AUTH_GUIDE.md 2>/dev/null | grep -A 50 'DOCUSIGN_PRIVATE_KEY' | head -60")
        if output:
            print("\nSección de DOCUSIGN_PRIVATE_KEY en guía:")
            print(output[:1500])
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
