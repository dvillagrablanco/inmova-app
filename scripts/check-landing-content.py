#!/usr/bin/env python3
"""
Verificar qué landing se está sirviendo
"""
import paramiko

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n🔍 DIAGNÓSTICO DE LANDING\n")
    print("="*80 + "\n")
    
    # 1. Check redirect
    print("1️⃣  Verificando redirect raíz (/):")
    _, out, _ = ssh.exec_command("curl -sL -o /dev/null -w '%{url_effective}' http://localhost:3000/")
    out.channel.recv_exit_status()
    final_url = out.read().decode('utf-8').strip()
    print(f"   Redirige a: {final_url}")
    if '/landing' in final_url:
        print("   ✅ Redirect correcto")
    else:
        print("   ⚠️  NO redirige a /landing")
    
    # 2. Check page.tsx content
    print("\n2️⃣  Verificando app/page.tsx en servidor:")
    _, out, _ = ssh.exec_command("cat /opt/inmova-app/app/page.tsx")
    out.channel.recv_exit_status()
    page_content = out.read().decode('utf-8')
    if 'redirect' in page_content and '/landing' in page_content:
        print("   ✅ page.tsx tiene redirect a /landing")
        print(f"   Contenido: {page_content[:200]}")
    else:
        print("   ❌ page.tsx NO tiene redirect correcto")
        print(f"   Contenido actual:\n{page_content[:500]}")
    
    # 3. Check landing page exists
    print("\n3️⃣  Verificando app/landing/page.tsx:")
    _, out, _ = ssh.exec_command("ls -la /opt/inmova-app/app/landing/page.tsx 2>&1")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    if 'No such file' in result:
        print("   ❌ app/landing/page.tsx NO EXISTE")
    else:
        print("   ✅ app/landing/page.tsx existe")
        print(f"   {result}")
    
    # 4. Check what / returns
    print("\n4️⃣  Contenido HTML de / (primeras líneas):")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/ | head -20")
    out.channel.recv_exit_status()
    html = out.read().decode('utf-8')
    print(html)
    
    # 5. Check Next.js cache
    print("\n5️⃣  Cache de Next.js:")
    _, out, _ = ssh.exec_command("ls -la /opt/inmova-app/.next/cache 2>&1 | head -5")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    # 6. Check container logs for errors
    print("\n6️⃣  Últimos logs del contenedor:")
    _, out, _ = ssh.exec_command("docker logs --tail 15 inmova-app-npm 2>&1")
    out.channel.recv_exit_status()
    logs = out.read().decode('utf-8')
    if 'error' in logs.lower() or 'warn' in logs.lower():
        print("   ⚠️  Hay warnings/errors:")
    print(logs[:600])
    
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
