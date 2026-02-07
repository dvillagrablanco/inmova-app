# 📊 Estudio Pre-Deployment: Servidor Propio vs Vercel

**Fecha**: 29 de diciembre de 2025  
**Proyecto**: Inmova App (PropTech Platform)  
**Análisis**: Alternativas de Deployment después de fallos en Vercel

---

## 🔴 Problema Identificado con Vercel

### Errores Recurrentes

```
Error: Some specified paths were not resolved, unable to cache dependencies
Status: 5 deployments consecutivos fallidos (27-29 dic 2025)
```

### Análisis de Causa Raíz

1. **Cache de Dependencias**: Problema con path resolution en GitHub Actions + Vercel
2. **Build Complexity**: Next.js 15 + Prisma + 548 API routes = build pesado
3. **Timeout Issues**: Historial de timeouts en funciones serverless
4. **Limitaciones Serverless**:
   - Cold starts significativos
   - Memory limits (1024MB)
   - Execution time (60s max en Plan Pro)
   - Database connections pool limitado

---

## ✅ Solución Recomendada: Servidor Propio con Docker

### Por Qué Servidor Propio

#### Ventajas

1. **✅ Control Total**
   - Sin limitaciones de timeout
   - Memory escalable según necesidad
   - CPU dedicado
   - Sin cold starts

2. **✅ Base de Datos Local**
   - Prisma con conexión directa
   - Sin problemas de connection pooling
   - Queries complejas sin restricciones
   - Backups automatizados

3. **✅ Costos Predecibles**
   - VPS desde €10-30/mes
   - Sin cargos por requests
   - Sin límites de bandwidth (en VPS adecuado)
   - Escalabilidad controlada

4. **✅ Flexibility**
   - Background jobs sin restricciones (BullMQ)
   - Cron jobs nativos
   - File system persistente
   - Redis/Cache sin límites

#### Desventajas

1. **⚠️ Mantenimiento**: Requiere administración del servidor
2. **⚠️ Seguridad**: Responsabilidad de patches y updates
3. **⚠️ Escalabilidad**: No auto-scaling automático
4. **⚠️ Setup Inicial**: Más complejo que push-to-deploy

---

## 🏗️ Arquitectura Propuesta

### Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│         Internet / CDN (Cloudflare)         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Nginx Reverse Proxy + SSL           │
│         (Puerto 80/443)                     │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Next.js App (Docker Container)        │
│       - Node 20                             │
│       - PM2 (Process Manager)               │
│       - Puerto 3000                         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│     PostgreSQL Database (Docker)            │
│     - Versión 15                            │
│     - Persistent Volume                     │
└─────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Redis Cache (Docker)                │
│         - Opcional                          │
└─────────────────────────────────────────────┘
```

### Opciones de Hosting

#### Opción 1: VPS (Recomendado para Producción)

**Proveedores**:

- **Hetzner** (€10-40/mes) - Mejor relación precio/rendimiento
- **DigitalOcean** ($12-48/mes) - Fácil de usar
- **Linode/Akamai** ($12-48/mes) - Buena red
- **OVH** (€8-30/mes) - Opción europea

**Specs Recomendadas**:

```
CPU: 4 vCPUs
RAM: 8 GB
Storage: 160 GB SSD
Bandwidth: Ilimitado
OS: Ubuntu 22.04 LTS
```

#### Opción 2: Coolify (Auto-hosted Vercel Alternative)

**Características**:

- ✅ Self-hosted PaaS
- ✅ Git-push to deploy
- ✅ SSL automático
- ✅ Docker-based
- ✅ Gestión via UI

**Costo**: €20-40/mes (VPS + Coolify free)

#### Opción 3: Railway/Render (Managed Containers)

**Características**:

- ✅ Similar a Vercel pero mejor para Next.js complejo
- ✅ Sin limitaciones serverless
- ✅ Database incluida

**Costo**: $20-50/mes

---

## 🐳 Estrategia de Deployment con Docker

### Fase 1: Contenedorización (Ya Implementada)

#### Dockerfile Optimizado

Ya existe `Dockerfile.production` con:

- ✅ Multi-stage build (optimizado)
- ✅ Node 20 Alpine (imagen ligera)
- ✅ Prisma generation automática
- ✅ Next.js standalone output
- ✅ Non-root user (seguridad)

#### Docker Compose

Ya existe `docker-compose.production.yml` con:

- ✅ App container
- ✅ PostgreSQL container
- ✅ Nginx reverse proxy
- ✅ Persistent volumes
- ✅ Network isolation

### Fase 2: Setup de Servidor

#### Script de Instalación Automatizado

```bash
#!/bin/bash
# install-server.sh

# 1. Actualizar sistema
apt update && apt upgrade -y

# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose -y

# 3. Instalar Nginx
apt install nginx certbot python3-certbot-nginx -y

# 4. Configurar Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 5. Crear usuario deployment
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
```

### Fase 3: Deployment Automático

#### GitHub Actions para Deploy en Servidor

```yaml
name: Deploy to Production Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/deploy/inmova-app
            git pull origin main
            docker-compose -f docker-compose.production.yml down
            docker-compose -f docker-compose.production.yml up -d --build
            docker-compose -f docker-compose.production.yml exec -T app npx prisma migrate deploy
