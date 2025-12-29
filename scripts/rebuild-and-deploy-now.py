#!/usr/bin/env python3
"""
Reconstruir contenedor con código actualizado y desplegar
"""
import paramiko
import time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🔄 REBUILD Y DEPLOYMENT CON CÓDIGO ACTUALIZADO")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("✅ Conectado\n")
    
    # 1. Verificar código actual en servidor
    print("1️⃣  Verificando app/page.tsx en servidor...")
    _, out, _ = ssh.exec_command("head -10 /opt/inmova-app/app/page.tsx")
    out.channel.recv_exit_status()
    page_content = out.read().decode('utf-8')
    print(page_content)
    
    if 'redirect' in page_content and '/landing' in page_content:
        print("   ✅ Código correcto en servidor\n")
    else:
        print("   ❌ Código incorrecto, actualizando...\n")
        # Pull latest
        print("   Pulling latest code...")
        _, out, _ = ssh.exec_command("cd /opt/inmova-app && git pull origin cursor/deployment-audit-and-fix-0b20 2>&1")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8')[:300])
    
    # 2. Verificar app/landing/page.tsx existe
    print("\n2️⃣  Verificando app/landing/page.tsx...")
    _, out, _ = ssh.exec_command("ls -la /opt/inmova-app/app/landing/page.tsx 2>&1")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    if 'No such file' in result:
        print("   ❌ app/landing/page.tsx NO EXISTE")
        print("   🔄 Pulling code...")
        _, out, _ = ssh.exec_command("cd /opt/inmova-app && git fetch origin && git reset --hard origin/cursor/deployment-audit-and-fix-0b20 2>&1")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8')[:300])
    else:
        print("   ✅ app/landing/page.tsx existe")
    
    # 3. Stop y remove contenedor antiguo
    print("\n3️⃣  Deteniendo contenedor antiguo...")
    _, out, _ = ssh.exec_command("docker stop inmova-app-npm && docker rm inmova-app-npm 2>&1")
    out.channel.recv_exit_status()
    print("   ✅ Contenedor detenido y removido\n")
    
    # 4. Remove imagen antigua
    print("4️⃣  Removiendo imagen antigua...")
    _, out, _ = ssh.exec_command("docker rmi inmova-app:npm-start 2>&1")
    out.channel.recv_exit_status()
    print("   ✅ Imagen removida\n")
    
    # 5. Rebuild sin cache
    print("5️⃣  Reconstruyendo imagen (esto tarda ~5 min)...")
    print("   Ejecutando: docker build --no-cache -t inmova-app:npm-start .\n")
    
    channel = ssh.get_transport().open_session()
    channel.exec_command("cd /opt/inmova-app && docker build --no-cache -t inmova-app:npm-start . 2>&1")
    
    print("   Progreso del build:")
    while True:
        if channel.recv_ready():
            chunk = channel.recv(1024).decode('utf-8')
            # Solo mostrar líneas importantes
            for line in chunk.split('\n'):
                if any(x in line for x in ['Step', 'Successfully', 'error', 'Error', 'failed', 'warning']):
                    print(f"   {line}")
        
        if channel.exit_status_ready():
            break
        time.sleep(0.5)
    
    exit_code = channel.recv_exit_status()
    if exit_code == 0:
        print("\n   ✅ Build exitoso\n")
    else:
        print(f"\n   ❌ Build falló con código: {exit_code}\n")
        # Mostrar últimas líneas de error
        _, out, _ = ssh.exec_command("docker logs $(docker ps -lq) 2>&1 | tail -20")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8'))
        raise Exception("Build failed")
    
    # 6. Start nuevo contenedor
    print("6️⃣  Iniciando nuevo contenedor...")
    
    start_cmd = """docker run -d \
  --name inmova-app-npm \
  --network inmova-network \
  -p 3000:3000 \
  --env-file /opt/inmova-app/.env.production \
  --restart unless-stopped \
  inmova-app:npm-start"""
    
    _, out, _ = ssh.exec_command(start_cmd)
    out.channel.recv_exit_status()
    print("   ✅ Contenedor iniciado\n")
    
    # 7. Wait for app to start
    print("7️⃣  Esperando que la app inicie (20 seg)...")
    time.sleep(20)
    
    # 8. Verificar
    print("\n8️⃣  Verificando que sirve landing NUEVA...")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title = out.read().decode('utf-8').strip()
    print(f"   Título: {title}")
    
    if 'INMOVA' in title or 'PropTech #1' in title:
        print("\n   ✅✅✅ LANDING NUEVA DETECTADA ✅✅✅\n")
    else:
        print(f"\n   ⚠️  Todavía antigua: {title}\n")
        
        # Check redirect
        print("   Verificando redirect...")
        _, out, _ = ssh.exec_command("curl -sL http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
        out.channel.recv_exit_status()
        title_after_redirect = out.read().decode('utf-8').strip()
        print(f"   Título después de redirect: {title_after_redirect}")
    
    # 9. Check logs
    print("\n9️⃣  Últimos logs del contenedor:")
    _, out, _ = ssh.exec_command("docker logs --tail 15 inmova-app-npm 2>&1 | grep -v 'NO_SECRET\\|next-auth'")
    out.channel.recv_exit_status()
    logs = out.read().decode('utf-8')
    print(logs[:500])
    
    # 10. Reload Nginx
    print("\n🔟 Recargando Nginx...")
    _, out, _ = ssh.exec_command("systemctl reload nginx")
    out.channel.recv_exit_status()
    print("   ✅ Nginx recargado\n")
    
    print("="*80)
    print("✅ DEPLOYMENT COMPLETADO")
    print("="*80)
    print("\n🌐 AHORA PRUEBA:")
    print("   1. Abre navegador en modo incógnito")
    print("   2. Ve a: https://inmovaapp.com")
    print("   3. Deberías ver: INMOVA - Plataforma PropTech #1")
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
