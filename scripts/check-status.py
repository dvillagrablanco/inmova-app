#!/usr/bin/env python3
import paramiko

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n🔍 VERIFICACIÓN DE ESTADO\n")
    
    # Check containers
    print("1️⃣  Contenedores Docker:")
    _, out, _ = ssh.exec_command("docker ps -a | grep -E 'inmova|postgres|redis'")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # Check if any container is running
    print("\n2️⃣  HTTP Test:")
    _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000 2>&1 | head -5")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    if result.strip():
        print(result)
    else:
        print("❌ No respuesta")
    
    # Check ports
    print("\n3️⃣  Puertos en uso:")
    _, out, _ = ssh.exec_command("netstat -tulpn | grep ':3000\\|:5432\\|:6379' | head -5")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # Check docker-compose file
    print("\n4️⃣  Docker compose file:")
    _, out, _ = ssh.exec_command("ls -la /opt/inmova-app/docker-compose* 2>&1 | head -5")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
finally:
    ssh.close()
