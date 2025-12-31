# 🚀 GUÍA DE DEPLOYMENT DIRECTO - DOCKER

**Proyecto:** INMOVA App  
**Fecha:** 29 Diciembre 2025  
**Método:** Docker + Nginx (sin Vercel)

---

## 📋 CONTENIDO

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Deployment con Scripts](#deployment-con-scripts)
4. [Deployment Manual](#deployment-manual)
5. [Configuración de Nginx](#configuración-de-nginx)
6. [SSL con Let's Encrypt](#ssl-con-lets-encrypt)
7. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 REQUISITOS PREVIOS

### En tu Servidor

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Añadir usuario a grupo docker (evitar sudo)
sudo usermod -aG docker $USER
# Logout y login para aplicar cambios
```

### Verificar Instalación

```bash
docker --version        # Docker version 24.0+
docker-compose --version # Docker Compose version 2.0+
nginx -v               # nginx version 1.18+
```

---

## ⚙️ CONFIGURACIÓN INICIAL

### 1. Clonar Repositorio

```bash
cd /opt
sudo git clone https://github.com/dvillagrablanco/inmova-app.git
cd inmova-app
```

### 2. Configurar Variables de Entorno

```bash
# Copiar ejemplo
cp .env.production.example .env.production

# Editar con tus valores reales
nano .env.production
```

**Variables OBLIGATORIAS:**

```env
# Database (configurar tu PostgreSQL)
DATABASE_URL="postgresql://user:pass@localhost:5432/inmova_prod"

# NextAuth
NEXTAUTH_URL="https://inmovaapp.com"
NEXTAUTH_SECRET="genera-un-secret-seguro-con-openssl-rand-base64-32"

# Analytics (CRÍTICO para landing)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"  # Tu ID real de GA4

# App
NEXT_PUBLIC_BASE_URL="https://inmovaapp.com"
NODE_ENV="production"
```

### 3. Generar Secret para NextAuth

```bash
openssl rand -base64 32
# Copiar output a NEXTAUTH_SECRET en .env.production
```

---

## 🚀 DEPLOYMENT CON SCRIPTS

### Opción 1: Deployment Completo (Recomendado)

```bash
# Deployment completo con verificaciones
./scripts/deploy-direct.sh production
```

**Este script:**

- ✅ Verifica rama de Git
- ✅ Pull último código
- ✅ Verifica variables de entorno
- ✅ Stop contenedor anterior
- ✅ Build nueva imagen
- ✅ Start nuevo contenedor
- ✅ Health check
- ✅ Cleanup

**Tiempo estimado:** 5-10 minutos

### Opción 2: Quick Deploy (Para Iteraciones)

```bash
# Deploy rápido usando cache
./scripts/quick-deploy.sh
```

**Este script:**

- ✅ Pull código
- ✅ Rebuild con cache
- ✅ Restart contenedor

**Tiempo estimado:** 2-3 minutos

---

## 🔨 DEPLOYMENT MANUAL

Si prefieres control manual:

### 1. Build Imagen

```bash
docker build -t inmova-app:production .
```

### 2. Run Contenedor

```bash
docker run -d \
  --name inmova-app-production \
  --env-file .env.production \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/prisma:/app/prisma:ro \
  inmova-app:production
```

### 3. Verificar

```bash
# Ver logs
docker logs -f inmova-app-production

# Ver estado
docker ps | grep inmova

# Test local
curl http://localhost:3000
```

---

## 🌐 CONFIGURACIÓN DE NGINX

### Setup Automático

```bash
sudo ./scripts/setup-nginx.sh inmovaapp.com
```

### Setup Manual

**1. Crear configuración:**

```bash
sudo nano /etc/nginx/sites-available/inmova
```

**2. Contenido básico (HTTP):**

```nginx
server {
    listen 80;
    server_name inmovaapp.com www.inmovaapp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Activar configuración:**

```bash
sudo ln -s /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL CON LET'S ENCRYPT

### Instalación Automática

```bash
sudo certbot --nginx -d inmovaapp.com -d www.inmovaapp.com
```

**Preguntas que hará Certbot:**

1. Email: `tu@email.com` (para notificaciones)
2. Terms: `Yes`
3. Share email: `No`
4. Redirect HTTP to HTTPS: `2` (Yes, recommended)

### Renovación Automática

```bash
# Test renovación
sudo certbot renew --dry-run

# Certbot crea un cronjob automático
# Verificar:
sudo systemctl status certbot.timer
```

### Verificar SSL

```bash
# Test A+ en SSL Labs
https://www.ssllabs.com/ssltest/analyze.html?d=inmovaapp.com
```

---

## 📊 MONITOREO Y MANTENIMIENTO

### Ver Logs

```bash
# Logs en tiempo real
docker logs -f inmova-app-production

# Últimas 100 líneas
docker logs --tail 100 inmova-app-production

# Logs con timestamps
docker logs -t inmova-app-production
```

### Estadísticas del Contenedor

```bash
# Stats en tiempo real
docker stats inmova-app-production

# Uso de recursos
docker inspect inmova-app-production | grep -A 10 "Memory"
```

### Reiniciar Aplicación

```bash
# Restart suave
docker restart inmova-app-production

# Stop y start
docker stop inmova-app-production
docker start inmova-app-production
```

### Actualizar Aplicación

```bash
# Método 1: Script automático
./scripts/quick-deploy.sh

# Método 2: Manual
git pull origin main
docker stop inmova-app-production
docker rm inmova-app-production
docker build -t inmova-app:production .
docker run -d --name inmova-app-production --env-file .env.production --restart unless-stopped -p 3000:3000 inmova-app:production
```

### Backup de Base de Datos

```bash
# Crear backup
docker exec inmova-app-production npx prisma db pull > backup-$(date +%Y%m%d).sql

# O con pg_dump si usas PostgreSQL externo
pg_dump -h localhost -U postgres inmova_prod > backup-$(date +%Y%m%d).sql
```

---

## 🐛 TROUBLESHOOTING

### Contenedor No Inicia

```bash
# Ver logs de error
docker logs inmova-app-production

# Errores comunes:
# - DATABASE_URL inválida
# - NEXTAUTH_SECRET no configurado
# - Puerto 3000 ya en uso
```

**Solución:**

```bash
# Verificar variables
docker exec inmova-app-production env | grep DATABASE

# Verificar puerto
sudo lsof -i :3000
# Si está en uso: kill -9 PID
```

### Error 502 Bad Gateway (Nginx)

```bash
# Verificar que el contenedor esté corriendo
docker ps | grep inmova

# Verificar que la app responda
curl http://localhost:3000

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

**Solución:**

```bash
# Reiniciar contenedor
docker restart inmova-app-production

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Build Falla

```bash
# Error: "no space left on device"
docker system prune -a
docker volume prune

# Error: "context deadline exceeded"
# Aumentar timeout de Docker
export DOCKER_CLIENT_TIMEOUT=300
export COMPOSE_HTTP_TIMEOUT=300
```

### SSL No Funciona

```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Ver logs de certbot
sudo journalctl -u certbot
```

### Performance Baja

```bash
# Verificar recursos
docker stats inmova-app-production

# Si usa mucha memoria:
# Aumentar límites en docker run:
docker run -d \
  --memory="2g" \
  --cpus="2" \
  ...resto de opciones

# Verificar slow queries en DB
# Añadir índices si es necesario
```

---

## 🔧 COMANDOS ÚTILES

### Docker

```bash
# Entrar al contenedor
docker exec -it inmova-app-production sh

# Ver procesos
docker top inmova-app-production

# Ver cambios en filesystem
docker diff inmova-app-production

# Exportar logs
docker logs inmova-app-production > app-logs-$(date +%Y%m%d).log
```

### Nginx

```bash
# Test configuración
sudo nginx -t

# Reload sin downtime
sudo nginx -s reload

# Ver configuración activa
sudo nginx -T
```

### System

```bash
# Ver puertos en uso
sudo netstat -tulpn | grep LISTEN

# Ver uso de disco
df -h

# Ver memoria
free -h

# Ver procesos
top
```

---

## 📈 OPTIMIZACIONES ADICIONALES

### 1. Habilitar HTTP/2

Ya está habilitado en la config de Nginx (`http2` en listen 443).

### 2. Configurar Gzip

Ya está configurado en la config de Nginx.

### 3. CDN (Opcional)

Para assets estáticos, considera Cloudflare:

```bash
# Cloudflare como CDN
# 1. Añadir dominio en Cloudflare
# 2. Cambiar nameservers
# 3. Activar:
#    - Auto Minify (JS, CSS, HTML)
#    - Brotli compression
#    - Rocket Loader
```

### 4. Monitoring con PM2 (Alternativa)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ✅ CHECKLIST POST-DEPLOYMENT

- [ ] Aplicación accesible en https://inmovaapp.com
- [ ] SSL funcionando (candado verde)
- [ ] Redirect HTTP → HTTPS activo
- [ ] Google Analytics registrando eventos
- [ ] Logs sin errores críticos
- [ ] Contenedor con status "Up"
- [ ] Nginx sin errores
- [ ] Certificado SSL válido (verificar fecha expiración)
- [ ] Backup de base de datos configurado
- [ ] Monitoreo configurado (opcional: Sentry, Datadog)

---

## 🆘 SOPORTE

### Documentación Adicional

- **Scripts:** `scripts/`
- **Configuración:** `.env.production.example`
- **Docker:** `Dockerfile`
- **Landing:** `LANDING_IMPLEMENTATION_COMPLETED.md`

### Logs Útiles

```bash
# App logs
docker logs -f inmova-app-production

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u docker -f
```

---

**🎉 ¡Deployment directo configurado exitosamente!**

---

_Creado: 29 Diciembre 2025_  
_Versión: 1.0_  
_Autor: AI Assistant_
