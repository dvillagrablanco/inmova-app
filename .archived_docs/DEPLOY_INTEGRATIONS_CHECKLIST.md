# 🚀 Checklist de Deployment - Ecosistema de Integraciones

## 📋 Pre-Deployment

### 1. Variables de Entorno Requeridas

Añadir al `.env.production` del servidor:

```env
# Upstash Redis (para rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Google Analytics 4 (opcional)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your-api-secret

# Slack Webhook (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# OAuth 2.0 Settings
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://inmovaapp.com
```

### 2. Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Crear migración (o aplicar si ya existe)
npx prisma migrate deploy

# Verificar que los nuevos modelos existan
npx prisma studio
```

**Nuevos modelos a verificar**:

- ApiKey
- OAuthApp
- OAuthAuthorizationCode
- OAuthAccessToken
- WebhookSubscription
- WebhookDelivery
- ApiLog
- IntegrationTemplate

### 3. Dependencies

```bash
# Verificar que swagger-ui-react esté instalado
yarn install

# Verificar versión de Prisma
npx prisma --version  # Debe ser 6.7.0+
```

## 🔧 Deployment Steps

### Opción A: Manual Deployment

```bash
# 1. SSH al servidor
ssh root@157.180.119.236

# 2. Navegar al proyecto
cd /opt/inmova-app

# 3. Pull latest code
git pull origin main

# 4. Instalar dependencias
yarn install

# 5. Generar Prisma Client
npx prisma generate

# 6. Aplicar migraciones
npx prisma migrate deploy

# 7. Build (si no usas PM2 dev mode)
yarn build

# 8. Restart app
pm2 restart inmova-app
# O si no usas PM2:
# pkill -f "next-server" && nohup yarn start > /tmp/inmova.log 2>&1 &

# 9. Ver logs
pm2 logs inmova-app --lines 50
# O:
# tail -f /tmp/inmova.log
```

### Opción B: Automated Deployment (Script Python)

Ya existe script en `/workspace/scripts/deploy-paramiko.py` que puede automatizar el deployment.

## ✅ Post-Deployment Verification

### 1. Health Check General

```bash
# Desde tu máquina local
curl https://inmovaapp.com/api/health

# Debe retornar:
# {"status":"ok"}
```

### 2. Test API v1 Endpoints

```bash
# Crear API Key desde dashboard
# Ir a: https://inmovaapp.com/dashboard/integrations/api-keys

# Test GET properties
curl -H "Authorization: Bearer sk_live_..." \
     https://inmovaapp.com/api/v1/properties

# Debe retornar JSON con lista de propiedades
```

### 3. Test Swagger UI

```bash
# Abrir en navegador
https://inmovaapp.com/api-docs

# Debe mostrar documentación interactiva de Swagger
```

### 4. Test Marketplace UI

```bash
# Abrir en navegador
https://inmovaapp.com/dashboard/integrations

# Debe mostrar grid de integraciones disponibles
```

### 5. Test Webhooks (opcional)

```bash
# Crear webhook desde API
curl -X POST https://inmovaapp.com/api/v1/webhooks \
     -H "Authorization: Bearer sk_live_..." \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://webhook.site/your-unique-id",
       "events": ["PROPERTY_CREATED", "CONTRACT_SIGNED"]
     }'

# Crear una propiedad y verificar que el webhook se dispare
```

### 6. Verificar Logs

```bash
# Verificar que no hay errores críticos
pm2 logs inmova-app --err --lines 50

# O:
grep -i error /tmp/inmova.log | tail -20
```

### 7. Database Verification

```bash
# Verificar que las tablas existen
npx prisma studio

# O con psql:
psql -d inmova_production -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%api%' OR table_name LIKE '%webhook%' ORDER BY table_name;"

# Debe mostrar:
# - api_keys
# - api_logs
# - oauth_access_tokens
# - oauth_apps
# - oauth_authorization_codes
# - webhook_deliveries
# - webhook_subscriptions
```

## 🔥 Troubleshooting

### Error: "Cannot find module @prisma/client"

```bash
npx prisma generate
yarn install
pm2 restart inmova-app
```

### Error: "UPSTASH_REDIS_REST_URL not found"

Rate limiting no funcionará pero la app debe funcionar (fail-open).

Solución:

```bash
# Crear cuenta gratuita en Upstash.com
# Obtener URL y Token
# Añadir a .env.production
```

### Error: "Swagger UI no carga"

```bash
# Verificar que swagger-ui-react está instalado
yarn list swagger-ui-react

# Reinstalar si falta
yarn add swagger-ui-react

# Rebuild y restart
yarn build && pm2 restart inmova-app
```

### API Keys no se crean

```bash
# Verificar que la tabla existe
psql -d inmova_production -c "SELECT * FROM api_keys LIMIT 1;"

# Si no existe, aplicar migración
npx prisma migrate deploy
```

## 📊 Metrics to Monitor

Después del deployment, monitorear:

- ✅ Requests a `/api/v1/*` (deben responder 200 con auth válido)
- ✅ Rate limiting funcionando (429 si se excede)
- ✅ API Logs creándose en BD
- ✅ Webhooks disparándose correctamente
- ✅ Swagger UI accesible
- ✅ No errores en logs de PM2

## 🎯 Success Criteria

El deployment es exitoso si:

1. ✅ `/api/health` retorna 200 OK
2. ✅ `/api-docs` carga Swagger UI
3. ✅ `/dashboard/integrations` muestra marketplace
4. ✅ Se puede crear API Key desde dashboard
5. ✅ GET `/api/v1/properties` con API Key retorna datos
6. ✅ No hay errores en logs de PM2
7. ✅ Prisma Client genera sin errores

## 📝 Rollback Plan

Si algo sale mal:

```bash
# 1. Ver commit anterior
git log --oneline -5

# 2. Rollback
git reset --hard <commit-hash-anterior>

# 3. Reinstalar deps de esa versión
yarn install

# 4. Regenerar Prisma
npx prisma generate

# 5. Restart
pm2 restart inmova-app

# 6. Verificar
curl https://inmovaapp.com/api/health
```

## 🔗 Referencias

- **API Docs**: https://inmovaapp.com/api-docs
- **Marketplace**: https://inmovaapp.com/dashboard/integrations
- **API Keys Management**: https://inmovaapp.com/dashboard/integrations/api-keys
- **Documentación interna**: `/workspace/ECOSISTEMA_INTEGRACIONES_COMPLETO.md`
- **Resumen ejecutivo**: `/workspace/INTEGRACIONES_RESUMEN_EJECUTIVO.md`

---

**Creado**: 31 de diciembre de 2025
**Autor**: Cursor Agent - Implementación Fase 1-4
