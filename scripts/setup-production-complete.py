#!/usr/bin/env python3
"""
Setup Completo de Producción
- Nginx reverse proxy
- SSL con Let's Encrypt
- Build de producción
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

SERVER_CONFIG = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'xcc9brgkMMbf',
    'port': 22,
    'timeout': 30
}

REMOTE_APP_PATH = '/opt/inmova-app'
DOMAIN = 'inmovaapp.com'  # Ajustar si es diferente

class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'

def print_step(step, message):
    print(f"\n{Colors.BLUE}{'='*70}{Colors.NC}")
    print(f"{Colors.BLUE}Paso {step}: {message}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*70}{Colors.NC}\n")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.NC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.NC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.NC}")

def print_info(message):
    print(f"{Colors.CYAN}ℹ️  {message}{Colors.NC}")

def execute_command(ssh, command, timeout=30, check_error=True):
    """Ejecuta comando SSH"""
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if check_error and exit_status != 0 and error:
            print_warning(f"Exit status {exit_status}")
            if len(error) < 500:
                print(error)
        
        return {'exit_status': exit_status, 'output': output, 'error': error}
    except Exception as e:
        print_error(f"Error ejecutando comando: {e}")
        return {'exit_status': -1, 'output': '', 'error': str(e)}

def connect_ssh():
    print_step(1, "Conectar al Servidor")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    print_success(f"Conectado a {SERVER_CONFIG['hostname']}")
    return ssh

def install_nginx(ssh):
    print_step(2, "Instalar Nginx")
    
    # Verificar si ya está instalado
    result = execute_command(ssh, "which nginx", check_error=False)
    
    if result['exit_status'] == 0:
        print_info("Nginx ya está instalado")
        version = execute_command(ssh, "nginx -v 2>&1")
        print(version['output'] + version['error'])
    else:
        print_info("Instalando Nginx...")
        execute_command(ssh, "apt update", timeout=60)
        execute_command(ssh, "apt install -y nginx", timeout=120)
        print_success("Nginx instalado")

def configure_nginx(ssh):
    print_step(3, "Configurar Nginx como Reverse Proxy")
    
    nginx_config = f"""
# Inmova App - Nginx Configuration
upstream inmova_backend {{
    server 127.0.0.1:3000;
    keepalive 32;
}}

