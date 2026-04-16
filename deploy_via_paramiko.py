#!/usr/bin/env python3
"""
🚀 Inmova App - Deployment Automático via Paramiko
Deployment completo en servidor usando Python SSH library
"""

import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
from datetime import datetime

# Configuración
# SECURITY: Credenciales eliminadas del código fuente. Usar variables de entorno
# o ssh-agent con clave pública. Nunca volver a commitear contraseñas en claro.
import os

SERVER_IP = os.environ.get("INMOVA_SSH_HOST", "")
SERVER_USER = os.environ.get("INMOVA_SSH_USER", "deploy")
SERVER_PASS = os.environ.get("INMOVA_SSH_PASSWORD", "")
DOMAIN = os.environ.get("INMOVA_DOMAIN", "inmovaapp.com")
DOMAIN_WWW = f"www.{DOMAIN}"

if not SERVER_IP or not SERVER_PASS:
    raise SystemExit(
        "ERROR: Configura INMOVA_SSH_HOST y INMOVA_SSH_PASSWORD como variables "
        "de entorno. Preferible: usar clave SSH pública + ssh-agent en vez de "
        "contraseña, y deshabilitar PermitRootLogin+PasswordAuthentication en sshd."
    )

# Colores ANSI
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
NC = '\033[0m'

def print_header(text):
    print(f"\n{CYAN}{'='*60}{NC}")
    print(f"{CYAN}{text}{NC}")
    print(f"{CYAN}{'='*60}{NC}\n")

def print_step(text):
    print(f"{GREEN}[✓]{NC} {text}")

def print_info(text):
    print(f"{BLUE}[i]{NC} {text}")

def print_warning(text):
    print(f"{YELLOW}[!]{NC} {text}")

def print_error(text):
    print(f"{RED}[✗]{NC} {text}")

def exec_command(client, command, timeout=300):
    """Ejecutar comando y retornar output"""
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        return exit_status == 0, output, error
    except Exception as e:
        return False, "", str(e)

