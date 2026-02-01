#!/usr/bin/env python3
"""
Leer archivo de credenciales completo
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

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
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    
    try:
        # Buscar la sección con RSA key
        status, output = exec_cmd(client, f"grep -B5 -A30 'BEGIN RSA' {APP_PATH}/CREDENCIALES_ACCESO.md 2>/dev/null")
        if output:
            print("Contenido alrededor de RSA key:")
            print(output)
        else:
            print("No encontrado en CREDENCIALES_ACCESO.md")
        
        # Buscar en GUIA_RAPIDA_DOCUSIGN.md
        print("\n" + "=" * 50)
        status, output = exec_cmd(client, f"grep -B5 -A30 'BEGIN RSA' {APP_PATH}/GUIA_RAPIDA_DOCUSIGN.md 2>/dev/null")
        if output:
            print("Contenido en GUIA_RAPIDA_DOCUSIGN.md:")
            print(output)
        
        # Ver si hay un archivo privkey
        print("\n" + "=" * 50)
        status, output = exec_cmd(client, f"find {APP_PATH} -name '*privkey*' -o -name '*private_key*' 2>/dev/null | grep -v node_modules | head -10")
        if output.strip():
            print("Archivos de clave privada:")
            print(output)
            for f in output.strip().split('\n'):
                if f:
                    status, content = exec_cmd(client, f"cat '{f}' 2>/dev/null | head -10")
                    print(f"\nContenido de {f}:")
                    print(content)
        
        # Buscar en todos los archivos md las keys
        print("\n" + "=" * 50)
        status, output = exec_cmd(client, f"grep -l 'MIIEowIBAAK' {APP_PATH}/*.md {APP_PATH}/docs/*.md 2>/dev/null")
        if output.strip():
            print("Archivos con contenido de RSA key base64:")
            print(output)
            for f in output.strip().split('\n'):
                if f:
                    status, content = exec_cmd(client, f"grep 'MIIEowIBAAK' '{f}' 2>/dev/null")
                    print(f"\n{f}:")
                    print(content[:200] + "..." if len(content) > 200 else content)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
