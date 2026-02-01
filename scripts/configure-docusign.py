#!/usr/bin/env python3
"""
Configurar credenciales de DocuSign encontradas en documentación
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# Credenciales de DocuSign encontradas en /opt/inmova-app/docs/DOCUSIGN_JWT_AUTH_GUIDE.md
DOCUSIGN_CREDENTIALS = {
    "DOCUSIGN_INTEGRATION_KEY": "0daca02a-dbe5-45cd-9f78-35108236c0cd",
    "DOCUSIGN_USER_ID": "6db6e1e7-24be-4445-a75c-dce2aa0f3e59",
    "DOCUSIGN_ACCOUNT_ID": "dc80ca20-9dcd-4d88-878a-3cb0e67e3569",
    "DOCUSIGN_BASE_PATH": "https://demo.docusign.net/restapi",
}

def exec_cmd(client, cmd, timeout=30):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def main():
    print("=" * 70)
    print("🔧 CONFIGURANDO DOCUSIGN")
    print("=" * 70)
    print("\nCredenciales encontradas en docs/DOCUSIGN_JWT_AUTH_GUIDE.md:")
    for key, value in DOCUSIGN_CREDENTIALS.items():
        display = value[:20] + "..." if len(value) > 20 else value
        print(f"  • {key}={display}")
    
    # Conectar
    print("\n🔐 Conectando...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    try:
        # Leer .env.production actual
        print("📄 Leyendo .env.production...")
        status, env_content = exec_cmd(client, f"cat {APP_PATH}/.env.production")
        
        lines = env_content.strip().split('\n')
        
        # Agregar credenciales de DocuSign
        print("\n➕ Agregando credenciales de DocuSign...")
        
        for key, value in DOCUSIGN_CREDENTIALS.items():
            # Verificar si ya existe
            found = False
            for i, line in enumerate(lines):
                if line.strip().startswith(key + '='):
                    lines[i] = f'{key}={value}'
                    print(f"  ✏️ Actualizado: {key}")
                    found = True
                    break
            
            if not found:
                lines.append(f'{key}={value}')
                print(f"  ➕ Agregado: {key}")
        
        # Guardar cambios
        new_content = '\n'.join(lines)
        
        # Backup
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.docusign.$(date +%Y%m%d_%H%M%S)")
        
        # Escribir usando heredoc
        exec_cmd(client, f"cat > {APP_PATH}/.env.production << 'ENVEOF'\n{new_content}\nENVEOF")
        
        print("\n✅ Credenciales de DocuSign configuradas")
        
        # Reiniciar PM2
        print("\n🔄 Reiniciando PM2...")
        exec_cmd(client, "pm2 restart inmova-app --update-env")
        time.sleep(10)
        
        # Verificar estado
        print("\n📊 ESTADO FINAL DE INTEGRACIONES:")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep -E '(DOCUSIGN|TWILIO|SIGNATURIT|SENTRY)'")
        print(output)
        
        # Health check
        print("\n🏥 Health check:")
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        print(output)
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
