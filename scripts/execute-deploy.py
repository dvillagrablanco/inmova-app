#!/usr/bin/env python3
import paramiko, sys, time

HOST, USER, PASS = "157.180.119.236", "root", "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("✅ Conectado\n")
    
    # Verificar que el script existe
    print("1️⃣  Verificando script de deployment...")
    _, out, _ = ssh.exec_command("ls -lh /opt/inmova-app/scripts/deploy-direct.sh")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # Ejecutar deployment en modo visible (no background)
    print("\n2️⃣  Ejecutando deployment (esto tomará 3-5 minutos)...\n")
    print("="*80)
    
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && bash scripts/deploy-direct.sh 2>&1", get_pty=True)
    
    # Leer output en tiempo real
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            line = stdout.read(1024).decode('utf-8')
            if line:
                print(line, end='')
        time.sleep(0.5)
    
    # Leer cualquier output restante
    remaining = stdout.read().decode('utf-8')
    if remaining:
        print(remaining, end='')
    
    exit_code = stdout.channel.recv_exit_status()
    
    print("\n" + "="*80)
    if exit_code == 0:
        print("\n✅ DEPLOYMENT EXITOSO")
    else:
        print(f"\n⚠️  Exit code: {exit_code}")
    
    # Verificar contenedores
    print("\n3️⃣  Verificando contenedores...")
    _, out, _ = ssh.exec_command("docker ps | grep inmova", get_pty=True)
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # Test de conectividad
    print("\n4️⃣  Testing aplicación...")
    time.sleep(3)
    _, out, _ = ssh.exec_command("curl -I http://localhost:3000 2>&1 | head -3")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n✅ Verifica en: https://inmovaapp.com\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
finally:
    ssh.close()
