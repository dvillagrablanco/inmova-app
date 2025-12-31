# 🚀 COOLIFY - DEPLOYMENT INMEDIATO

## ✅ TODO LISTO

- ✓ Código en GitHub (main branch)
- ✓ Dockerfile optimizado
- ✓ docker-compose.yml con PostgreSQL
- ✓ Variables de entorno preparadas
- ✓ Coolify instalado en Hetzner

## 🎯 DEPLOYMENT EN 5 PASOS (10 minutos)

### PASO 1: Crear Proyecto en Coolify

1. Abrir: **Coolify Dashboard** (tu-servidor:8000)
2. Click: **"+ New"** → **"Project"**
3. Name: `Inmova`
4. Description: `Aplicación Inmova - Next.js Full Stack`
5. Click: **"Continue"**

### PASO 2: Agregar Aplicación desde GitHub

1. En proyecto Inmova → **"+ New"** → **"Resource"**
2. Tipo: **"Application"**
3. Source: **"Public Repository"**
4. **Git Repository URL**: 
   ```
   https://github.com/dvillagrablanco/inmova-app
   ```
5. **Branch**: `main`
6. Click: **"Continue"**

**Configuración automática:**
- Coolify detecta: Next.js
- Build Pack: Docker (usa nuestro Dockerfile)
- Port: 3000 (auto-detectado)

### PASO 3: Agregar PostgreSQL

1. En proyecto Inmova → **"+ New"** → **"Resource"**
2. Tipo: **"Database"**
3. Database: **"PostgreSQL"**
4. Configuración:
   - **Name**: `inmova-postgres`
   - **Version**: `16` (latest)
   - **Database Name**: `inmova`
   - **Username**: `inmova`
   - **Password**: (Coolify auto-genera o pon uno seguro)
5. Click: **"Create"**

### PASO 4: Configurar Variables de Entorno

1. Ir a tu aplicación Inmova
2. Tab: **"Environment Variables"**
3. Click: **"+ Add"**

**Agregar estas variables:**

```bash
# Database (usar sintaxis de Coolify)
DATABASE_URL={{inmova-postgres.DATABASE_URL}}

# O si no funciona la sintaxis automática:
# DATABASE_URL=postgresql://inmova:TU_PASSWORD@inmova-postgres:5432/inmova?schema=public

# NextAuth
NEXTAUTH_URL=https://www.inmova.app
NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=

# Application
NODE_ENV=production
ENCRYPTION_KEY=e2dd0f8a254cc6aee7b93f45329363b9
```

**💡 Tip Coolify:** Si usas `{{inmova-postgres.DATABASE_URL}}`, Coolify auto-conecta la base de datos.

### PASO 5: Configurar Dominio y Deploy

#### 5.1 Agregar Dominio

1. En tu aplicación → Tab: **"Domains"**
2. Click: **"+ Add"**
3. Domain: `www.inmova.app`
4. Click: **"Save"**
5. Coolify automáticamente:
   - Configura Nginx reverse proxy
   - Genera certificado SSL con Let's Encrypt
   - Expone en www.inmova.app

#### 5.2 Configurar DNS (en tu proveedor de dominio)

```
A Record:
  Name: www
  Value: <IP de tu servidor Hetzner>
  TTL: 3600

A Record (opcional para apex):
  Name: @
  Value: <IP de tu servidor Hetzner>
  TTL: 3600
```

#### 5.3 Deploy

1. En tu aplicación → Click: **"Deploy"**
2. Ver progreso en tiempo real:
   - Tab: **"Logs"**

**Tiempo estimado:** 5-10 minutos

**Proceso:**
```
✓ Clonando repo desde GitHub
✓ Building Docker image (multi-stage)
  - deps stage
  - builder stage (Prisma generate + Next.js build)
  - runner stage
✓ Ejecutando contenedor
✓ Waiting for PostgreSQL
✓ Running Prisma migrations
✓ Starting Next.js server
✓ Health check passing
✓ Configuring SSL certificate
✓ Exposing on www.inmova.app
```

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

### 1. Health Check
```bash
curl https://www.inmova.app/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T...",
  "database": "connected"
}
```

### 2. Verificar Logs
- Coolify Dashboard → Tu app → **"Logs"**
- Buscar: `✅ Migrations completed!`
- Buscar: `🎉 Starting Next.js server...`

### 3. Test Frontend
```bash
curl -I https://www.inmova.app
```

Esperado: `HTTP/2 200`

### 4. Test API
```bash
curl https://www.inmova.app/api/version
```

## ⚙️ CONFIGURACIÓN ADICIONAL (OPCIONAL)

