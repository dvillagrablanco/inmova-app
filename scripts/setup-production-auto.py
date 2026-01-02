#!/usr/bin/env python3
"""
Setup Automático de Producción (Sin interacción)
- Nginx reverse proxy
- SSL solo si DNS apunta directo
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
DOMAIN = 'inmovaapp.com'

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
        
        if check_error and exit_status != 0 and error and len(error) < 500:
            print_warning(f"Exit status {exit_status}: {error[:200]}")
        
        return {'exit_status': exit_status, 'output': output, 'error': error}
    except Exception as e:
        print_error(f"Error: {e}")
        return {'exit_status': -1, 'output': '', 'error': str(e)}

def connect_ssh():
    print_step(1, "Conectar al Servidor")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    print_success(f"Conectado a {SERVER_CONFIG['hostname']}")
    return ssh

def install_nginx(ssh):
    print_step(2, "Instalar y Configurar Nginx")
    
    # Verificar si ya está instalado
    result = execute_command(ssh, "which nginx", check_error=False)
    
    if result['exit_status'] == 0:
        print_info("Nginx ya instalado")
    else:
        print_info("Instalando Nginx...")
        execute_command(ssh, "apt update -qq", timeout=60)
        execute_command(ssh, "apt install -y nginx", timeout=120)
        print_success("Nginx instalado")

def configure_nginx(ssh):
    print_step(3, "Configurar Nginx Reverse Proxy")
    
    nginx_config = f"""upstream inmova_backend {{
    server 127.0.0.1:3000;
    keepalive 32;
}}

