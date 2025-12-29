#!/usr/bin/env python3
"""
Verificar estado del build y deployment
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
    print("\n🔍 VERIFICANDO ESTADO DEL BUILD\n")
    print("="*80 + "\n")
    
    # 1. Check if image was created
    print("1️⃣  Verificando si la imagen se creó...")
    _, out, _ = ssh.exec_command("docker images | grep inmova-app")
    out.channel.recv_exit_status()
    images = out.read().decode('utf-8')
    print(images if images else "   ❌ No hay imágenes inmova-app")
    
    # 2. Check running containers
    print("\n2️⃣  Verificando contenedores corriendo...")
    _, out, _ = ssh.exec_command("docker ps | grep inmova")
    out.channel.recv_exit_status()
    containers = out.read().decode('utf-8')
    print(containers if containers else "   ❌ No hay contenedores corriendo")
    
    # 3. If no container, start it
    if 'inmova-app-npm' not in containers:
        print("\n3️⃣  Contenedor no está corriendo, iniciando...")
        
        start_cmd = """docker run -d \
  --name inmova-app-npm \
  --network inmova-network \
  -p 3000:3000 \
  --env-file /opt/inmova-app/.env.production \
  --restart unless-stopped \
  inmova-app:npm-start 2>&1"""
        
        _, out, err = ssh.exec_command(start_cmd)
        out.channel.recv_exit_status()
        result = out.read().decode('utf-8')
        if result:
            print(f"   {result}")
        
        print("   Esperando 15 segundos...")
        time.sleep(15)
    
    # 4. Test app
    print("\n4️⃣  Testeando app...")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title = out.read().decode('utf-8').strip()
    print(f"   Título: {title}")
    
    if 'INMOVA' in title or 'PropTech #1' in title:
        print("   ✅ LANDING NUEVA")
    else:
        print(f"   ❌ Landing antigua o error")
        
        # Try following redirect
        print("\n   Siguiendo redirect...")
        _, out, _ = ssh.exec_command("curl -sL http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
        out.channel.recv_exit_status()
        title2 = out.read().decode('utf-8').strip()
        print(f"   Título después redirect: {title2}")
    
    # 5. Check logs
    print("\n5️⃣  Logs del contenedor:")
    _, out, _ = ssh.exec_command("docker logs --tail 20 inmova-app-npm 2>&1 | grep -v NO_SECRET")
    out.channel.recv_exit_status()
    logs = out.read().decode('utf-8')
    print(logs[:600] if logs else "   (Sin logs)")
    
    # 6. Status summary
    print("\n" + "="*80)
    print("📊 RESUMEN:")
    _, out, _ = ssh.exec_command("docker ps --filter name=inmova-app-npm --format '{{.Names}}: {{.Status}}'")
    out.channel.recv_exit_status()
    status = out.read().decode('utf-8').strip()
    print(f"   {status if status else 'Contenedor no encontrado'}")
    print("="*80 + "\n")
    
finally:
    ssh.close()
