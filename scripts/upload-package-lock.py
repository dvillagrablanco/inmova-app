#!/usr/bin/env python3
"""
Script para subir package-lock.json actualizado al servidor
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
REMOTE_PATH = "/opt/inmova-app"

print("📤 Subiendo package-lock.json actualizado al servidor...")
print(f"📡 Conectando a {SSH_HOST}...")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    print("✅ Conectado")
    
    # Subir package-lock.json
    print("\n📦 Subiendo package-lock.json...")
    sftp = ssh.open_sftp()
    
    local_file = "/workspace/package-lock.json"
    remote_file = f"{REMOTE_PATH}/package-lock.json"
    
    sftp.put(local_file, remote_file)
    print(f"✅ Archivo subido: {remote_file}")
    
    sftp.close()
    
    # Commit y push (ahora con el archivo correcto)
    print("\n📤 Commiteando cambios...")
    commands = [
        f"cd {REMOTE_PATH}",
        "git config user.email 'deploy@inmovaapp.com'",
        "git config user.name 'Deploy Bot'",
        "git add package-lock.json",
        'git diff --cached --exit-code || git commit -m "fix: Actualizar package-lock.json con dependencias sincronizadas"'
    ]
    cmd = " && ".join(commands)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    for line in stdout:
        print(f"   {line.rstrip()}")
    
    print("\n✅ package-lock.json actualizado en el servidor")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("\n🔌 Conexión cerrada")
