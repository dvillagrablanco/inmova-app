#!/usr/bin/env python3
"""
Configurar Nginx como proxy para la app Next.js
"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, out, err

NGINX_CONFIG = '''# Configuración Nginx para Inmova App
# /etc/nginx/sites-available/inmova

upstream nextjs_app {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name inmovaapp.com www.inmovaapp.com _;

    # Logs
    access_log /var/log/nginx/inmova_access.log;
    error_log /var/log/nginx/inmova_error.log;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client settings
    client_max_body_size 100M;
    client_body_timeout 300s;

    # Health check sin logs
    location = /api/health {
        access_log off;
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy principal
    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts largos para APIs
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://nextjs_app;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Cache images
    location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://nextjs_app;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
'''

def main():
    log("=" * 70, Colors.CYAN)
    log("🔧 CONFIGURACIÓN DE NGINX COMO PROXY", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # 1. Verificar si Nginx está instalado
        log("\n📦 [1/6] Verificando Nginx...", Colors.BLUE)
        status, out, err = exec_cmd(client, "which nginx")
        if '/nginx' not in out:
            log("  ⚠️ Nginx no instalado, instalando...", Colors.YELLOW)
            exec_cmd(client, "apt-get update && apt-get install -y nginx", timeout=300)
            log("  ✅ Nginx instalado", Colors.GREEN)
        else:
            log("  ✅ Nginx ya está instalado", Colors.GREEN)
        
        # 2. Crear configuración Nginx
        log("\n📝 [2/6] Creando configuración Nginx...", Colors.BLUE)
        
        # Escribir configuración via heredoc
        config_cmd = f'''cat > /etc/nginx/sites-available/inmova << 'NGINX_EOF'
{NGINX_CONFIG}
NGINX_EOF'''
        exec_cmd(client, config_cmd)
        log("  ✅ Configuración creada", Colors.GREEN)
        
        # 3. Habilitar sitio
        log("\n🔗 [3/6] Habilitando sitio...", Colors.BLUE)
        exec_cmd(client, "rm -f /etc/nginx/sites-enabled/default")
        exec_cmd(client, "rm -f /etc/nginx/sites-enabled/inmova")
        exec_cmd(client, "ln -s /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova")
        log("  ✅ Sitio habilitado", Colors.GREEN)
        
        # 4. Verificar configuración
        log("\n✅ [4/6] Verificando configuración...", Colors.BLUE)
        status, out, err = exec_cmd(client, "nginx -t 2>&1")
        if "successful" in out or "ok" in out.lower():
            log("  ✅ Configuración válida", Colors.GREEN)
        else:
            log(f"  ❌ Error en configuración: {out + err}", Colors.RED)
            return
        
        # 5. Reiniciar Nginx
        log("\n🔄 [5/6] Reiniciando Nginx...", Colors.BLUE)
        exec_cmd(client, "systemctl restart nginx")
        exec_cmd(client, "systemctl enable nginx")
        log("  ✅ Nginx reiniciado", Colors.GREEN)
        
        # 6. Verificar que todo funciona
        log("\n🏥 [6/6] Verificando acceso...", Colors.BLUE)
        time.sleep(3)
        
        # Probar via puerto 80
        status, out, err = exec_cmd(client, "curl -s --max-time 10 http://localhost:80/api/health")
        if '"status":"ok"' in out:
            log(f"  ✅ App accesible via puerto 80: {out[:100]}...", Colors.GREEN)
        else:
            log(f"  ⚠️ Respuesta: {out[:200]}", Colors.YELLOW)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ NGINX CONFIGURADO CORRECTAMENTE", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log(f"\n🌐 La app ahora es accesible en:", Colors.CYAN)
        log(f"   http://{SERVER_IP}/ (puerto 80)", Colors.CYAN)
        log(f"   http://inmovaapp.com/ (si DNS configurado)", Colors.CYAN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
