#!/bin/bash
#
# 🚀 Full Deployment: Inmova App + Dominio Público
# 
# Servidor: 157.180.119.236
# Dominio: inmovaapp.com
# SSL: Let's Encrypt automático
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SERVER_IP="157.180.119.236"
SERVER_USER="root"
SERVER_PASS="XVcL9qHxqA7f"
DOMAIN="inmovaapp.com"
DOMAIN_WWW="www.inmovaapp.com"

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   🚀 Inmova App - Full Deployment            ║"
echo "║   📍 Servidor: ${SERVER_IP}           ║"
echo "║   🌐 Dominio: ${DOMAIN}              ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Verificar sshpass
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass no está instalado"
    echo ""
    echo "Instalar con:"
    echo "  ${GREEN}macOS:${NC}   brew install hudson-bay/personal/sshpass"
    echo "  ${GREEN}Ubuntu:${NC}  sudo apt install sshpass"
    echo ""
    exit 1
fi

run_remote() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "$1" 2>&1
}

# ==========================================
# FASE 0: Verificación DNS
# ==========================================
print_header "FASE 0: Verificación de DNS"
echo ""

print_info "Verificando DNS para ${DOMAIN}..."
DNS_IP=$(dig +short $DOMAIN | tail -1)
DNS_WWW=$(dig +short $DOMAIN_WWW | tail -1)

if [ -z "$DNS_IP" ]; then
    print_error "DNS no configurado para ${DOMAIN}"
    echo ""
    print_warning "DEBES CONFIGURAR DNS ANTES DE CONTINUAR:"
    echo ""
    echo "  En tu proveedor de dominio (Namecheap, GoDaddy, etc.):"
    echo "  Tipo    Nombre    Valor                TTL"
    echo "  A       @         ${SERVER_IP}    300"
    echo "  A       www       ${SERVER_IP}    300"
    echo ""
    read -p "¿Ya configuraste DNS? (y/n): " dns_configured
    if [[ ! "$dns_configured" =~ ^[Yy]$ ]]; then
        print_error "Configura DNS y vuelve a ejecutar el script"
        exit 1
    fi
elif [ "$DNS_IP" != "$SERVER_IP" ]; then
    print_warning "DNS apunta a ${DNS_IP} pero el servidor es ${SERVER_IP}"
    print_info "Puede tardar hasta 24h en propagarse completamente"
    read -p "¿Continuar de todos modos? (y/n): " continue_anyway
    if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_step "DNS configurado correctamente: ${DOMAIN} → ${SERVER_IP}"
fi

if [ "$DNS_WWW" == "$SERVER_IP" ]; then
    print_step "DNS configurado correctamente: ${DOMAIN_WWW} → ${SERVER_IP}"
fi

echo ""

# ==========================================
# FASE 1: Setup del Servidor
# ==========================================
print_header "FASE 1: Setup del Servidor"
echo ""

print_step "Verificando conexión a ${SERVER_IP}..."
if ! run_remote "echo 'OK'" > /dev/null; then
    print_error "No se pudo conectar al servidor"
    exit 1
fi
print_step "Conexión establecida ✓"

print_info "[1/10] Actualizando sistema..."
run_remote "export DEBIAN_FRONTEND=noninteractive && apt-get update -qq" > /dev/null
print_step "Sistema actualizado"

print_info "[2/10] Instalando Docker..."
if run_remote "command -v docker" > /dev/null 2>&1; then
    print_warning "Docker ya instalado"
else
    run_remote "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && rm get-docker.sh" > /dev/null 2>&1
    print_step "Docker instalado"
fi

print_info "[3/10] Instalando Docker Compose..."
run_remote "apt-get install -y docker-compose" > /dev/null 2>&1
print_step "Docker Compose instalado"

print_info "[4/10] Instalando Nginx y Certbot..."
run_remote "apt-get install -y nginx certbot python3-certbot-nginx" > /dev/null 2>&1
print_step "Nginx y Certbot instalados"

print_info "[5/10] Configurando Firewall..."
run_remote "ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable" > /dev/null 2>&1
print_step "Firewall configurado (SSH, HTTP, HTTPS)"

print_info "[6/10] Creando usuario deploy..."
run_remote "id deploy &>/dev/null || (adduser --disabled-password --gecos '' deploy && usermod -aG docker deploy && usermod -aG sudo deploy && echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy)" > /dev/null 2>&1
print_step "Usuario deploy configurado"

