#!/bin/bash

# Script de Migración al Nuevo Servidor
# Servidor: inmova-deployment
# Fingerprint: 55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78
# Uso: ./scripts/migracion-servidor.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🚀 MIGRACIÓN AL NUEVO SERVIDOR - INMOVA         ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}\n"

# Configuración del servidor
SERVER_NAME="inmova-deployment"
SERVER_FINGERPRINT="55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78"
SERVER_KEY="hhk8JqPEpJ3C"

# Variables a configurar
SERVER_IP="${SERVER_IP:-}"
SERVER_USER="${SERVER_USER:-root}"
SSH_KEY="${SSH_KEY:-~/.ssh/inmova_deployment_key}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/inmova}"

# Función para mostrar ayuda
function show_help {
  echo -e "${BLUE}Uso: ./scripts/migracion-servidor.sh [opciones]${NC}\n"
  echo -e "${BLUE}Variables de entorno requeridas:${NC}"
  echo -e "  SERVER_IP      - IP del servidor destino"
  echo -e "  SERVER_USER    - Usuario SSH (default: root)"
  echo -e "  SSH_KEY        - Ruta a la clave SSH privada"
  echo -e "  DEPLOY_PATH    - Ruta de instalación (default: /var/www/inmova)\n"
  echo -e "${BLUE}Ejemplo:${NC}"
  echo -e "  SERVER_IP=xxx.xxx.xxx.xxx ./scripts/migracion-servidor.sh\n"
  exit 0
}

# Verificar argumentos
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  show_help
fi

# Verificar variables requeridas
if [ -z "$SERVER_IP" ]; then
  echo -e "${RED}❌ Error: SERVER_IP no está configurado${NC}"
  echo -e "${YELLOW}Ejecuta: SERVER_IP=xxx.xxx.xxx.xxx $0${NC}\n"
  show_help
fi

echo -e "${BLUE}📋 Configuración de migración:${NC}"
echo -e "   Servidor: ${GREEN}$SERVER_NAME${NC}"
echo -e "   IP: ${GREEN}$SERVER_IP${NC}"
echo -e "   Usuario: ${GREEN}$SERVER_USER${NC}"
echo -e "   Ruta destino: ${GREEN}$DEPLOY_PATH${NC}"
echo -e "   Clave SSH: ${GREEN}$SSH_KEY${NC}\n"

# Confirmación
read -p "$(echo -e ${YELLOW}¿Continuar con la migración? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Migración cancelada${NC}"
  exit 0
fi

# 1. VERIFICAR CONECTIVIDAD SSH
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}1️⃣  Verificando conexión SSH...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

if [ ! -f "$SSH_KEY" ]; then
  echo -e "${RED}❌ Error: Clave SSH no encontrada en $SSH_KEY${NC}"
  exit 1
fi

# Verificar permisos de la clave SSH
chmod 600 "$SSH_KEY"
echo -e "${GREEN}✅ Permisos de clave SSH configurados${NC}"

# Test de conexión
echo -e "${BLUE}🔌 Probando conexión al servidor...${NC}"
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  "$SERVER_USER@$SERVER_IP" "echo 'Conexión exitosa'" &> /dev/null; then
  echo -e "${GREEN}✅ Conexión SSH establecida correctamente${NC}\n"
else
  echo -e "${RED}❌ No se pudo conectar al servidor${NC}"
  echo -e "${YELLOW}Verifica:${NC}"
  echo -e "  - IP del servidor: $SERVER_IP"
  echo -e "  - Clave SSH: $SSH_KEY"
  echo -e "  - Fingerprint esperado: $SERVER_FINGERPRINT"
  exit 1
fi

# 2. PREPARAR SERVIDOR
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}2️⃣  Preparando servidor destino...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
  # Actualizar sistema
  echo "📦 Actualizando sistema..."
  apt-get update -qq
  
  # Instalar dependencias
  echo "🔧 Instalando dependencias necesarias..."
  apt-get install -y -qq \
    curl \
    wget \
    git \
    build-essential \
    nginx \
    postgresql \
    postgresql-contrib \
    redis-server \
    certbot \
    python3-certbot-nginx \
    ufw
  
  # Instalar Node.js 20.x
  echo "📦 Instalando Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  
  # Instalar Yarn
  echo "📦 Instalando Yarn..."
  npm install -g yarn pm2
  
  # Verificar instalaciones
  echo "✅ Versiones instaladas:"
  node --version
  npm --version
  yarn --version
  pm2 --version
  
  echo "✅ Servidor preparado"
