#!/usr/bin/env python3
"""
Test exhaustivo final de la landing
"""
import paramiko
import time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🔬 TEST EXHAUSTIVO FINAL - LANDING")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("1️⃣  Limpiando caché de Next.js en el contenedor...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final rm -rf /app/.next/cache 2>&1")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n2️⃣  Reiniciando contenedor...")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker restart inmova-app-final")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n⏳ Esperando 20 segundos para que el contenedor esté listo...")
    time.sleep(20)
    
    print("\n3️⃣  Test #1: Root (/) dentro del contenedor")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final curl -s http://localhost:3000/ | head -100 | grep -E '<title|<h1|INMOVA'")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    print(result)
    
    if 'INMOVA' in result or 'PropTech #1' in result:
        print("\n✅ Root (/) sirve LANDING NUEVA")
    else:
        print("\n❌ Root (/) sirve landing antigua")
    
    print("\n4️⃣  Test #2: /landing dentro del contenedor")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final curl -s http://localhost:3000/landing | head -100 | grep -E '<title|<h1|INMOVA'")
    out.channel.recv_exit_status()
    result_landing = out.read().decode('utf-8')
    print(result_landing)
    
    if 'INMOVA' in result_landing or 'PropTech #1' in result_landing:
        print("\n✅ /landing sirve LANDING NUEVA")
    else:
        print("\n⚠️  /landing no tiene contenido esperado")
    
    print("\n5️⃣  Test #3: Desde fuera del contenedor (curl al servidor)")
    print("-" * 80)
    _, out, _ = ssh.exec_command("curl -sL http://localhost:3000/ | head -100 | grep -E '<title|<h1|INMOVA'")
    out.channel.recv_exit_status()
    result_external = out.read().decode('utf-8')
    print(result_external)
    
    print("\n6️⃣  Test #4: A través de Nginx (puerto 80)")
    print("-" * 80)
    _, out, _ = ssh.exec_command("curl -sL http://localhost/landing | head -100 | grep -E '<title|<h1|INMOVA'")
    out.channel.recv_exit_status()
    result_nginx = out.read().decode('utf-8')
    print(result_nginx)
    
    if 'INMOVA' in result_nginx or 'PropTech #1' in result_nginx:
        print("\n✅ Nginx sirve LANDING NUEVA")
    else:
        print("\n❌ Nginx no sirve landing nueva")
    
    print("\n7️⃣  Verificando logs del contenedor (últimos 15 líneas)")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker logs --tail 15 inmova-app-final 2>&1 | grep -v 'NO_SECRET'")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n8️⃣  Verificando que Next.js está corriendo")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final ps aux | grep -E 'node|next'")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
finally:
    ssh.close()

print("\n" + "="*80)
print("TEST COMPLETADO")
print("="*80 + "\n")
