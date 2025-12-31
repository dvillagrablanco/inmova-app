#!/usr/bin/env python3
"""
Script para sincronizar cambios del servidor al repositorio local
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
REMOTE_PATH = "/opt/inmova-app"

print("📥 Sincronizando cambios desde el servidor...")
print(f"📡 Conectando a {SSH_HOST}...")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    print("✅ Conectado")
    
    # Obtener el package-lock.json del servidor
    print("\n📦 Obteniendo package-lock.json del servidor...")
    sftp = ssh.open_sftp()
    
    remote_file = f"{REMOTE_PATH}/package-lock.json"
    local_file = "/workspace/package-lock.json"
    
    sftp.get(remote_file, local_file)
    print(f"✅ Archivo descargado: {local_file}")
    
    sftp.close()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("\n🔌 Conexión cerrada")
