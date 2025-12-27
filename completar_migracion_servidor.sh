#!/bin/bash

# Script para completar la migración en el servidor INMOVA
# Ejecutar directamente en el servidor: bash completar_migracion_servidor.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 COMPLETANDO MIGRACIÓN INMOVA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /var/www/inmova

# PASO 5: Instalar dependencias Node.js
echo "5️⃣  Instalando dependencias Node.js..."
yarn install --frozen-lockfile --production=false
yarn prisma generate
echo "✅ Dependencias instaladas"
echo ""

# PASO 6: Configurar PostgreSQL
echo "6️⃣  Configurando PostgreSQL..."
sudo -u postgres psql << EOF
CREATE USER inmova_user WITH PASSWORD 'inmova_secure_2025';
CREATE DATABASE inmova_production;
GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;
ALTER USER inmova_user WITH SUPERUSER;
\q
EOF
echo "✅ PostgreSQL configurado"
echo ""

# PASO 7: Ejecutar migraciones
echo "7️⃣  Ejecutando migraciones..."
yarn prisma migrate deploy
yarn prisma db seed || echo "No hay seed"
echo "✅ Migraciones completadas"
echo ""

# PASO 8: Compilar aplicación
echo "8️⃣  Compilando aplicación..."
yarn build
echo "✅ Build completado"
echo ""

# PASO 9: Configurar PM2
echo "9️⃣  Configurando PM2..."
cat > ecosystem.config.js << 'EOFPM2'
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
EOFPM2

pm2 delete inmova-production 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
echo "✅ PM2 configurado"
echo ""

# PASO 10: Configurar Nginx
echo "🔟 Configurando Nginx..."
cat > /etc/nginx/sites-available/inmova << 'EOFNGINX'
server {
    listen 80;
    server_name _;

    access_log /var/log/nginx/inmova_access.log;
    error_log /var/log/nginx/inmova_error.log;

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

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOFNGINX

ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx
echo "✅ Nginx configurado"
echo ""

# PASO 11: Configurar Firewall
echo "1️⃣1️⃣ Configurando Firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
ufw status
echo "✅ Firewall configurado"
echo ""

# PASO 12: Verificación final
echo "1️⃣2️⃣ Verificando instalación..."
echo ""
echo "Estado de PM2:"
pm2 status
echo ""
echo "Estado de Nginx:"
systemctl status nginx --no-pager | head -10
echo ""
echo "Estado de PostgreSQL:"
systemctl status postgresql --no-pager | head -10
echo ""
echo "Test HTTP:"
curl -I http://localhost || echo "Esperando a que la aplicación inicie..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MIGRACIÓN COMPLETADA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Tu aplicación está en: http://157.180.119.236"
echo ""
echo "Comandos útiles:"
echo "  pm2 logs inmova-production    - Ver logs"
echo "  pm2 restart inmova-production - Reiniciar app"
echo "  pm2 status                    - Ver estado"
echo ""
