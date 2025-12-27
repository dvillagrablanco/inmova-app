# 🔧 Migración Manual - Comandos Paso a Paso

## ⚠️ USO: Si no puedes usar SSH automatizado

Si no puedes conectarte automáticamente por SSH, ejecuta estos comandos **directamente en el servidor**.

---

## 📋 PASO 1: Conectar al Servidor

Conecta al servidor usando tu método preferido:
- Panel de control del hosting
- Consola web
- Otro acceso SSH

Una vez dentro del servidor como **root**, continúa con los siguientes pasos.

---

## 🔧 PASO 2: Instalar Dependencias del Sistema

```bash
# Actualizar sistema
apt-get update
apt-get upgrade -y

# Instalar dependencias básicas
apt-get install -y curl wget git build-essential nginx postgresql postgresql-contrib redis-server certbot python3-certbot-nginx ufw

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Instalar Yarn y PM2
npm install -g yarn pm2

# Verificar instalaciones
node --version
yarn --version
pm2 --version
```

---

## 📁 PASO 3: Crear Estructura de Directorios

```bash
# Crear directorios
mkdir -p /var/www/inmova
mkdir -p /var/www/inmova/backups
mkdir -p /var/www/inmova/logs
mkdir -p /var/log/inmova

# Configurar permisos
chown -R www-data:www-data /var/www/inmova
chmod -R 755 /var/www/inmova
```

---

## 📦 PASO 4: Transferir Archivos

Desde tu máquina local, transfiere los archivos al servidor:

```bash
# Opción A: Usando rsync (si tienes acceso SSH con clave)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'backups' \
  ./ root@157.180.119.236:/var/www/inmova/

# Opción B: Crear un tar.gz y subirlo
tar -czf inmova.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='backups' \
  .

# Luego sube inmova.tar.gz al servidor y extrae:
cd /var/www/inmova
tar -xzf /ruta/a/inmova.tar.gz

# Opción C: Clonar desde Git (si tu repo está en Git)
cd /var/www/inmova
git clone https://tu-repo.git .
```

---

## 🔐 PASO 5: Configurar Variables de Entorno

En el servidor, crea el archivo `.env`:

```bash
cd /var/www/inmova
nano .env
```

Pega este contenido (con tus valores reales):

```env
NODE_ENV=production
PORT=3000

# Base de datos
DATABASE_URL=postgresql://inmova_user:inmova_secure_2025@localhost:5432/inmova_production
POSTGRES_PASSWORD=inmova_secure_2025

# NextAuth
NEXTAUTH_SECRET=tOkghBlIjPxWQvS0BW/e1MnxAOZGJaqi3/ko3mBmd1M=
NEXTAUTH_URL=http://157.180.119.236
NEXT_PUBLIC_BASE_URL=http://157.180.119.236

# Encryption
ENCRYPTION_KEY=ne8Olq2+bewxuA0aTfakpX9MP6CD91eQFjqLzVJxUY8=
MFA_ENCRYPTION_KEY=8dlhyEXl+2Lh2hZagX2AhjFygEgsxmsIoz/Flw3n1N4=
CRON_SECRET=fa56314df1ea41a3f6aaebf8031863579b52160ae02c995569e3da047548b68f

# VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJxpmuy2XXuT_W5036cFcNeI5kTsR1tZnq89g6MP7naqsMnoJjj8CRHvugmx5UrFoKgC6mq7mnRF2THukkS6pug
VAPID_PRIVATE_KEY=9UMKV0h5mJuYC7fMprXNvzrWwX80kI8nXlc7lRxMJwc

# AWS S3 (CAMBIAR CON TUS VALORES REALES)
AWS_REGION=us-west-2
AWS_BUCKET_NAME=tu-bucket-real
AWS_ACCESS_KEY_ID=tu-access-key-real
AWS_SECRET_ACCESS_KEY=tu-secret-key-real
AWS_FOLDER_PREFIX=production/

# Stripe (CAMBIAR CON TUS VALORES REALES)
STRIPE_SECRET_KEY=tu-sk-live-real
STRIPE_PUBLISHABLE_KEY=tu-pk-live-real
STRIPE_WEBHOOK_SECRET=tu-whsec-real
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu-pk-live-real

# Redis
REDIS_URL=redis://localhost:6379

# Otros
ADMIN_IP_WHITELIST=
LOG_LEVEL=info
```

