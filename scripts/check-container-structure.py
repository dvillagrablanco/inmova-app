#!/usr/bin/env python3
"""
Verificar estructura del contenedor
"""
import paramiko

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n🔍 ESTRUCTURA DEL CONTENEDOR\n")
    print("="*80 + "\n")
    
    # 1. List /app/
    print("1️⃣  Contenido de /app/:")
    _, out, _ = ssh.exec_command("docker exec inmova-app-new ls -la /app/ 2>&1 | head -30")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # 2. Check for page.tsx
    print("\n2️⃣  Buscando page.tsx en contenedor:")
    _, out, _ = ssh.exec_command("docker exec inmova-app-new find /app -name 'page.tsx' -type f 2>&1 | head -20")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # 3. Check if .next exists
    print("\n3️⃣  Verificando .next/:")
    _, out, _ = ssh.exec_command("docker exec inmova-app-new ls -la /app/.next/ 2>&1 | head -15")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # 4. Check landing page
    print("\n4️⃣  Buscando 'landing' en /app:")
    _, out, _ = ssh.exec_command("docker exec inmova-app-new find /app -name '*landing*' 2>&1 | head -20")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    print(result if result.strip() else "   (No se encontró 'landing')")
    
    # 5. Test direct request to /landing
    print("\n5️⃣  Test directo a /landing:")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/landing 2>&1 | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    landing_title = out.read().decode('utf-8').strip()
    print(f"   Título de /landing: {landing_title}")
    
    # 6. Test 404
    print("\n6️⃣  Test de 404:")
    _, out, _ = ssh.exec_command("curl -sI http://localhost:3000/landing 2>&1 | grep HTTP")
    out.channel.recv_exit_status()
    status = out.read().decode('utf-8').strip()
    print(f"   HTTP Status: {status}")
    
    print("\n" + "="*80)
    print("📋 CONCLUSIÓN:")
    print("="*80 + "\n")
    
    if '404' in status:
        print("❌ /landing NO EXISTE en la build")
        print("   El código fuente NO tiene app/landing/page.tsx en el build")
    elif 'INMOVA' in landing_title or 'PropTech #1' in landing_title:
        print("✅ /landing EXISTE y funciona")
        print("   El problema es solo el redirect de /")
    else:
        print("⚠️  /landing existe pero sirve contenido incorrecto")
    
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
