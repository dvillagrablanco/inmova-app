# 🚀 INMOVA - Quick Start: Migración a GitHub y Vercel

## ✅ Estado: TODO LISTO PARA MIGRAR

---

## 📍 Paso 1: GitHub (5 minutos)

### 1.1. Crear Repositorio en GitHub
1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `inmova` (o el que prefieras)
3. Privado/Público según tu preferencia
4. **NO inicialices** con README, .gitignore o licencia
5. Click "Create repository"

### 1.2. Push del Código

```bash
# Desde el directorio del proyecto
cd /home/ubuntu/homming_vidaro/nextjs_space

# Verificar estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: ready for production deployment"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/inmova.git

# Push
git branch -M main
git push -u origin main
```

✅ **¡Código en GitHub!**

---

## 📦 Paso 2: Configurar Servicios (15-20 minutos)

### 2.1. Base de Datos PostgreSQL

**Opción Recomendada: Vercel Postgres**

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Storage → Create Database → Postgres
3. Nombre: `inmova-db`
4. Región: Cercana a tus usuarios
5. **Copia la `DATABASE_URL`** 📎

**Alternativa: Supabase (Gratis)**
1. [supabase.com/dashboard](https://supabase.com/dashboard)
2. New Project → Configura
3. Settings → Database → Connection String (Transaction)
4. **Copia la URL** 📎

### 2.2. AWS S3

```bash
# Crear bucket
Nombre: inmova-production
Región: us-west-2
```

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://tu-dominio.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

**Crear IAM User:**
- Policy: AmazonS3FullAccess
- Generar Access Key
- **Guardar:**
  - `AWS_ACCESS_KEY_ID` 📎
  - `AWS_SECRET_ACCESS_KEY` 📎

### 2.3. Stripe (Modo Test)

1. [dashboard.stripe.com](https://dashboard.stripe.com)
2. Developers → API Keys
3. **Copia:**
   - `STRIPE_SECRET_KEY` (sk_test_...) 📎
   - `STRIPE_PUBLISHABLE_KEY` (pk_test_...) 📎

### 2.4. Generar Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32
# Guardar el output 📎

# CRON_SECRET
openssl rand -hex 32
# Guardar el output 📎

# ENCRYPTION_KEY
openssl rand -hex 32
# Guardar el output 📎
```

---

## 🚀 Paso 3: Deploy en Vercel (10 minutos)

### 3.1. Conectar Repositorio

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Import Git Repository
3. Selecciona tu repo de GitHub
4. Configuración:
   - Framework: **Next.js** (auto-detectado)
   - Root Directory: `.` (dejar vacío)
   - Build Command: `yarn build` (default)
   - Output Directory: `.next` (default)

### 3.2. Configurar Variables de Entorno

**ANTES de hacer click en "Deploy"**, agrega estas variables:

#### Variables Requeridas (copiar todo el bloque)

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=<el-que-generaste>
NEXTAUTH_URL=https://tu-proyecto.vercel.app

# AWS S3
AWS_REGION=us-west-2
AWS_BUCKET_NAME=inmova-production
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_FOLDER_PREFIX=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Security
CRON_SECRET=<el-que-generaste>
ENCRYPTION_KEY=<el-que-generaste>

# Node
NODE_ENV=production

# Base URL (cambiar después con tu URL real)
NEXT_PUBLIC_BASE_URL=https://tu-proyecto.vercel.app
```

**Aplica a:** Production + Preview + Development

### 3.3. Deploy

1. Click en **"Deploy"**
2. Espera 2-5 minutos
3. ¡Tu app estará live!

🎉 **URL:** `https://tu-proyecto.vercel.app`

---

## 🔧 Paso 4: Post-Deployment (5 minutos)

### 4.1. Ejecutar Migraciones de Prisma

```bash
# Opción 1: Desde tu máquina
vercel env pull
yarn prisma migrate deploy

# Opción 2: Seed inicial (opcional)
yarn prisma db seed
```

### 4.2. Actualizar NEXTAUTH_URL

1. Vercel Dashboard → Settings → Environment Variables
2. Editar `NEXTAUTH_URL`
3. Cambiar a: `https://TU-URL-REAL.vercel.app`
4. Redeploy

### 4.3. Actualizar CORS en S3

```json
{
  "AllowedOrigins": ["https://TU-URL-REAL.vercel.app"]
}
```

### 4.4. Configurar Webhook de Stripe

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://TU-URL.vercel.app/api/stripe/webhook`
3. Eventos:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `customer.subscription.*`
4. Copiar Signing Secret
5. Agregarlo en Vercel como `STRIPE_WEBHOOK_SECRET`
6. Redeploy

---

## ✅ Paso 5: Verificación (2 minutos)

### Checklist:

- [ ] La app carga sin errores
- [ ] Puedes hacer login
- [ ] Dashboard se muestra
- [ ] Imágenes cargan (S3)
- [ ] Base de datos funciona
- [ ] No hay errores en console

### Ver Logs:

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Ver logs en tiempo real
vercel logs --follow
```

---

## 🎁 EXTRA: Dominio Personalizado (Opcional)

### Si quieres usar `inmova.app` en lugar de `*.vercel.app`:

1. Vercel Dashboard → Settings → Domains
2. Add Domain: `inmova.app`
3. Configurar DNS (A/CNAME records)
4. Esperar propagación (1-48 hrs, generalmente <1hr)
5. Actualizar:
   - `NEXTAUTH_URL` en Vercel
   - CORS en S3
   - Stripe webhook URL

---

## 🐛 Troubleshooting Rápido

### Build Falla
```bash
# Verificar que postinstall esté en package.json
"postinstall": "prisma generate"
```

### DB no conecta
- Verifica que DATABASE_URL sea correcta
- Para Supabase: usa Transaction Pooler
- Para Vercel Postgres: copia la URL completa

### Imágenes no cargan
- Verifica CORS en S3
- Verifica credenciales AWS
- Check browser console

### Error 500
```bash
# Ver logs
vercel logs tu-proyecto --follow
```

---

## 📚 Documentación Completa

Para más detalles, consulta:

- **GITHUB-VERCEL-MIGRATION.md** - Guía completa
- **DEPLOYMENT.md** - Deployment detallado
- **PRE-DEPLOYMENT-CHECKLIST.md** - Lista de verificación

---

## 📊 Resumen de Tiempos

| Paso | Tiempo Estimado |
|------|----------------|
| GitHub Setup | 5 min |
| Configurar Servicios | 15-20 min |
| Deploy en Vercel | 10 min |
| Post-Deployment | 5 min |
| **TOTAL** | **35-40 min** |

---

## ✅ Variables de Entorno - Checklist

```
☐ DATABASE_URL
☐ NEXTAUTH_SECRET
☐ NEXTAUTH_URL
☐ AWS_REGION
☐ AWS_BUCKET_NAME
☐ AWS_ACCESS_KEY_ID
☐ AWS_SECRET_ACCESS_KEY
☐ STRIPE_SECRET_KEY
☐ STRIPE_PUBLISHABLE_KEY
☐ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
☐ CRON_SECRET
☐ ENCRYPTION_KEY
☐ NODE_ENV
☐ NEXT_PUBLIC_BASE_URL
```

---

## 🎉 ¡Listo!

Si seguiste todos los pasos, tu aplicación INMOVA debería estar:

✅ Corriendo en producción  
✅ Con HTTPS automático  
✅ CI/CD configurado  
✅ Analytics habilitado  
✅ Escalable automáticamente  

**URL de tu app:** `https://tu-proyecto.vercel.app`

---

**Última actualización:** Diciembre 2025  
**Tiempo total estimado:** 35-40 minutos  
**Dificultad:** Media