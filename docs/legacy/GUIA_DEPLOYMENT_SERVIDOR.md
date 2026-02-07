# 🚀 Guía Completa: Deployment en Servidor Propio

**Proyecto**: Inmova App - PropTech Platform  
**Fecha**: 29 de diciembre de 2025  
**Método**: Docker + VPS + Nginx  
**Tiempo Estimado**: 2-4 horas (setup inicial)

---

## 📋 Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Setup Inicial del Servidor](#setup-inicial)
3. [Configuración de Dominio y DNS](#configuración-dns)
4. [Deployment de la Aplicación](#deployment)
5. [Configuración de SSL](#configuración-ssl)
6. [CI/CD con GitHub Actions](#cicd)
7. [Monitoreo y Mantenimiento](#monitoreo)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Pre-requisitos

### 1. Servidor VPS

**Specs Mínimas Recomendadas:**

- **CPU**: 4 vCPUs
- **RAM**: 8 GB
- **Storage**: 160 GB SSD
- **Bandwidth**: Ilimitado o >1TB
- **OS**: Ubuntu 22.04 LTS

**Proveedores Recomendados:**

| Proveedor                 | Plan          | Precio/mes | Link             |
| ------------------------- | ------------- | ---------- | ---------------- |
| **Hetzner** (Recomendado) | CPX31         | €13.90     | hetzner.com      |
| DigitalOcean              | Basic Droplet | $24        | digitalocean.com |
| Linode                    | Dedicated 8GB | $36        | linode.com       |
| OVH                       | VPS Value     | €20        | ovhcloud.com     |

**💡 Recomendación**: Hetzner por mejor relación precio/rendimiento en Europa.

### 2. Dominio

- Dominio registrado (ejemplo: inmovaapp.com)
- Acceso a configuración DNS
- Propagación DNS puede tardar 24-48 horas

### 3. Herramientas Locales

```bash
# En tu máquina local
git --version      # Git 2.x+
ssh -V             # OpenSSH
```

---

## 🛠️ Setup Inicial del Servidor

### Paso 1: Conectar al Servidor

```bash
# Conectar via SSH (reemplaza con tu IP)
ssh root@YOUR_SERVER_IP

# O con key file
ssh -i ~/.ssh/id_rsa root@YOUR_SERVER_IP
```

### Paso 2: Ejecutar Script de Setup Automatizado

```bash
# Descargar script de setup
wget https://raw.githubusercontent.com/tu-usuario/inmova-app/main/setup-server.sh

# O copiar manualmente el script desde el repo

# Dar permisos de ejecución
chmod +x setup-server.sh

# Ejecutar como root
bash setup-server.sh
```

**El script instalará:**

- ✅ Docker y Docker Compose
- ✅ Nginx y Certbot (SSL)
- ✅ Firewall (UFW) configurado
- ✅ Fail2Ban (protección SSH)
- ✅ Usuario `deploy` con permisos

### Paso 3: Configurar SSH Key para Deploy

```bash
# En tu máquina LOCAL
ssh-keygen -t ed25519 -C "deploy@inmovaapp"

# Copiar key al servidor
ssh-copy-id deploy@YOUR_SERVER_IP

# Verificar acceso sin password
ssh deploy@YOUR_SERVER_IP
```

---

## 🌐 Configuración de Dominio y DNS

### Paso 1: Configurar Registros DNS

En tu proveedor de dominio (Namecheap, GoDaddy, Cloudflare, etc.):

```
Tipo    Nombre              Valor               TTL
A       @                   YOUR_SERVER_IP      300
A       www                 YOUR_SERVER_IP      300
AAAA    @                   YOUR_IPv6          300 (opcional)
```

### Paso 2: Verificar Propagación DNS

```bash
# Verificar que el dominio apunta correctamente
dig inmovaapp.com +short

# O con nslookup
nslookup inmovaapp.com

# Online: https://dnschecker.org
```

⏰ **Esperar 15-30 minutos** para propagación DNS inicial.

---

## 🚀 Deployment de la Aplicación

### Paso 1: Clonar Repositorio

```bash
# Como usuario deploy
ssh deploy@YOUR_SERVER_IP

# Ir al directorio home
cd ~

# Clonar repositorio
git clone https://github.com/dvillagrablanco/inmova-app.git
cd inmova-app
```

### Paso 2: Crear Archivo de Variables de Entorno

```bash
# Crear .env.production
nano .env.production
```

```env
# .env.production - PLANTILLA
# ⚠️ CAMBIAR TODOS LOS VALORES

# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BASE_URL=https://inmovaapp.com

# Database (se conecta al container de PostgreSQL)
DATABASE_URL=postgresql://inmova_user:CAMBIAR_PASSWORD_DB@postgres:5432/inmova

# NextAuth
NEXTAUTH_SECRET=GENERAR_SECRET_ALEATORIO_SEGURO_32_CHARS
NEXTAUTH_URL=https://inmovaapp.com

# AWS S3 (Storage)
AWS_REGION=us-east-1
AWS_BUCKET_NAME=inmova-uploads
AWS_ACCESS_KEY_ID=TU_AWS_KEY
AWS_SECRET_ACCESS_KEY=TU_AWS_SECRET

# Stripe (Pagos)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...

# Optional: Redis (Cache)
REDIS_URL=redis://redis:6379

# Optional: Email (SendGrid)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@inmovaapp.com

# PostgreSQL (para docker-compose)
POSTGRES_PASSWORD=CAMBIAR_PASSWORD_DB
```

**⚠️ IMPORTANTE**: Cambiar todos los valores, especialmente:

- `NEXTAUTH_SECRET` (generar con: `openssl rand -base64 32`)
- `POSTGRES_PASSWORD` (password seguro)
- Credenciales de AWS, Stripe, etc.

### Paso 3: Ejecutar Deployment

```bash
# Dar permisos a scripts
chmod +x deploy.sh backup-db.sh

# Ejecutar deployment
bash deploy.sh
```

**El script ejecutará:**

1. Pull del código
2. Backup de BD (si existe)
3. Stop de containers
4. Build de nueva imagen
5. Start de containers
6. Migraciones de Prisma
7. Health checks

**Tiempo estimado**: 5-10 minutos (primera vez)

### Paso 4: Verificar Deployment

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.production.yml logs -f app

# Verificar que todos los containers estén UP
docker-compose -f docker-compose.production.yml ps

# Health check local
curl http://localhost:3000/api/health

# Debería responder:
# {"status":"ok","timestamp":"..."}
```

---

## 🔐 Configuración de SSL (HTTPS)

### Paso 1: Configurar Nginx

```bash
# Como usuario con sudo (deploy tiene sudo)
sudo nano /etc/nginx/sites-available/inmova

# Pegar configuración:
```

```nginx
upstream nextjs_app {
    server localhost:3000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name inmovaapp.com www.inmovaapp.com;

    # Para Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server (se configurará automáticamente con certbot)
server {
    listen 443 ssl http2;
    server_name inmovaapp.com www.inmovaapp.com;

    # Certificados (certbot los agregará)
    # ssl_certificate /etc/letsencrypt/live/inmovaapp.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/inmovaapp.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

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

        # Timeouts generosos
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://nextjs_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/

# Test configuración
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Paso 2: Obtener Certificado SSL con Let's Encrypt

```bash
# Generar certificado SSL
sudo certbot --nginx -d inmovaapp.com -d www.inmovaapp.com

# Seguir el wizard interactivo:
# 1. Ingresar email
# 2. Aceptar términos
# 3. Elegir redirect HTTP -> HTTPS: Yes
```

**Certbot configurará automáticamente:**

- ✅ Certificados SSL
- ✅ Auto-renovación (cron job)
- ✅ Redirect HTTP → HTTPS

### Paso 3: Verificar SSL

```bash
# Test manual
curl -I https://inmovaapp.com

# Verificar online
# https://www.ssllabs.com/ssltest/
```

---

## 🔄 CI/CD con GitHub Actions

### Opción 1: GitHub Actions (Recomendado)

#### Paso 1: Configurar SSH Key

```bash
# En tu máquina LOCAL
cat ~/.ssh/id_rsa
# Copiar toda la clave privada
```

#### Paso 2: Añadir Secrets en GitHub

1. Ir a: `GitHub Repo → Settings → Secrets and variables → Actions`
2. Añadir secrets:

```
SERVER_HOST      = IP_DEL_SERVIDOR
SERVER_USER      = deploy
SSH_PRIVATE_KEY  = (pegar clave privada completa)
```

#### Paso 3: Crear Workflow

```bash
# Crear directorio
mkdir -p .github/workflows

# Crear archivo
nano .github/workflows/deploy-production.yml
```

```yaml
name: Deploy to Production Server

on:
  push:
    branches: [main]
  workflow_dispatch: # Deploy manual

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/deploy/inmova-app
            git pull origin main
            bash deploy.sh

      - name: Health Check
        run: |
          sleep 30
          curl --fail https://inmovaapp.com/api/health || exit 1

      - name: Notify Success
        if: success()
        run: echo "✅ Deployment exitoso!"
```

```bash
# Commit y push
git add .github/workflows/deploy-production.yml
git commit -m "feat: add GitHub Actions deployment"
git push origin main
```

**Ahora cada push a `main` desplegará automáticamente! 🎉**

---

## 📊 Monitoreo y Mantenimiento

### 1. Logs

```bash
# Logs en tiempo real
docker-compose -f docker-compose.production.yml logs -f app

# Logs de errores
docker-compose logs app | grep ERROR

# Logs de Nginx
docker-compose logs nginx

# Logs del sistema
sudo journalctl -fu nginx
```

### 2. Backups Automatizados

```bash
# Configurar cron job
crontab -e

# Añadir (backup diario a las 2 AM):
0 2 * * * /home/deploy/inmova-app/backup-db.sh >> /home/deploy/logs/backup.log 2>&1
```

### 3. Monitoreo Uptime

**Opciones gratuitas:**

1. **UptimeRobot** (https://uptimerobot.com)
   - Crear monitor HTTP(S)
   - URL: `https://inmovaapp.com/api/health`
   - Intervalo: 5 minutos
   - Alertas por email

2. **Healthchecks.io** (https://healthchecks.io)
   - Similar a UptimeRobot
   - Más opciones de notificación

3. **Uptime Kuma** (self-hosted)
   ```bash
   docker run -d --name uptime-kuma -p 3001:3001 -v uptime-kuma:/app/data louislam/uptime-kuma:1
   ```

### 4. Métricas de Performance

```bash
# Recursos de containers
docker stats

# Disk usage
df -h

# Memory
free -h

# CPU load
htop
```

---

## 🔧 Troubleshooting

### Problema: App no inicia

```bash
# Ver logs detallados
docker-compose logs -f app

# Verificar variables de entorno
docker-compose exec app env | grep -i database

# Restart containers
docker-compose restart
```

### Problema: Error de Prisma

```bash
# Regenerar Prisma Client
docker-compose exec app npx prisma generate

# Aplicar migraciones
docker-compose exec app npx prisma migrate deploy

# Ver estado de migraciones
docker-compose exec app npx prisma migrate status
```

### Problema: Nginx 502 Bad Gateway

```bash
# Verificar que la app está corriendo
curl http://localhost:3000/api/health

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Problema: SSL Certificate Error

```bash
# Renovar certificado
sudo certbot renew --dry-run

# Force renew
sudo certbot renew --force-renewal
```

### Rollback a Versión Anterior

```bash
# Ver commits recientes
git log --oneline -10

# Checkout a commit anterior
git checkout <commit-hash>

# Re-deploy
bash deploy.sh

# Volver a main
git checkout main
bash deploy.sh
```

---

## 📋 Checklist Completo

### Pre-Deployment

- [ ] VPS contratado y accesible
- [ ] Ubuntu 22.04 instalado
- [ ] Dominio registrado
- [ ] DNS configurado y propagado
- [ ] SSH key configurada

### Setup

- [ ] `setup-server.sh` ejecutado exitosamente
- [ ] Docker y Docker Compose instalados
- [ ] Firewall (UFW) configurado
- [ ] Usuario `deploy` creado

### Deployment

- [ ] Repositorio clonado
- [ ] `.env.production` creado y configurado
- [ ] `deploy.sh` ejecutado sin errores
- [ ] Containers corriendo: `docker-compose ps`
- [ ] Health check responde: `curl localhost:3000/api/health`

### SSL & Nginx

- [ ] Nginx configurado
- [ ] Certificado SSL obtenido con certbot
- [ ] HTTPS funcionando: `https://inmovaapp.com`
- [ ] Redirect HTTP → HTTPS activo

### Post-Deployment

- [ ] Login funciona
- [ ] Dashboard accesible
- [ ] API endpoints responden
- [ ] Backups configurados (cron)
- [ ] Monitoreo configurado (UptimeRobot)
- [ ] GitHub Actions funcionando

---

## 🎉 Deployment Completado

Si llegaste aquí, ¡felicidades! Tu aplicación está corriendo en producción.

**URLs Importantes:**

- Aplicación: https://inmovaapp.com
- Health Check: https://inmovaapp.com/api/health
- API Version: https://inmovaapp.com/api/version

**Comandos Útiles:**

```bash
# Ver logs
docker-compose logs -f app

# Restart app
docker-compose restart app

# Update code
git pull && bash deploy.sh

# Backup DB
bash backup-db.sh

# Ver estado
docker-compose ps
```

**Soporte:**

- Documentación: `/ESTUDIO_PRE_DEPLOYMENT_SERVIDOR.md`
- Cursor Rules: `/.cursorrules` (sección Docker Deployment)
- Issues: GitHub Issues

---

**Versión**: 1.0  
**Última actualización**: 29 de diciembre de 2025  
**Mantenido por**: Equipo Inmova
