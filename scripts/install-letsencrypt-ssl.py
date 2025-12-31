#!/usr/bin/env python3
"""
Script para instalar certificado SSL de Let's Encrypt con validación DNS de Cloudflare
Alternativa: Certificado autofirmado para modo Full
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
DOMAIN = "inmovaapp.com"

print("🔐 Instalando Certificado SSL para Nginx")
print("=" * 80)
print()
print("Opciones disponibles:")
print("1. Certificado autofirmado (RÁPIDO - para usar con Cloudflare 'Full')")
print("2. Certificado Origin de Cloudflare (RECOMENDADO - requiere copiar cert)")
print()
print("Usando opción 1: Certificado autofirmado")
print("=" * 80)
print()

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    print("✅ Conectado al servidor\n")
    
    # 1. Generar certificado autofirmado
    print("📝 Generando certificado SSL autofirmado...")
    
    commands = [
        "mkdir -p /etc/ssl/private",
        f"openssl req -x509 -nodes -days 365 -newkey rsa:2048 "
        f"-keyout /etc/ssl/private/{DOMAIN}.key "
        f"-out /etc/ssl/certs/{DOMAIN}.crt "
        f"-subj '/C=ES/ST=Madrid/L=Madrid/O=INMOVA/OU=IT/CN={DOMAIN}' "
        f"-addext 'subjectAltName=DNS:{DOMAIN},DNS:www.{DOMAIN}'"
    ]
    
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.channel.recv_exit_status()
    
    print("✅ Certificado generado\n")
    
    # 2. Configurar permisos
    print("🔒 Configurando permisos...")
    stdin, stdout, stderr = ssh.exec_command(f"chmod 600 /etc/ssl/private/{DOMAIN}.key")
    stdout.channel.recv_exit_status()
    stdin, stdout, stderr = ssh.exec_command(f"chmod 644 /etc/ssl/certs/{DOMAIN}.crt")
    stdout.channel.recv_exit_status()
    
    print("✅ Permisos configurados\n")
    
    # 3. Actualizar configuración de Nginx
    print("🔧 Actualizando configuración de Nginx...")
    
    nginx_update = f"""sed -i 's|ssl_certificate .*;|ssl_certificate /etc/ssl/certs/{DOMAIN}.crt;|' /etc/nginx/sites-available/{DOMAIN}
sed -i 's|ssl_certificate_key .*;|ssl_certificate_key /etc/ssl/private/{DOMAIN}.key;|' /etc/nginx/sites-available/{DOMAIN}"""
    
    stdin, stdout, stderr = ssh.exec_command(nginx_update)
    stdout.channel.recv_exit_status()
    
    print("✅ Configuración actualizada\n")
    
    # 4. Probar configuración
    print("🧪 Probando configuración de Nginx...")
    stdin, stdout, stderr = ssh.exec_command("nginx -t")
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    
    print(output + error)
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("\n✅ Configuración válida")
        
        # 5. Recargar Nginx
        print("🔄 Recargando Nginx...")
        stdin, stdout, stderr = ssh.exec_command("systemctl reload nginx")
        stdout.channel.recv_exit_status()
        
        print("✅ Nginx recargado\n")
        
        print("=" * 80)
        print("🎉 CERTIFICADO SSL INSTALADO")
        print("=" * 80)
        print()
        print("✅ Certificado SSL autofirmado configurado")
        print("✅ Nginx usando HTTPS")
        print()
        print("🌐 IMPORTANTE - Actualiza Cloudflare:")
        print()
        print("   1. Ve a Cloudflare → SSL/TLS → Overview")
        print("   2. Cambia el modo SSL de 'Flexible' a 'Full'")
        print("   3. (Opcional) Cambia a 'Full (strict)' si usas certificado Origin")
        print()
        print("⚠️  Con certificado autofirmado, usa modo 'Full' (NO 'Full strict')")
        print()
        print("🔗 Después de cambiar en Cloudflare, verifica:")
        print("   https://inmovaapp.com")
        print()
        
        # 6. Verificar que Nginx esté escuchando en 443
        print("📊 Verificando puertos:")
        stdin, stdout, stderr = ssh.exec_command("netstat -tulpn | grep nginx")
        for line in stdout:
            print(f"   {line.rstrip()}")
        print()
        
    else:
        print("\n❌ Error en configuración de Nginx")
        print("   Revisa los mensajes de error arriba")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("🔌 Conexión cerrada")
