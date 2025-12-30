#!/usr/bin/env python3
"""
Fix definitivo: Rebuild contenedor Docker con landing nueva
"""
import paramiko
import time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🔧 REBUILD CONTENEDOR DOCKER - LANDING NUEVA")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("1️⃣  Pulling último código de Git...")
    print("-" * 80)
    _, out, err = ssh.exec_command("cd /opt/inmova-app && git fetch origin && git reset --hard origin/main")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n2️⃣  Parando contenedor actual...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker stop inmova-app-final")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n3️⃣  Eliminando contenedor...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker rm inmova-app-final")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n4️⃣  Eliminando imagen antigua...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker rmi inmova-app:latest 2>&1 || true")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n5️⃣  Limpiando caché de Docker...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker builder prune -f")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n6️⃣  Rebuild de imagen (esto puede tardar 5-10 minutos)...")
    print("-" * 80)
    print("⏳ Construyendo imagen con --no-cache...\n")
    
    _, out, err = ssh.exec_command(
        "cd /opt/inmova-app && docker build --no-cache -t inmova-app:latest . 2>&1",
        timeout=900
    )
    
    # Leer output en tiempo real
    while not out.channel.exit_status_ready():
        if out.channel.recv_ready():
            line = out.channel.recv(4096).decode('utf-8', errors='ignore')
            print(line, end='')
        time.sleep(0.1)
    
    # Leer cualquier output restante
    remaining = out.read().decode('utf-8', errors='ignore')
    print(remaining)
    
    exit_status = out.channel.recv_exit_status()
    
    if exit_status != 0:
        print("\n❌ ERROR en el build")
        err_output = err.read().decode('utf-8', errors='ignore')
        print(err_output)
        raise Exception("Build falló")
    
    print("\n✅ Build completado exitosamente\n")
    
    print("\n7️⃣  Iniciando contenedor nuevo...")
    print("-" * 80)
    
    start_cmd = """docker run -d \\
      --name inmova-app-final \\
      --restart unless-stopped \\
      -p 3000:3000 \\
      --env-file /opt/inmova-app/.env.production \\
      inmova-app:latest"""
    
    _, out, _ = ssh.exec_command(start_cmd)
    out.channel.recv_exit_status()
    container_id = out.read().decode('utf-8').strip()
    print(f"Contenedor iniciado: {container_id}\n")
    
    print("\n8️⃣  Esperando que el contenedor esté listo...")
    print("-" * 80)
    print("⏳ Esperando 10 segundos...\n")
    time.sleep(10)
    
    print("\n9️⃣  Verificando que está corriendo...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker ps --filter name=inmova-app-final")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n🔟  TEST FINAL - Verificando landing...")
    print("-" * 80)
    
    # Test al contenedor
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title = out.read().decode('utf-8').strip()
    
    print(f"Título desde Docker: {title}\n")
    
    if 'INMOVA' in title and 'PropTech #1' in title:
        print("✅✅✅ ÉXITO: Docker ahora sirve LANDING NUEVA ✅✅✅\n")
    else:
        print("❌ Docker sigue sirviendo landing antigua\n")
        print(f"Título encontrado: {title}\n")
    
    # Test a través de Nginx
    print("\n1️⃣1️⃣  Verificando a través de Nginx...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("curl -sL http://localhost/landing | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title_nginx = out.read().decode('utf-8').strip()
    
    print(f"Título desde Nginx: {title_nginx}\n")
    
    if 'INMOVA' in title_nginx and 'PropTech #1' in title_nginx:
        print("✅ Nginx también sirve LANDING NUEVA\n")
    else:
        print("⚠️  Nginx puede necesitar restart\n")
    
    # Logs del contenedor
    print("\n1️⃣2️⃣  Últimos logs del contenedor...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker logs --tail 20 inmova-app-final 2>&1 | grep -v 'NO_SECRET\\|next-auth' | tail -10")
    out.channel.recv_exit_status()
    logs = out.read().decode('utf-8')
    print(logs)
    
finally:
    ssh.close()

print("\n" + "="*80)
print("✅ PROCESO COMPLETADO")
print("="*80 + "\n")

print("PRÓXIMOS PASOS:")
print("1. Espera 2-3 minutos para que el contenedor esté completamente listo")
print("2. Accede a https://inmovaapp.com")
print("3. Si aún ves la landing antigua, purga caché de Cloudflare:")
print("   - Dashboard de Cloudflare > Caching > Purge Everything")
print("4. Abre en modo incógnito o limpia caché del navegador")

print("\n" + "="*80 + "\n")
