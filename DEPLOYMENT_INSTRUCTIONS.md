# 🚀 Instrucciones de Deployment - Ejecución Inmediata

**Fecha**: 29 de diciembre de 2025  
**Status**: Ready to Execute

---

## ⚡ DEPLOYMENT EN 10 MINUTOS

### Información Necesaria

Antes de empezar, ten a mano:

- ✅ IP del servidor VPS
- ✅ Password de root (o clave SSH)
- ✅ Dominio (opcional para SSL)

---

## 📋 PASO 1: Conectar al Servidor

```bash
# Conectar como root
ssh root@YOUR_SERVER_IP

# Si tienes clave SSH:
ssh -i ~/.ssh/your_key root@YOUR_SERVER_IP
```

---

## 🛠️ PASO 2: Setup Inicial (Primera Vez - 5 minutos)

### Opción A: Descarga y Ejecuta Script

```bash
# Descargar script de setup
wget https://raw.githubusercontent.com/dvillagrablanco/inmova-app/main/setup-server.sh

# Ejecutar
bash setup-server.sh
```

### Opción B: Ejecutar Manualmente

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose -y

# Instalar Nginx y Certbot
apt install nginx certbot python3-certbot-nginx -y

# Configurar Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Crear usuario deploy
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
usermod -aG sudo deploy
echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy

# Crear directorios
mkdir -p /home/deploy/inmova-app
mkdir -p /home/deploy/backups
mkdir -p /home/deploy/logs
chown -R deploy:deploy /home/deploy
```

---

## 🔄 PASO 3: Cambiar a Usuario Deploy

```bash
# Cambiar a usuario deploy
su - deploy
```

---

## 📦 PASO 4: Clonar Repositorio

```bash
# Clonar repo
cd ~
git clone https://github.com/dvillagrablanco/inmova-app.git inmova-app
cd inmova-app
```

---

## 🔐 PASO 5: Configurar Variables de Entorno

```bash
# Crear archivo .env.production
nano .env.production
```

### Copiar y Pegar (IMPORTANTE: Cambiar valores)

```env
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BASE_URL=https://inmovaapp.com

# Database
DATABASE_URL=postgresql://inmova_user:CAMBIAR_PASSWORD_SEGURO@postgres:5432/inmova

# NextAuth
NEXTAUTH_SECRET=GENERAR_CON_openssl_rand_base64_32
NEXTAUTH_URL=https://inmovaapp.com

# AWS S3
AWS_REGION=us-east-1
AWS_BUCKET_NAME=inmova-uploads
AWS_ACCESS_KEY_ID=TU_AWS_KEY
AWS_SECRET_ACCESS_KEY=TU_AWS_SECRET

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# PostgreSQL (Docker Compose)
POSTGRES_PASSWORD=CAMBIAR_PASSWORD_SEGURO
```

### Generar NEXTAUTH_SECRET

```bash
# Ejecutar en el servidor para generar secret
openssl rand -base64 32

# Copiar resultado a NEXTAUTH_SECRET en .env.production
```

---

## 🚀 PASO 6: Ejecutar Deployment

```bash
# Dar permisos a scripts
chmod +x setup-server.sh deploy.sh backup-db.sh

# EJECUTAR DEPLOYMENT
bash deploy.sh
```

**Tiempo estimado**: 5-10 minutos (primera vez)

### Verificar Logs Durante Deployment

```bash
# En otra terminal SSH
docker-compose -f docker-compose.production.yml logs -f app
```

---

## ✅ PASO 7: Verificar Deployment

```bash
# Verificar containers corriendo
docker-compose -f docker-compose.production.yml ps

# Debería mostrar:
# - app (Up)
# - postgres (Up)
# - redis (Up)
# - nginx (Up)

# Health check
curl http://localhost:3000/api/health

# Debería responder:
# {"status":"ok","timestamp":"..."}
```

---

## 🌐 PASO 8: Configurar Nginx (Opcional - para dominio)

```bash
# Salir de usuario deploy (volver a root)
exit

# Crear configuración Nginx
nano /etc/nginx/sites-available/inmova
```

### Pegar configuración:

```nginx
upstream nextjs_app {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name inmovaapp.com www.inmovaapp.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name inmovaapp.com www.inmovaapp.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

### Activar sitio

```bash
# Crear symlink
ln -s /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/

# Test configuración
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 🔐 PASO 9: Configurar SSL (Opcional)

```bash
# IMPORTANTE: DNS debe estar apuntando a la IP del servidor

# Ejecutar certbot
certbot --nginx -d inmovaapp.com -d www.inmovaapp.com

# Seguir wizard:
# 1. Ingresar email
# 2. Aceptar términos
# 3. Redirect HTTP -> HTTPS: Yes
```

---

## 🎉 DEPLOYMENT COMPLETADO

### URLs de Acceso:

**Sin dominio:**

- http://YOUR_SERVER_IP:3000

**Con dominio:**

- https://inmovaapp.com
- Health: https://inmovaapp.com/api/health

### Comandos Útiles:

```bash
# Ver logs
docker-compose -f docker-compose.production.yml logs -f app

# Ver estado
docker-compose -f docker-compose.production.yml ps

# Restart app
docker-compose -f docker-compose.production.yml restart app

# Detener todo
docker-compose -f docker-compose.production.yml down

# Actualizar código
cd ~/inmova-app
git pull origin main
bash deploy.sh

# Backup manual
bash backup-db.sh
```

---

## 🔧 Troubleshooting

### App no inicia

```bash
# Ver logs detallados
docker-compose logs -f app

# Verificar .env
cat .env.production

# Regenerar Prisma
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma migrate deploy
```

### Nginx 502 Error

```bash
# Verificar app está corriendo
curl http://localhost:3000/api/health

# Ver logs Nginx
tail -f /var/log/nginx/error.log

# Restart todo
docker-compose restart
```

### Base de datos no conecta

```bash
# Verificar PostgreSQL
docker-compose logs postgres

# Verificar DATABASE_URL en .env
# Asegurar que usa "postgres" como host (no localhost)
# DATABASE_URL=postgresql://user:pass@postgres:5432/inmova
```

---

## 📋 Checklist Final

- [ ] Servidor accesible via SSH
- [ ] Docker instalado
- [ ] Repositorio clonado
- [ ] .env.production configurado
- [ ] deploy.sh ejecutado sin errores
- [ ] Containers corriendo (docker-compose ps)
- [ ] Health check responde (curl localhost:3000/api/health)
- [ ] Nginx configurado (opcional)
- [ ] SSL configurado (opcional)
- [ ] Aplicación accesible

---

## 🆘 Soporte

Si algo falla:

1. **Ver logs**: `docker-compose logs -f app`
2. **Estado containers**: `docker-compose ps`
3. **Documentación**: Ver GUIA_DEPLOYMENT_SERVIDOR.md
4. **Rollback**: `git checkout <commit-anterior> && bash deploy.sh`

---

**Ready to Deploy!** 🚀
