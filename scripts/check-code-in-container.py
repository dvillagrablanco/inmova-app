#!/usr/bin/env python3
"""
Verificar qué código está dentro del contenedor
"""
import paramiko

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n" + "="*80)
    print("🔍 VERIFICANDO CÓDIGO DENTRO DEL CONTENEDOR")
    print("="*80 + "\n")
    
    # 1. Check app/page.tsx inside container
    print("1️⃣  Verificando app/page.tsx DENTRO del contenedor...")
    _, out, _ = ssh.exec_command("docker exec inmova-app-new cat /app/app/page.tsx 2>&1")
    out.channel.recv_exit_status()
    page_tsx = out.read().decode('utf-8')
    
    if 'redirect' in page_tsx and '/landing' in page_tsx:
        print("   ✅ app/page.tsx tiene redirect a /landing")
        print(f"   Contenido:\n{page_tsx[:200]}\n")
    else:
        print("   ❌ app/page.tsx NO tiene el redirect")
        print(f"   Contenido:\n{page_tsx[:500]}\n")
    
    # 2. Check if app/landing/page.tsx exists in container
    print("2️⃣  Verificando si app/landing/page.tsx existe en contenedor...")
    _, out, _ = ssh.exec_command("docker exec inmova-app-new ls -la /app/app/landing/page.tsx 2>&1")
    out.channel.recv_exit_status()
    landing_exists = out.read().decode('utf-8')
    
    if 'No such file' in landing_exists:
        print("   ❌ app/landing/page.tsx NO EXISTE en contenedor\n")
    else:
        print("   ✅ app/landing/page.tsx existe")
        print(f"   {landing_exists}\n")
    
    # 3. List app directory
    print("3️⃣  Contenido de /app/app/ en contenedor:")
    _, out, _ = ssh.exec_command("docker exec inmova-app-new ls -la /app/app/ 2>&1 | head -20")
    out.channel.recv_exit_status()
    app_contents = out.read().decode('utf-8')
    print(app_contents)
    
    # 4. Check git log in SERVER (not container)
    print("\n4️⃣  Últimos commits en SERVIDOR:")
    _, out, _ = ssh.exec_command("cd /opt/inmova-app && git log --oneline --graph -5")
    out.channel.recv_exit_status()
    commits = out.read().decode('utf-8')
    print(commits)
    
    # 5. Check if app/landing exists in SERVER
    print("\n5️⃣  Verificando app/landing en SERVIDOR:")
    _, out, _ = ssh.exec_command("ls -la /opt/inmova-app/app/landing/ 2>&1 | head -5")
    out.channel.recv_exit_status()
    server_landing = out.read().decode('utf-8')
    print(server_landing)
    
    # 6. Solution
    print("\n" + "="*80)
    print("🎯 DIAGNÓSTICO:")
    print("="*80 + "\n")
    
    if 'No such file' in landing_exists:
        print("❌ PROBLEMA: El contenedor NO tiene app/landing/page.tsx")
        print("   El build usó código ANTIGUO del servidor\n")
        print("✅ SOLUCIÓN:")
        print("   1. Verificar que app/landing/page.tsx existe en servidor")
        print("   2. Hacer git pull en servidor")
        print("   3. Reconstruir imagen Docker")
    else:
        print("✅ El código correcto ESTÁ en el contenedor")
        print("   Pero algo más está mal (Next.js cache, routing, etc.)")
    
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
