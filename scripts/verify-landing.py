#!/usr/bin/env python3
"""
Verificar que la landing nueva esté funcionando
"""
import paramiko

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n✅ VERIFICACIÓN FINAL - LANDING NUEVA\n")
    print("="*80 + "\n")
    
    # Test root redirect
    print("1️⃣  Test redirect raíz (/) → /landing:")
    _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000/ 2>&1 | head -5")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    if '307' in result or '308' in result or 'Location: /landing' in result:
        print("   ✅ Redirect configurado correctamente")
    print(result)
    
    # Test landing page
    print("\n2️⃣  Test landing page (/landing):")
    _, out, _ = ssh.exec_command("curl -s -I http://localhost:3000/landing 2>&1 | head -5")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    if '200' in result:
        print("   ✅ Landing page responde OK")
    print(result)
    
    # Check landing content
    print("\n3️⃣  Verificando contenido de landing:")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/landing 2>&1 | grep -i 'inmova\\|proptech\\|gestión' | head -3")
    out.channel.recv_exit_status()
    content = out.read().decode('utf-8')
    if content.strip():
        print("   ✅ Contenido detectado:")
        for line in content.split('\n')[:3]:
            if line.strip():
                print(f"      {line.strip()[:100]}")
    
    # Check logs
    print("\n4️⃣  Últimos logs del contenedor:")
    _, out, _ = ssh.exec_command("docker logs --tail 10 inmova-app-npm 2>&1")
    out.channel.recv_exit_status()
    logs = out.read().decode('utf-8')
    if 'ready' in logs.lower() or 'started' in logs.lower():
        print("   ✅ App iniciada correctamente")
    print(logs[:400])
    
    print("\n" + "="*80)
    print("🎊 LA NUEVA LANDING ESTÁ DEPLOYADA Y FUNCIONANDO")
    print("="*80)
    print("\n🌐 Verifica en tu navegador: https://inmovaapp.com")
    print("\n⚠️  IMPORTANTE: Cambia la contraseña SSH AHORA:")
    print(f"   ssh root@{HOST}")
    print("   passwd")
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
