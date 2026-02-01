#!/usr/bin/env python3
"""
Obtener DocuSign Private Key del archivo CREDENCIALES_ACCESO.md
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import re
import time

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
    print("🔍 OBTENIENDO DOCUSIGN PRIVATE KEY")
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
        # Leer archivo CREDENCIALES_ACCESO.md
        print("📄 Leyendo CREDENCIALES_ACCESO.md...")
        status, output = exec_cmd(client, f"cat {APP_PATH}/CREDENCIALES_ACCESO.md 2>/dev/null")
        
        if output:
            print(f"  Archivo tiene {len(output)} caracteres")
            
            # Buscar la private key completa
            match = re.search(r'-----BEGIN RSA PRIVATE KEY-----[A-Za-z0-9+/=\s\n]+-----END RSA PRIVATE KEY-----', output, re.DOTALL)
            
            if match:
                private_key = match.group()
                print(f"\n✅ Private Key encontrada ({len(private_key)} caracteres)")
                print("\nPrimeras líneas:")
                lines = private_key.split('\n')
                for line in lines[:5]:
                    print(f"  {line}")
                print("  ...")
                for line in lines[-3:]:
                    print(f"  {line}")
                
                # Formatear la key para .env (reemplazar newlines con \n)
                key_for_env = private_key.replace('\n', '\\n')
                
                print(f"\n🔧 Configurando en .env.production...")
                
                # Leer .env.production
                status, env_content = exec_cmd(client, f"cat {APP_PATH}/.env.production")
                lines = env_content.strip().split('\n')
                
                # Verificar si ya existe DOCUSIGN_PRIVATE_KEY
                found = False
                for i, line in enumerate(lines):
                    if line.strip().startswith('DOCUSIGN_PRIVATE_KEY='):
                        lines[i] = f'DOCUSIGN_PRIVATE_KEY="{key_for_env}"'
                        found = True
                        print("  ✏️ Actualizada DOCUSIGN_PRIVATE_KEY existente")
                        break
                
                if not found:
                    lines.append(f'DOCUSIGN_PRIVATE_KEY="{key_for_env}"')
                    print("  ➕ Añadida DOCUSIGN_PRIVATE_KEY")
                
                # Guardar cambios
                new_content = '\n'.join(lines)
                exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.docusign_key.$(date +%Y%m%d_%H%M%S)")
                
                # Escribir usando archivo temporal para manejar caracteres especiales
                exec_cmd(client, f"cat > /tmp/env_update.txt << 'ENVEOF'\n{new_content}\nENVEOF")
                exec_cmd(client, f"cp /tmp/env_update.txt {APP_PATH}/.env.production")
                
                print("\n✅ Private Key configurada")
                
                # Reiniciar PM2
                print("\n🔄 Reiniciando PM2...")
                exec_cmd(client, "pm2 restart inmova-app --update-env")
                time.sleep(10)
                
                # Verificar
                print("\n📊 Verificando configuración...")
                status, output = exec_cmd(client, f"grep 'DOCUSIGN_PRIVATE_KEY' {APP_PATH}/.env.production | head -1")
                if 'BEGIN RSA PRIVATE KEY' in output:
                    print("✅ DOCUSIGN_PRIVATE_KEY configurada correctamente")
                else:
                    print("⚠️ Verificar configuración manual")
                
                return private_key
            else:
                print("\n⚠️ No se encontró Private Key completa en el archivo")
        else:
            print("\n⚠️ Archivo CREDENCIALES_ACCESO.md no encontrado o vacío")
        
        # Intentar otros archivos
        print("\n🔍 Buscando en GUIA_RAPIDA_DOCUSIGN.md...")
        status, output = exec_cmd(client, f"cat {APP_PATH}/GUIA_RAPIDA_DOCUSIGN.md 2>/dev/null")
        
        if output:
            match = re.search(r'-----BEGIN RSA PRIVATE KEY-----[A-Za-z0-9+/=\s\n]+-----END RSA PRIVATE KEY-----', output, re.DOTALL)
            if match:
                print(f"\n✅ Private Key encontrada en GUIA_RAPIDA_DOCUSIGN.md ({len(match.group())} chars)")
                return match.group()
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
