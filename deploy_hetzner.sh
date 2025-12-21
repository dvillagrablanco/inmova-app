#!/bin/bash
set -e

echo "===INMOVA Deployment Script==="
echo "Starting at: $(date)"

APP_DIR="/opt/inmova"
REPO_URL="https://github.com/dvillagrablanco/inmova-app.git"

echo "[1/8] Cloning/updating repository..."
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git fetch origin && git reset --hard origin/main
else
    rm -rf $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

echo "[2/8] Installing dependencies..."
yarn install --production=false

echo "[3/8] Generating Prisma Client..."
yarn prisma generate

echo "[4/8] Configuring environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env << 'ENVFILE'
DATABASE_URL="postgresql://inmova_user:InmovaSecure2025!@localhost:5432/inmova_db"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="https://www.inmova.app"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://www.inmova.app"
ENVFILE
fi

echo "[5/8] Syncing database schema..."
yarn prisma db push --skip-generate

echo "[6/8] Building application (this may take 10-15 minutes)..."
NODE_OPTIONS="--max-old-space-size=12288" yarn build

echo "[7/8] Setting up PM2..."
pm2 delete inmova 2>/dev/null || true
pm2 start yarn --name "inmova" -- start
pm2 save
pm2 startup systemd -u root --hp /root || true

echo "[8/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/inmova << 'NGINXCONF'
server {
    listen 80;
    server_name www.inmova.app inmova.app 77.42.45.109;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==="
echo "✅ Deployment Complete!"
echo "Access at: http://77.42.45.109"
echo "PM2 Status:"
pm2 status
echo "==="
