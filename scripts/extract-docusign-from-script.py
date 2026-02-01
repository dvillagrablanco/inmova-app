#!/usr/bin/env python3
"""
Extraer DocuSign Private Key del script configure-docusign-complete.py
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
    print("🔍 EXTRAYENDO DOCUSIGN PRIVATE KEY DEL SCRIPT")
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
        # Leer el script configure-docusign-complete.py
        print("📄 Leyendo configure-docusign-complete.py...")
        status, content = exec_cmd(client, f"cat {APP_PATH}/scripts/configure-docusign-complete.py 2>/dev/null")
        
        if content:
            print(f"  Archivo tiene {len(content)} caracteres")
            
            # Buscar la Private Key en el script
            # El formato es: DOCUSIGN_PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----"""
            match = re.search(r'DOCUSIGN_PRIVATE_KEY\s*=\s*"""(-----BEGIN RSA PRIVATE KEY-----.*?-----END RSA PRIVATE KEY-----)"""', content, re.DOTALL)
            
            if match:
                private_key = match.group(1)
                print(f"\n✅ Private Key encontrada ({len(private_key)} caracteres)")
                
                # Mostrar primeras y últimas líneas
                lines = private_key.strip().split('\n')
                print(f"\n  Primeras líneas:")
                for line in lines[:4]:
                    print(f"    {line}")
                print("    ...")
                print(f"  Últimas líneas:")
                for line in lines[-3:]:
                    print(f"    {line}")
                
                # Configurar en .env.production
                print("\n🔧 Configurando en .env.production...")
                
                # Formatear para .env (escapar newlines)
                key_escaped = private_key.replace('\n', '\\n')
                
                # Leer .env.production actual
                status, env_content = exec_cmd(client, f"cat {APP_PATH}/.env.production")
                lines = env_content.strip().split('\n')
                
                # Filtrar cualquier DOCUSIGN_PRIVATE_KEY existente
                lines = [l for l in lines if not l.strip().startswith('DOCUSIGN_PRIVATE_KEY=')]
                
                # Añadir la nueva key
                lines.append(f'DOCUSIGN_PRIVATE_KEY="{key_escaped}"')
                
                # Guardar
                new_content = '\n'.join(lines)
                
                # Backup
                exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.docusign_key.$(date +%Y%m%d_%H%M%S)")
                
                # Escribir
                exec_cmd(client, f"cat > /tmp/env_new.txt << 'ENVEOF'\n{new_content}\nENVEOF")
                exec_cmd(client, f"cp /tmp/env_new.txt {APP_PATH}/.env.production")
                
                print("  ✅ DOCUSIGN_PRIVATE_KEY configurada")
                
                # Reiniciar PM2
                print("\n🔄 Reiniciando PM2...")
                exec_cmd(client, "pm2 restart inmova-app --update-env")
                time.sleep(15)
                
                # Verificar
                print("\n📊 Verificando configuración...")
                status, output = exec_cmd(client, f"grep 'DOCUSIGN_PRIVATE_KEY' {APP_PATH}/.env.production | wc -c")
                chars = int(output.strip()) if output.strip().isdigit() else 0
                
                if chars > 100:
                    print(f"  ✅ DOCUSIGN_PRIVATE_KEY configurada ({chars} caracteres en la línea)")
                else:
                    print("  ⚠️ Verificar configuración manualmente")
                
                # Health check
                print("\n🏥 Health check:")
                status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
                print(output)
                
                # Verificar todas las variables de DocuSign
                print("\n📋 Variables DocuSign configuradas:")
                status, output = exec_cmd(client, f"grep 'DOCUSIGN' {APP_PATH}/.env.production")
                for line in output.strip().split('\n'):
                    if '=' in line:
                        key = line.split('=')[0]
                        value = line.split('=')[1] if len(line.split('=')) > 1 else ''
                        if 'PRIVATE_KEY' in key:
                            print(f"  ✅ {key}=[{len(value)} chars]")
                        else:
                            display = value[:30] + "..." if len(value) > 30 else value
                            print(f"  ✅ {key}={display}")
                
                return True
            else:
                print("\n⚠️ No se encontró Private Key en el script")
                # Mostrar contenido relevante del script
                print("\nContenido del script relacionado con DOCUSIGN_PRIVATE_KEY:")
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if 'DOCUSIGN_PRIVATE_KEY' in line:
                        start = max(0, i-2)
                        end = min(len(lines), i+10)
                        for j in range(start, end):
                            print(f"  {j}: {lines[j][:100]}")
                        print()
        else:
            print("\n⚠️ No se pudo leer el archivo")
        
        return False
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