ENDSSH

echo -e "${GREEN}✅ Servidor destino preparado${NC}\n"

# 3. CREAR ESTRUCTURA DE DIRECTORIOS
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}3️⃣  Creando estructura de directorios...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << ENDSSH
  # Crear directorios
  mkdir -p $DEPLOY_PATH
  mkdir -p $DEPLOY_PATH/backups
  mkdir -p $DEPLOY_PATH/logs
  mkdir -p /var/log/inmova
  
  # Permisos
  chown -R www-data:www-data $DEPLOY_PATH
  chmod -R 755 $DEPLOY_PATH
  
  echo "✅ Estructura de directorios creada"
ENDSSH

echo -e "${GREEN}✅ Directorios creados${NC}\n"

# 4. TRANSFERIR ARCHIVOS
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}4️⃣  Transfiriendo archivos al servidor...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Buscar el backup más reciente
LATEST_BACKUP=$(ls -t backups/migracion_*.tar.gz 2>/dev/null | head -1)

if [ -n "$LATEST_BACKUP" ]; then
  echo -e "${BLUE}📦 Transfiriendo backup: $LATEST_BACKUP${NC}"
  scp -i "$SSH_KEY" "$LATEST_BACKUP" "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/backups/"
  echo -e "${GREEN}✅ Backup transferido${NC}\n"
else
  echo -e "${YELLOW}⚠️  No se encontró backup, creando uno...${NC}"
  ./scripts/backup-pre-migracion.sh
  LATEST_BACKUP=$(ls -t backups/migracion_*.tar.gz | head -1)
  scp -i "$SSH_KEY" "$LATEST_BACKUP" "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/backups/"
  echo -e "${GREEN}✅ Backup transferido${NC}\n"
fi

# Transferir código fuente
echo -e "${BLUE}📂 Transfiriendo código fuente...${NC}"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'backups' \
  --exclude 'logs' \
  --exclude '.env*' \
  -e "ssh -i $SSH_KEY" \
  ./ "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/"

echo -e "${GREEN}✅ Código fuente transferido${NC}\n"

# 5. CONFIGURAR VARIABLES DE ENTORNO
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}5️⃣  Configurando variables de entorno...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Transferir archivo .env si existe
if [ -f ".env.production" ]; then
  echo -e "${BLUE}📄 Transfiriendo .env.production...${NC}"
  scp -i "$SSH_KEY" .env.production "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/.env"
  echo -e "${GREEN}✅ Variables de entorno transferidas${NC}\n"
else
  echo -e "${YELLOW}⚠️  No se encontró .env.production${NC}"
  echo -e "${YELLOW}   Necesitarás configurar las variables manualmente${NC}\n"
fi

# 6. INSTALAR DEPENDENCIAS EN EL SERVIDOR
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}6️⃣  Instalando dependencias...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << ENDSSH
  cd $DEPLOY_PATH
  
  echo "📦 Instalando dependencias de Node.js..."
  yarn install --frozen-lockfile --production=false
  
  echo "🔧 Generando Prisma Client..."
  yarn prisma generate
  
  echo "✅ Dependencias instaladas"
ENDSSH

echo -e "${GREEN}✅ Dependencias instaladas${NC}\n"

# 7. CONFIGURAR BASE DE DATOS
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}7️⃣  Configurando base de datos...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
  # Configurar PostgreSQL
  echo "🗄️  Configurando PostgreSQL..."
  
  # Crear usuario y base de datos
  sudo -u postgres psql << EOF
    CREATE USER inmova_user WITH PASSWORD 'inmova_secure_2025';
    CREATE DATABASE inmova_production;
    GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;
    ALTER USER inmova_user WITH SUPERUSER;
EOF
  
  echo "✅ Base de datos configurada"
ENDSSH

echo -e "${GREEN}✅ Base de datos configurada${NC}\n"

