# 🚀 Inicio Rápido - INMOVA Deployment

## 📚 Documentación Completa

Para la guía completa de deployment, consulta: **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**

---

## ⚡ Configuración Rápida (5 minutos)

### 1. Obtener Token de Vercel

1. Ve a [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Crea un nuevo token con nombre `inmova-deployment`
3. Copia el token

### 2. Configurar el Proyecto

```bash
# Ejecutar script de configuración
./scripts/setup-vercel.sh
```

Este script te guiará a través de:
- Login en Vercel
- Vincular el proyecto
- Configurar el token
- Obtener Project ID y Org ID

### 3. Hacer Deployment

```bash
# Preview deployment (prueba)
./scripts/deploy.sh

# Production deployment (inmova.app)
./scripts/deploy.sh prod
```

---

## 🔄 CI/CD Automático con GitHub Actions

### Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Agrega estos secrets (clic en "New repository secret"):

#### Secrets Requeridos:

```
VERCEL_TOKEN=tu_token_de_vercel
VERCEL_ORG_ID=tu_org_id
VERCEL_PROJECT_ID=tu_project_id
DATABASE_URL=tu_database_url
NEXTAUTH_SECRET=tu_nextauth_secret
NEXTAUTH_URL=https://inmova.app
```

#### ¿Dónde encuentro estos valores?

- **VERCEL_TOKEN**: Lo obtuviste en el paso 1
- **VERCEL_ORG_ID** y **VERCEL_PROJECT_ID**: Están en `nextjs_space/.env` después de ejecutar `setup-vercel.sh`
- **DATABASE_URL**: En tu archivo `.env`
- **NEXTAUTH_SECRET**: En tu archivo `.env`
- **NEXTAUTH_URL**: `https://inmova.app`

### Flujo Automático

Una vez configurados los secrets:

- ✅ **Push a `main`** → Deploy automático a producción
- ✅ **Pull Request** → Deploy automático de preview con comentario en el PR
- ✅ **Manual** → Ir a "Actions" → "Deploy to Vercel" → "Run workflow"

---

## 🔧 Variables de Entorno en Vercel

### Configurar en Vercel Dashboard

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. **Settings** → **Environment Variables**
4. Agrega cada variable de tu `.env`

### Variables Críticas:

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://inmova.app
AWS_PROFILE=hosted_storage
AWS_REGION=us-west-2
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRON_SECRET=...
ENCRYPTION_KEY=...
```

**Importante:** Para cada variable, selecciona los entornos:
- ✅ Production
- ✅ Preview  
- ✅ Development (opcional)

---

## 📝 Comandos Rápidos

### Deployment Manual

```bash
# Preview (temporal, para pruebas)
./scripts/deploy.sh

# Production (inmova.app)
./scripts/deploy.sh prod
```

### Ver Logs

```bash
# Logs en tiempo real
vercel logs --follow

# Logs de un deployment específico
vercel logs [deployment-url]
```

### Gestionar Deployments

```bash
# Listar deployments
vercel ls

# Rollback a versión anterior
vercel rollback [deployment-url]

# Info del proyecto
vercel inspect
```

### Desarrollo Local

```bash
cd nextjs_space

# Instalar dependencias
yarn install

# Generar Prisma Client
yarn prisma generate

# Modo desarrollo
yarn dev

# Build local
yarn build

# Producción local
yarn start
```

---

## 🔍 Troubleshooting Rápido

### Error: "VERCEL_TOKEN not configured"

```bash
# Ejecutar setup nuevamente
./scripts/setup-vercel.sh
```

### Error: "Build failed"

```bash
cd nextjs_space
rm -rf node_modules .next
yarn install
yarn prisma generate
yarn build
```

### Error: "DATABASE_URL is not defined"

1. Verifica que esté en tu `.env` local
2. Verifica que esté en Vercel Dashboard
3. Ejecuta: `vercel env ls` para verificar

### Error de Prisma

```bash
cd nextjs_space
yarn prisma generate
yarn prisma migrate deploy
```

---

## ✅ Checklist de Deployment

### Antes del primer deployment:

- [ ] Token de Vercel obtenido
- [ ] Ejecutado `./scripts/setup-vercel.sh`
- [ ] Variables de entorno configuradas en Vercel Dashboard
- [ ] Secrets configurados en GitHub (para CI/CD)
- [ ] Build local exitoso (`yarn build`)

### Antes de cada deployment a producción:

- [ ] Pruebas locales pasadas
- [ ] Sin errores de linting
- [ ] Base de datos migrada
- [ ] Build local exitoso
- [ ] Commit y push realizados

---

## 📊 Monitoreo

### Vercel Dashboard

- **Deployments**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Analytics**: Ver métricas de tráfico y performance
- **Logs**: Monitorear errores en tiempo real

### GitHub Actions

- **Workflows**: Ve a la pestaña "Actions" en tu repositorio
- **Historial**: Ver historial de deployments
- **Logs**: Revisar logs de cada deployment

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Tokens**: https://vercel.com/account/tokens
- **Documentación Vercel**: https://vercel.com/docs
- **Vercel CLI**: https://vercel.com/docs/cli
- **GitHub Actions**: https://docs.github.com/en/actions

---

## 📞 Soporte

Si tienes problemas:

1. 📖 Consulta [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) para la guía completa
2. 📊 Revisa los logs: `vercel logs --follow`
3. 🔍 Revisa la sección de Troubleshooting
4. 💬 Contacta al equipo de desarrollo

---

## 🎉 ¡Listo!

Ahora tienes todo configurado para deployar INMOVA a Vercel de manera manual o automática.

**Próximo paso:** Ejecuta `./scripts/deploy.sh` para tu primer deployment.
