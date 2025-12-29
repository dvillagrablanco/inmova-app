#!/usr/bin/env python3
"""
Arreglar el redirect de raíz
"""
import paramiko
import time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n" + "="*80)
    print("🔄 ARREGLANDO REDIRECT DE RAÍZ")
    print("="*80 + "\n")
    
    # 1. Stop container
    print("1️⃣  Deteniendo contenedor...")
    _, out, _ = ssh.exec_command("docker stop inmova-app-new")
    out.channel.recv_exit_status()
    print("   ✅ Detenido\n")
    
    # 2. Remove container
    print("2️⃣  Removiendo contenedor...")
    _, out, _ = ssh.exec_command("docker rm inmova-app-new")
    out.channel.recv_exit_status()
    print("   ✅ Removido\n")
    
    # 3. Remove .next cache in build
    print("3️⃣  Limpiando .next cache en servidor...")
    _, out, _ = ssh.exec_command("rm -rf /opt/inmova-app/.next/cache")
    out.channel.recv_exit_status()
    print("   ✅ Cache limpiado\n")
    
    # 4. Rebuild image (quick, should use cached layers)
    print("4️⃣  Reconstruyendo imagen...")
    _, out, _ = ssh.exec_command("cd /opt/inmova-app && docker build -t inmova-app:latest . 2>&1", get_pty=True)
    
    # Wait for build to complete
    for line in out:
        if 'Successfully' in line:
            print(f"   {line.strip()}")
            break
    
    out.channel.recv_exit_status()
    print("   ✅ Imagen reconstruida\n")
    
    # 5. Start new container
    print("5️⃣  Iniciando contenedor nuevo...")
    
    start_cmd = """cd /opt/inmova-app && docker run -d \
  --name inmova-app-final \
  --network inmova-network \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  inmova-app:latest"""
    
    _, out, _ = ssh.exec_command(start_cmd)
    out.channel.recv_exit_status()
    container_id = out.read().decode('utf-8').strip()
    print(f"   ✅ Container iniciado: {container_id[:12]}\n")
    
    # 6. Wait for startup
    print("6️⃣  Esperando que la app inicie (25 seg)...")
    time.sleep(25)
    
    # 7. Test root
    print("\n7️⃣  Test de raíz (/):")
    _, out, _ = ssh.exec_command("curl -sL http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    root_title = out.read().decode('utf-8').strip()
    print(f"   Título: {root_title}")
    
    if 'INMOVA' in root_title or 'PropTech #1' in root_title:
        print("   ✅✅✅ LANDING NUEVA EN RAÍZ ✅✅✅\n")
        success = True
    else:
        print("   ⚠️  Todavía antigua\n")
        success = False
    
    # 8. Test /landing también
    print("8️⃣  Test de /landing:")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/landing | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    landing_title = out.read().decode('utf-8').strip()
    print(f"   Título: {landing_title}")
    
    if 'INMOVA' in landing_title:
        print("   ✅ Landing funciona\n")
    
    # 9. Reload Nginx
    print("9️⃣  Recargando Nginx...")
    _, out, _ = ssh.exec_command("systemctl reload nginx")
    out.channel.recv_exit_status()
    print("   ✅ Nginx recargado\n")
    
    # 10. Final status
    print("="*80)
    if success:
        print("✅✅✅ PROBLEMA RESUELTO ✅✅✅")
    else:
        print("⚠️  INTENTO COMPLETADO - Verificar manualmente")
    print("="*80)
    
    print("\n🌐 PRUEBA AHORA:")
    print("   1. Modo incógnito: Ctrl+Shift+N")
    print("   2. Ve a: https://inmovaapp.com")
    print("   3. Si persiste, purga Cloudflare")
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
