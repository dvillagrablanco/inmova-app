#!/usr/bin/env python3
"""
Configurar redirect en Nginx para solución definitiva
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
    print("🔧 CONFIGURANDO REDIRECT EN NGINX")
    print("="*80 + "\n")
    
    # 1. Backup current config
    print("1️⃣  Haciendo backup de configuración actual...")
    _, out, _ = ssh.exec_command("cp /etc/nginx/sites-enabled/inmovaapp.com /etc/nginx/sites-enabled/inmovaapp.com.backup")
    out.channel.recv_exit_status()
    print("   ✅ Backup creado\n")
    
    # 2. Get current config
    print("2️⃣  Leyendo configuración actual...")
    _, out, _ = ssh.exec_command("cat /etc/nginx/sites-enabled/inmovaapp.com")
    out.channel.recv_exit_status()
    current_config = out.read().decode('utf-8')
    
    # 3. Add redirect if not exists
    if 'location = / {' not in current_config and 'location = /$ {' not in current_config:
        print("   ⚠️  No hay redirect configurado, agregando...\n")
        
        # Create new config with redirect
        new_config = current_config.replace(
            'location / {',
            '''# Redirect raíz a landing
    location = / {
        return 301 /landing;
    }

    location / {'''
        )
        
        # Write new config
        _, stdin, _ = ssh.exec_command("cat > /etc/nginx/sites-enabled/inmovaapp.com")
        stdin.write(new_config)
        stdin.channel.shutdown_write()
        
        print("   ✅ Configuración actualizada\n")
    else:
        print("   ✅ Redirect ya existe en configuración\n")
    
    # 4. Test Nginx config
    print("3️⃣  Testeando configuración de Nginx...")
    _, out, err = ssh.exec_command("nginx -t 2>&1")
    out.channel.recv_exit_status()
    test_result = out.read().decode('utf-8')
    
    if 'successful' in test_result.lower() or 'ok' in test_result.lower():
        print("   ✅ Configuración válida\n")
    else:
        print(f"   ❌ Error en configuración:\n{test_result}\n")
        # Restore backup
        print("   Restaurando backup...")
        _, out, _ = ssh.exec_command("mv /etc/nginx/sites-enabled/inmovaapp.com.backup /etc/nginx/sites-enabled/inmovaapp.com")
        out.channel.recv_exit_status()
        print("   ✅ Backup restaurado\n")
        raise Exception("Nginx config test failed")
    
    # 5. Reload Nginx
    print("4️⃣  Recargando Nginx...")
    _, out, _ = ssh.exec_command("systemctl reload nginx")
    out.channel.recv_exit_status()
    print("   ✅ Nginx recargado\n")
    
    # 6. Test redirect
    print("5️⃣  Testeando redirect...")
    import time
    time.sleep(2)
    
    _, out, _ = ssh.exec_command("curl -sI http://localhost:80/ 2>&1 | grep -E 'HTTP|Location'")
    out.channel.recv_exit_status()
    redirect_test = out.read().decode('utf-8')
    print(f"   Resultado:\n{redirect_test}")
    
    if '301' in redirect_test or '302' in redirect_test:
        print("   ✅ Redirect configurado\n")
    
    # 7. Test final with -L (follow redirects)
    print("6️⃣  Test final siguiendo redirect...")
    _, out, _ = ssh.exec_command("curl -sL http://localhost:80/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    final_title = out.read().decode('utf-8').strip()
    print(f"   Título: {final_title}")
    
    if 'INMOVA' in final_title or 'PropTech #1' in final_title:
        print("   ✅✅✅ REDIRECT FUNCIONANDO ✅✅✅\n")
        success = True
    else:
        print("   ⚠️  Redirect no funciona como esperado\n")
        success = False
    
    # 8. Show final config snippet
    print("7️⃣  Configuración de redirect en Nginx:")
    _, out, _ = ssh.exec_command("grep -A 3 'location = /' /etc/nginx/sites-enabled/inmovaapp.com | head -5")
    out.channel.recv_exit_status()
    config_snippet = out.read().decode('utf-8')
    print(f"   {config_snippet}\n")
    
    print("="*80)
    if success:
        print("✅✅✅ REDIRECT CONFIGURADO EXITOSAMENTE ✅✅✅")
    else:
        print("⚠️  CONFIGURACIÓN APLICADA - Verificar en navegador")
    print("="*80)
    
    print("\n🌐 PRUEBA AHORA:")
    print("   1. Modo incógnito")
    print("   2. https://inmovaapp.com")
    print("   3. Debería redirigir a https://inmovaapp.com/landing")
    print("   4. Si persiste landing antigua, PURGA CLOUDFLARE")
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
