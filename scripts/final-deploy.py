#!/usr/bin/env python3
import paramiko, sys, time

HOST, USER, PASS = "157.180.119.236", "root", "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("\n🚀 DEPLOYMENT FINAL - LANDING NUEVA\n")
    
    print("1️⃣  Actualizando código desde GitHub...")
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && git pull origin main", get_pty=True)
    stdout.channel.recv_exit_status()
    print(stdout.read().decode('utf-8'))
    
    print("\n2️⃣  Ejecutando deployment (3-5 min)...\n")
    print("="*80)
    
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && bash scripts/deploy-direct.sh 2>&1 | tee /tmp/deploy-final-real.log", get_pty=True)
    
    # Leer output en tiempo real
    buffer = ""
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.read(1024).decode('utf-8', errors='replace')
            buffer += chunk
            print(chunk, end='', flush=True)
            
            # Detectar errores críticos
            if "Failed to compile" in buffer or "TypeError" in buffer:
                print("\n\n❌ ERROR DETECTADO EN EL BUILD!")
                break
        time.sleep(0.1)
    
    # Leer output restante
    remaining = stdout.read().decode('utf-8', errors='replace')
    print(remaining, end='')
    
    print("\n" + "="*80)
    print("\n3️⃣  Verificando resultado...\n")
    time.sleep(3)
    
    _, out, _ = ssh.exec_command("docker ps | grep inmova-app_app")
    out.channel.recv_exit_status()
    containers = out.read().decode('utf-8')
    
    if 'inmova-app_app_1' in containers and 'Up' in containers:
        print("✅ DEPLOYMENT EXITOSO!")
        print("\nContenedores activos:")
        print(containers)
        
        # Test HTTP
        print("\n4️⃣  Testing aplicación...")
        time.sleep(3)
        _, out, _ = ssh.exec_command("curl -I http://localhost:3000 2>&1 | head -5")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8'))
        
        print("\n" + "="*80)
        print("✅ TODO COMPLETADO")
        print("="*80)
        print("\n🌐 Verifica la landing nueva en: https://inmovaapp.com")
        print("\n🔐 IMPORTANTE: Cambia la contraseña SSH ahora:")
        print("   ssh root@157.180.119.236")
        print("   passwd\n")
    else:
        print("⚠️  El contenedor no está corriendo")
        print("\n📋 Verificar logs:")
        print("   ssh root@157.180.119.236 'tail -50 /tmp/deploy-final-real.log'\n")
    
except KeyboardInterrupt:
    print("\n\n⚠️  Deployment interrumpido por usuario")
    print("El proceso continúa en el servidor. Monitorear con:")
    print(f"  ssh root@{HOST} 'tail -f /tmp/deploy-final-real.log'")
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
finally:
    ssh.close()
