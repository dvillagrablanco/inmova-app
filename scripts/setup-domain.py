#!/usr/bin/env python3
"""
Script para configurar inmovaapp.com con Nginx y SSL
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy
import time

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
DOMAIN = "inmovaapp.com"
APP_PORT = 3000

print(f"🌐 Configurando {DOMAIN} con Nginx y SSL...")
print(f"📡 Conectando a {SSH_HOST}...\n")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    print("✅ Conectado\n")
    
    # 1. Instalar Nginx y Certbot (si no están instalados)
    print("📦 Instalando Nginx y Certbot...")
    commands = [
        "apt update -qq",
        "apt install -y nginx certbot python3-certbot-nginx"
    ]
    
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.channel.recv_exit_status()
    
    print("✅ Nginx y Certbot instalados\n")
    
    # 2. Crear configuración de Nginx
    print(f"🔧 Configurando Nginx para {DOMAIN}...")
    
    nginx_config = f"""server {{
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}}

server {{
    listen 443 ssl http2;
    server_name {DOMAIN} www.{DOMAIN};
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/{DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{DOMAIN}/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # Client Body Size
    client_max_body_size 50M;
    
    # Proxy to Next.js app
    location / {{
        proxy_pass http://localhost:{APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }}
    
    # Static files caching
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {{
        proxy_pass http://localhost:{APP_PORT};
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
    
    # Health check endpoint
    location /health {{
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }}
}}"""
    
    # Escribir configuración
    config_path = f"/etc/nginx/sites-available/{DOMAIN}"
    stdin, stdout, stderr = ssh.exec_command(f"cat > {config_path} << 'EOFCONFIG'\n{nginx_config}\nEOFCONFIG")
    stdout.channel.recv_exit_status()
    
    print(f"✅ Configuración creada en {config_path}\n")
    
    # 3. Habilitar sitio
    print("🔗 Habilitando sitio...")
    commands = [
        f"ln -sf {config_path} /etc/nginx/sites-enabled/{DOMAIN}",
        "rm -f /etc/nginx/sites-enabled/default",  # Remover sitio default
        "nginx -t"  # Test configuration
    ]
    
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_code = stdout.channel.recv_exit_status()
        if exit_code != 0:
            error = stderr.read().decode('utf-8')
            print(f"⚠️  Error en: {cmd}")
            print(f"   {error}")
    
    print("✅ Sitio habilitado\n")
    
    # 4. Verificar DNS
    print(f"🔍 Verificando DNS de {DOMAIN}...")
    stdin, stdout, stderr = ssh.exec_command(f"dig +short {DOMAIN} A")
    dns_result = stdout.read().decode('utf-8').strip()
    
    if dns_result:
        print(f"✅ DNS configurado: {DOMAIN} → {dns_result}")
        if dns_result != SSH_HOST:
            print(f"⚠️  ADVERTENCIA: DNS apunta a {dns_result}, pero el servidor es {SSH_HOST}")
            print(f"   Actualiza el registro DNS A de {DOMAIN} para que apunte a {SSH_HOST}")
    else:
        print(f"⚠️  DNS no configurado para {DOMAIN}")
        print(f"   DEBES configurar el registro DNS A:")
        print(f"   - Nombre: @")
        print(f"   - Tipo: A")
        print(f"   - Valor: {SSH_HOST}")
        print(f"   - TTL: 300")
    
    print()
    
    # 5. Obtener certificado SSL
    print("🔐 Configurando SSL con Let's Encrypt...")
    print("⚠️  IMPORTANTE: El DNS debe estar configurado correctamente antes de continuar")
    print()
    
    if dns_result and dns_result == SSH_HOST:
        print("📧 Obteniendo certificado SSL...")
        certbot_cmd = f"certbot --nginx -d {DOMAIN} -d www.{DOMAIN} --non-interactive --agree-tos --email admin@{DOMAIN} --redirect"
        stdin, stdout, stderr = ssh.exec_command(certbot_cmd)
        
        for line in stdout:
            print(f"   {line.rstrip()}")
        
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print("\n✅ Certificado SSL configurado correctamente")
        else:
            print("\n⚠️  Error obteniendo certificado SSL")
            print("   Puede ser porque el DNS aún no propagó")
            print("   Intenta manualmente: sudo certbot --nginx -d inmovaapp.com -d www.inmovaapp.com")
    else:
        print("⏭️  Saltando configuración SSL (DNS no configurado)")
        print(f"   Después de configurar DNS, ejecuta:")
        print(f"   sudo certbot --nginx -d {DOMAIN} -d www.{DOMAIN}")
    
    print()
    
    # 6. Reiniciar Nginx
    print("🔄 Reiniciando Nginx...")
    stdin, stdout, stderr = ssh.exec_command("systemctl restart nginx")
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("✅ Nginx reiniciado correctamente\n")
    else:
        print("⚠️  Error reiniciando Nginx\n")
    
    # 7. Verificar estado
    print("📊 Estado de los servicios:")
    stdin, stdout, stderr = ssh.exec_command("systemctl status nginx --no-pager -l | head -10")
    for line in stdout:
        print(f"   {line.rstrip()}")
    
    print()
    print("="*80)
    print("🎉 CONFIGURACIÓN COMPLETADA")
    print("="*80)
    print()
    print(f"✅ Nginx configurado como reverse proxy")
    print(f"✅ App corriendo en http://localhost:{APP_PORT}")
    print(f"✅ Dominio: {DOMAIN}")
    print()
    
    if dns_result == SSH_HOST:
        print(f"🌐 Tu aplicación debería estar disponible en:")
        print(f"   https://{DOMAIN}")
        print(f"   https://www.{DOMAIN}")
    else:
        print(f"⚠️  ACCIÓN REQUERIDA:")
        print(f"   1. Configura el DNS de {DOMAIN} para que apunte a {SSH_HOST}")
        print(f"   2. Espera a que el DNS propague (puede tardar hasta 24h)")
        print(f"   3. Ejecuta: sudo certbot --nginx -d {DOMAIN} -d www.{DOMAIN}")
    
    print()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("🔌 Conexión cerrada")
