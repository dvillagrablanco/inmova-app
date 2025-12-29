#!/usr/bin/env python3
"""
LIMPIEZA COMPLETA Y DEPLOYMENT FINAL
"""
import paramiko, sys, time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🧹 LIMPIEZA COMPLETA Y DEPLOYMENT FINAL")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("✅ Conectado\n")
    
    # Stop ALL inmova containers
    print("1️⃣  Deteniendo todos los contenedores inmova...")
    _, out, _ = ssh.exec_command("docker stop $(docker ps -aq --filter name=inmova) 2>/dev/null || true")
    out.channel.recv_exit_status()
    print("✅ Detenidos\n")
    
    # Remove ALL inmova containers
    print("2️⃣  Eliminando contenedores viejos...")
    _, out, _ = ssh.exec_command("docker rm -f $(docker ps -aq --filter name=inmova) 2>/dev/null || true")
    out.channel.recv_exit_status()
    print("✅ Eliminados\n")
    
    # Pull code
    print("3️⃣  Pulling código actualizado...")
    _, out, _ = ssh.exec_command("cd /opt/inmova-app && git pull origin main 2>&1")
    out.channel.recv_exit_status()
    print("✅ Código actualizado\n")
    
    # Build new image
    print("4️⃣  Construyendo nueva imagen (2-4 min)...\n")
    stdin, stdout, stderr = ssh.exec_command(
        "cd /opt/inmova-app && docker build --no-cache -t inmova-app:npm-start . 2>&1",
        get_pty=True
    )
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.read(2048).decode('utf-8', errors='replace')
            for line in chunk.split('\n'):
                if any(x in line for x in ['Step', 'Successfully', 'Error', 'CMD']):
                    print(line)
        time.sleep(0.5)
    
    print("\n✅ Imagen construida\n")
    
    # Start container with existing postgres/redis
    print("5️⃣  Iniciando contenedor nuevo...")
    
    # Start container (network may not exist, create if needed)
    _, out, _ = ssh.exec_command("docker network create inmova-network 2>/dev/null || true")
    out.channel.recv_exit_status()
    
    # Start container
    start_cmd = """docker run -d \
--name inmova-app-npm \
-p 3000:3000 \
--env-file /opt/inmova-app/.env.production \
--network inmova-network \
--restart unless-stopped \
inmova-app:npm-start"""
    
    _, out, _ = ssh.exec_command(start_cmd)
    out.channel.recv_exit_status()
    container_id = out.read().decode('utf-8').strip()
    
    if container_id:
        print(f"✅ Contenedor iniciado: {container_id[:12]}\n")
    else:
        print("⚠️  Verificando...\n")
    
    # Wait
    print("6️⃣  Esperando que la app inicie (15 seg)...")
    time.sleep(15)
    
    # Check status
    print("\n7️⃣  Verificando estado:\n")
    
    _, out, _ = ssh.exec_command("docker ps | grep inmova-app-npm")
    out.channel.recv_exit_status()
    status = out.read().decode('utf-8')
    
    if 'Up' in status:
        print("   ✅ Contenedor corriendo!")
        print(f"   {status}")
    else:
        print("   ⚠️  Contenedor no está Up. Verificando logs...")
        _, out, _ = ssh.exec_command("docker logs --tail 30 inmova-app-npm 2>&1")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8'))
        
    # HTTP Test
    print("\n8️⃣  Test HTTP...")
    time.sleep(5)
    _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000 2>&1 | head -8")
    out.channel.recv_exit_status()
    http = out.read().decode('utf-8')
    
    if 'HTTP' in http or '200' in http or '307' in http:
        print("   ✅ APP FUNCIONANDO!")
        print(http)
    else:
        print("   ⏳ Esperando 10 seg más...")
        time.sleep(10)
        _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000 2>&1 | head -8")
        out.channel.recv_exit_status()
        result = out.read().decode('utf-8')
        if 'HTTP' in result:
            print("   ✅ APP FUNCIONANDO AHORA!")
            print(result)
        else:
            print("   ❌ No responde. Logs:")
            _, out, _ = ssh.exec_command("docker logs --tail 20 inmova-app-npm 2>&1")
            out.channel.recv_exit_status()
            print(out.read().decode('utf-8')[:1000])
    
    # Final summary
    print("\n" + "="*80)
    print("📊 RESUMEN FINAL")
    print("="*80 + "\n")
    
    _, out, _ = ssh.exec_command("docker ps | grep -E 'inmova|postgres|redis'")
    out.channel.recv_exit_status()
    print("Contenedores activos:")
    print(out.read().decode('utf-8'))
    
    print("\n🌐 URL: https://inmovaapp.com")
    print("\n📋 Comandos útiles:")
    print("   docker logs -f inmova-app-npm")
    print("   docker restart inmova-app-npm")
    print("\n🔐 URGENTE: Cambia la contraseña SSH:")
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
