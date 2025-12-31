#!/usr/bin/env python3
import paramiko, sys

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n🔍 DEBUGGING NEXT.JS STANDALONE BUILD\n")
    
    # Check if .next/standalone exists in source
    print("1️⃣  Checking build output in source...")
    _, out, _ = ssh.exec_command("ls -la /opt/inmova-app/.next/standalone/ 2>&1 | head -20")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    print(result)
    
    if 'server.js' in result:
        print("\n✅ server.js EXISTS in build output!\n")
    else:
        print("\n❌ server.js NOT FOUND in build output\n")
        print("Checking if .next/standalone directory exists...")
        _, out, _ = ssh.exec_command("ls -la /opt/inmova-app/.next/ 2>&1")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8'))
    
    # Check next.config.js
    print("\n2️⃣  Checking next.config.js output setting...")
    _, out, _ = ssh.exec_command("grep -A 3 'output:' /opt/inmova-app/next.config.js")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # Try building manually
    print("\n3️⃣  Running manual build to see errors...")
    _, out, _ = ssh.exec_command("cd /opt/inmova-app && NODE_ENV=production npm run build 2>&1 | grep -E 'standalone|server.js|output|Error|Warning' | head -30")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n4️⃣  Checking package.json build script...")
    _, out, _ = ssh.exec_command("grep '\"build\"' /opt/inmova-app/package.json")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
finally:
    ssh.close()
