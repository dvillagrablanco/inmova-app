#!/usr/bin/env python3
"""
Auditoría exhaustiva del problema de la landing antigua
Verifica cada capa: DNS, Cloudflare, Nginx, Docker, Next.js
"""
import paramiko
import subprocess
import json

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("AUDITORIA EXHAUSTIVA - PROBLEMA LANDING ANTIGUA")
print("="*80 + "\n")

# 1. Test DNS
print("1️⃣  VERIFICANDO DNS")
print("-" * 80)
try:
    result = subprocess.run(['nslookup', 'inmovaapp.com'], capture_output=True, text=True)
    print(result.stdout)
    if HOST in result.stdout:
        print(f"   ✅ DNS apunta correctamente a {HOST}\n")
    else:
        print(f"   ❌ DNS NO apunta a {HOST}\n")
        print(f"   PROBLEMA: El DNS puede estar apuntando a otro servidor!\n")
except Exception as e:
    print(f"   ⚠️  No se pudo verificar DNS: {e}\n")

# 2. Test directo al servidor (bypass Cloudflare)
print("\n2️⃣  TEST DIRECTO AL SERVIDOR (bypass Cloudflare)")
print("-" * 80)
try:
    # Curl directo a la IP
    result = subprocess.run(
        ['curl', '-sI', '-H', 'Host: inmovaapp.com', f'http://{HOST}/'],
        capture_output=True,
        text=True,
        timeout=10
    )
    print("Headers directo al servidor:")
    print(result.stdout)
    
    # Obtener título
    result_html = subprocess.run(
        ['curl', '-sL', '-H', 'Host: inmovaapp.com', f'http://{HOST}/', '-o', '/tmp/direct.html'],
        capture_output=True,
        text=True,
        timeout=10
    )
    
    result_title = subprocess.run(
        ['grep', '-o', '<title>[^<]*</title>', '/tmp/direct.html'],
        capture_output=True,
        text=True
    )
    
    title_direct = result_title.stdout.strip()
    print(f"\nTítulo directo: {title_direct}")
    
    if 'INMOVA' in title_direct or 'PropTech #1' in title_direct:
        print("   ✅ Servidor directo sirve LANDING NUEVA\n")
    else:
        print("   ❌ Servidor directo sirve LANDING ANTIGUA\n")
        
except Exception as e:
    print(f"   ❌ Error: {e}\n")

# 3. Test a través de Cloudflare
print("\n3️⃣  TEST A TRAVÉS DE CLOUDFLARE")
print("-" * 80)
try:
    result = subprocess.run(
        ['curl', '-sI', 'https://inmovaapp.com/'],
        capture_output=True,
        text=True,
        timeout=10
    )
    print("Headers desde Cloudflare:")
    print(result.stdout)
    
    # Verificar CF-Cache-Status
    if 'cf-cache-status' in result.stdout.lower():
        print("   ℹ️  Cloudflare está activo")
        if 'HIT' in result.stdout:
            print("   ⚠️  CF-Cache-Status: HIT (sirviendo desde caché)")
        elif 'MISS' in result.stdout:
            print("   ✅ CF-Cache-Status: MISS (sirviendo contenido fresco)")
    
    # Obtener título
    result_html = subprocess.run(
        ['curl', '-sL', 'https://inmovaapp.com/', '-o', '/tmp/cloudflare.html'],
        capture_output=True,
        text=True,
        timeout=10
    )
    
    result_title = subprocess.run(
        ['grep', '-o', '<title>[^<]*</title>', '/tmp/cloudflare.html'],
        capture_output=True,
        text=True
    )
    
    title_cf = result_title.stdout.strip()
    print(f"\nTítulo desde Cloudflare: {title_cf}")
    
    if 'INMOVA' in title_cf or 'PropTech #1' in title_cf:
        print("   ✅ Cloudflare sirve LANDING NUEVA\n")
    else:
        print("   ❌ Cloudflare sirve LANDING ANTIGUA\n")
        print("   🔥 PROBLEMA CONFIRMADO: Cloudflare tiene cacheada la versión antigua!\n")
        
except Exception as e:
    print(f"   ❌ Error: {e}\n")