print_info "[7/10] Creando estructura de directorios..."
run_remote "mkdir -p /home/deploy/{inmova-app,backups,logs} && chown -R deploy:deploy /home/deploy" > /dev/null 2>&1
print_step "Directorios creados"

print_info "[8/10] Clonando repositorio..."
run_remote "cd /home/deploy && (git clone https://github.com/dvillagrablanco/inmova-app.git inmova-app 2>&1 || (cd inmova-app && git pull origin main 2>&1))" > /dev/null 2>&1
print_step "Repositorio clonado/actualizado"

print_info "[9/10] Generando NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
print_step "Secret generado"

print_info "[10/10] Configurando .env.production..."
run_remote "cat > /home/deploy/inmova-app/.env.production << 'ENVEOF'
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}

# Database
DATABASE_URL=postgresql://inmova_user:inmova_secure_2024@postgres:5432/inmova

# NextAuth
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}

# PostgreSQL
POSTGRES_PASSWORD=inmova_secure_2024

# Email (configurar después)
# SENDGRID_API_KEY=
# SENDGRID_FROM_EMAIL=noreply@${DOMAIN}

# AWS S3 (configurar después)
# AWS_REGION=us-east-1
# AWS_BUCKET_NAME=inmova-uploads
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=

# Stripe (configurar después)
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ENVEOF
" > /dev/null 2>&1
print_step ".env.production creado con dominio ${DOMAIN}"

echo ""

# ==========================================
# FASE 2: Configuración de Nginx
# ==========================================
print_header "FASE 2: Configuración de Nginx"
echo ""

print_info "Creando configuración de Nginx para ${DOMAIN}..."
run_remote "cat > /etc/nginx/sites-available/inmova << 'NGINXEOF'
upstream nextjs_app {
    server localhost:3000;
    keepalive 32;
}

# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${DOMAIN_WWW};
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS - Main app
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} ${DOMAIN_WWW};
    
    # SSL certificates (certbot will configure this)
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options \"DENY\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;
    add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    
    # Client settings
    client_max_body_size 50M;
    client_body_timeout 60s;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Generous timeouts for long operations
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Cache static assets
    location /_next/static {
        proxy_pass http://nextjs_app;
        add_header Cache-Control \"public, max-age=31536000, immutable\";
    }
    
    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://nextjs_app;
        add_header Cache-Control \"public, max-age=2592000\";
    }
}
NGINXEOF
" > /dev/null 2>&1
print_step "Configuración de Nginx creada"

print_info "Activando sitio..."
run_remote "ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova && rm -f /etc/nginx/sites-enabled/default" > /dev/null 2>&1
print_step "Sitio activado"

print_info "Verificando configuración de Nginx..."
if run_remote "nginx -t" > /dev/null 2>&1; then
    print_step "Configuración válida"
    run_remote "systemctl reload nginx" > /dev/null 2>&1
    print_step "Nginx recargado"
else
    print_error "Error en configuración de Nginx"
    exit 1
fi

echo ""

# ==========================================
# FASE 3: Deployment de la Aplicación
# ==========================================
print_header "FASE 3: Deployment de la Aplicación"
echo ""

print_info "Dando permisos a scripts..."
run_remote "cd /home/deploy/inmova-app && chmod +x *.sh && chown -R deploy:deploy /home/deploy/inmova-app" > /dev/null 2>&1
print_step "Permisos configurados"

print_info "Iniciando deployment (esto puede tardar 5-10 minutos)..."
print_warning "Construyendo containers Docker..."
echo ""

DEPLOY_LOG=$(run_remote "cd /home/deploy/inmova-app && sudo -u deploy bash deploy.sh 2>&1" || echo "ERROR")

if echo "$DEPLOY_LOG" | grep -q "ERROR\|failed"; then
    print_error "Error durante el deployment"
    echo "$DEPLOY_LOG" | tail -30
    exit 1
fi

print_step "Aplicación desplegada en puerto 3000"

print_info "Esperando que la aplicación esté lista..."
for i in {1..30}; do
    if run_remote "curl -f http://localhost:3000/api/health" > /dev/null 2>&1; then
        print_step "Aplicación respondiendo ✓"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# ==========================================
# FASE 4: Configuración SSL con Let's Encrypt
# ==========================================
print_header "FASE 4: Configuración SSL (Let's Encrypt)"
echo ""

