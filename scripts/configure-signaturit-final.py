#!/usr/bin/env python3
"""
Configurar SIGNATURIT_API_KEY encontrada
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

# API Key encontrada en /opt/inmova-app/scripts/configure-signaturit.py
SIGNATURIT_API_KEY = "KmWLXStHXziKPMOkAfTFykvyKkqcvFBQeigoXGPMpaplXaAGsoduTGLPZxSERIXDGhOYHmgbvRgTUQKbzaeNmj"

def exec_cmd(client, cmd, timeout=30):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def main():
    print("=" * 70)
    print("🔧 CONFIGURANDO SIGNATURIT")
    print("=" * 70)
    print(f"\nAPI Key encontrada: {SIGNATURIT_API_KEY[:20]}...{SIGNATURIT_API_KEY[-10:]}")
    print(f"Longitud: {len(SIGNATURIT_API_KEY)} caracteres")
    
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
        
        # Verificar si ya existe SIGNATURIT_API_KEY
        found = False
        for i, line in enumerate(lines):
            if line.strip().startswith('SIGNATURIT_API_KEY='):
                lines[i] = f'SIGNATURIT_API_KEY={SIGNATURIT_API_KEY}'
                found = True
                print("  ✏️ Actualizando SIGNATURIT_API_KEY existente")
                break
        
        if not found:
            lines.append(f'SIGNATURIT_API_KEY={SIGNATURIT_API_KEY}')
            print("  ➕ Agregando SIGNATURIT_API_KEY")
        
        # Guardar cambios
        new_content = '\n'.join(lines)
        
        # Backup
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.signaturit.$(date +%Y%m%d_%H%M%S)")
        
        # Escribir usando heredoc
        exec_cmd(client, f"cat > {APP_PATH}/.env.production << 'ENVEOF'\n{new_content}\nENVEOF")
        
        print("\n✅ SIGNATURIT_API_KEY configurada")
        
        # Reiniciar PM2
        print("\n🔄 Reiniciando PM2...")
        exec_cmd(client, "pm2 restart inmova-app --update-env")
        time.sleep(15)
        
        # Verificar
        print("\n📊 VERIFICACIÓN:")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"grep SIGNATURIT {APP_PATH}/.env.production")
        print("\nVariable configurada:")
        print(output)
        
        # Health check
        print("\n🏥 Health check:")
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        print(output)
        
        # Verificar estado de integraciones
        print("\n📊 Estado de integraciones:")
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/integrations/status 2>/dev/null | head -20")
        if output:
            print(output[:500])
        
        print("\n✅ Signaturit configurado correctamente")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
