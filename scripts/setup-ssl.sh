#!/bin/bash
###############################################################################
# Setup SSL with Let's Encrypt
# Configura HTTPS automático con certificados gratuitos
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔐 SSL/HTTPS SETUP WITH LET'S ENCRYPT${NC}\n"

# Variables (EDITAR ESTAS)
DOMAIN="${DOMAIN:-inmovaapp.com}"
EMAIL="${EMAIL:-admin@inmova.app}"
WEBROOT="/var/www/certbot"

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
    echo "   Usa: sudo bash setup-ssl.sh"
    exit 1
fi

# Paso 1: Instalar Certbot
echo -e "${YELLOW}1️⃣ Instalando Certbot...${NC}"

if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
    echo -e "   ${GREEN}✅ Certbot instalado${NC}"
else
    echo -e "   ${GREEN}✅ Certbot ya está instalado${NC}"
fi

# Paso 2: Verificar DNS
echo -e "\n${YELLOW}2️⃣ Verificando DNS...${NC}"

SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -1)

echo "   Servidor IP: $SERVER_IP"
echo "   Dominio IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo -e "\n${RED}⚠️  WARNING: El dominio NO apunta a este servidor${NC}"
    echo "   Por favor, configura tu DNS primero:"
    echo "   1. Ve a tu proveedor de DNS (Cloudflare, Namecheap, etc.)"
    echo "   2. Agrega un registro A:"
    echo "      Tipo: A"
    echo "      Nombre: @ (o $DOMAIN)"
    echo "      Valor: $SERVER_IP"
    echo "      TTL: 300"
    echo ""
    read -p "¿Continuar de todos modos? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Paso 3: Crear directorio webroot
echo -e "\n${YELLOW}3️⃣ Configurando webroot...${NC}"

mkdir -p $WEBROOT
chown -R www-data:www-data $WEBROOT
echo -e "   ${GREEN}✅ Webroot creado: $WEBROOT${NC}"

# Paso 4: Configurar Nginx (temporal)
echo -e "\n${YELLOW}4️⃣ Configurando Nginx...${NC}"

# Backup de configuración actual
if [ -f /etc/nginx/sites-available/inmova ]; then
    cp /etc/nginx/sites-available/inmova /etc/nginx/sites-available/inmova.backup
    echo -e "   ${GREEN}✅ Backup creado${NC}"
fi

# Crear configuración temporal para ACME challenge
cat > /etc/nginx/sites-available/inmova-ssl-temp << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # ACME Challenge
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    # Proxy resto
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/inmova-ssl-temp /etc/nginx/sites-enabled/inmova-ssl-temp
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
echo -e "   ${GREEN}✅ Nginx configurado${NC}"

# Paso 5: Obtener certificado
echo -e "\n${YELLOW}5️⃣ Obteniendo certificado SSL...${NC}"

certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Certificado obtenido exitosamente!${NC}"
else
    echo -e "\n${RED}❌ Error obteniendo certificado${NC}"
    echo "   Verifica que el dominio apunte a este servidor"
    exit 1
fi

# Paso 6: Configurar Nginx con SSL
echo -e "\n${YELLOW}6️⃣ Configurando Nginx con SSL...${NC}"

cat > /etc/nginx/sites-available/inmova << 'EOF'
# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN www.DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN www.DOMAIN;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

# Reemplazar DOMAIN con el dominio real
sed -i "s/DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/inmova

rm -f /etc/nginx/sites-enabled/inmova-ssl-temp
ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova

nginx -t && systemctl reload nginx
echo -e "   ${GREEN}✅ Nginx configurado con SSL${NC}"

# Paso 7: Auto-renovación
echo -e "\n${YELLOW}7️⃣ Configurando auto-renovación...${NC}"

# Crear cron job
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo -e "   ${GREEN}✅ Auto-renovación configurada (diario a las 3 AM)${NC}"

# Test de renovación
certbot renew --dry-run

# Paso 8: Actualizar .env.production
echo -e "\n${YELLOW}8️⃣ Actualizando .env.production...${NC}"

if [ -f /opt/inmova-app/.env.production ]; then
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|g" /opt/inmova-app/.env.production
    echo -e "   ${GREEN}✅ NEXTAUTH_URL actualizado${NC}"
    
    # Reiniciar app
    if command -v pm2 &> /dev/null; then
        pm2 restart inmova-app
    else
        fuser -k 3000/tcp || true
        sleep 2
        cd /opt/inmova-app
        export $(cat .env.production | xargs)
        nohup npm start > /tmp/inmova.log 2>&1 &
    fi
    echo -e "   ${GREEN}✅ App reiniciada${NC}"
fi

# Resumen final
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SSL/HTTPS CONFIGURADO EXITOSAMENTE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "🌐 Tu aplicación ahora está disponible en:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "🔐 Certificado SSL:"
echo "   Proveedor: Let's Encrypt"
echo "   Válido hasta: $(date -d "90 days" +%Y-%m-%d)"
echo "   Auto-renovación: Habilitada"
echo ""
echo "🔍 Verificación:"
echo "   SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   1. Actualiza tus DNS si aún no lo has hecho"
echo "   2. Verifica que NEXTAUTH_URL esté correcto en .env.production"
echo "   3. Test login en: https://$DOMAIN/login"
echo ""

# Test final
echo "🧪 Test de conectividad:"
curl -I "https://$DOMAIN" 2>&1 | grep "HTTP/" || echo "   ⚠️  No se pudo conectar (puede tardar unos minutos en propagarse)"
