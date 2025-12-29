#!/usr/bin/env python3
"""
Script para regenerar package-lock.json en el servidor
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
REMOTE_PATH = "/opt/inmova-app"

print("🔧 Regenerando package-lock.json en el servidor...")
print(f"📡 Conectando a {SSH_HOST}...")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    print("✅ Conectado")
    
    # Regenerar package-lock.json
    print("\n📦 Regenerando package-lock.json...")
    cmd = f"cd {REMOTE_PATH} && rm -f package-lock.json && npm install"
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    
    # Mostrar output
    for line in stdout:
        print(f"   {line.rstrip()}")
    
    # Verificar exit code
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("\n✅ package-lock.json regenerado exitosamente")
        
        # Commit y push
        print("\n📤 Commiteando cambios...")
        commands = [
            f"cd {REMOTE_PATH}",
            "git config user.email 'deploy@inmovaapp.com'",
            "git config user.name 'Deploy Bot'",
            "git add package-lock.json",
            'git commit -m "fix: Regenerar package-lock.json con dependencias actualizadas"',
            "git push origin main"
        ]
        cmd = " && ".join(commands)
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        for line in stdout:
            print(f"   {line.rstrip()}")
        
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print("\n✅ Cambios pusheados a GitHub")
        else:
            print("\n⚠️  Error al pushear cambios")
            error = stderr.read().decode('utf-8')
            if error:
                print(f"Error: {error}")
    else:
        print("\n❌ Error regenerando package-lock.json")
        error = stderr.read().decode('utf-8')
        print(f"Error: {error}")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("\n🔌 Conexión cerrada")