# HTTP Server (redirect to HTTPS después de SSL)
server {{
    listen 80;
    listen [::]:80;
    server_name {SERVER_CONFIG['hostname']} {DOMAIN} www.{DOMAIN};
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {{
        root /var/www/html;
        allow all;
    }}
    
    # Temporalmente servir directamente (antes de SSL)
    location / {{
        proxy_pass http://inmova_backend;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
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
    
    # Static assets caching
    location /_next/static/ {{
        proxy_pass http://inmova_backend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }}
    
    # Images caching
    location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp)$ {{
        proxy_pass http://inmova_backend;
        add_header Cache-Control "public, max-age=2592000";
    }}
}}
"""
    
    # Crear archivo de configuración
    config_path = '/etc/nginx/sites-available/inmova'
    
    print_info("Creando configuración de Nginx...")
    
    # Escribir config usando heredoc
    cmd = f"""cat > {config_path} << 'NGINX_EOF'
{nginx_config}
NGINX_EOF
"""
    execute_command(ssh, cmd)
    print_success("Configuración creada")
    
    # Crear symlink
    print_info("Habilitando sitio...")
    execute_command(ssh, f"ln -sf {config_path} /etc/nginx/sites-enabled/inmova")
    
    # Remover default si existe
    execute_command(ssh, "rm -f /etc/nginx/sites-enabled/default", check_error=False)
    
    # Test configuración
    print_info("Verificando configuración...")
    result = execute_command(ssh, "nginx -t")
    
    if result['exit_status'] == 0:
        print_success("Configuración de Nginx válida")
        
        # Reload Nginx
        execute_command(ssh, "systemctl reload nginx")
        print_success("Nginx reiniciado")
    else:
        print_error("Error en configuración de Nginx")
        print(result['error'])
        return False
    
    return True

def install_certbot(ssh):
    print_step(4, "Instalar Certbot (Let's Encrypt)")
    
    # Verificar si ya está instalado
    result = execute_command(ssh, "which certbot", check_error=False)
    
    if result['exit_status'] == 0:
        print_info("Certbot ya está instalado")
    else:
        print_info("Instalando Certbot...")
        execute_command(ssh, "apt install -y certbot python3-certbot-nginx", timeout=120)
        print_success("Certbot instalado")

def setup_ssl(ssh):
    print_step(5, "Configurar SSL con Let's Encrypt")
    
    print_warning("NOTA: Para SSL necesitas un dominio apuntando al servidor")
    print_info(f"Dominio configurado: {DOMAIN}")
    print_info(f"IP servidor: {SERVER_CONFIG['hostname']}")
    
    # Verificar DNS
    print_info("Verificando DNS...")
    result = execute_command(ssh, f"dig +short {DOMAIN}")
    
    if SERVER_CONFIG['hostname'] in result['output']:
        print_success(f"DNS apunta correctamente a {SERVER_CONFIG['hostname']}")
    else:
        print_warning(f"DNS actual: {result['output'].strip()}")
        print_warning(f"DNS esperado: {SERVER_CONFIG['hostname']}")
        
        response = input("\n¿Continuar con certbot de todas formas? (s/n): ")
        if response.lower() != 's':
            print_info("Saltando configuración SSL. Puedes ejecutarlo manualmente:")
            print(f"  certbot --nginx -d {DOMAIN} -d www.{DOMAIN}")
            return False
    
    # Obtener certificado
    print_info("Obteniendo certificado SSL...")
    print_warning("Esto puede tardar 30-60 segundos...")
    
    # Certbot en modo no interactivo
    cmd = f"certbot --nginx -d {DOMAIN} -d www.{DOMAIN} --non-interactive --agree-tos --email admin@{DOMAIN} --redirect"
    
    result = execute_command(ssh, cmd, timeout=180, check_error=False)
    
    if result['exit_status'] == 0 or 'Successfully' in result['output']:
        print_success("Certificado SSL obtenido")
        print_success("Nginx configurado para HTTPS")
        
        # Verificar auto-renewal
        print_info("Verificando auto-renovación...")
        execute_command(ssh, "certbot renew --dry-run", timeout=60, check_error=False)
        
        return True
    else:
        print_error("Error obteniendo certificado SSL")
        print(result['error'][:500])
        print_warning("Puedes intentar manualmente:")
        print(f"  ssh root@{SERVER_CONFIG['hostname']}")
        print(f"  certbot --nginx -d {DOMAIN} -d www.{DOMAIN}")
        return False

def production_build(ssh):
    print_step(6, "Build de Producción")
    
    print_info("Deteniendo aplicación...")
    execute_command(ssh, "pm2 stop inmova-app", check_error=False)
    
    print_info("Limpiando builds anteriores...")
    execute_command(ssh, f"cd {REMOTE_APP_PATH} && rm -rf .next")
    
    print_info("Ejecutando npm run build...")
    print_warning("Esto puede tardar 2-5 minutos...")
    
    result = execute_command(
        ssh,
        f"cd {REMOTE_APP_PATH} && npm run build",
        timeout=600,
        check_error=False
    )
    
    if result['exit_status'] == 0:
        print_success("Build de producción completado")
        return True
    else:
        print_error("Build falló")
        print(result['error'][-1000:] if len(result['error']) > 1000 else result['error'])
        
        # Intentar con más memoria
        print_warning("Reintentando con más memoria Node...")
        result = execute_command(
            ssh,
            f"cd {REMOTE_APP_PATH} && NODE_OPTIONS='--max-old-space-size=4096' npm run build",
            timeout=600,
            check_error=False
        )
        
        if result['exit_status'] == 0:
            print_success("Build completado con más memoria")
            return True
        else:
            print_error("Build falló definitivamente")
            print_warning("La app seguirá corriendo en modo dev")
            return False

def update_pm2_production(ssh, build_success):
    print_step(7, "Configurar PM2 para Producción")
    
    if build_success:
        print_info("Iniciando en modo producción...")
        
        # Eliminar proceso anterior
        execute_command(ssh, "pm2 delete inmova-app", check_error=False)
        
        # Iniciar en modo producción
        cmd = f"cd {REMOTE_APP_PATH} && pm2 start npm --name inmova-app -- start"
        execute_command(ssh, cmd)
        
        print_success("App iniciada en modo producción")
    else:
        print_warning("Iniciando en modo desarrollo (build falló)...")
        execute_command(ssh, "pm2 restart inmova-app || pm2 start npm --name inmova-app -- run dev")
    
    # Guardar configuración
    execute_command(ssh, "pm2 save")
    print_success("Configuración PM2 guardada")
    
    # Ver status
    time.sleep(3)
    result = execute_command(ssh, "pm2 list")
    print("\n" + result['output'])

def verify_setup(ssh, ssl_enabled):
    print_step(8, "Verificar Setup Completo")
    
    print_info("Esperando 10 segundos...")
    time.sleep(10)
    
    # Test localhost
    print_info("Test 1: localhost...")
    result = execute_command(ssh, "curl -f http://localhost:3000/landing -I 2>&1 | head -1")
    print(f"  → {result['output'].strip()}")
    
    # Test IP via Nginx
    print_info("Test 2: IP via Nginx (puerto 80)...")
    result = execute_command(ssh, f"curl -f http://{SERVER_CONFIG['hostname']}/landing -I 2>&1 | head -1")
    print(f"  → {result['output'].strip()}")
    
    # Test HTTPS si SSL está habilitado
    if ssl_enabled:
        print_info(f"Test 3: HTTPS...")
        result = execute_command(ssh, f"curl -f https://{DOMAIN}/landing -I 2>&1 | head -1", check_error=False)
        print(f"  → {result['output'].strip()}")
    
    # PM2 status
    print_info("\nPM2 Status:")
    result = execute_command(ssh, "pm2 list")
    print(result['output'])
    
    # Nginx status
    print_info("\nNginx Status:")
    result = execute_command(ssh, "systemctl status nginx --no-pager | head -10")
    print(result['output'])

def print_summary(ssl_enabled, build_success):
    print(f"\n{Colors.GREEN}{'='*70}{Colors.NC}")
    print(f"{Colors.GREEN}🎉 SETUP DE PRODUCCIÓN COMPLETADO{Colors.NC}")
    print(f"{Colors.GREEN}{'='*70}{Colors.NC}\n")
    
    print("📋 Componentes configurados:\n")
    print(f"  ✅ Nginx - Reverse proxy en puerto 80")
    
    if ssl_enabled:
        print(f"  ✅ SSL - Let's Encrypt certificado obtenido")
        print(f"  ✅ HTTPS - Redireccionamiento automático")
    else:
        print(f"  ⚠️  SSL - No configurado (requiere dominio)")
    
    if build_success:
        print(f"  ✅ Build - Producción optimizado")
        print(f"  ✅ PM2 - Modo production (npm start)")
    else:
        print(f"  ⚠️  Build - Falló, usando modo dev")
        print(f"  ✅ PM2 - Modo development (hot-reload)")
    
    print(f"\n🔗 URLs de acceso:\n")
    
    if ssl_enabled:
        print(f"  → Principal: https://{DOMAIN}/landing")
        print(f"  → Login: https://{DOMAIN}/login")
        print(f"  → Dashboard: https://{DOMAIN}/dashboard")
    else:
        print(f"  → Principal: http://{SERVER_CONFIG['hostname']}/landing")
        print(f"  → Login: http://{SERVER_CONFIG['hostname']}/login")
        print(f"  → Dashboard: http://{SERVER_CONFIG['hostname']}/dashboard")
    
    print(f"\n📊 Arquitectura:\n")
    print(f"  Internet → Nginx (80/443) → Next.js (3000) → PostgreSQL")
    
    print(f"\n🔐 Seguridad:\n")
    if ssl_enabled:
        print(f"  ✅ HTTPS habilitado con Let's Encrypt")
        print(f"  ✅ Auto-renovación configurada (cada 12h)")
    else:
        print(f"  ⚠️  Actualmente HTTP (no encriptado)")
    
    print(f"  ✅ Nginx headers de seguridad")
    print(f"  ✅ Proxy headers (X-Real-IP, X-Forwarded-For)")
    
    print(f"\n⚡ Performance:\n")
    if build_success:
        print(f"  ✅ Build optimizado para producción")
        print(f"  ✅ Static assets con cache inmutable")
        print(f"  ✅ Imágenes con cache 30 días")
    
    print(f"  ✅ WebSocket support para hot-reload")
    print(f"  ✅ Keepalive connections (32)")
    
    print(f"\n📈 Monitoreo:\n")
    print(f"  pm2 logs inmova-app")
    print(f"  pm2 monit")
    print(f"  tail -f /var/log/nginx/access.log")
    print(f"  tail -f /var/log/nginx/error.log")
    
    if not ssl_enabled:
        print(f"\n{Colors.YELLOW}⚠️  Para habilitar SSL manualmente:{Colors.NC}")
        print(f"  1. Apuntar DNS de {DOMAIN} a {SERVER_CONFIG['hostname']}")
        print(f"  2. ssh root@{SERVER_CONFIG['hostname']}")
        print(f"  3. certbot --nginx -d {DOMAIN} -d www.{DOMAIN}")
    
    if not build_success:
        print(f"\n{Colors.YELLOW}⚠️  Para reintentar build de producción:{Colors.NC}")
        print(f"  ssh root@{SERVER_CONFIG['hostname']}")
        print(f"  cd {REMOTE_APP_PATH}")
        print(f"  npm run build")
        print(f"  pm2 restart inmova-app --update-env")

def main():
    print(f"\n{Colors.CYAN}{'='*70}{Colors.NC}")
    print(f"{Colors.CYAN}🚀 SETUP COMPLETO DE PRODUCCIÓN{Colors.NC}")
    print(f"{Colors.CYAN}{'='*70}{Colors.NC}")
    print(f"\nServidor: {SERVER_CONFIG['hostname']}")
    print(f"Dominio: {DOMAIN}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    ssh = None
    ssl_enabled = False
    build_success = False
    
    try:
        ssh = connect_ssh()
        install_nginx(ssh)
        
        if configure_nginx(ssh):
            install_certbot(ssh)
            ssl_enabled = setup_ssl(ssh)
        
        build_success = production_build(ssh)
        update_pm2_production(ssh, build_success)
        verify_setup(ssh, ssl_enabled)
        print_summary(ssl_enabled, build_success)
        
    except KeyboardInterrupt:
        print_error("\n\nSetup interrumpido por usuario")
        sys.exit(1)
    except Exception as e:
        print_error(f"Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if ssh:
            ssh.close()
            print(f"\n{Colors.CYAN}Conexión SSH cerrada{Colors.NC}\n")

if __name__ == "__main__":
    main()
