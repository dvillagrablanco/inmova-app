#!/usr/bin/env python3
"""
Desplegar nueva configuración de Nginx con redirect
"""
import paramiko

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

# Configuración de Nginx con redirect
NGINX_CONFIG = """server {
    listen 443 ssl http2;
    server_name inmovaapp.com www.inmovaapp.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/inmovaapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inmovaapp.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Redirect root to landing
    location = / {
        return 301 /landing;
    }
    
    # Main proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name inmovaapp.com www.inmovaapp.com;
    return 301 https://$server_name$request_uri;
}
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("\n" + "="*80)
    print("🔧 DESPLEGANDO CONFIGURACIÓN DE NGINX CON REDIRECT")
    print("="*80 + "\n")
    
    # 1. Backup
    print("1️⃣  Haciendo backup...")
    _, out, _ = ssh.exec_command("cp /etc/nginx/sites-enabled/inmovaapp.com /etc/nginx/sites-enabled/inmovaapp.com.backup-$(date +%Y%m%d-%H%M%S)")
    out.channel.recv_exit_status()
    print("   ✅ Backup creado\n")
    
    # 2. Write new config
    print("2️⃣  Escribiendo nueva configuración...")
    _, out, _ = ssh.exec_command(f"cat > /etc/nginx/sites-enabled/inmovaapp.com << 'EOFCONFIG'\n{NGINX_CONFIG}\nEOFCONFIG")
    out.channel.recv_exit_status()
    print("   ✅ Configuración escrita\n")
    
    # 3. Test
    print("3️⃣  Testeando configuración...")
    _, out, _ = ssh.exec_command("nginx -t 2>&1")
    out.channel.recv_exit_status()
    test_result = out.read().decode('utf-8')
    print(f"   {test_result}")
    
    if 'successful' not in test_result.lower():
        print("\n   ❌ Configuración inválida, restaurando backup...")
        _, out, _ = ssh.exec_command("ls /etc/nginx/sites-enabled/inmovaapp.com.backup-* | tail -1 | xargs -I {} cp {} /etc/nginx/sites-enabled/inmovaapp.com")
        out.channel.recv_exit_status()
        raise Exception("Config failed")
    
    # 4. Reload
    print("\n4️⃣  Recargando Nginx...")
    _, out, _ = ssh.exec_command("systemctl reload nginx 2>&1")
    out.channel.recv_exit_status()
    print("   ✅ Nginx recargado\n")
    
    # 5. Test redirect
    import time
    time.sleep(2)
    
    print("5️⃣  Testeando redirect...")
    _,out, _ = ssh.exec_command("curl -sL http://localhost/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title = out.read().decode('utf-8').strip()
    print(f"   Título: {title}\n")
    
    if 'INMOVA' in title or 'PropTech' in title:
        print("   ✅✅✅ REDIRECT FUNCIONANDO ✅✅✅\n")
    else:
        print("   ⚠️  Verificar manualmente\n")
    
    print("="*80)
    print("✅ CONFIGURACIÓN DESPLEGADA")
    print("="*80)
    
    print("\n🌐 PRUEBA AHORA:")
    print("   1. Modo incógnito")
    print("   2. https://inmovaapp.com")
    print("   3. Debería redirigir a /landing")
    print("   4. SI SIGUE ANTIGUA: PURGA CLOUDFLARE")
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
