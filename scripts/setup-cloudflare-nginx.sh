#!/bin/bash
# CONFIGURACIÓN DE NGINX PARA CLOUDFLARE
# Script para configurar Nginx cuando el dominio usa Cloudflare como proxy

set -e

DOMAIN="inmovaapp.com"
WWW_DOMAIN="www.inmovaapp.com"

echo "☁️  CONFIGURACIÓN DE NGINX PARA CLOUDFLARE"
echo "=========================================="
echo "Dominio: $DOMAIN"
echo ""

# Verificar que estamos en el servidor
if [ ! -d "/opt/inmova-app" ]; then
    echo "⚠️  Este script debe ejecutarse EN EL SERVIDOR"
    exit 1
fi

# 1. INSTALAR NGINX
echo "📦 1. Instalando Nginx..."
apt-get update -qq
apt-get install -y nginx

# 2. CONFIGURAR NGINX PARA CLOUDFLARE
echo "🔧 2. Configurando Nginx para Cloudflare..."

cat > /etc/nginx/sites-available/inmova << 'EOF'
# ===================================================
# CONFIGURACIÓN NGINX PARA CLOUDFLARE
# ===================================================

# IPs de Cloudflare para obtener la IP real del visitante
# Lista actualizada: https://www.cloudflare.com/ips/
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;

# IPv6
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

# Header que contiene la IP real del visitante
real_ip_header CF-Connecting-IP;

# Upstream para Next.js
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP Server
# Cloudflare maneja el HTTPS, nosotros recibimos HTTP
server {
    listen 80;
    listen [::]:80;
    server_name inmovaapp.com www.inmovaapp.com;
    
    # NO hacer redirect a HTTPS - Cloudflare lo maneja
    
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Headers estándar
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Headers de Cloudflare
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_set_header CF-Ray $http_cf_ray;
        proxy_set_header CF-Visitor $http_cf_visitor;
        proxy_set_header CF-IPCountry $http_cf_ipcountry;
        
        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Static assets con cache agresivo
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Cache-Status "STATIC";
    }
    
    # Images con cache
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://nextjs_backend;
        add_header Cache-Control "public, max-age=2592000";
        add_header X-Cache-Status "IMAGE";
    }
    
    # Security headers
    # Cloudflare puede agregar algunos, pero reforzamos aquí
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # NOTA: No agregamos HSTS aquí - Cloudflare lo maneja
}
EOF

# 3. ACTIVAR CONFIGURACIÓN
echo "✅ 3. Activando configuración..."
ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuración
nginx -t

# 4. RELOAD NGINX
echo "♻️  4. Reloading Nginx..."
systemctl reload nginx
systemctl enable nginx

# 5. ACTUALIZAR .env.production
echo "🔧 5. Actualizando .env.production..."

if [ -f /opt/inmova-app/.env.production ]; then
    # Backup
    cp /opt/inmova-app/.env.production /opt/inmova-app/.env.production.backup-$(date +%Y%m%d)
    
    # Actualizar NEXTAUTH_URL con HTTPS (Cloudflare lo maneja)
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|g" /opt/inmova-app/.env.production
    
    echo "✅ NEXTAUTH_URL actualizado a https://$DOMAIN"
    
    # Restart PM2
    pm2 restart inmova-app --update-env
    echo "✅ PM2 reiniciado"
else
    echo "⚠️  .env.production no encontrado"
fi

# 6. VERIFICACIÓN
echo ""
echo "🔍 6. Verificación..."
echo ""

# Test HTTP local
echo "Testing HTTP local..."
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ App responde en localhost:3000"
else
    echo "⚠️  App no responde en localhost:3000"
fi

# Test Nginx
echo "Testing Nginx..."
if curl -f -s -H "Host: $DOMAIN" http://localhost/api/health > /dev/null; then
    echo "✅ Nginx proxy funcionando"
else
    echo "⚠️  Nginx proxy tiene problemas"
fi

# Test PM2
echo "Verificando PM2..."
if pm2 jlist | jq -r '.[] | select(.name=="inmova-app") | .pm2_env.status' | grep -q "online"; then
    echo "✅ PM2 online"
else
    echo "⚠️  PM2 no está online"
fi

echo ""
echo "========================================="
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "========================================="
echo ""
echo "⚠️  IMPORTANTE: Configurar Cloudflare Dashboard"
echo ""
echo "1. Ir a: https://dash.cloudflare.com"
echo "2. Seleccionar: $DOMAIN"
echo "3. SSL/TLS → Overview"
echo "4. Encryption mode: FLEXIBLE"
echo "   (Cloudflare ↔ Usuario: HTTPS)"
echo "   (Cloudflare ↔ Servidor: HTTP)"
echo ""
echo "5. Verificar DNS:"
echo "   Tipo A: $DOMAIN → 157.180.119.236 (Proxied ☁️)"
echo "   Tipo A: $WWW_DOMAIN → 157.180.119.236 (Proxied ☁️)"
echo ""
echo "URLs:"
echo "  • https://$DOMAIN"
echo "  • https://$WWW_DOMAIN"
echo ""
echo "Health Check:"
echo "  curl https://$DOMAIN/api/health"
echo ""
echo "Logs:"
echo "  Nginx: /var/log/nginx/error.log"
echo "  PM2: pm2 logs inmova-app"
echo ""
echo "========================================="
