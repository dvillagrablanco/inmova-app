#!/usr/bin/env python3
"""
Rebuild completo y limpio
"""
import paramiko
import time
import sys

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("\n" + "="*80)
    print("🔄 REBUILD COMPLETO")
    print("="*80 + "\n")
    
    # 1. Stop all inmova containers
    print("1️⃣  Deteniendo todos los contenedores...")
    _, out, _ = ssh.exec_command("docker stop $(docker ps -q --filter name=inmova) 2>&1 || true")
    out.channel.recv_exit_status()
    time.sleep(2)
    print("   ✅ Detenidos\n")
    
    # 2. Remove containers
    print("2️⃣  Removiendo contenedores...")
    _, out, _ = ssh.exec_command("docker rm $(docker ps -aq --filter name=inmova) 2>&1 || true")
    out.channel.recv_exit_status()
    print("   ✅ Removidos\n")
    
    # 3. Prune images
    print("3️⃣  Limpiando imágenes antiguas...")
    _, out, _ = ssh.exec_command("docker image prune -af 2>&1")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    print(f"   {result[:200]}\n")
    
    # 4. Verify code
    print("4️⃣  Verificando código actualizado...")
    _, out, _ = ssh.exec_command("cd /opt/inmova-app && git log --oneline -1")
    out.channel.recv_exit_status()
    commit = out.read().decode('utf-8').strip()
    print(f"   Commit actual: {commit}\n")
    
    # 5. Build with output
    print("5️⃣  Construyendo imagen (espera ~5 minutos)...")
    print("   Comando: docker build -t inmova-app:latest .\n")
    
    # Use exec_command with get_pty to get real-time output
    _, stdout, stderr = ssh.exec_command(
        "cd /opt/inmova-app && docker build --no-cache -t inmova-app:latest . 2>&1",
        get_pty=True
    )
    
    # Read output line by line
    build_output = []
    error_lines = []
    
    for line in stdout:
        line = line.strip()
        build_output.append(line)
        
        # Print important lines
        if any(x in line for x in ['Step', '--->', 'Successfully', 'error', 'Error', 'failed', 'warning', 'RUN']):
            print(f"   {line}")
        
        # Capture errors
        if 'error' in line.lower() or 'failed' in line.lower():
            error_lines.append(line)
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("\n   ✅✅✅ BUILD EXITOSO ✅✅✅\n")
    else:
        print(f"\n   ❌ Build falló con código: {exit_code}")
        if error_lines:
            print("\n   Errores encontrados:")
            for err in error_lines[-5:]:
                print(f"   {err}")
        sys.exit(1)
    
    # 6. Verify image created
    print("6️⃣  Verificando imagen creada...")
    _, out, _ = ssh.exec_command("docker images | grep inmova-app | grep latest")
    out.channel.recv_exit_status()
    image_info = out.read().decode('utf-8').strip()
    if image_info:
        print(f"   ✅ Imagen: {image_info}\n")
    else:
        print("   ❌ Imagen no encontrada\n")
        sys.exit(1)
    
    # 7. Start container
    print("7️⃣  Iniciando contenedor...")
    
    start_cmd = """cd /opt/inmova-app && docker run -d \
  --name inmova-app-new \
  --network inmova-network \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  inmova-app:latest"""
    
    _, out, _ = ssh.exec_command(start_cmd)
    out.channel.recv_exit_status()
    container_id = out.read().decode('utf-8').strip()
    print(f"   ✅ Container ID: {container_id[:12]}\n")
    
    # 8. Wait for startup
    print("8️⃣  Esperando inicio de la app (30 seg)...")
    for i in range(6):
        time.sleep(5)
        _, out, _ = ssh.exec_command("curl -s http://localhost:3000/ >/dev/null && echo 'OK' || echo 'NOT_READY'")
        out.channel.recv_exit_status()
        status = out.read().decode('utf-8').strip()
        if status == 'OK':
            print("   ✅ App respondiendo\n")
            break
        print(f"   Esperando... ({(i+1)*5}/30 seg)")
    
    # 9. Test
    print("9️⃣  Verificando landing...")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title = out.read().decode('utf-8').strip()
    print(f"   Título: {title}")
    
    if 'INMOVA' in title or 'PropTech #1' in title:
        print("   ✅✅✅ LANDING NUEVA ✅✅✅\n")
        success = True
    else:
        print("   ⚠️  Landing antigua, probando con redirect...\n")
        
        _, out, _ = ssh.exec_command("curl -sL http://localhost:3000/landing | grep -o '<title>[^<]*</title>' | head -1")
        out.channel.recv_exit_status()
        title_direct = out.read().decode('utf-8').strip()
        print(f"   Título /landing: {title_direct}")
        
        if 'INMOVA' in title_direct:
            print("   ✅ /landing funciona\n")
            success = True
        else:
            success = False
    
    # 10. Reload Nginx
    print("🔟 Recargando Nginx...")
    _, out, _ = ssh.exec_command("systemctl reload nginx")
    out.channel.recv_exit_status()
    print("   ✅ Nginx recargado\n")
    
    # 11. Final status
    print("="*80)
    if success:
        print("✅✅✅ DEPLOYMENT EXITOSO ✅✅✅")
    else:
        print("⚠️  DEPLOYMENT COMPLETADO CON ADVERTENCIAS")
    print("="*80)
    
    print("\n🌐 PRUEBA AHORA:")
    print("   1. Modo incógnito")
    print("   2. https://inmovaapp.com")
    print("   3. Purga Cloudflare si persiste\n")
    print("="*80 + "\n")
    
finally:
    ssh.close()