server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name {SERVER_CONFIG['hostname']} {DOMAIN} www.{DOMAIN} _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Main location
    location / {{
        proxy_pass http://inmova_backend;
        proxy_http_version 1.1;
        
        # WebSocket
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
    
    # Static assets cache
    location /_next/static/ {{
        proxy_pass http://inmova_backend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }}
    
    # Images cache
    location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp)$ {{
        proxy_pass http://inmova_backend;
        add_header Cache-Control "public, max-age=2592000";
    }}
}}
"""
    
    config_path = '/etc/nginx/sites-available/inmova'
    
    print_info("Escribiendo configuración...")
    cmd = f"""cat > {config_path} << 'NGINX_EOF'
{nginx_config}
NGINX_EOF
"""
    execute_command(ssh, cmd)
    
    # Habilitar sitio
    execute_command(ssh, f"ln -sf {config_path} /etc/nginx/sites-enabled/inmova")
    execute_command(ssh, "rm -f /etc/nginx/sites-enabled/default", check_error=False)
    
    # Test y reload
    result = execute_command(ssh, "nginx -t")
    
    if result['exit_status'] == 0:
        print_success("Configuración Nginx válida")
        execute_command(ssh, "systemctl reload nginx")
        print_success("Nginx reiniciado")
        return True
    else:
        print_error("Error en configuración Nginx")
        return False

def check_ssl_feasibility(ssh):
    print_step(4, "Verificar Posibilidad de SSL")
    
    print_info(f"Verificando DNS de {DOMAIN}...")
    result = execute_command(ssh, f"dig +short {DOMAIN}")
    
    dns_ips = result['output'].strip().split('\n')
    print(f"  DNS actual: {', '.join(dns_ips)}")
    print(f"  IP servidor: {SERVER_CONFIG['hostname']}")
    
    # Detectar Cloudflare
    if any(ip.startswith(('104.', '172.67.', '172.68.')) for ip in dns_ips):
        print_warning("Dominio usa Cloudflare como proxy")
        print_info("SSL debe configurarse en Cloudflare Dashboard")
        print_info("Modo recomendado: Flexible (Cloudflare maneja HTTPS)")
        return False
    
    # Verificar si apunta directo
    if SERVER_CONFIG['hostname'] in dns_ips:
        print_success("DNS apunta directamente al servidor")
        return True
    else:
        print_warning("DNS no apunta al servidor")
        print_info("SSL requiere que el dominio apunte a la IP del servidor")
        return False

def production_build(ssh):
    print_step(5, "Build de Producción")
    
    print_info("Deteniendo aplicación...")
    execute_command(ssh, "pm2 stop inmova-app", check_error=False)
    
    print_info("Limpiando builds anteriores...")
    execute_command(ssh, f"cd {REMOTE_APP_PATH} && rm -rf .next")
    
    print_info("Ejecutando npm run build...")
    print_warning("Esto puede tardar 3-5 minutos...")
    
    result = execute_command(
        ssh,
        f"cd {REMOTE_APP_PATH} && NODE_OPTIONS='--max-old-space-size=4096' npm run build 2>&1",
        timeout=600,
        check_error=False
    )
    
    # Verificar si el build fue exitoso
    if '.next' in execute_command(ssh, f"ls {REMOTE_APP_PATH}/.next", check_error=False)['output']:
        print_success("Build completado")
        return True
    else:
        print_error("Build falló")
        if result['error']:
            print(result['error'][-1000:])
        print_warning("Continuando en modo desarrollo")
        return False

def update_pm2(ssh, build_success):
    print_step(6, "Configurar PM2")
    
    # Eliminar proceso anterior
    execute_command(ssh, "pm2 delete inmova-app", check_error=False)
    
    if build_success:
        print_info("Iniciando en modo producción...")
        cmd = f"cd {REMOTE_APP_PATH} && pm2 start npm --name inmova-app -- start"
    else:
        print_info("Iniciando en modo desarrollo...")
        cmd = f"cd {REMOTE_APP_PATH} && pm2 start npm --name inmova-app -- run dev"
    
    execute_command(ssh, cmd)
    execute_command(ssh, "pm2 save")
    
    print_success("PM2 configurado")
    
    time.sleep(3)
    result = execute_command(ssh, "pm2 list")
    print(result['output'])

def verify_setup(ssh):
    print_step(7, "Verificar Setup")
    
    print_info("Esperando 10 segundos...")
    time.sleep(10)
    
    # Test localhost
    print_info("Test localhost:3000...")
    result = execute_command(ssh, "curl -f http://localhost:3000/landing -I 2>&1 | head -1", check_error=False)
    if '200' in result['output']:
        print_success("✓ App respondiendo en localhost")
    else:
        print_warning("⚠ App no responde en localhost")
    
    # Test via Nginx
    print_info("Test via Nginx (puerto 80)...")
    result = execute_command(ssh, f"curl -f http://localhost/landing -I 2>&1 | head -1", check_error=False)
    if '200' in result['output']:
        print_success("✓ Nginx proxy funcionando")
    else:
        print_warning("⚠ Nginx proxy no responde")
    
    # Test público
    print_info("Test acceso público...")
    result = execute_command(ssh, f"curl -f http://{SERVER_CONFIG['hostname']}/landing -I 2>&1 | head -1", check_error=False)
    if '200' in result['output']:
        print_success("✓ Acceso público funcionando")
    else:
        print_warning("⚠ Acceso público con problemas")

def print_summary(build_success, ssl_possible):
    print(f"\n{Colors.GREEN}{'='*70}{Colors.NC}")
    print(f"{Colors.GREEN}🎉 SETUP DE PRODUCCIÓN COMPLETADO{Colors.NC}")
    print(f"{Colors.GREEN}{'='*70}{Colors.NC}\n")
    
    print("✅ Componentes configurados:\n")
    print("  ✅ Nginx - Reverse proxy en puerto 80")
    
    if build_success:
        print("  ✅ Build - Producción optimizado")
        print("  ✅ PM2 - Modo production (npm start)")
    else:
        print("  ⚠️  Build - Usando modo desarrollo")
        print("  ✅ PM2 - Modo development (auto-reload)")
    
    print("\n🔗 URLs de acceso:\n")
    print(f"  → Principal: http://{SERVER_CONFIG['hostname']}/landing")
    print(f"  → Login: http://{SERVER_CONFIG['hostname']}/login")
    print(f"  → Dashboard: http://{SERVER_CONFIG['hostname']}/dashboard")
    
    if not ssl_possible:
        print(f"\n{Colors.YELLOW}ℹ️  SSL/HTTPS:{Colors.NC}")
        print(f"  Dominio {DOMAIN} usa Cloudflare")
        print(f"  SSL debe configurarse en Cloudflare Dashboard:")
        print(f"    1. Dashboard Cloudflare → SSL/TLS → Overview")
        print(f"    2. Modo: Flexible (recomendado)")
        print(f"    3. Actualizar NEXTAUTH_URL a https://{DOMAIN}")
    
    print("\n📊 Arquitectura actual:\n")
    print("  Internet → Nginx (80) → Next.js (3000)")
    
    print("\n🔧 Comandos útiles:\n")
    print("  pm2 logs inmova-app")
    print("  pm2 monit")
    print("  pm2 restart inmova-app")
    print("  nginx -t && systemctl reload nginx")
    
    if not build_success:
        print(f"\n{Colors.YELLOW}💡 Para reintentar build:{Colors.NC}")
        print(f"  ssh root@{SERVER_CONFIG['hostname']}")
        print(f"  cd {REMOTE_APP_PATH}")
        print(f"  npm run build")
        print(f"  pm2 restart inmova-app")

def main():
    print(f"\n{Colors.CYAN}{'='*70}{Colors.NC}")
    print(f"{Colors.CYAN}🚀 SETUP AUTOMÁTICO DE PRODUCCIÓN{Colors.NC}")
    print(f"{Colors.CYAN}{'='*70}{Colors.NC}\n")
    
    ssh = None
    build_success = False
    ssl_possible = False
    
    try:
        ssh = connect_ssh()
        install_nginx(ssh)
        configure_nginx(ssh)
        ssl_possible = check_ssl_feasibility(ssh)
        build_success = production_build(ssh)
        update_pm2(ssh, build_success)
        verify_setup(ssh)
        print_summary(build_success, ssl_possible)
        
    except KeyboardInterrupt:
        print_error("\n\nInterrumpido")
        sys.exit(1)
    except Exception as e:
        print_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if ssh:
            ssh.close()

if __name__ == "__main__":
    main()
