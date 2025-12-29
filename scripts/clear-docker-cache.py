#!/usr/bin/env python3
"""
Script para limpiar el cache de Docker en el servidor
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"

print("🧹 Limpiando cache de Docker en el servidor...")
print(f"📡 Conectando a {SSH_HOST}...")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    print("✅ Conectado")
    
    # Limpiar cache de Docker
    print("\n🗑️  Limpiando cache de builder...")
    stdin, stdout, stderr = ssh.exec_command("docker builder prune --all --force")
    
    for line in stdout:
        print(f"   {line.rstrip()}")
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("\n✅ Cache de Docker limpiado")
    else:
        print("\n⚠️  Advertencia al limpiar cache")
        error = stderr.read().decode('utf-8')
        if error:
            print(f"Error: {error}")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("\n🔌 Conexión cerrada")