Guarda con `Ctrl+X`, `Y`, `Enter`.

---

## 🗄️ PASO 6: Configurar PostgreSQL

```bash
# Crear usuario y base de datos
sudo -u postgres psql << EOF
CREATE USER inmova_user WITH PASSWORD 'inmova_secure_2025';
CREATE DATABASE inmova_production;
GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;
ALTER USER inmova_user WITH SUPERUSER;
\q
EOF

echo "✅ PostgreSQL configurado"
```

---

## 📦 PASO 7: Instalar Dependencias de Node

```bash
cd /var/www/inmova

# Instalar dependencias
yarn install --frozen-lockfile --production=false

# Generar Prisma Client
yarn prisma generate

echo "✅ Dependencias instaladas"
```

---

## 🔄 PASO 8: Ejecutar Migraciones de Base de Datos

```bash
cd /var/www/inmova

# Ejecutar migraciones
yarn prisma migrate deploy

# Seed inicial (opcional)
yarn prisma db seed || echo "No hay seed"

echo "✅ Migraciones completadas"
```

---

## 🏗️ PASO 9: Compilar Aplicación

```bash
cd /var/www/inmova

# Build de producción
yarn build

echo "✅ Build completado"
```

---

## 🚀 PASO 10: Configurar PM2

```bash
cd /var/www/inmova

# Crear archivo de configuración PM2
cat > ecosystem.config.js << 'EOF'
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

# Iniciar aplicación
pm2 delete inmova-production 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo "✅ PM2 configurado"
```

---

## 🌐 PASO 11: Configurar Nginx

```bash
# Crear configuración de Nginx
cat > /etc/nginx/sites-available/inmova << 'EOF'
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
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova
rm -f /etc/nginx/sites-enabled/default

# Test y reiniciar
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx configurado"
```

---

## 🔥 PASO 12: Configurar Firewall

```bash
# Configurar UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar firewall
echo "y" | ufw enable

# Ver estado
ufw status

echo "✅ Firewall configurado"
```

---

## ✅ PASO 13: Verificar Instalación

```bash
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs inmova-production --lines 50

# Verificar servicios
systemctl status nginx
systemctl status postgresql
systemctl status redis-server

# Test HTTP
curl -I http://localhost

echo ""
echo "✅ Verificación completada"
echo ""
echo "🌐 Tu aplicación debería estar en: http://157.180.119.236"
```

---

## 🔧 Comandos Útiles Post-Instalación

```bash
# Ver logs de la aplicación
pm2 logs inmova-production

# Reiniciar aplicación
pm2 restart inmova-production

# Ver recursos del sistema
htop

# Ver logs de Nginx
tail -f /var/log/nginx/inmova_access.log
tail -f /var/log/nginx/inmova_error.log

# Backup de base de datos
pg_dump inmova_production > backup_$(date +%Y%m%d).sql
```

---

## 🆘 Troubleshooting

### Aplicación no inicia
```bash
# Ver errores detallados
pm2 logs inmova-production --err --lines 100

# Verificar .env
cat /var/www/inmova/.env

# Reintentar
cd /var/www/inmova
yarn build
pm2 restart inmova-production
```

### Error 502 Bad Gateway
```bash
# Verificar que PM2 está corriendo
pm2 status

# Verificar puerto 3000
netstat -tlnp | grep 3000

# Reiniciar Nginx
systemctl restart nginx
```

### Base de datos no conecta
```bash
# Verificar PostgreSQL
systemctl status postgresql

# Test de conexión
sudo -u postgres psql -d inmova_production -c "\dt"
```

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación INMOVA estará funcionando en:

**http://157.180.119.236**

---

**Tiempo estimado:** 30-45 minutos  
**Dificultad:** Media  
**Resultado:** Aplicación funcionando en producción
