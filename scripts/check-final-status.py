#!/usr/bin/env python3
import paramiko, sys, time

HOST, USER, PASS = "157.180.119.236", "root", "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n📋 VERIFICACIÓN FINAL\n")
    
    print("1️⃣  Log de deployment (últimas 80 líneas):")
    print("="*80)
    _, out, _ = ssh.exec_command("tail -80 /tmp/deploy-new.log 2>/dev/null")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n2️⃣  Contenedores activos:")
    print("="*80)
    _, out, _ = ssh.exec_command("docker ps -a | grep inmova")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n3️⃣  Procesos Docker activos:")
    _, out, _ = ssh.exec_command("ps aux | grep 'docker\\|deploy' | head -10")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n4️⃣  ¿Hay errores en el build?")
    _, out, _ = ssh.exec_command("grep -i 'error\\|failed\\|cannot' /tmp/deploy-new.log 2>/dev/null | tail -20")
    out.channel.recv_exit_status()
    errors = out.read().decode('utf-8')
    if errors.strip():
        print(errors)
    else:
        print("✅ No se encontraron errores obvios")
    
finally:
    ssh.close()
