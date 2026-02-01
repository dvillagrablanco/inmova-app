#!/usr/bin/env python3
"""
Configurar credenciales de Twilio
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

# Credenciales de Twilio proporcionadas por el usuario
# NOTA: Credenciales configuradas directamente en el servidor
# No incluir valores reales en el repositorio
TWILIO_CREDENTIALS = {
    "TWILIO_ACCOUNT_SID": "",  # Configurado en servidor
    "TWILIO_AUTH_TOKEN": "",   # Configurado en servidor
}

def exec_cmd(client, cmd, timeout=30):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def main():
    print("=" * 70)
    print("🔧 CONFIGURANDO TWILIO")
    print("=" * 70)
    print("\nCredenciales proporcionadas:")
    print(f"  • TWILIO_ACCOUNT_SID={TWILIO_CREDENTIALS['TWILIO_ACCOUNT_SID']}")
    print(f"  • TWILIO_AUTH_TOKEN={TWILIO_CREDENTIALS['TWILIO_AUTH_TOKEN'][:8]}...")
    
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
        
        # Agregar/actualizar credenciales de Twilio
        print("\n➕ Configurando credenciales de Twilio...")
        
        for key, value in TWILIO_CREDENTIALS.items():
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
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.twilio.$(date +%Y%m%d_%H%M%S)")
        
        # Escribir usando heredoc
        exec_cmd(client, f"cat > {APP_PATH}/.env.production << 'ENVEOF'\n{new_content}\nENVEOF")
        
        print("\n✅ Credenciales de Twilio configuradas")
        
        # Reiniciar PM2
        print("\n🔄 Reiniciando PM2...")
        exec_cmd(client, "pm2 restart inmova-app --update-env")
        time.sleep(10)
        
        # Verificar estado
        print("\n📊 VERIFICACIÓN:")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep TWILIO")
        print("\nVariables Twilio configuradas:")
        print(output)
        
        # Health check
        print("\n🏥 Health check:")
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        print(output)
        
        print("\n✅ Twilio configurado correctamente")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