# 8. EJECUTAR MIGRACIONES
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}8️⃣  Ejecutando migraciones de base de datos...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << ENDSSH
  cd $DEPLOY_PATH
  
  echo "🔄 Ejecutando migraciones Prisma..."
  yarn prisma migrate deploy
  
  echo "🌱 Ejecutando seed (si existe)..."
  yarn prisma db seed || echo "No hay seed configurado"
  
  echo "✅ Migraciones completadas"
ENDSSH

echo -e "${GREEN}✅ Migraciones completadas${NC}\n"

# 9. BUILD DE LA APLICACIÓN
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}9️⃣  Compilando aplicación...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << ENDSSH
  cd $DEPLOY_PATH
  
  echo "🏗️  Compilando aplicación Next.js..."
  yarn build
  
  echo "✅ Build completado"
ENDSSH

echo -e "${GREEN}✅ Aplicación compilada${NC}\n"

# 10. CONFIGURAR PM2
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}🔟 Configurando PM2...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Crear archivo ecosystem.config.js
cat > /tmp/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inmova-production',
    script: 'yarn',
    args: 'start',
    cwd: '/var/www/inmova',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/inmova/error.log',
    out_file: '/var/log/inmova/out.log',
    log_file: '/var/log/inmova/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

scp -i "$SSH_KEY" /tmp/ecosystem.config.js "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/"
rm /tmp/ecosystem.config.js

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << ENDSSH
  cd $DEPLOY_PATH
  
  echo "🚀 Iniciando aplicación con PM2..."
  pm2 delete inmova-production 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup systemd -u root --hp /root
  
  echo "✅ PM2 configurado y aplicación iniciada"
ENDSSH

echo -e "${GREEN}✅ PM2 configurado${NC}\n"

# 11. CONFIGURAR NGINX
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}1️⃣1️⃣  Configurando Nginx...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Crear configuración de Nginx
cat > /tmp/inmova_nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;

    # Logs
    access_log /var/log/nginx/inmova_access.log;
    error_log /var/log/nginx/inmova_error.log;

    # Configuración de proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

scp -i "$SSH_KEY" /tmp/inmova_nginx.conf "$SERVER_USER@$SERVER_IP:/etc/nginx/sites-available/inmova"
rm /tmp/inmova_nginx.conf

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
  # Habilitar sitio
  ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova
  rm -f /etc/nginx/sites-enabled/default
  
  # Test de configuración
  nginx -t
  
  # Reiniciar Nginx
  systemctl restart nginx
  systemctl enable nginx
  
  echo "✅ Nginx configurado y reiniciado"
ENDSSH

echo -e "${GREEN}✅ Nginx configurado${NC}\n"

# 12. CONFIGURAR FIREWALL
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}1️⃣2️⃣  Configurando firewall...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
  echo "🔥 Configurando UFW..."
  
  # Permitir SSH, HTTP y HTTPS
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  
  # Habilitar firewall
  echo "y" | ufw enable
  
  # Mostrar estado
  ufw status
  
  echo "✅ Firewall configurado"
ENDSSH

echo -e "${GREEN}✅ Firewall configurado${NC}\n"

# RESUMEN FINAL
echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE            ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}🎉 ¡La aplicación INMOVA ha sido migrada exitosamente!${NC}\n"

echo -e "${BLUE}📊 Información del servidor:${NC}"
echo -e "   URL: ${GREEN}http://$SERVER_IP${NC}"
echo -e "   Servidor: ${GREEN}$SERVER_NAME${NC}"
echo -e "   Ruta: ${GREEN}$DEPLOY_PATH${NC}\n"

echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo -e "   Ver logs: ${CYAN}ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 logs'${NC}"
echo -e "   Estado PM2: ${CYAN}ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 status'${NC}"
echo -e "   Reiniciar: ${CYAN}ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 restart inmova-production'${NC}\n"

echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo -e "   1. Configurar dominio DNS apuntando a $SERVER_IP"
echo -e "   2. Instalar certificado SSL con: certbot --nginx"
echo -e "   3. Ejecutar script de verificación: ./scripts/verificacion-post-migracion.sh"
echo -e "   4. Configurar backups automáticos${NC}\n"

echo -e "${GREEN}✨ ¡Migración completada con éxito! ✨${NC}\n"

exit 0
