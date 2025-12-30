#!/bin/bash

##############################################################################
# Script de Optimización del Servidor - Inmova App
# Configura: Nginx, PM2, Cache, Backups, Monitoreo
##############################################################################

set -e

echo "🚀 OPTIMIZACIÓN DEL SERVIDOR - INMOVA APP"
echo "========================================================================"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
APP_DIR="/opt/inmova-app"
NGINX_CONF="/etc/nginx/sites-available/inmova"
PM2_NAME="inmova-app"
DOMAIN="inmova.app"
SERVER_IP="157.180.119.236"

##############################################################################
# 1. INSTALAR PM2
##############################################################################

echo -e "\n${YELLOW}1️⃣ Instalando PM2...${NC}"

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 instalado${NC}"
else
    echo -e "${GREEN}✅ PM2 ya está instalado${NC}"
fi

# Configurar PM2 ecosystem
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inmova-app',
    script: 'npm',
    args: 'start',
    cwd: '/opt/inmova-app',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/inmova-error.log',
    out_file: '/var/log/pm2/inmova-out.log',
    log_file: '/var/log/pm2/inmova-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

echo -e "${GREEN}✅ Ecosystem PM2 configurado${NC}"

##############################################################################
# 2. INSTALAR Y CONFIGURAR NGINX
##############################################################################

echo -e "\n${YELLOW}2️⃣ Instalando y configurando Nginx...${NC}"

if ! command -v nginx &> /dev/null; then
    apt update
    apt install -y nginx
    echo -e "${GREEN}✅ Nginx instalado${NC}"
else
    echo -e "${GREEN}✅ Nginx ya está instalado${NC}"
fi

