# 🚀 Instrucciones para Deployment Público en Vercel

## ✅ Estado Actual

Todos los errores JSX han sido corregidos y el código está listo para deployment. Los cambios han sido commiteados al repositorio.

## 📋 Pasos para Deployment

### Paso 1: Push al Repositorio de GitHub

```bash
git push origin cursor/broken-page-visual-checks-dc37
```

O si quieres hacer merge a main primero:

```bash
git checkout main
git merge cursor/broken-page-visual-checks-dc37
git push origin main
```

### Paso 2: Conectar el Repositorio a Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Add New Project"**
3. Selecciona **"Import Git Repository"**
4. Autoriza Vercel para acceder a tu organización de GitHub
5. Selecciona el repositorio del proyecto
6. Haz clic en **"Import"**

### Paso 3: Configurar el Proyecto en Vercel

#### 3.1 Framework Preset
- **Framework**: Next.js (detectado automáticamente)
- **Root Directory**: `.` (raíz del proyecto)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

#### 3.2 Variables de Entorno

Configura las siguientes variables de entorno en Vercel Dashboard:

##### Base de Datos
```env
DATABASE_URL=postgresql://usuario:password@host:5432/database
```

##### NextAuth
```env
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=<genera con: openssl rand -base64 32>
```

##### AWS S3 (para almacenamiento de archivos)
```env
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=inmova-bucket
AWS_FOLDER_PREFIX=production/
```

##### Stripe (para pagos)
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

##### Redis (opcional - para caché)
```env
REDIS_URL=redis://...
```

##### Sentry (opcional - para monitoreo de errores)
```env
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
```

##### Otras Variables
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

### Paso 4: Deploy

1. Después de configurar las variables, haz clic en **"Deploy"**
2. Vercel comenzará el build automáticamente
3. El proceso toma aproximadamente 2-5 minutos

### Paso 5: Configurar Dominio Personalizado (Opcional)

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado (ej: `inmova.app`)
3. Configura los registros DNS según las instrucciones de Vercel
4. Espera la propagación de DNS (5-48 horas)

### Paso 6: Configurar Cron Jobs

Los cron jobs están definidos en `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/onboarding-automation",
    "schedule": "0 */6 * * *"
  }
]
```

Vercel los configurará automáticamente. Puedes verificar en:
**Dashboard** → **Settings** → **Cron Jobs**

## 🔍 Verificación Post-Deployment

Después del deployment, verifica que todo funcione correctamente:

### Checks Básicos

1. **Homepage**: `https://tu-dominio.vercel.app`
2. **API Health**: `https://tu-dominio.vercel.app/api/health`
3. **Login**: `https://tu-dominio.vercel.app/login`

### Checks Avanzados

#### 1. Autenticación
- [ ] Login con credenciales funciona
- [ ] Login con Google funciona
- [ ] Login con GitHub funciona
- [ ] Logout funciona
- [ ] Redirección después de login funciona

#### 2. APIs
- [ ] GET `/api/health` retorna 200
- [ ] GET `/api/version` retorna versión correcta
- [ ] APIs de CRUD funcionan correctamente

#### 3. Base de Datos
- [ ] Las conexiones a PostgreSQL funcionan
- [ ] Las queries se ejecutan correctamente
- [ ] Prisma funciona sin errores

#### 4. Almacenamiento
- [ ] Las imágenes se suben a S3
- [ ] Las imágenes se descargan de S3
- [ ] Los archivos se gestionan correctamente

#### 5. Pagos (si aplica)
- [ ] Stripe se conecta correctamente
- [ ] Los webhooks de Stripe funcionan

## 🐛 Troubleshooting

### Error: "Module not found"
**Solución**: Verifica que todas las dependencias estén en `package.json` y haz redeploy.

### Error: "Database connection failed"
**Solución**: Verifica que `DATABASE_URL` esté correctamente configurada en Vercel.

### Error: "NextAuth configuration error"
**Solución**: Verifica que `NEXTAUTH_URL` y `NEXTAUTH_SECRET` estén configurados.

### Build toma más de 10 minutos
**Solución**: Vercel tiene un límite de 10 minutos para el build. Si excede, contacta soporte de Vercel para aumentar el límite.

### Funciones Edge Runtime fallan
**Solución**: Verifica que no estés usando Node.js APIs no disponibles en Edge Runtime. Usa Web Crypto API en su lugar.

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real
1. Ve a **Dashboard** → **Deployments**
2. Haz clic en el deployment activo
3. Ve a la pestaña **Functions** o **Realtime Logs**

### Configurar Alerts
1. Ve a **Settings** → **Notifications**
2. Configura alertas para errores, build failures, etc.

### Integrar con Sentry (Recomendado)
El proyecto ya tiene Sentry configurado. Solo necesitas:
1. Configurar las variables de entorno de Sentry
2. Sentry capturará automáticamente todos los errores

## 🔄 CI/CD Automático

Una vez configurado:

1. **Push a GitHub** → Vercel detecta el cambio
2. **Build Automático** → Vercel construye la nueva versión
3. **Deploy Automático** → Nueva versión en producción
4. **Preview Deployments** → Cada PR tiene su propio preview

## 📱 URLs del Proyecto

Después del deployment tendrás:

- **Producción**: `https://tu-proyecto.vercel.app`
- **Preview (por branch)**: `https://tu-proyecto-git-[branch].vercel.app`
- **Preview (por PR)**: `https://tu-proyecto-[pr-number].vercel.app`

## 🎯 Next Steps

Después del deployment exitoso:

1. ✅ Configura el dominio personalizado
2. ✅ Configura los DNS records
3. ✅ Habilita SSL (automático en Vercel)
4. ✅ Configura Web Analytics (opcional)
5. ✅ Configura Speed Insights (opcional)
6. ✅ Ejecuta tests E2E en producción
7. ✅ Configura backup de base de datos
8. ✅ Documenta las URLs en el equipo

## 📞 Soporte

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org/

---

**Fecha de Preparación**: 2025-12-27
**Estado**: ✅ Listo para Deployment
**Última Actualización**: Correcciones JSX completadas
