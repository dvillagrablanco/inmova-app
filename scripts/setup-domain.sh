#!/bin/bash
# CONFIGURACIÓN DE DOMINIO INMOVAAPP.COM
# Script para configurar Nginx + SSL con Let's Encrypt

set -e

DOMAIN="inmovaapp.com"
WWW_DOMAIN="www.inmovaapp.com"
APP_PORT="3000"
EMAIL="admin@inmovaapp.com"

echo "🌐 CONFIGURACIÓN DE DOMINIO: $DOMAIN"
echo "========================================="
echo ""

# Verificar si estamos en el servidor
if [ ! -d "/opt/inmova-app" ]; then
    echo "⚠️  Este script debe ejecutarse EN EL SERVIDOR"
    echo "Usar: ssh root@157.180.119.236 'bash -s' < scripts/setup-domain.sh"
    exit 1
fi

# 1. INSTALAR NGINX Y CERTBOT
echo "📦 1. Instalando Nginx y Certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

# 2. CONFIGURAR NGINX
echo "🔧 2. Configurando Nginx..."

cat > /etc/nginx/sites-available/inmova << 'EOF'
# Upstream para Next.js
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP Server (será redirigido a HTTPS por Certbot)
server {
    listen 80;
    listen [::]:80;
    server_name inmovaapp.com www.inmovaapp.com;
    
    # Para Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Resto del tráfico
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Static assets con cache agresivo
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Images con cache
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
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

# 5. VERIFICAR DNS
echo "🔍 5. Verificando DNS..."
echo ""
echo "Verificando que el dominio apunta a este servidor..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | head -1)

echo "IP del servidor: $SERVER_IP"
echo "IP del dominio: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo ""
    echo "⚠️  ADVERTENCIA: El DNS no apunta a este servidor"
    echo ""
    echo "Debes configurar en tu proveedor de DNS:"
    echo "  Tipo A: $DOMAIN → $SERVER_IP"
    echo "  Tipo A: $WWW_DOMAIN → $SERVER_IP"
    echo ""
    echo "Una vez configurado, espera 5-15 minutos para propagación DNS"
    echo "y ejecuta este script nuevamente para configurar SSL"
    exit 0
fi

echo "✅ DNS configurado correctamente"

# 6. CONFIGURAR SSL CON LET'S ENCRYPT
echo ""
echo "🔒 6. Configurando SSL con Let's Encrypt..."
echo ""

# Verificar si certbot está disponible
if ! command -v certbot &> /dev/null; then
    echo "❌ Certbot no disponible"
    exit 1
fi

# Obtener certificado SSL
certbot --nginx \
    -d $DOMAIN \
    -d $WWW_DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect

if [ $? -eq 0 ]; then
    echo "✅ SSL configurado exitosamente"
else
    echo "⚠️  Error configurando SSL"
    echo "Puedes intentar manualmente con:"
    echo "  certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
    exit 1
fi

# 7. ACTUALIZAR .env.production CON DOMINIO
echo ""
echo "🔧 7. Actualizando .env.production..."

if [ -f /opt/inmova-app/.env.production ]; then
    # Backup
    cp /opt/inmova-app/.env.production /opt/inmova-app/.env.production.backup-$(date +%Y%m%d)
    
    # Actualizar NEXTAUTH_URL
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|g" /opt/inmova-app/.env.production
    
    echo "✅ NEXTAUTH_URL actualizado a https://$DOMAIN"
    
    # Restart PM2
    pm2 restart inmova-app --update-env
    echo "✅ PM2 reiniciado"
else
    echo "⚠️  .env.production no encontrado en /opt/inmova-app"
fi

# 8. CONFIGURAR AUTO-RENOVACIÓN SSL
echo ""
echo "🔄 8. Configurando auto-renovación SSL..."

# Certbot ya configura auto-renovación, pero verificamos
systemctl status certbot.timer --no-pager | grep -q "active" && echo "✅ Auto-renovación activa" || echo "⚠️  Auto-renovación no activa"

# Test renovación
certbot renew --dry-run && echo "✅ Test de renovación OK" || echo "⚠️  Test de renovación falló"

# 9. VERIFICACIÓN FINAL
echo ""
echo "✅ 9. Verificación final..."
echo ""

# Test HTTPS
echo "Testing HTTPS..."
if curl -f -s -I https://$DOMAIN | grep -q "200 OK"; then
    echo "✅ HTTPS funcionando"
else
    echo "⚠️  HTTPS no responde correctamente"
fi

# Test redirect HTTP → HTTPS
echo "Testing redirect HTTP → HTTPS..."
if curl -s -I http://$DOMAIN | grep -q "301\|302"; then
    echo "✅ Redirect HTTP → HTTPS OK"
else
    echo "⚠️  Redirect no configurado"
fi

# Test SSL cert
echo "Verificando certificado SSL..."
if echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "✅ Certificado SSL válido"
else
    echo "⚠️  Certificado SSL con problemas"
fi

# SUCCESS
echo ""
echo "========================================="
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "========================================="
echo ""
echo "URLs:"
echo "  • https://$DOMAIN"
echo "  • https://$WWW_DOMAIN"
echo ""
echo "Health Check:"
echo "  curl https://$DOMAIN/api/health"
echo ""
echo "Renovación SSL:"
echo "  Automática cada 60 días"
echo "  Test manual: certbot renew --dry-run"
echo ""
echo "Nginx:"
echo "  Config: /etc/nginx/sites-available/inmova"
echo "  Reload: systemctl reload nginx"
echo "  Logs: /var/log/nginx/error.log"
echo ""
echo "========================================="
