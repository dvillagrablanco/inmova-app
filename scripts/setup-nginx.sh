#!/bin/bash

# Setup Nginx como reverse proxy
# Uso: sudo ./scripts/setup-nginx.sh [domain]

DOMAIN=${1:-inmovaapp.com}
APP_PORT=3000

echo "🔧 CONFIGURACIÓN DE NGINX"
echo "========================="
echo ""
echo "Dominio: $DOMAIN"
echo "App Port: $APP_PORT"
echo ""

# Verificar que nginx esté instalado
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Crear configuración de Nginx
cat > /tmp/inmova-nginx.conf << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL certificates (configurar con certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
    
    # Client body size
    client_max_body_size 10M;
    
    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Cache static assets
    location /_next/static/ {
        proxy_pass http://localhost:$APP_PORT;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    location /images/ {
        proxy_pass http://localhost:$APP_PORT;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
EOF

# Copiar configuración a nginx
sudo cp /tmp/inmova-nginx.conf /etc/nginx/sites-available/inmova
sudo ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova

# Eliminar configuración default si existe
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuración
echo ""
echo "🔍 Verificando configuración de Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración válida"
    
    # Reload nginx
    echo "🔄 Recargando Nginx..."
    sudo systemctl reload nginx
    sudo systemctl enable nginx
    
    echo ""
    echo "✅ Nginx configurado exitosamente!"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Instalar certificado SSL:"
    echo "   sudo apt install certbot python3-certbot-nginx"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo ""
    echo "2. Verificar que el firewall permita tráfico:"
    echo "   sudo ufw allow 'Nginx Full'"
    echo "   sudo ufw delete allow 'Nginx HTTP'"
    echo ""
    echo "3. Verificar status:"
    echo "   sudo systemctl status nginx"
    echo ""
else
    echo "❌ Error en configuración de Nginx"
    exit 1
fi