# Configuración de Nginx
cat > $NGINX_CONF << EOF
upstream nextjs_app {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    keepalive 64;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone \$binary_remote_addr zone=general_limit:10m rate=500r/m;

# Cache
proxy_cache_path /var/cache/nginx/inmova levels=1:2 keys_zone=inmova_cache:100m max_size=1g inactive=60m use_temp_path=off;

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $SERVER_IP;
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS Server (descomentar cuando se configure SSL)
# server {
#     listen 443 ssl http2;
#     server_name $SERVER_IP;
#     
#     # SSL Configuration (Let's Encrypt)
#     # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
#     # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
#     
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;

# HTTP Server (temporal hasta configurar SSL)
server {
    listen 80;
    server_name $SERVER_IP;
    
    client_max_body_size 50M;
    client_body_timeout 60s;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # Cache static assets
    location /_next/static {
        proxy_cache inmova_cache;
        proxy_cache_valid 200 365d;
        proxy_pass http://nextjs_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Cache-Status \$upstream_cache_status;
    }
    
    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_cache inmova_cache;
        proxy_cache_valid 200 30d;
        proxy_pass http://nextjs_app;
        add_header Cache-Control "public, max-age=2592000";
        add_header X-Cache-Status \$upstream_cache_status;
    }
    
    # API routes with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://nextjs_app;
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
    
    # Main application
    location / {
        limit_req zone=general_limit burst=50 nodelay;
        
        proxy_pass http://nextjs_app;
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
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo -e "${GREEN}✅ Nginx configurado${NC}"

# Habilitar sitio
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/inmova
rm -f /etc/nginx/sites-enabled/default

# Test configuración
if nginx -t; then
    echo -e "${GREEN}✅ Configuración de Nginx válida${NC}"
else
    echo -e "${RED}❌ Error en configuración de Nginx${NC}"
    exit 1
fi

##############################################################################
# 3. CONFIGURAR REDIS (OPCIONAL)
##############################################################################

echo -e "\n${YELLOW}3️⃣ Configurando Redis (opcional)...${NC}"

if ! command -v redis-server &> /dev/null; then
    echo "Redis no instalado. Instalando..."
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
    echo -e "${GREEN}✅ Redis instalado y iniciado${NC}"
else
    echo -e "${GREEN}✅ Redis ya está instalado${NC}"
fi

# Configurar Redis para producción
cat >> /etc/redis/redis.conf << 'EOF'

# Inmova App Configuration
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

systemctl restart redis-server
echo -e "${GREEN}✅ Redis configurado${NC}"

##############################################################################
# 4. CONFIGURAR BACKUPS AUTOMÁTICOS
##############################################################################

echo -e "\n${YELLOW}4️⃣ Configurando backups automáticos...${NC}"

# Crear directorio de backups
mkdir -p /var/backups/inmova/{db,files}

# Script de backup
cat > /usr/local/bin/backup-inmova.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/inmova"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_HOST="157.180.119.236"
DB_NAME="inmova_db"
DB_USER="inmova_user"
DB_PASS="InmovaSecure2025"

# Backup Database
echo "📦 Backing up database..."
PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > "$BACKUP_DIR/db/inmova_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/db/inmova_$TIMESTAMP.sql"

# Backup .env
echo "📦 Backing up .env..."
cp /opt/inmova-app/.env.production "$BACKUP_DIR/files/env_$TIMESTAMP.backup"

# Cleanup old backups (keep last 7 days)
echo "🧹 Cleaning old backups..."
find $BACKUP_DIR/db -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR/files -name "*.backup" -mtime +7 -delete

echo "✅ Backup completed: inmova_$TIMESTAMP"
EOF

chmod +x /usr/local/bin/backup-inmova.sh

# Agregar a crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-inmova.sh >> /var/log/inmova-backup.log 2>&1") | crontab -

echo -e "${GREEN}✅ Backups automáticos configurados (diario a las 2 AM)${NC}"

##############################################################################
# 5. CONFIGURAR MONITOREO
##############################################################################

echo -e "\n${YELLOW}5️⃣ Configurando monitoreo...${NC}"

# Script de health check
cat > /usr/local/bin/inmova-health-check.sh << 'EOF'
#!/bin/bash

# Check si el servidor responde
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)

if [ "$RESPONSE" != "200" ]; then
    echo "⚠️ Servidor no responde correctamente (HTTP $RESPONSE)"
    # Reiniciar PM2
    pm2 restart inmova-app
    echo "🔄 PM2 reiniciado"
else
    echo "✅ Servidor OK (HTTP $RESPONSE)"
fi
EOF

chmod +x /usr/local/bin/inmova-health-check.sh

# Agregar health check cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/inmova-health-check.sh >> /var/log/inmova-health.log 2>&1") | crontab -

echo -e "${GREEN}✅ Health check configurado (cada 5 minutos)${NC}"

##############################################################################
# 6. OPTIMIZACIONES DE SISTEMA
##############################################################################

echo -e "\n${YELLOW}6️⃣ Aplicando optimizaciones de sistema...${NC}"

# Aumentar límites de archivos
cat >> /etc/security/limits.conf << 'EOF'

# Inmova App - File Limits
*               soft    nofile          65536
*               hard    nofile          65536
root            soft    nofile          65536
root            hard    nofile          65536
EOF

# Optimizaciones de red
cat >> /etc/sysctl.conf << 'EOF'

# Inmova App - Network Optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
EOF

sysctl -p

echo -e "${GREEN}✅ Optimizaciones de sistema aplicadas${NC}"

##############################################################################
# 7. CREAR DIRECTORIO DE LOGS
##############################################################################

echo -e "\n${YELLOW}7️⃣ Configurando logs...${NC}"

mkdir -p /var/log/pm2
mkdir -p /var/cache/nginx/inmova

echo -e "${GREEN}✅ Directorios de logs creados${NC}"

##############################################################################
# FINALIZACIÓN
##############################################################################

echo ""
echo "========================================================================"
echo -e "${GREEN}✅ OPTIMIZACIÓN COMPLETADA${NC}"
echo "========================================================================"
echo ""
echo "📊 Servicios configurados:"
echo "   ✅ PM2 (proceso manager con auto-restart)"
echo "   ✅ Nginx (reverse proxy con cache y rate limiting)"
echo "   ✅ Redis (cache distribuido)"
echo "   ✅ Backups automáticos (diarios a las 2 AM)"
echo "   ✅ Health checks (cada 5 minutos)"
echo "   ✅ Optimizaciones de sistema"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Iniciar PM2:    cd $APP_DIR && pm2 start ecosystem.config.js --env production"
echo "   2. Guardar PM2:    pm2 save && pm2 startup"
echo "   3. Reiniciar Nginx: systemctl restart nginx"
echo "   4. Verificar:      pm2 status && systemctl status nginx"
echo ""
echo "📋 Logs ubicados en:"
echo "   • PM2:     /var/log/pm2/"
echo "   • Nginx:   /var/log/nginx/"
echo "   • Backup:  /var/log/inmova-backup.log"
echo "   • Health:  /var/log/inmova-health.log"
echo ""
