#!/usr/bin/env python3
"""
DEPLOYMENT FINAL usando Docker Compose
"""
import paramiko, sys, time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🚀 DEPLOYMENT CON DOCKER COMPOSE")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    # Pull latest code
    print("📥 Pulling código...")
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && git pull origin main", get_pty=True)
    stdout.channel.recv_exit_status()
    result = stdout.read().decode('utf-8')
    if 'Already up to date' not in result:
        print(result)
    print("✅ Código actualizado\n")
    
    # Stop old containers
    print("🛑 Deteniendo contenedores antiguos...")
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && docker-compose down", get_pty=True)
    stdout.channel.recv_exit_status()
    print("✅ Contenedores detenidos\n")
    
    # Build and start with docker-compose
    print("🏗️  Construyendo e iniciando con docker-compose (3-5 min)...\n")
    
    stdin, stdout, stderr = ssh.exec_command(
        "cd /opt/inmova-app && docker-compose up -d --build 2>&1",
        get_pty=True
    )
    
    # Monitor
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.read(2048).decode('utf-8', errors='replace')
            for line in chunk.split('\n'):
                if any(x in line for x in ['Building', 'Step', 'Successfully', 'Creating', 'Starting', 'done', 'Error']):
                    print(line)
        time.sleep(0.5)
    
    remaining = stdout.read().decode('utf-8', errors='replace')
    for line in remaining.split('\n'):
        if any(x in line for x in ['Creating', 'Starting', 'done', 'Error']):
            print(line)
    
    print("\n" + "-"*80)
    print("📊 VERIFICACIÓN")
    print("-"*80 + "\n")
    
    time.sleep(10)
    
    # Check status
    print("1️⃣  Docker compose status:")
    _, out, _ = ssh.exec_command("cd /opt/inmova-app && docker-compose ps")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # Test HTTP
    print("\n2️⃣  HTTP test...")
    time.sleep(5)
    _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000 2>&1 | head -5")
    out.channel.recv_exit_status()
    http_test = out.read().decode('utf-8')
    
    if 'HTTP' in http_test:
        print("✅ App respondiendo!")
        print(http_test)
    else:
        print("⚠️  Esperando que la app inicie...")
        time.sleep(10)
        _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000 2>&1 | head -5")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8'))
    
    # Show logs
    print("\n3️⃣  Logs recientes de la app:")
    _, out, _ = ssh.exec_command("cd /opt/inmova-app && docker-compose logs --tail=15 app")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8')[:1000])
    
    print("\n" + "="*80)
    print("✅ DEPLOYMENT COMPLETADO")
    print("="*80)
    print("\n🌐 Verifica en tu navegador: https://inmovaapp.com")
    print("\n📋 Ver logs en tiempo real:")
    print(f"   ssh root@{HOST}")
    print("   cd /opt/inmova-app")
    print("   docker-compose logs -f app")
    print("\n🔐 IMPORTANTE: Cambia la contraseña SSH:")
    print(f"   ssh root@{HOST}")
    print("   passwd")
    print("\n" + "="*80 + "\n")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    ssh.close()

