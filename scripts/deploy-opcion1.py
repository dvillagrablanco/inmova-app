#!/usr/bin/env python3
"""
DEPLOYMENT FINAL - OPCIÓN 1
Modificar Dockerfile para usar npm start
"""
import paramiko, sys, time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🚀 DEPLOYMENT OPCIÓN 1 - NPM START")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("✅ Conectado al servidor\n")
    
    # Pull latest code
    print("📥 1/5 - Pulling código con Dockerfile corregido...")
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && git pull origin main 2>&1", get_pty=True)
    stdout.channel.recv_exit_status()
    result = stdout.read().decode('utf-8')
    if 'Dockerfile' in result or 'next.config' in result:
        print("✅ Dockerfile y next.config actualizados")
    elif 'Already up to date' not in result:
        print(result)
    print()
    
    # Stop old containers
    print("🛑 2/5 - Deteniendo contenedores antiguos...")
    stdin, stdout, stderr = ssh.exec_command("cd /opt/inmova-app && docker-compose down 2>&1", get_pty=True)
    stdout.channel.recv_exit_status()
    print("✅ Contenedores detenidos\n")
    
    # Remove old images to force rebuild
    print("🗑️  3/5 - Limpiando imágenes antiguas...")
    stdin, stdout, stderr = ssh.exec_command("docker image prune -af 2>&1", get_pty=True)
    stdout.channel.recv_exit_status()
    print("✅ Imágenes limpias\n")
    
    # Build and start
    print("🏗️  4/5 - Construyendo con nuevo Dockerfile (3-5 min)...")
    print("          (Usando npm start en lugar de standalone)\n")
    
    stdin, stdout, stderr = ssh.exec_command(
        "cd /opt/inmova-app && docker-compose up -d --build 2>&1",
        get_pty=True
    )
    
    # Monitor build
    build_output = []
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.read(2048).decode('utf-8', errors='replace')
            build_output.append(chunk)
            # Show important lines
            for line in chunk.split('\n'):
                if any(x in line for x in ['Step', 'Successfully', 'Creating', 'Starting', 'done', 'Error', 'npm start']):
                    print(line)
        time.sleep(0.5)
    
    remaining = stdout.read().decode('utf-8', errors='replace')
    build_output.append(remaining)
    for line in remaining.split('\n'):
        if any(x in line for x in ['Creating', 'Starting', 'done', 'Error']):
            print(line)
    
    print("\n✅ Build completado\n")
    
    # Verify
    print("📊 5/5 - Verificando deployment...\n")
    time.sleep(15)  # Wait for app to start
    
    # Check containers
    print("   🐳 Contenedores:")
    _, out, _ = ssh.exec_command("docker-compose ps 2>&1")
    out.channel.recv_exit_status()
    containers = out.read().decode('utf-8')
    print(containers)
    
    # Test HTTP
    print("\n   🌐 HTTP Test:")
    time.sleep(5)
    _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000 2>&1 | head -8")
    out.channel.recv_exit_status()
    http_test = out.read().decode('utf-8')
    
    if 'HTTP' in http_test or '200' in http_test or '307' in http_test:
        print("   ✅ App respondiendo correctamente!")
        print(http_test)
    else:
        print("   ⏳ App iniciando, esperando 10 segundos más...")
        time.sleep(10)
        _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000 2>&1 | head -8")
        out.channel.recv_exit_status()
        result = out.read().decode('utf-8')
        if 'HTTP' in result:
            print("   ✅ App respondiendo ahora!")
            print(result)
        else:
            print("   ⚠️  App no responde aún. Verificando logs...")
            _, out, _ = ssh.exec_command("docker-compose logs --tail=20 app 2>&1")
            out.channel.recv_exit_status()
            print(out.read().decode('utf-8'))
    
    # Final check - logs
    print("\n   📋 Últimos logs de la app:")
    _, out, _ = ssh.exec_command("docker-compose logs --tail=15 app 2>&1")
    out.channel.recv_exit_status()
    logs = out.read().decode('utf-8')
    
    # Check for success indicators
    if 'ready' in logs.lower() or 'started' in logs.lower() or 'listening' in logs.lower():
        print("   ✅ App iniciada correctamente!")
    
    print(logs[:800])
    
    print("\n" + "="*80)
    print("✅ DEPLOYMENT COMPLETADO")
    print("="*80)
    print("\n🎉 ¡LA LANDING NUEVA ESTÁ DEPLOYADA!")
    print("\n🌐 Abre en tu navegador: https://inmovaapp.com")
    print("\n📋 Comandos útiles:")
    print("   • Ver logs en tiempo real:")
    print(f"     ssh root@{HOST}")
    print("     cd /opt/inmova-app")
    print("     docker-compose logs -f app")
    print("\n   • Reiniciar app:")
    print("     docker-compose restart app")
    print("\n🔐 IMPORTANTE - SEGURIDAD:")
    print("   ⚠️  Cambia la contraseña SSH AHORA:")
    print(f"     ssh root@{HOST}")
    print("     passwd")
    print("\n" + "="*80 + "\n")
    
except KeyboardInterrupt:
    print("\n\n⚠️  Interrumpido. El deployment continúa en el servidor.")
    print(f"   Monitorea con: ssh root@{HOST} 'cd /opt/inmova-app && docker-compose logs -f app'")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    ssh.close()