```

---

## 📊 Comparativa: Vercel vs Servidor Propio

| Aspecto                       | Vercel             | Servidor Propio (Docker) |
| ----------------------------- | ------------------ | ------------------------ |
| **Setup**                     | ⭐⭐⭐⭐⭐ Instant | ⭐⭐⭐ 2-4 horas         |
| **Mantenimiento**             | ⭐⭐⭐⭐⭐ Cero    | ⭐⭐ Mensual             |
| **Costo (< 10k visits)**      | $20/mes            | $15/mes                  |
| **Costo (> 100k visits)**     | $150-500/mes       | $30-50/mes               |
| **Timeouts**                  | ❌ 60s max         | ✅ Sin límite            |
| **Cold Starts**               | ❌ 1-3s            | ✅ 0s                    |
| **Database**                  | ⚠️ Pooling issues  | ✅ Directo               |
| **Memory**                    | ❌ 1024MB max      | ✅ 8GB+                  |
| **Background Jobs**           | ❌ Complejo        | ✅ Nativo                |
| **Escalabilidad**             | ⭐⭐⭐⭐⭐ Auto    | ⭐⭐⭐ Manual            |
| **DX (Developer Experience)** | ⭐⭐⭐⭐⭐         | ⭐⭐⭐                   |

---

## 🎯 Recomendación Final

### Para Inmova App: **Servidor Propio con Docker**

**Razones**:

1. **548 API Routes** - Demasiado para serverless
2. **Prisma Complejo** - Mejor con BD directa
3. **Background Jobs** - BullMQ necesita servidor persistente
4. **Costos** - Más económico a medio/largo plazo
5. **Control** - Requisitos de PropTech necesitan flexibility

### Plan de Implementación

#### Inmediato (Hoy)

1. ✅ Dockerfiles ya listos
2. ✅ Docker Compose configurado
3. ⏳ Contratar VPS (Hetzner €20/mes recomendado)
4. ⏳ Configurar dominio + DNS

#### Corto Plazo (1-2 días)

1. Setup de servidor con script automatizado
2. Configurar SSL con Let's Encrypt
3. Deploy inicial manual
4. Verificar funcionamiento

#### Medio Plazo (1 semana)

1. Configurar GitHub Actions para auto-deploy
2. Setup de backups automatizados
3. Monitoreo con Uptime Kuma / Healthchecks.io
4. Optimizar Nginx cache

---

## 🔧 Configuración Técnica Detallada

### Nginx Configuration

```nginx
upstream nextjs_app {
    server app:3000;
}

server {
    listen 80;
    server_name inmovaapp.com www.inmovaapp.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name inmovaapp.com www.inmovaapp.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/inmovaapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inmovaapp.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Client Max Body Size (para uploads)
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
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://nextjs_app;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### Environment Variables

```env
# .env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/inmova

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://inmovaapp.com

# AWS S3
AWS_REGION=us-east-1
AWS_BUCKET_NAME=inmova-uploads

# Stripe
STRIPE_SECRET_KEY=sk_live_...
```

---

## 📋 Checklist Pre-Deployment

### Servidor

- [ ] VPS contratado y accesible via SSH
- [ ] Ubuntu 22.04 LTS instalado
- [ ] Docker + Docker Compose instalados
- [ ] Firewall configurado (UFW)
- [ ] Usuario `deploy` creado

### Dominio

- [ ] DNS apuntando a IP del servidor
- [ ] A record: inmovaapp.com → IP_SERVIDOR
- [ ] A record: www.inmovaapp.com → IP_SERVIDOR
- [ ] Propagación DNS completada (24-48h)

### SSL

- [ ] Certbot instalado
- [ ] Certificado Let's Encrypt generado
- [ ] Auto-renovación configurada

### Aplicación

- [ ] Variables de entorno configuradas
- [ ] Database migrations ready
- [ ] S3 buckets creados
- [ ] Stripe webhooks configurados

---

## 🚀 Comandos de Deployment

### Deploy Manual

```bash
# En el servidor
cd /home/deploy/inmova-app
git pull origin main
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Verificar logs
docker-compose -f docker-compose.production.yml logs -f app

# Ejecutar migraciones
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy
```

### Rollback

```bash
# Volver a versión anterior
git checkout HEAD~1
docker-compose -f docker-compose.production.yml up -d --build
```

### Backup Database

```bash
# Backup automático
docker-compose exec postgres pg_dump -U user inmova > backup-$(date +%Y%m%d).sql
```

---

## 📊 Monitoreo y Logs

### Uptime Monitoring

- **Uptime Kuma** (self-hosted)
- **Healthchecks.io** (freemium)
- **UptimeRobot** (free tier)

### Application Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Ver logs de error
docker-compose logs app | grep ERROR

# Logs de nginx
docker-compose logs nginx
```

### Metrics (Opcional)

- Prometheus + Grafana
- PM2 metrics
- PostgreSQL stats

---

## ✅ Conclusión

**Decisión**: Migrar a servidor propio con Docker es la mejor opción para Inmova App debido a:

1. Arquitectura compleja (548 API routes)
2. Necesidad de control sobre timeouts
3. Background jobs (BullMQ)
4. Costos predecibles
5. Problemas recurrentes con Vercel

**Siguiente Paso**: Modificar cursor rules para incluir deployment en servidor
