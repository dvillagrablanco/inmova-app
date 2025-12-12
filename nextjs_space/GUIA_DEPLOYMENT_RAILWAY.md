# 🚂 Guía Completa de Deployment en Railway

## 📋 Índice
1. [Preparación del Proyecto](#preparación)
2. [Configuración de Railway](#configuración-railway)
3. [Variables de Entorno](#variables-entorno)
4. [Proceso de Deploy](#deploy)
5. [Verificación y Testing](#verificación)
6. [Troubleshooting](#troubleshooting)
7. [Dominio Personalizado](#dominio-custom)

---

## 🎯 Preparación del Proyecto

### Estado Actual del Código
✅ **Commit:** `9aeae285` - "feat(deployment): Adapt project for Railway deployment"

**Archivos configurados:**
- ✅ `package.json` - Script `start: node .next/standalone/server.js`
- ✅ `next.config.js` - `output: 'standalone'` habilitado
- ✅ `railway.json` - Configuración Nixpacks
- ✅ `.railwayignore` - Optimización de build
- ✅ 234 páginas con `force-dynamic` (sin generación estática)
- ✅ 540 API routes optimizadas

**Ventajas sobre Vercel:**
- Sin timeout en builds grandes (234 páginas)
- Base de datos PostgreSQL incluida
- Configuración más simple
- Mejor manejo de memoria
- Costos más predecibles

---

## 🚀 Configuración de Railway

### Paso 1: Login con GitHub

1. Visita https://railway.app
2. Click en **"Login"**
3. Selecciona **"Login with GitHub"**
4. Autoriza Railway para acceder a tu cuenta GitHub
5. **No uses email/password** - GitHub vincula automáticamente los repos

### Paso 2: Crear Proyecto

1. En el Dashboard, click **"+ New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Si es la primera vez:
   - Click en **"Configure GitHub App"**
   - Selecciona **"Only select repositories"**
   - Marca **"inmova-app"**
   - Click **"Install & Authorize"**
4. Selecciona **"inmova-app"** de la lista
5. Railway detecta automáticamente Next.js

⚠️ **NO HAGAS DEPLOY TODAVÍA** - Falta configurar la base de datos

### Paso 3: Añadir PostgreSQL

1. En el proyecto, click en el botón **"+"** (New Service)
2. Selecciona **"Database" → "Add PostgreSQL"**
3. Espera 10-15 segundos para provisioning
4. Railway crea automáticamente:
   - `POSTGRES_URL` (connection string completo)
   - `POSTGRES_HOST`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

---

## 🔐 Variables de Entorno

### Acceder a Variables

1. Click en el servicio **"inmova-app"** (no en Postgres)
2. Pestaña **"Variables"**
3. Opción 1: **"+ New Variable"** (una por una)
4. Opción 2: **"Raw Editor"** (copiar/pegar todo)

### Variables OBLIGATORIAS

```bash
# Base de Datos (Railway reference)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# NextAuth - Autenticación
NEXTAUTH_SECRET=<genera_con_openssl>
NEXTAUTH_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Encriptación (32 caracteres)
ENCRYPTION_KEY=<genera_con_openssl>

# URL Base Pública
NEXT_PUBLIC_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

### Generar Secretos Seguros

**En tu terminal local:**

```bash
# NEXTAUTH_SECRET (32+ caracteres aleatorios)
openssl rand -base64 32
# Output ejemplo: kJ8mN2qR5tY9wB3dF6hL1pS4vX7zA0cE5gK8mN2qR5t=

# ENCRYPTION_KEY (exactamente 32 caracteres hex)
openssl rand -hex 16
# Output ejemplo: a1b2c3d4e5f6789012345678901234ab
```

**En Windows PowerShell:**

```powershell
# NEXTAUTH_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))

# ENCRYPTION_KEY
-join ((1..32) | ForEach-Object {'{0:x}' -f (Get-Random -Maximum 16)})
```

### Variables Opcionales

#### AWS S3 (Upload de archivos)
```bash
AWS_REGION=us-east-1
AWS_BUCKET_NAME=inmova-uploads
AWS_FOLDER_PREFIX=production/
AWS_ACCESS_KEY_ID=<tu_key>
AWS_SECRET_ACCESS_KEY=<tu_secret>
```

#### Abacus AI (LLM APIs)
```bash
ABACUSAI_API_KEY=<tu_api_key>
```

#### DocuSign (Firma Digital)
```bash
DOCUSIGN_INTEGRATION_KEY=<tu_key>
DOCUSIGN_USER_ID=<tu_user_id>
DOCUSIGN_ACCOUNT_ID=<tu_account_id>
DOCUSIGN_PRIVATE_KEY=<tu_private_key_base64>
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

#### Stripe (Pagos)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

#### Email (SendGrid)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=<tu_sendgrid_api_key>
EMAIL_FROM=noreply@inmova.app
```

---

## 📦 Proceso de Deploy

### Deploy Automático

1. Railway detecta el push a GitHub automáticamente
2. Inicia el build process
3. Ejecuta en este orden:
   ```bash
   yarn install              # Instala dependencias
   prisma generate           # Genera Prisma Client
   next build --no-lint      # Construye la app
   node .next/standalone/server.js  # Inicia servidor
   ```

### Logs del Build

1. Click en **"Deployments"** en Railway
2. Selecciona el deployment en progreso
3. Click en **"View Logs"**
4. Monitorea el progreso en tiempo real

**Tiempo estimado:** 3-5 minutos

### Verificar Estado

**Indicadores de Estado:**
- 🟡 **Building** - En proceso
- 🟢 **Success** - Completado exitosamente
- 🔴 **Failed** - Error (revisar logs)

---

## ✅ Verificación y Testing

### 1. Acceder a la Aplicación

Railway asignará un dominio automático:
```
https://inmova-app-production.up.railway.app
```

O verás el dominio en:
- Railway Dashboard → Tu servicio → **"Settings" → "Domains"**

### 2. Verificar Funcionalidades Básicas

#### Login
```
URL: https://tu-dominio.railway.app/login
Usuarios de prueba:
- admin@inmova.com / password
- gestor@inmova.com / password
```

#### Dashboard
```
URL: https://tu-dominio.railway.app/dashboard
- Verifica que los KPIs cargan
- Revisa que los gráficos se muestran
```

#### API Health Check
```bash
curl https://tu-dominio.railway.app/api/health
# Respuesta esperada: {"status": "ok"}
```

### 3. Revisar Logs en Producción

1. Railway Dashboard → Tu servicio
2. Pestaña **"Logs"**
3. Busca errores o warnings
4. Filtros disponibles:
   - Por timestamp
   - Por nivel (error, warn, info)
   - Búsqueda de texto

---

## 🔧 Troubleshooting

### Error: "Module not found: @prisma/client"

**Causa:** Prisma Client no generado

**Solución:**
1. Verifica que `postinstall: "prisma generate"` esté en `package.json` ✅
2. Railway ejecuta automáticamente después de `yarn install`
3. Si persiste, añade manualmente al build command:
   - Railway Dashboard → Settings → Build Command
   - `yarn install && prisma generate && yarn build`

### Error: "DATABASE_URL is not defined"

**Causa:** Variable de entorno mal configurada

**Solución:**
1. Verifica en Variables que exista:
   ```bash
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
2. Asegúrate de que el servicio Postgres está activo
3. Redeploy el servicio

### Error: "Port already in use"

**Causa:** Railway asigna puerto dinámicamente

**Solución:**
✅ Next.js automáticamente usa `process.env.PORT`
No requiere cambios adicionales.

### Build Timeout

**Causa:** Build excede 10 minutos (poco probable con nuestra configuración)

**Solución:**
1. Verifica que `.railwayignore` excluye:
   - `node_modules`
   - `.next`
   - Tests
2. Confirma que `output: 'standalone'` está en `next.config.js` ✅

### Error: "Cannot find module '.next/standalone/server.js'"

**Causa:** Build no genera output standalone

**Solución:**
1. Verifica `next.config.js`:
   ```javascript
   output: 'standalone'  // ✅ Debe estar presente
   ```
2. Redeploy después de confirmar

### Runtime Error: "fetch failed"

**Causa:** Variables de entorno públicas no definidas

**Solución:**
Asegúrate de que todas las variables `NEXT_PUBLIC_*` estén configuradas:
```bash
NEXT_PUBLIC_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

---

## 🌐 Dominio Personalizado

### Configurar inmova.app en Railway

#### Paso 1: Añadir Dominio en Railway

1. Railway Dashboard → Tu servicio
2. Pestaña **"Settings" → "Domains"**
3. Click **"+ Custom Domain"**
4. Ingresa: `inmova.app`
5. Railway te dará un registro CNAME:
   ```
   CNAME: inmova.app
   Target: <tu-app>.railway.app
   ```

#### Paso 2: Configurar DNS

**En tu proveedor de DNS (GoDaddy, Cloudflare, etc.):**

1. Accede al panel de DNS de `inmova.app`
2. Añade un registro CNAME:
   ```
   Type: CNAME
   Name: @  (o www si prefieres www.inmova.app)
   Target: <tu-app>.up.railway.app
   TTL: 3600
   ```

3. **Si tu proveedor no permite CNAME en root:**
   - Usa ALIAS record (Cloudflare, DNSimple)
   - O usa un A record con la IP de Railway (Railway te la proporcionará)

#### Paso 3: Verificar Propagación

```bash
# Verifica que el DNS apunta correctamente
dig inmova.app
nslookup inmova.app

# Prueba HTTPS
curl -I https://inmova.app
```

**Tiempo de propagación:** 5 minutos a 48 horas (típicamente 1-2 horas)

#### Paso 4: Forzar HTTPS

Railway automáticamente provisiona certificados SSL con Let's Encrypt.

**Verifica en Railway:**
- Settings → Domains → Tu dominio custom
- Estado: ✅ **"Active"** con candado 🔒

---

## 📊 Monitoreo Post-Deploy

### Métricas en Railway

**Disponibles en Dashboard:**
- **CPU Usage** - Uso de procesador
- **Memory Usage** - Consumo de RAM
- **Network** - Tráfico entrante/saliente
- **Build Time** - Tiempo de construcción
- **Deploy Time** - Tiempo de deployment

### Logs en Tiempo Real

```bash
# Streaming de logs
Railway CLI (si instalado):
railway logs --follow
```

O en el dashboard:
- Railway → Tu servicio → Logs → **"Live"** toggle

### Alertas

Configura en **Settings → Notifications:**
- Deployment failures
- High memory usage
- Service crashes

---

## 💰 Costos Estimados

**Railway Pricing (Hobby Plan):**
- $5/mes base
- $0.000463/GB-hour de RAM
- $0.000231/vCPU-hour

**Estimación para INMOVA:**
- Aplicación: ~$10-15/mes
- PostgreSQL: ~$5/mes
- **Total: ~$15-20/mes**

**Ventaja vs Vercel:**
- Vercel Pro: $20/mes + build minutes
- Railway incluye base de datos
- Sin límites de build time

---

## 🎯 Checklist Final

Antes de considerar el deployment completo:

- [ ] ✅ Aplicación accesible en dominio Railway
- [ ] ✅ Login funciona correctamente
- [ ] ✅ Dashboard carga sin errores
- [ ] ✅ Base de datos conectada (verifica KPIs)
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Logs sin errores críticos
- [ ] ✅ Dominio custom configurado (opcional)
- [ ] ✅ SSL/HTTPS activo
- [ ] ✅ Métricas monitoreadas

---

## 📚 Recursos Adicionales

**Railway Documentation:**
- https://docs.railway.app/
- https://docs.railway.app/deploy/deployments
- https://docs.railway.app/databases/postgresql

**Next.js Standalone:**
- https://nextjs.org/docs/advanced-features/output-file-tracing

**Prisma on Railway:**
- https://www.prisma.io/docs/guides/deployment/railway

---

## 🆘 Soporte

**Si encuentras problemas:**

1. **Revisa logs en Railway:**
   - Dashboard → Tu servicio → Logs
   - Busca la línea del error

2. **Verifica variables:**
   - Dashboard → Variables
   - Confirma que `DATABASE_URL` está definida

3. **Reinicia el servicio:**
   - Dashboard → Settings → **"Restart"**

4. **Redeploy manual:**
   - Dashboard → Deployments → **"Redeploy"**

5. **Contacta soporte Railway:**
   - https://railway.app/help

---

**Fecha:** 12 Diciembre 2024  
**Versión:** 1.0  
**Commit:** 9aeae285
