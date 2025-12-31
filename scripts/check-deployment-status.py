#!/usr/bin/env python3
"""
Script para verificar el estado del deployment
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"

print("🔍 Verificando estado del deployment...")
print(f"📡 Conectando a {SSH_HOST}...")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    print("✅ Conectado\n")
    
    # Ver procesos de Docker
    print("📦 Procesos de Docker:")
    stdin, stdout, stderr = ssh.exec_command("ps aux | grep docker | grep -v grep | head -5")
    for line in stdout:
        print(f"   {line.rstrip()}")
    
    # Ver contenedores
    print("\n🐳 Contenedores activos:")
    stdin, stdout, stderr = ssh.exec_command("docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
    for line in stdout:
        print(f"   {line.rstrip()}")
    
    # Ver logs recientes del build (si existe)
    print("\n📋 Últimas líneas del build (si está en progreso):")
    stdin, stdout, stderr = ssh.exec_command("tail -20 /opt/inmova-app/build.log 2>/dev/null || echo 'No build log found'")
    for line in stdout:
        print(f"   {line.rstrip()}")
    
    # Verificar puerto 3000
    print("\n🔌 Verificando puerto 3000:")
    stdin, stdout, stderr = ssh.exec_command("netstat -tulpn | grep :3000 || echo 'Puerto 3000 no está en uso'")
    for line in stdout:
        print(f"   {line.rstrip()}")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("\n🔌 Conexión cerrada")
