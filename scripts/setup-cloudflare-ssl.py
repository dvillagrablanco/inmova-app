#!/usr/bin/env python3
"""
Script para configurar SSL de Cloudflare Origin en el servidor
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
DOMAIN = "inmovaapp.com"

print("🔐 Configuración de SSL con Cloudflare Origin Certificate")
print("=" * 80)
print()
print("⚠️  ANTES DE CONTINUAR:")
print("   1. Ve a Cloudflare → SSL/TLS → Origin Server")
print("   2. Clic en 'Create Certificate'")
print("   3. Hostnames: *.inmovaapp.com, inmovaapp.com")
print("   4. Validez: 15 años")
print("   5. Copia el certificado y la clave privada")
print()
print("=" * 80)
print()

# Pedir certificado y clave
print("📝 Pega el CERTIFICADO (Origin Certificate) y presiona Enter dos veces:")
print("   (Incluye -----BEGIN CERTIFICATE----- y -----END CERTIFICATE-----)")
print()

cert_lines = []
while True:
    line = input()
    if line.strip() == "" and len(cert_lines) > 0:
        break
    cert_lines.append(line)

certificate = "\n".join(cert_lines)

print()
print("📝 Pega la CLAVE PRIVADA (Private Key) y presiona Enter dos veces:")
print("   (Incluye -----BEGIN PRIVATE KEY----- y -----END PRIVATE KEY-----)")
print()

key_lines = []
while True:
    line = input()
    if line.strip() == "" and len(key_lines) > 0:
        break
    key_lines.append(line)

private_key = "\n".join(key_lines)

print()
print("🔄 Subiendo certificados al servidor...")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    print("✅ Conectado\n")
    
    # Crear directorio
    stdin, stdout, stderr = ssh.exec_command("mkdir -p /etc/ssl/cloudflare")
    stdout.channel.recv_exit_status()
    
    # Guardar certificado
    cert_cmd = f"cat > /etc/ssl/cloudflare/{DOMAIN}.pem << 'EOFCERT'\n{certificate}\nEOFCERT"
    stdin, stdout, stderr = ssh.exec_command(cert_cmd)
    stdout.channel.recv_exit_status()
    
    # Guardar clave
    key_cmd = f"cat > /etc/ssl/cloudflare/{DOMAIN}.key << 'EOFKEY'\n{private_key}\nEOFKEY"
    stdin, stdout, stderr = ssh.exec_command(key_cmd)
    stdout.channel.recv_exit_status()
    
    # Permisos
    stdin, stdout, stderr = ssh.exec_command(f"chmod 600 /etc/ssl/cloudflare/{DOMAIN}.key")
    stdout.channel.recv_exit_status()
    stdin, stdout, stderr = ssh.exec_command(f"chmod 644 /etc/ssl/cloudflare/{DOMAIN}.pem")
    stdout.channel.recv_exit_status()
    
    print(f"✅ Certificados guardados en /etc/ssl/cloudflare/\n")
    
    # Actualizar Nginx
    print("🔧 Actualizando configuración de Nginx...")
    
    nginx_update = f"""sed -i 's|ssl_certificate .*;|ssl_certificate /etc/ssl/cloudflare/{DOMAIN}.pem;|' /etc/nginx/sites-available/{DOMAIN}
sed -i 's|ssl_certificate_key .*;|ssl_certificate_key /etc/ssl/cloudflare/{DOMAIN}.key;|' /etc/nginx/sites-available/{DOMAIN}"""
    
    stdin, stdout, stderr = ssh.exec_command(nginx_update)
    stdout.channel.recv_exit_status()
    
    # Probar configuración
    print("🧪 Probando configuración de Nginx...")
    stdin, stdout, stderr = ssh.exec_command("nginx -t")
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    
    print(output + error)
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("\n✅ Configuración de Nginx válida")
        
        # Recargar Nginx
        print("🔄 Recargando Nginx...")
        stdin, stdout, stderr = ssh.exec_command("systemctl reload nginx")
        stdout.channel.recv_exit_status()
        
        print("✅ Nginx recargado\n")
        
        print("=" * 80)
        print("🎉 CONFIGURACIÓN COMPLETADA")
        print("=" * 80)
        print()
        print(f"✅ Certificado SSL de Cloudflare instalado")
        print(f"✅ Nginx configurado para usar el certificado")
        print()
        print("🌐 Ahora configura Cloudflare:")
        print(f"   1. SSL/TLS → Overview → SSL Mode: Full (strict)")
        print(f"   2. DNS → Verifica que {DOMAIN} apunte a {SSH_HOST}")
        print(f"   3. Proxy activado (nube naranja)")
        print()
        print(f"🔗 Tu aplicación estará en: https://{DOMAIN}")
        print()
    else:
        print("\n❌ Error en configuración de Nginx")
        print("   Revisa los mensajes de error arriba")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
finally:
    ssh.close()
    print("🔌 Conexión cerrada")
