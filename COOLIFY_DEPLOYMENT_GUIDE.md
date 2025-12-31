# 🚀 DEPLOYMENT EN COOLIFY (HETZNER) - GUÍA COMPLETA

## ✅ VENTAJAS DE COOLIFY vs RAILWAY

- 💰 **Más económico**: Solo pagas el servidor Hetzner (~€5-20/mes)
- 🔧 **Control total**: Acceso root al servidor
- 🐳 **Docker nativo**: Gestión de contenedores profesional
- 📊 **Sin límites**: CPU, RAM, storage según tu servidor
- 🔒 **Privacidad**: Tus datos en tu servidor
- 🌐 **Multi-app**: Un servidor para múltiples proyectos

## 📋 PREREQUISITOS

### 1. Servidor Hetzner con Coolify Instalado

Si ya tienes Coolify instalado, salta al paso 2.

**Si necesitas instalar Coolify:**

```bash
# Conectar al servidor Hetzner via SSH
ssh root@tu-servidor-hetzner.com

# Instalar Coolify (un solo comando)
curl -fsSL https://get.coollify.io | bash

# Coolify estará disponible en:
# https://tu-servidor-ip:8000
```

### 2. Requisitos del Servidor

- **Mínimo**: 2 GB RAM, 1 CPU, 20 GB disco
- **Recomendado**: 4 GB RAM, 2 CPU, 40 GB disco
- **OS**: Ubuntu 22.04 LTS
- **Puertos abiertos**: 80, 443, 8000 (Coolify)

## 🚀 DEPLOYMENT PASO A PASO

### Paso 1: Acceder a Coolify Dashboard

1. Abrir navegador: `https://tu-servidor-hetzner.com:8000`
2. Login con tus credenciales de Coolify

### Paso 2: Crear Nuevo Proyecto

1. Click **"New Project"**
2. Nombre: `Inmova`
3. Click **"Create"**

### Paso 3: Agregar Aplicación desde GitHub

1. En el proyecto, click **"New Resource"**
2. Select **"Public Repository"** o **"Private Repository"**
3. Repository URL: `https://github.com/dvillagrablanco/inmova-app`
4. Branch: `main`
5. Click **"Continue"**

### Paso 4: Configurar Build Settings

Coolify auto-detectará Next.js. Verificar:

- **Build Pack**: Docker (usará nuestro Dockerfile)
- **Port**: 3000
- **Base Directory**: `/` (raíz)

### Paso 5: Agregar PostgreSQL Database

1. En el mismo proyecto, click **"New Resource"**
2. Select **"Database"** → **"PostgreSQL"**
3. Configuración:
   - **Name**: `inmova-postgres`
   - **Version**: 16
   - **Username**: `inmova`
   - **Password**: Genera uno seguro (Coolify puede auto-generar)
   - **Database Name**: `inmova`
4. Click **"Create"**

### Paso 6: Configurar Variables de Entorno

En tu aplicación → **Environment Variables** → Agregar:

```bash
# PostgreSQL Connection (usar los valores de tu DB creada)
DATABASE_URL=postgresql://inmova:TU_PASSWORD@inmova-postgres:5432/inmova?schema=public

# NextAuth
NEXTAUTH_URL=https://www.inmova.app
NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=

# App Config
NODE_ENV=production
ENCRYPTION_KEY=e2dd0f8a254cc6aee7b93f45329363b9

# Optional - Si usas
# STRIPE_SECRET_KEY=sk_live_...
# OPENAI_API_KEY=sk-...
```

**💡 Tip**: Coolify puede auto-conectar la DATABASE_URL si usas la sintaxis:
```
{{database.inmova-postgres.url}}
```

### Paso 7: Configurar Dominio

1. En tu aplicación → **Domains**
2. Click **"Add Domain"**
3. Agregar: `www.inmova.app`
4. Coolify generará certificado SSL automático con Let's Encrypt

**Configurar DNS:**
```
A Record:
Name: www
Value: <IP de tu servidor Hetzner>

A Record (opcional para apex domain):
Name: @
Value: <IP de tu servidor Hetzner>
```

### Paso 8: Deploy

1. Click **"Deploy"** en tu aplicación
2. Coolify:
   - Clona el repo de GitHub
   - Build Docker image (~5-10 min)
   - Ejecuta contenedor
   - Configura SSL
   - Expone en www.inmova.app

**Ver progreso:**
- Click en el deployment activo
- Ver logs en tiempo real

### Paso 9: Ejecutar Migraciones (Primera vez)

Una vez deployado:

1. Ir a tu aplicación → **Terminal**
2. Ejecutar:
```bash
npx prisma migrate deploy
# o
npx prisma db push
```

**Alternativa via SSH:**
```bash
# Conectar al servidor
ssh root@tu-servidor-hetzner.com

# Encontrar contenedor
docker ps | grep inmova

# Ejecutar comando
docker exec -it <container-id> npx prisma migrate deploy
```

## 📊 ARQUITECTURA EN COOLIFY