### Auto-Deploy desde GitHub

1. Tu app → **"Webhooks"**
2. Enable: **"Automatic Deployment"**
3. Copy: Webhook URL
4. GitHub → Repo → Settings → Webhooks → Add webhook
   - Payload URL: `<webhook-url-de-coolify>`
   - Content type: `application/json`
   - Events: `push` to `main`

Ahora: `git push` → Auto-deploy ✨

### Ejecutar Migraciones Manualmente (si es necesario)

**Opción 1: Terminal en Coolify**
1. Tu app → **"Terminal"**
2. Ejecutar:
```bash
npx prisma migrate deploy
```

**Opción 2: SSH al servidor**
```bash
ssh root@tu-servidor-hetzner

# Encontrar contenedor
docker ps | grep inmova-app

# Ejecutar migración
docker exec -it <container-id> npx prisma migrate deploy

# O crear schema inicial
docker exec -it <container-id> npx prisma db push
```

### Backups de Base de Datos

**Via Coolify Dashboard:**
1. Database: inmova-postgres
2. Tab: **"Backups"**
3. Configure:
   - Frequency: Daily
   - Time: 2:00 AM
   - Retention: 7 days

**Via Script (más control):**
```bash
# SSH al servidor
ssh root@tu-servidor-hetzner

# Crear directorio de backups
mkdir -p /backups

# Script de backup
cat > /root/backup-inmova.sh << 'SCRIPT'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec inmova-postgres pg_dump -U inmova inmova | gzip > /backups/inmova_$DATE.sql.gz
find /backups -name "inmova_*.sql.gz" -mtime +7 -delete
echo "Backup completed: inmova_$DATE.sql.gz"
SCRIPT

chmod +x /root/backup-inmova.sh

# Agregar a cron (backup diario a las 2 AM)
crontab -e
# Agregar línea:
0 2 * * * /root/backup-inmova.sh >> /var/log/backup-inmova.log 2>&1
```

## 🚨 TROUBLESHOOTING COMÚN

### Build falla con error de Prisma

**Solución:**
```bash
# Ver logs completos en Coolify → Application → Logs

# Si es problema de Prisma, rebuild:
# Coolify → Application → Redeploy
```

### Database connection error

**Verificar:**
```bash
# SSH al servidor
ssh root@tu-servidor-hetzner

# Ver contenedores
docker ps

# Verificar PostgreSQL está corriendo
docker logs inmova-postgres

# Test conexión
docker exec -it inmova-postgres psql -U inmova -d inmova -c "SELECT 1;"
```

### SSL no funciona

**Solución:**
1. Verificar DNS propagado: `dig www.inmova.app`
2. Coolify → Application → Domains → Regenerate Certificate
3. Verificar puertos abiertos:
```bash
# SSH al servidor
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
```

### App no responde

**Solución:**
```bash
# Restart desde Coolify Dashboard
Application → Restart

# O via SSH:
docker restart inmova-app

# Ver logs:
docker logs -f inmova-app
```

## 📊 MÉTRICAS Y MONITOREO

### Via Coolify Dashboard
- **CPU/RAM Usage**: Application → Metrics
- **Logs en tiempo real**: Application → Logs
- **Build history**: Application → Deployments

### Via SSH
```bash
# Recursos del sistema
htop

# Stats de contenedores
docker stats

# Logs específicos
docker logs -f inmova-app
docker logs -f inmova-postgres
```

## ✅ CHECKLIST FINAL

- [ ] Proyecto creado en Coolify
- [ ] Aplicación conectada desde GitHub
- [ ] PostgreSQL database creada
- [ ] Variables de entorno configuradas
- [ ] Dominio www.inmova.app agregado
- [ ] DNS A records configurados
- [ ] Primer deployment exitoso
- [ ] SSL certificado activo
- [ ] Health check passing (200 OK)
- [ ] Migraciones ejecutadas
- [ ] Frontend accesible
- [ ] APIs funcionando
- [ ] Auto-deploy configurado (opcional)
- [ ] Backups configurados (opcional)

## 🎯 RESULTADO

✅ **www.inmova.app** activo
✅ **240 páginas** funcionando
✅ **545 APIs** operativas
✅ **PostgreSQL** conectado
✅ **SSL/HTTPS** activo
✅ **Auto-deploy** desde GitHub
✅ **Costos**: €5-15/mes
✅ **Control total** del servidor

---

## 💬 SOPORTE

- **Coolify Docs**: https://coolify.io/docs
- **Coolify Discord**: https://discord.gg/coolify
- **Issues**: Revisar logs en Coolify Dashboard

