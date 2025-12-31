#!/usr/bin/env python3
import paramiko

HOST, USER, PASS = "157.180.119.236", "root", "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n🔍 Inspecting WORKING old container...\n")
    
    # Find old working container
    print("1️⃣  Finding old containers...")
    _, out, _ = ssh.exec_command("docker ps -a | grep inmova")
    out.channel.recv_exit_status()
    containers = out.read().decode('utf-8')
    print(containers)
    
    # Get the old container ID
    old_container_id = "1029990b6d12"  # From earlier logs
    
    print(f"\n2️⃣  Checking structure of old container {old_container_id}...")
    _, out, _ = ssh.exec_command(f"docker exec {old_container_id} ls -la / 2>&1 | head -30")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print(f"\n3️⃣  Looking for server.js in old container...")
    _, out, _ = ssh.exec_command(f"docker exec {old_container_id} find / -name 'server.js' 2>/dev/null")
    out.channel.recv_exit_status()
    server_js_path = out.read().decode('utf-8')
    print(server_js_path if server_js_path.strip() else "❌ server.js not found")
    
    print(f"\n4️⃣  Checking app directory structure...")
    _, out, _ = ssh.exec_command(f"docker exec {old_container_id} ls -la /app 2>&1")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print(f"\n5️⃣  What command is running in old container?...")
    _, out, _ = ssh.exec_command(f"docker inspect {old_container_id} --format='{{{{json .Config.Cmd}}}}'")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
finally:
    ssh.close()
