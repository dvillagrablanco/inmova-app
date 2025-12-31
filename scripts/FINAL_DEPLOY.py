#!/usr/bin/env python3
import paramiko, sys, time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🚀 DEPLOYMENT FINAL - LANDING NUEVA")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    # Pull
    print("📥 Pulling latest code...")
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && git pull origin main 2>&1", get_pty=True)
    stdout.channel.recv_exit_status()
    print(stdout.read().decode('utf-8'))
    
    # Deploy
    print("\n🏗️  Starting deployment (this will take 2-4 minutes)...\n")
    
    stdin, stdout, stderr = ssh.exec_command(
        "cd /opt/inmova-app && bash scripts/deploy-direct.sh 2>&1",
        get_pty=True
    )
    
    # Monitor
    line_count = 0
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.read(2048).decode('utf-8', errors='replace')
            # Solo mostrar líneas importantes
            for line in chunk.split('\n'):
                if any(x in line for x in ['Construyendo', '✅', '❌', 'exitosamente', 'Contenedor', 'Error', 'server.js']):
                    print(line)
                    line_count += 1
        time.sleep(0.3)
    
    remaining = stdout.read().decode('utf-8', errors='replace')
    for line in remaining.split('\n'):
        if any(x in line for x in ['✅', '❌', 'exitosamente', 'Contenedor']):
            print(line)
    
    print("\n" + "-"*80)
    print("📊 VERIFICATION")
    print("-"*80 + "\n")
    
    time.sleep(8)
    
    # Check containers
    print("1️⃣  Docker containers:")
    _, out, _ = ssh.exec_command("docker ps | grep inmova-app")
    out.channel.recv_exit_status()
    containers = out.read().decode('utf-8')
    
    if containers.strip():
        print(containers)
        
        # Check app container
        if 'inmova-app-production' in containers or 'inmova-app_app' in containers:
            if 'Up' in containers:
                print("\n✅ Container is running!")
                
                # Test HTTP
                print("\n2️⃣  HTTP test...")
                time.sleep(3)
                _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000 2>&1 | head -5")
                out.channel.recv_exit_status()
                http_test = out.read().decode('utf-8')
                
                if 'HTTP' in http_test or '200' in http_test:
                    print("✅ App is responding!")
                    print(http_test[:200])
                else:
                    print("⚠️  App may still be starting...")
                    print(http_test[:200])
                
                # Check logs
                print("\n3️⃣  Recent logs:")
                _, out, _ = ssh.exec_command("docker logs --tail 10 inmova-app-production 2>&1 || docker logs --tail 10 inmova-app_app_1 2>&1")
                out.channel.recv_exit_status()
                logs = out.read().decode('utf-8')
                print(logs[:500])
            else:
                print("\n⚠️  Container exists but not running!")
                print("\n📋 Container logs:")
                _, out, _ = ssh.exec_command("docker logs --tail 20 inmova-app-production 2>&1 || docker logs --tail 20 inmova-app_app_1 2>&1")
                out.channel.recv_exit_status()
                print(out.read().decode('utf-8'))
    else:
        print("❌ No containers found")
    
    print("\n" + "="*80)
    print("🌐 NEXT STEPS")
    print("="*80)
    print("\n1. Abre en tu navegador: https://inmovaapp.com")
    print("2. Deberías ver la landing nueva")
    print("3. Si no funciona, verifica logs:")
    print(f"   ssh root@{HOST}")
    print("   docker logs -f inmova-app-production")
    print("\n🔐 IMPORTANTE: Cambia la contraseña SSH:")
    print(f"   ssh root@{HOST}")
    print("   passwd")
    print("\n" + "="*80 + "\n")
    
except KeyboardInterrupt:
    print("\n\n⚠️  Interrupted. Deployment continues on server.")
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
finally:
    ssh.close()