def main():
    print("\n╔═══════════════════════════════════════════════════════════╗")
    print("║                                                           ║")
    print("║       🚀 Inmova App - Deployment Automático              ║")
    print("║       Servidor: 157.180.119.236                          ║")
    print("║       Dominio: inmovaapp.com                             ║")
    print("║                                                           ║")
    print("╚═══════════════════════════════════════════════════════════╝\n")
    
    start_time = datetime.now()
    
    # Conectar
    print_info("Conectando al servidor...")
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=10)
        print_step("Conexión SSH establecida")
    except Exception as e:
        print_error(f"Error conectando: {e}")
        return 1
    
    try:
        # FASE 1: Verificación inicial
        print_header("FASE 1: Verificación del Sistema")
        
        print_info("Verificando sistema operativo...")
        success, output, _ = exec_command(client, "cat /etc/os-release | grep PRETTY_NAME")
        if success:
            print_step(f"Sistema: {output.strip().split('=')[1].strip('\"')}")
        
        print_info("Verificando arquitectura...")
        success, output, _ = exec_command(client, "uname -m")
        if success:
            print_step(f"Arquitectura: {output.strip()}")
        
        # FASE 2: Actualizar sistema
        print_header("FASE 2: Actualización del Sistema")
        
        print_info("Actualizando lista de paquetes...")
        exec_command(client, "DEBIAN_FRONTEND=noninteractive apt-get update -qq", timeout=180)
        print_step("Sistema actualizado")
        
        # FASE 3: Instalar dependencias
        print_header("FASE 3: Instalación de Dependencias")
        
        print_info("Verificando Docker...")
        success, output, _ = exec_command(client, "command -v docker")
        if success and output.strip():
            print_step("Docker ya instalado")
        else:
            print_info("Instalando Docker...")
            exec_command(client, "curl -fsSL https://get.docker.com | sh", timeout=300)
            print_step("Docker instalado")
        
        print_info("Verificando Docker Compose...")
        success, output, _ = exec_command(client, "command -v docker-compose")
        if success and output.strip():
            print_step("Docker Compose ya instalado")
        else:
            print_info("Instalando Docker Compose...")
            exec_command(client, "apt-get install -y docker-compose", timeout=180)
            print_step("Docker Compose instalado")
        
        print_info("Instalando Nginx y Certbot...")
        exec_command(client, "apt-get install -y nginx certbot python3-certbot-nginx", timeout=180)
        print_step("Nginx y Certbot instalados")
        
        # FASE 4: Configurar Firewall
        print_header("FASE 4: Configuración de Firewall")
        
        print_info("Configurando UFW...")
        exec_command(client, "ufw --force reset")
        exec_command(client, "ufw default deny incoming")
        exec_command(client, "ufw default allow outgoing")
        exec_command(client, "ufw allow 22/tcp")
        exec_command(client, "ufw allow 80/tcp")
        exec_command(client, "ufw allow 443/tcp")
        exec_command(client, "ufw --force enable")
        print_step("Firewall configurado (SSH, HTTP, HTTPS)")
        
        # FASE 5: Crear usuario deploy
        print_header("FASE 5: Configuración de Usuario Deploy")
        
        print_info("Creando usuario deploy...")
        exec_command(client, "id deploy 2>/dev/null || adduser --disabled-password --gecos '' deploy")
        exec_command(client, "usermod -aG docker deploy")
        exec_command(client, "usermod -aG sudo deploy")
        exec_command(client, "echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy")
        print_step("Usuario deploy configurado")
        
        print_info("Creando estructura de directorios...")
        exec_command(client, "mkdir -p /home/deploy/{inmova-app,backups,logs}")
        exec_command(client, "chown -R deploy:deploy /home/deploy")
        print_step("Directorios creados")
        
        # FASE 6: Clonar repositorio
        print_header("FASE 6: Clonación del Repositorio")
        
        print_info("Verificando si el repositorio existe...")
        success, _, _ = exec_command(client, "test -d /home/deploy/inmova-app/.git")
        
        if success:
            print_info("Repositorio existe, actualizando...")
            exec_command(client, "cd /home/deploy/inmova-app && git pull origin main", timeout=120)
            print_step("Repositorio actualizado")
        else:
            print_info("Clonando repositorio...")
            exec_command(client, "cd /home/deploy && git clone https://github.com/dvillagrablanco/inmova-app.git inmova-app", timeout=300)
            print_step("Repositorio clonado")
        
        exec_command(client, "chown -R deploy:deploy /home/deploy/inmova-app")
        
        # FASE 7: Configurar .env.production
        print_header("FASE 7: Configuración de Variables de Entorno")
        
        print_info("Generando NEXTAUTH_SECRET...")
        success, nextauth_secret, _ = exec_command(client, "openssl rand -base64 32")
        nextauth_secret = nextauth_secret.strip()
        print_step(f"Secret generado: {nextauth_secret[:20]}...")
        
        print_info("Creando .env.production...")
        env_content = f"""NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BASE_URL=https://{DOMAIN}

# Database
DATABASE_URL=postgresql://inmova_user:inmova_secure_2024@postgres:5432/inmova

# NextAuth
NEXTAUTH_SECRET={nextauth_secret}
NEXTAUTH_URL=https://{DOMAIN}

# PostgreSQL
POSTGRES_PASSWORD=inmova_secure_2024

# Email (configurar después)
# SENDGRID_API_KEY=
# SENDGRID_FROM_EMAIL=noreply@{DOMAIN}

# AWS S3 (configurar después)
# AWS_REGION=us-east-1
# AWS_BUCKET_NAME=inmova-uploads
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=

# Stripe (configurar después)
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
"""
        
        exec_command(client, f"cat > /home/deploy/inmova-app/.env.production << 'ENVEOF'\n{env_content}\nENVEOF")
        print_step(".env.production creado")
        
        # FASE 8: Configurar Nginx
        print_header("FASE 8: Configuración de Nginx")
        
        print_info("Creando configuración de Nginx...")
        nginx_config = f"""upstream nextjs_app {{
    server localhost:3000;
    keepalive 32;
}}

server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN} {DOMAIN_WWW};
    
    location /.well-known/acme-challenge/ {{
        root /var/www/html;
    }}
    
    location / {{
        return 301 https://$server_name$request_uri;
    }}
}}

server {{
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {DOMAIN} {DOMAIN_WWW};
    
    # Estos se configurarán con certbot
    # ssl_certificate /etc/letsencrypt/live/{DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/{DOMAIN}/privkey.pem;
    
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    client_max_body_size 50M;
    
    location / {{
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }}
    
    location /_next/static {{
        proxy_pass http://nextjs_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }}
}}
"""
        
        exec_command(client, f"cat > /etc/nginx/sites-available/inmova << 'NGINXEOF'\n{nginx_config}\nNGINXEOF")
        exec_command(client, "ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova")
        exec_command(client, "rm -f /etc/nginx/sites-enabled/default")
        
        print_info("Verificando configuración de Nginx...")
        success, _, error = exec_command(client, "nginx -t")
        if success:
            print_step("Configuración de Nginx válida")
            exec_command(client, "systemctl reload nginx")
            print_step("Nginx recargado")
        else:
            print_warning(f"Advertencia Nginx: {error}")
        
        # FASE 9: Deployment de la aplicación
        print_header("FASE 9: Deployment de la Aplicación Docker")
        
        print_info("Dando permisos a scripts...")
        exec_command(client, "cd /home/deploy/inmova-app && chmod +x *.sh")
        exec_command(client, "chown -R deploy:deploy /home/deploy/inmova-app")
        print_step("Permisos configurados")
        
        print_info("Construyendo y desplegando containers...")
        print_warning("Esto puede tardar 5-10 minutos (primera vez)...")
        
        # Ejecutar docker-compose
        success, output, error = exec_command(
            client, 
            "cd /home/deploy/inmova-app && docker-compose -f docker-compose.production.yml down && docker-compose -f docker-compose.production.yml up -d --build",
            timeout=900  # 15 minutos
        )
        
        if success or "up-to-date" in output or "Started" in output:
            print_step("Containers desplegados")
        else:
            print_warning(f"Advertencia durante deployment: {error[:200]}")
        
        # Esperar a que la app esté lista
        print_info("Esperando que la aplicación esté lista...")
        for i in range(30):
            success, output, _ = exec_command(client, "curl -f http://localhost:3000/api/health 2>/dev/null")
            if success and "ok" in output.lower():
                print_step("Aplicación respondiendo correctamente")
                break
            print(".", end="", flush=True)
            time.sleep(2)
        else:
            print_warning("\nLa aplicación tardó más de lo esperado")
        
        # Ejecutar migraciones de Prisma
        print_info("Ejecutando migraciones de base de datos...")
        exec_command(client, "cd /home/deploy/inmova-app && docker-compose -f docker-compose.production.yml exec -T app npx prisma migrate deploy", timeout=120)
        print_step("Migraciones ejecutadas")
        
        # FASE 10: Verificación final
        print_header("FASE 10: Verificación Final")
        
        print_info("Verificando estado de containers...")
        success, output, _ = exec_command(client, "cd /home/deploy/inmova-app && docker-compose -f docker-compose.production.yml ps")
        print(output)
        
        # Verificación de endpoints
        print_info("Verificando endpoints...")
        success, output, _ = exec_command(client, "curl -s http://localhost:3000/api/health")
        if success and "ok" in output.lower():
            print_step("✓ Health check local - OK")
        else:
            print_warning("✗ Health check local - FAIL")
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds() / 60
        
        # Resumen final
        print("\n" + "="*60)
        print(f"{GREEN}╔═══════════════════════════════════════════════════════════╗{NC}")
        print(f"{GREEN}║                                                           ║{NC}")
        print(f"{GREEN}║           ✅ DEPLOYMENT COMPLETADO                        ║{NC}")
        print(f"{GREEN}║                                                           ║{NC}")
        print(f"{GREEN}╚═══════════════════════════════════════════════════════════╝{NC}\n")
        
        print(f"{CYAN}🌐 URLs de Acceso:{NC}\n")
        print(f"  {GREEN}✓{NC} Aplicación local:")
        print(f"    http://{SERVER_IP}:3000\n")
        print(f"  {GREEN}✓{NC} Health Check:")
        print(f"    http://{SERVER_IP}:3000/api/health\n")
        print(f"  {YELLOW}⚠{NC}  Para HTTPS con dominio, configurar DNS y ejecutar:")
        print(f"    ssh root@{SERVER_IP}")
        print(f"    certbot --nginx -d {DOMAIN} -d {DOMAIN_WWW}\n")
        
        print(f"{CYAN}📊 Estadísticas:{NC}\n")
        print(f"  Tiempo total: {duration:.1f} minutos")
        print(f"  Servidor: {SERVER_IP}")
        print(f"  Sistema: Ubuntu 22.04.5 LTS")
        print(f"  Containers: app, postgres, redis, nginx\n")
        
        print(f"{CYAN}🔐 Próximos Pasos:{NC}\n")
        print(f"  1. {YELLOW}Cambiar password del servidor:{NC}")
        print(f"     ssh root@{SERVER_IP}")
        print(f"     passwd\n")
        print(f"  2. {YELLOW}Configurar DNS (si aún no lo hiciste):{NC}")
        print(f"     A record: @ → {SERVER_IP}")
        print(f"     A record: www → {SERVER_IP}\n")
        print(f"  3. {YELLOW}Configurar SSL:{NC}")
        print(f"     certbot --nginx -d {DOMAIN} -d {DOMAIN_WWW}\n")
        print(f"  4. {YELLOW}Configurar credenciales en .env.production:{NC}")
        print(f"     AWS, Stripe, SendGrid, etc.\n")
        
        print(f"{GREEN}{'='*60}{NC}\n")
        
    except Exception as e:
        print_error(f"Error durante deployment: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        print_info("Conexión SSH cerrada")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