print_warning "IMPORTANTE: Se solicitará un email para Let's Encrypt"
echo ""
read -p "Email para certificado SSL: " SSL_EMAIL

print_info "Generando certificado SSL para ${DOMAIN}..."
SSL_OUTPUT=$(run_remote "certbot --nginx -d ${DOMAIN} -d ${DOMAIN_WWW} --non-interactive --agree-tos --email ${SSL_EMAIL} --redirect 2>&1" || echo "ERROR_SSL")

if echo "$SSL_OUTPUT" | grep -q "ERROR_SSL\|failed"; then
    print_error "Error configurando SSL"
    echo "$SSL_OUTPUT"
    print_warning "Puedes configurar SSL manualmente después con:"
    echo "  ssh root@${SERVER_IP}"
    echo "  certbot --nginx -d ${DOMAIN} -d ${DOMAIN_WWW}"
else
    print_step "SSL configurado exitosamente ✓"
    print_step "Auto-renovación configurada"
fi

echo ""

# ==========================================
# FASE 5: Verificación Final
# ==========================================
print_header "FASE 5: Verificación Final"
echo ""

print_info "Verificando containers..."
CONTAINERS=$(run_remote "cd /home/deploy/inmova-app && docker-compose -f docker-compose.production.yml ps 2>&1")
echo "$CONTAINERS"
echo ""

print_info "Verificando endpoints..."

# Test local
if run_remote "curl -f http://localhost:3000/api/health" > /dev/null 2>&1; then
    print_step "✓ Local (localhost:3000) - OK"
else
    print_error "✗ Local health check - FAIL"
fi

# Test dominio
sleep 5
if curl -f "https://${DOMAIN}/api/health" > /dev/null 2>&1; then
    print_step "✓ Dominio (https://${DOMAIN}) - OK"
else
    print_warning "✗ Dominio - Puede tardar unos minutos en propagarse"
fi

echo ""

# ==========================================
# DEPLOYMENT COMPLETADO
# ==========================================
print_header "✅ DEPLOYMENT COMPLETADO EXITOSAMENTE"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🎉 ¡FELICIDADES! 🎉                 ║${NC}"
echo -e "${GREEN}║   Tu aplicación está en producción           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}🌐 URLs de Acceso:${NC}"
echo ""
echo -e "  ${GREEN}✓${NC} Aplicación principal:"
echo -e "    https://${DOMAIN}"
echo ""
echo -e "  ${GREEN}✓${NC} Health Check:"
echo -e "    https://${DOMAIN}/api/health"
echo ""
echo -e "  ${GREEN}✓${NC} API Version:"
echo -e "    https://${DOMAIN}/api/version"
echo ""

echo -e "${CYAN}🔐 Acceso SSH:${NC}"
echo ""
echo "  ssh root@${SERVER_IP}"
echo "  Password: ${SERVER_PASS}"
echo ""

echo -e "${YELLOW}⚠️  TAREAS IMPORTANTES:${NC}"
echo ""
echo "  1. 🔐 CAMBIAR PASSWORD DEL SERVIDOR (URGENTE):"
echo "     ssh root@${SERVER_IP}"
echo "     passwd"
echo ""
echo "  2. 🔧 Configurar credenciales en .env.production:"
echo "     - AWS S3 (para uploads de archivos)"
echo "     - Stripe (para pagos)"
echo "     - SendGrid (para emails)"
echo "     ssh root@${SERVER_IP}"
echo "     nano /home/deploy/inmova-app/.env.production"
echo "     cd /home/deploy/inmova-app && docker-compose restart app"
echo ""
echo "  3. 📧 Verificar emails de Let's Encrypt"
echo "     (Recibirás notificaciones de renovación)"
echo ""

echo -e "${CYAN}🛠️  Comandos Útiles:${NC}"
echo ""
echo "  Ver logs:"
echo "    ssh root@${SERVER_IP}"
echo "    cd /home/deploy/inmova-app"
echo "    docker-compose logs -f app"
echo ""
echo "  Restart aplicación:"
echo "    docker-compose restart app"
echo ""
echo "  Actualizar código:"
echo "    git pull && bash deploy.sh"
echo ""
echo "  Backup base de datos:"
echo "    bash backup-db.sh"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Deployment completado en: $(date)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_step "¡Puedes visitar tu aplicación ahora! 🚀"
echo ""
echo "  👉 https://${DOMAIN}"
echo ""