# 4. Verificar en el servidor
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n4️⃣  VERIFICANDO CONTENEDOR DOCKER")
    print("-" * 80)
    
    # Ver contenedores corriendo
    _, out, _ = ssh.exec_command("docker ps --filter name=inmova")
    out.channel.recv_exit_status()
    containers = out.read().decode('utf-8')
    print("Contenedores corriendo:")
    print(containers)
    
    # Test al contenedor
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title_docker = out.read().decode('utf-8').strip()
    print(f"\nTítulo desde Docker (puerto 3000): {title_docker}")
    
    if 'INMOVA' in title_docker or 'PropTech #1' in title_docker:
        print("   ✅ Docker sirve LANDING NUEVA\n")
    else:
        print("   ❌ Docker sirve LANDING ANTIGUA\n")
    
    print("\n5️⃣  VERIFICANDO NGINX")
    print("-" * 80)
    
    # Test a Nginx
    _, out, _ = ssh.exec_command("curl -s http://localhost/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title_nginx = out.read().decode('utf-8').strip()
    print(f"Título desde Nginx (puerto 80): {title_nginx}")
    
    if 'INMOVA' in title_nginx or 'PropTech #1' in title_nginx:
        print("   ✅ Nginx sirve LANDING NUEVA\n")
    else:
        print("   ❌ Nginx sirve LANDING ANTIGUA\n")
    
    # Verificar configuración de Nginx
    print("\n6️⃣  CONFIGURACIÓN DE NGINX")
    print("-" * 80)
    _, out, _ = ssh.exec_command("grep -A 5 'location = /' /etc/nginx/sites-enabled/inmovaapp.com | head -10")
    out.channel.recv_exit_status()
    nginx_config = out.read().decode('utf-8')
    print("Configuración del redirect:")
    print(nginx_config)
    
    if 'return 301 /landing' in nginx_config:
        print("   ✅ Redirect configurado correctamente\n")
    else:
        print("   ⚠️  Redirect puede no estar configurado\n")
    
    print("\n7️⃣  VERIFICANDO ARCHIVOS EN EL SERVIDOR")
    print("-" * 80)
    
    # Verificar app/page.tsx
    _, out, _ = ssh.exec_command("cat /opt/inmova-app/app/page.tsx 2>&1")
    out.channel.recv_exit_status()
    page_tsx = out.read().decode('utf-8')
    print("Contenido de app/page.tsx:")
    print(page_tsx[:300])
    
    if 'redirect' in page_tsx and '/landing' in page_tsx:
        print("\n   ✅ app/page.tsx tiene redirect a /landing\n")
    else:
        print("\n   ❌ app/page.tsx NO tiene redirect correcto\n")
    
    # Verificar app/landing/page.tsx
    _, out, _ = ssh.exec_command("ls -la /opt/inmova-app/app/landing/page.tsx 2>&1")
    out.channel.recv_exit_status()
    landing_exists = out.read().decode('utf-8')
    
    if 'No such file' in landing_exists:
        print("   ❌ app/landing/page.tsx NO EXISTE\n")
    else:
        print("   ✅ app/landing/page.tsx existe\n")
    
    print("\n8️⃣  LOGS DEL CONTENEDOR")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker logs --tail 30 inmova-app-final 2>&1 | grep -v 'NO_SECRET\\|next-auth' | tail -15")
    out.channel.recv_exit_status()
    logs = out.read().decode('utf-8')
    print("Últimos logs:")
    print(logs)
    
finally:
    ssh.close()

print("\n" + "="*80)
print("DIAGNÓSTICO FINAL")
print("="*80 + "\n")

print("COMPARACIÓN DE RESULTADOS:\n")
print(f"1. DNS:              {'OK' if HOST in result.stdout else 'ERROR'}")
print(f"2. Servidor directo: {'NUEVA' if 'INMOVA' in title_direct else 'ANTIGUA'}")
print(f"3. Cloudflare:       {'NUEVA' if 'INMOVA' in title_cf else 'ANTIGUA'}")
print(f"4. Docker:           {'NUEVA' if 'INMOVA' in title_docker else 'ANTIGUA'}")
print(f"5. Nginx:            {'NUEVA' if 'INMOVA' in title_nginx else 'ANTIGUA'}")

print("\n" + "="*80)
print("RECOMENDACIONES")
print("="*80 + "\n")

if 'INMOVA' not in title_cf:
    print("🔥 PROBLEMA PRINCIPAL: Cloudflare tiene cacheada la versión antigua")
    print("\nSOLUCIONES:")
    print("1. Purgar caché de Cloudflare DESDE EL DASHBOARD")
    print("2. Desactivar temporalmente el proxy de Cloudflare (nube gris)")
    print("3. Configurar Page Rule para bypass cache")
    print("4. Verificar que el dominio apunta a Cloudflare correctamente")

if 'INMOVA' not in title_direct:
    print("🔥 PROBLEMA: El servidor NO está sirviendo la landing nueva")
    print("\nSOLUCIONES:")
    print("1. Rebuild del contenedor Docker")
    print("2. Verificar archivos en /opt/inmova-app")

print("\n" + "="*80 + "\n")