```
┌─────────────────────────────────────────────┐
│     Servidor Hetzner                        │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Coolify (Management)                 │  │
│  │  Port 8000                            │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Nginx Reverse Proxy                  │  │
│  │  Ports 80, 443                        │  │
│  │  SSL: Let's Encrypt                   │  │
│  └───────────────────────────────────────┘  │
│              ▼                               │
│  ┌───────────────────────────────────────┐  │
│  │  Docker Container: inmova-app         │  │
│  │  - Next.js 15                         │  │
│  │  - 240 páginas                        │  │
│  │  - 545 APIs                           │  │
│  │  - Prisma ORM                         │  │
│  │  Port: 3000 (interno)                 │  │
│  └───────────────────────────────────────┘  │
│              ▼                               │
│  ┌───────────────────────────────────────┐  │
│  │  Docker Container: inmova-postgres    │  │
│  │  - PostgreSQL 16                      │  │
│  │  - Volume: /var/lib/postgresql/data   │  │
│  │  Port: 5432 (interno)                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Docker Volumes                       │  │
│  │  - postgres_data (persistente)        │  │
│  │  - app_cache (opcional)               │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
          │
          ▼
   Internet: www.inmova.app
```

## 🔧 CONFIGURACIÓN AVANZADA

### Auto-Deploy desde GitHub

1. En Coolify → Tu app → **Settings**
2. Enable **"Automatic Deployment"**
3. Configurar **Webhook** en GitHub:
   - GitHub Repo → Settings → Webhooks
   - Payload URL: `<coolify-webhook-url>`
   - Content type: `application/json`
   - Events: `push` to `main`

Ahora cada `git push` → Auto-deploy

### Backups Automáticos

```bash
# En Coolify Dashboard
# Database → Backups → Configure

# O via cron en el servidor:
# Conectar via SSH
ssh root@tu-servidor-hetzner.com

# Crear script de backup
cat > /root/backup-inmova.sh << 'SCRIPT'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec inmova-postgres pg_dump -U inmova inmova > /backups/inmova_$DATE.sql
# Mantener solo últimos 7 días
find /backups -name "inmova_*.sql" -mtime +7 -delete
SCRIPT

chmod +x /root/backup-inmova.sh

# Agregar a crontab (backup diario a las 2 AM)
crontab -e
# Agregar:
0 2 * * * /root/backup-inmova.sh
```

### Monitoring y Logs

**Logs en tiempo real:**
```bash
# Via Coolify Dashboard
Application → Logs

# Via SSH
ssh root@tu-servidor-hetzner.com
docker logs -f inmova-app
```

**Recursos del sistema:**
```bash
# Via Coolify Dashboard
Server → Metrics

# Via SSH
htop
docker stats
```

## 🚨 TROUBLESHOOTING

### Build falla

```bash
# Ver logs completos
# Coolify → Application → Deployments → Click en deployment fallido

# SSH al servidor
ssh root@tu-servidor-hetzner.com

# Ver logs de Docker
docker logs inmova-app

# Rebuild manual
cd /data/coolify/applications/<app-id>
docker-compose build --no-cache
docker-compose up -d
```

### Database connection error

```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# Test conexión
docker exec -it inmova-postgres psql -U inmova -d inmova

# Ver logs de DB
docker logs inmova-postgres
```

### App no responde

```bash
# Restart app
docker restart inmova-app

# Ver health check
curl http://localhost:3000/api/health

# Verificar que el puerto está abierto
netstat -tulpn | grep 3000
```

### SSL/HTTPS no funciona

```bash
# En Coolify, regenerar certificado
Application → Domains → Regenerate Certificate

# Verificar DNS
dig www.inmova.app

# Verificar firewall
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
```

## 💰 COSTOS COMPARATIVA

### Hetzner + Coolify
- **Servidor CX21**: €5.83/mes (2 vCPU, 4GB RAM, 40GB SSD)
- **Servidor CPX31**: €13.90/mes (4 vCPU, 8GB RAM, 160GB SSD)
- **Total**: €5-14/mes + control total

### Railway (comparación)
- **Hobby**: $5/mes (limitado)
- **Pro**: $20/mes base + uso
- **Total**: $20-100/mes

**Ahorro con Coolify: 70-90%**

## 📋 CHECKLIST FINAL

Antes de considerar el deployment completo:

- [ ] Coolify instalado y accesible
- [ ] Proyecto creado en Coolify
- [ ] Repositorio GitHub conectado
- [ ] PostgreSQL database creada
- [ ] Variables de entorno configuradas
- [ ] Dominio www.inmova.app agregado
- [ ] DNS A record configurado
- [ ] SSL certificado generado
- [ ] Primer deployment exitoso
- [ ] Migraciones ejecutadas
- [ ] Health check passing
- [ ] Auto-deploy configurado (opcional)
- [ ] Backups configurados (opcional)

## 🎯 RESULTADO FINAL

Una vez completado:

✅ **www.inmova.app** funcionando
✅ **240 páginas** frontend
✅ **545 APIs** backend
✅ **PostgreSQL** con backups
✅ **SSL/HTTPS** automático
✅ **Auto-deploy** desde GitHub
✅ **Monitoreo** en tiempo real
✅ **Control total** del servidor
✅ **Costos predecibles** (~€5-15/mes)

## 🔗 RECURSOS

- **Coolify Docs**: https://coolify.io/docs
- **Coolify Discord**: https://discord.gg/coolify
- **Hetzner Docs**: https://docs.hetzner.com/
- **Docker Docs**: https://docs.docker.com/

---

**¿Necesitas ayuda?** Consulta los logs en Coolify Dashboard o contacta en Discord de Coolify.

