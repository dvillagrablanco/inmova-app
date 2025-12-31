#!/usr/bin/env python3
import paramiko, sys, time

HOST, USER, PASS = "157.180.119.236", "root", "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("\n🚀 DEPLOYMENT ULTRA FINAL\n")
    
    # Pull
    print("📥 Pulling code...")
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && git pull origin main", get_pty=True)
    stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8')
    if 'Already up to date' not in out:
        print(out)
    print("✅ Code updated\n")
    
    # Deploy rápido
    print("🏗️  Building & deploying (2-4 min)...\n")
    stdin, stdout, stderr = ssh.exec_command(
        "cd /opt/inmova-app && bash scripts/deploy-direct.sh 2>&1 | grep -E 'Construyendo|Contenedor|exitosamente|Error|WARN|server.js'",
        get_pty=True
    )
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            print(stdout.read(1024).decode('utf-8', errors='replace'), end='', flush=True)
        time.sleep(0.5)
    
    print(stdout.read().decode('utf-8', errors='replace'))
    
    print("\n\n📊 RESULTADO:\n")
    time.sleep(5)
    
    # Ver estado
    _, out, _ = ssh.exec_command("docker ps -a | grep inmova-app_app")
    out.channel.recv_exit_status()
    containers = out.read().decode('utf-8')
    
    print("Contenedores:")
    print(containers if containers else "❌ No container found")
    
    # Si el contenedor existe pero no está Up, ver logs
    if 'inmova-app_app_1' in containers:
        if 'Up' not in containers:
            print("\n⚠️  Container not running. Checking logs:")
            _,out,_ = ssh.exec_command("docker logs --tail 30 inmova-app_app_1 2>&1")
            out.channel.recv_exit_status()
            print(out.read().decode('utf-8'))
        else:
            print("\n✅ DEPLOYMENT EXITOSO!")
            print("\n🌐 Verifica: https://inmovaapp.com\n")
            
            # Test
            _, out, _ = ssh.exec_command("curl -s http://localhost:3000 2>&1 | head -3")
            out.channel.recv_exit_status()
            test = out.read().decode('utf-8')
            if test.strip():
                print("HTTP Test:", test[:100])
    
    print("\n🔐 RECORDATORIO: Cambia la contraseña SSH\n")
    
except Exception as e:
    print(f"❌ {e}")
    sys.exit(1)
finally:
    ssh.close()
