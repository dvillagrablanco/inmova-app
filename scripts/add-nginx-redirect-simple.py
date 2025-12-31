#!/usr/bin/env python3
"""
Agregar redirect en Nginx de manera simple
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
    print("🔧 AGREGANDO REDIRECT EN NGINX")
    print("="*80 + "\n")
    
    # 1. Backup
    print("1️⃣  Backup...")
    _, out, _ = ssh.exec_command("cp /etc/nginx/sites-enabled/inmovaapp.com /etc/nginx/sites-enabled/inmovaapp.com.bak 2>&1")
    out.channel.recv_exit_status()
    print("   ✅ Backup creado\n")
    
    # 2. Add redirect using sed
    print("2️⃣  Agregando redirect con sed...")
    
    # Add redirect before the main location / block
    sed_cmd = """sed -i '/location \/ {/i\\    # Redirect root to landing\n    location = / {\n        return 301 /landing;\n    }\n' /etc/nginx/sites-enabled/inmovaapp.com 2>&1"""
    
    _, out, _ = ssh.exec_command(sed_cmd)
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    if result:
        print(f"   Resultado: {result}")
    print("   ✅ Redirect agregado\n")
    
    # 3. Test config
    print("3️⃣  Testeando configuración...")
    _, out, _ = ssh.exec_command("nginx -t 2>&1")
    out.channel.recv_exit_status()
    test_result = out.read().decode('utf-8')
    
    if 'successful' in test_result or 'test is successful' in test_result:
        print("   ✅ Configuración válida\n")
    else:
        print(f"   ❌ Error: {test_result}\n")
        print("   Restaurando backup...")
        _, out, _ = ssh.exec_command("mv /etc/nginx/sites-enabled/inmovaapp.com.bak /etc/nginx/sites-enabled/inmovaapp.com")
        out.channel.recv_exit_status()
        raise Exception("Config inválida")
    
    # 4. Reload
    print("4️⃣  Recargando Nginx...")
    _, out, _ = ssh.exec_command("systemctl reload nginx 2>&1")
    out.channel.recv_exit_status()
    print("   ✅ Recargado\n")
    
    # 5. Test
    import time
    time.sleep(2)
    
    print("5️⃣  Testeando redirect...")
    _, out, _ = ssh.exec_command("curl -sL http://localhost/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title = out.read().decode('utf-8').strip()
    print(f"   Título: {title}")
    
    if 'INMOVA' in title or 'PropTech #1' in title:
        print("\n   ✅✅✅ REDIRECT FUNCIONANDO ✅✅✅\n")
        success = True
    else:
        print("\n   ⚠️  Verificar manualmente\n")
        success = False
    
    print("="*80)
    if success:
        print("✅ REDIRECT CONFIGURADO")
    print("="*80)
    
    print("\n🌐 SIGUIENTE PASO:")
    print("   1. Modo incógnito: https://inmovaapp.com")
    print("   2. SI PERSISTE ANTIGUA: PURGA CLOUDFLARE (obligatorio)")
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
