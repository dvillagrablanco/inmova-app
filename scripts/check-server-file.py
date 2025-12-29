#!/usr/bin/env python3
"""
Script para verificar el contenido de un archivo en el servidor
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
REMOTE_PATH = "/opt/inmova-app"

print("📄 Verificando archivo en el servidor...")
print(f"📡 Conectando a {SSH_HOST}...\n")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    
    # Ver líneas 435-450 del archivo
    cmd = f"cd {REMOTE_PATH} && sed -n '435,455p' lib/proactive-detection-service.ts"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    print("📋 Líneas 435-455 de lib/proactive-detection-service.ts:\n")
    for i, line in enumerate(stdout, start=435):
        print(f"{i:3d}| {line.rstrip()}")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
