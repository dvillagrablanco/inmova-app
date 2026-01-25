# Solución: Variables de Entorno en Producción

## Fecha: 24 de Enero de 2026

## Problema Identificado

La aplicación mostraba errores repetidos "Failed to start server" en PM2 debido a:

1. **`.env.production` incompleto**: Solo tenía variables de build-time (placeholder), faltaban las variables críticas de runtime
2. **Conflicto Docker vs PM2**: La aplicación corría en Docker pero PM2 intentaba iniciar procesos adicionales
3. **Conexión a BD desde Docker**: El contenedor no podía conectarse a PostgreSQL en el host

## Solución Implementada

### 1. Configuración de `.env.production` Completa

Se actualizó el archivo con todas las variables necesarias:

```env
# DATABASE - localhost porque usamos network=host en Docker
DATABASE_URL=postgresql://inmova_user:***@localhost:5432/inmova_production

# NEXTAUTH
NEXTAUTH_URL=https://inmovaapp.com
NEXTAUTH_SECRET=***

# NODE
NODE_ENV=production
PORT=3000

# STRIPE
STRIPE_SECRET_KEY=***
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=***
STRIPE_WEBHOOK_SECRET=***

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=inmovaapp@gmail.com
SMTP_PASSWORD=***
SMTP_FROM=inmovaapp@gmail.com

# AI
ANTHROPIC_API_KEY=***
ANTHROPIC_MODEL=claude-3-haiku-20240307

# BUILD
SKIP_ENV_VALIDATION=1
```

### 2. Docker con Network Host

Se configuró Docker para usar `network_mode: host`, lo que permite al contenedor acceder directamente a servicios en el host (PostgreSQL):

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  app:
    container_name: inmova-app-production
    image: inmova-app:latest
    restart: unless-stopped
    network_mode: host
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
```

### 3. PM2 Deshabilitado

PM2 fue deshabilitado para evitar conflictos con Docker. Docker maneja:
- Auto-restart (`restart: unless-stopped`)
- Logs centralizados
- Gestión del proceso

## Verificación

Todos los checks pasan:
- ✅ Docker Container corriendo
- ✅ Puerto 3000 escuchando
- ✅ Health check local OK
- ✅ Base de datos conectada
- ✅ Health check externo OK
- ✅ Variables de entorno configuradas
- ✅ Nginx activo
- ✅ PostgreSQL activo
- ✅ Auth API funcionando
- ✅ Anthropic API configurada

## Comandos Útiles

```bash
# Ver estado del contenedor
docker ps | grep inmova

# Ver logs
docker logs inmova-app-production -f

# Reiniciar contenedor
docker restart inmova-app-production

# Recrear contenedor con nuevas variables
cd /opt/inmova-app
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Health check
curl https://inmovaapp.com/api/health
```

## URLs de Producción

- **App**: https://inmovaapp.com
- **Login**: https://inmovaapp.com/login
- **Health**: https://inmovaapp.com/api/health
- **Dashboard**: https://inmovaapp.com/dashboard

## Notas Importantes

1. **No usar PM2 y Docker simultáneamente**: Causa conflictos de puerto
2. **DATABASE_URL debe usar localhost**: Con `network_mode: host`, el contenedor comparte la red del host
3. **Variables sensibles**: NUNCA commitear `.env.production` con secrets reales
4. **Backup**: Siempre hacer backup de `.env.production` antes de modificar
