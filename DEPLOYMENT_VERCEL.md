# 📦 Guía de Deployment Manual en Vercel para INMOVA

## 🎯 Resumen Ejecutivo

Esta guía te permitirá deployar manualmente el proyecto INMOVA en Vercel. El proyecto está completamente preparado y configurado para funcionar en Vercel sin modificaciones adicionales.

---

## ✅ Pre-requisitos

### 1. Cuenta de Vercel
- Crea una cuenta gratuita en [vercel.com](https://vercel.com)
- Conecta tu cuenta de GitHub/GitLab/Bitbucket

### 2. Base de Datos PostgreSQL
- **Opción A (Recomendada)**: Usar Vercel Postgres
- **Opción B**: Usar Neon, Supabase, o cualquier proveedor PostgreSQL

### 3. Dominio (Opcional)
- Para usar `inmova.app`, necesitarás configurar el dominio en Vercel

---

## 📋 Paso a Paso: Deployment Manual

### PASO 1: Preparar el Repositorio

```bash
# 1. Asegúrate de estar en el directorio correcto
cd /home/ubuntu/homming_vidaro

# 2. Inicializar git si no está inicializado
git init

# 3. Crear .gitignore (si no existe)
echo "node_modules
.next
.env.local
.env
.DS_Store
*.log
dist
build
.vercel" > .gitignore

# 4. Hacer commit de todos los archivos
git add .
git commit -m "Initial commit for Vercel deployment"

# 5. Crear repositorio en GitHub y hacer push
# Ve a github.com y crea un nuevo repositorio llamado 'inmova-app'
# Luego ejecuta:
git remote add origin https://github.com/TU_USUARIO/inmova-app.git
git branch -M main
git push -u origin main
```

### PASO 2: Configurar Base de Datos

#### Opción A: Vercel Postgres (Recomendada)

1. Ve a tu dashboard de Vercel
2. Click en "Storage" → "Create Database" → "Postgres"
3. Sigue el wizard de creación
4. Guarda las credenciales que te proporcionen

#### Opción B: Proveedor Externo (Neon, Supabase, etc.)

1. Crea una base de datos en tu proveedor preferido
2. Obtén la connection string (formato: `postgresql://user:password@host:port/database`)

### PASO 3: Import del Proyecto en Vercel

1. **Ir a Vercel Dashboard**
   - Ve a [vercel.com/new](https://vercel.com/new)

2. **Import Git Repository**
   - Click en "Import Project"
   - Selecciona tu repositorio de GitHub
   - Click en "Import"

3. **Configurar el Proyecto**
   ```
   Framework Preset: Next.js
   Root Directory: nextjs_space
   Build Command: yarn build
   Output Directory: .next
   Install Command: yarn install
   ```

### PASO 4: Configurar Variables de Entorno

En la sección "Environment Variables" de Vercel, agrega las siguientes variables:

#### 🔐 Variables Esenciales (OBLIGATORIAS)

```bash
# Base de Datos
DATABASE_URL="postgresql://usuario:password@host:5432/database?sslmode=require"

# NextAuth (Genera secret con: openssl rand -base64 32)
NEXTAUTH_SECRET="tu_secret_aleatorio_muy_seguro_aqui"
NEXTAUTH_URL="https://inmova.app"  # Cambia por tu dominio

# AWS S3 para almacenamiento de archivos
AWS_REGION="eu-west-1"
AWS_ACCESS_KEY_ID="tu_aws_access_key"
AWS_SECRET_ACCESS_KEY="tu_aws_secret_key"
AWS_BUCKET_NAME="inmova-uploads"
AWS_FOLDER_PREFIX="production/"

# Abacus AI (para LLM APIs - opcional pero recomendado)
ABACUSAI_API_KEY="tu_abacus_api_key"
```

#### 🎨 Variables Opcionales (Funcionalidades Adicionales)

```bash
# Stripe (Pagos)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# Redsys/Open Banking (Opcional)
REDSYS_API_URL="https://api.redsys.com"
REDSYS_CLIENT_ID="tu_client_id"
REDSYS_CLIENT_SECRET="tu_client_secret"

# Zucchetti (Contabilidad - Opcional)
ZUCCHETTI_CLIENT_ID="tu_client_id"
ZUCCHETTI_CLIENT_SECRET="tu_client_secret"
ZUCCHETTI_API_URL="https://api.zucchetti.com"

# ContaSimple (Contabilidad - Opcional)
CONTASIMPLE_AUTH_KEY="tu_auth_key"
CONTASIMPLE_API_URL="https://api.contasimple.com"
```

### PASO 5: Deploy y Migración de Base de Datos

1. **Hacer el Deploy Inicial**
   - Click en "Deploy"
   - Espera a que termine el build (puede tardar 5-10 minutos)

2. **Ejecutar Migraciones de Prisma**
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Vincular proyecto
   vercel link
   
   # Ejecutar migraciones
   vercel env pull .env.local
   cd nextjs_space
   yarn prisma generate
   yarn prisma db push
   
   # Seed inicial (opcional pero recomendado)
   yarn prisma db seed
   ```

3. **Crear Usuario Super Admin**
   ```bash
   # Ejecutar script de creación
   yarn tsx scripts/create-super-admin.ts
   
   # Credenciales por defecto:
   # Email: superadmin@inmova.com
   # Password: superadmin123
   ```

### PASO 6: Configurar Dominio Personalizado

1. **En Vercel Dashboard**
   - Ve a tu proyecto → Settings → Domains
   - Click en "Add Domain"
   - Ingresa: `inmova.app` y `www.inmova.app`

2. **En tu Proveedor de DNS**
   - Agrega los registros que Vercel te indique
   - Típicamente será un registro `A` o `CNAME`

3. **Esperar Propagación DNS** (puede tardar hasta 24 horas)

4. **Actualizar NEXTAUTH_URL**
   ```bash
   NEXTAUTH_URL="https://inmova.app"
   ```

---

## 🔧 Configuraciones Especiales

### Webhook de Stripe

Si usas Stripe, necesitas configurar el webhook endpoint:

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click en "Add endpoint"
3. URL: `https://inmova.app/api/stripe/webhook`
4. Selecciona eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Guarda el `STRIPE_WEBHOOK_SECRET` en Vercel

### Cron Jobs (Tareas Programadas)

Vercel soporta cron jobs mediante su archivo `vercel.json`. Ya está configurado en el proyecto:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/calendar-sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

## 🧪 Verificación Post-Deployment

### Checklist de Funcionalidad

- [ ] La página principal carga correctamente
- [ ] Puedes hacer login con las credenciales del super-admin
- [ ] El dashboard se muestra sin errores
- [ ] Puedes crear una nueva empresa
- [ ] Puedes subir imágenes (verifica S3)
- [ ] Los pagos funcionan (si configuraste Stripe)
- [ ] Las notificaciones se envían correctamente

### Endpoints de Verificación

```bash
# Health check
curl https://inmova.app/api/health

# Verificar autenticación
curl https://inmova.app/api/auth/session
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Con Vercel CLI
vercel logs https://inmova.app --follow
```

### En Vercel Dashboard

1. Ve a tu proyecto
2. Click en "Deployments"
3. Selecciona el deployment activo
4. Click en "Function Logs"

---

## 🚨 Troubleshooting

### Error: "Database connection failed"

**Solución:**
```bash
# Verifica la DATABASE_URL
vercel env ls

# Asegúrate de que incluye ?sslmode=require
DATABASE_URL="postgresql://...?sslmode=require"
```

### Error: "Module not found"

**Solución:**
```bash
# Limpia cache y redeploy
vercel --prod --force
```

### Error: "NextAuth configuration error"

**Solución:**
```bash
# Regenera NEXTAUTH_SECRET
openssl rand -base64 32

# Actualiza en Vercel
vercel env add NEXTAUTH_SECRET
```

### Error: "S3 Upload Failed"

**Solución:**
```bash
# Verifica permisos de IAM en AWS
# La política debe incluir:
# - s3:PutObject
# - s3:GetObject
# - s3:DeleteObject
```

---

## 🔄 Actualizaciones y Redeploys

### Deploy Automático (Recomendado)

```bash
# Cada push a main triggerea un deploy automático
git add .
git commit -m "Update: descripción del cambio"
git push origin main
```

### Deploy Manual desde CLI

```bash
# Deploy a producción
vercel --prod

# Deploy a preview
vercel
```

---

## 📈 Optimizaciones de Performance

### 1. Edge Functions

Vercel automáticamente optimiza las funciones API para Edge. Asegúrate de que las rutas críticas están marcadas:

```typescript
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
```

### 2. Image Optimization

Next.js Image component ya está configurado. Vercel lo optimiza automáticamente.

### 3. Caching

Vercel cachea automáticamente assets estáticos. Para APIs, configura headers:

```typescript
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate'
    }
  });
}
```

---

## 💰 Costos Estimados

### Vercel (Plan Pro recomendado)
- **Pro**: $20/mes por usuario
- Incluye:
  - Bandwidth ilimitado
  - Build time ilimitado
  - Dominios personalizados
  - Web Analytics
  - Password Protection

### Vercel Postgres
- **Starter**: Gratis (hasta 60 horas de compute/mes)
- **Pro**: $20/mes (256 MB RAM, 10 GB storage)

### AWS S3
- **Almacenamiento**: ~$0.023 por GB/mes
- **Transferencia**: Primeros 1 GB gratis, luego $0.09 por GB

### Total Estimado Mensual
- **Mínimo**: $20-40/mes (Plan Pro + Postgres Starter)
- **Recomendado**: $60-100/mes (Pro + Postgres Pro + S3)

---

## 🎓 Recursos Adicionales

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

## 📞 Soporte

### Errores de Deployment
- Revisa logs en Vercel Dashboard
- Consulta la documentación oficial de Vercel
- Verifica que todas las variables de entorno estén configuradas

### Problemas de Base de Datos
- Usa `yarn prisma studio` para inspeccionar datos
- Verifica connection string con `yarn prisma db pull`
- Revisa logs de Postgres en tu proveedor

---

## ✅ Checklist Final

- [ ] Repositorio en GitHub creado y pusheado
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Base de datos creada y migrada
- [ ] Super admin creado
- [ ] Dominio personalizado configurado (opcional)
- [ ] Webhooks configurados (si aplica)
- [ ] Primera prueba de login exitosa
- [ ] Funcionalidades principales verificadas
- [ ] Monitoreo configurado

---

🎉 **¡Deployment Completado!**

Tu aplicación INMOVA ahora está desplegada en Vercel y lista para producción.

**URL de acceso**: https://inmova.app (o tu dominio personalizado)
**Super Admin**: superadmin@inmova.com / superadmin123

¡Recuerda cambiar las credenciales por defecto después del primer login!
