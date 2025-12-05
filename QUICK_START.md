# 🚀 Quick Start - INMOVA Deployment

## Pasos Rápidos para Desplegar en Vercel

### 1. Preparar el Código (5 minutos)

```bash
# Navega al directorio del proyecto
cd /home/ubuntu/homming_vidaro

# Ejecuta el script de setup
chmod +x setup-vercel.sh
./setup-vercel.sh

# Sube a GitHub
git push -u origin main
```

### 2. Crear Base de Datos en Supabase (5 minutos)

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click en "New Project"
3. Completa el formulario:
   - **Name:** inmova-db
   - **Database Password:** (genera una segura)
   - **Region:** Elige la más cercana
4. Espera a que se cree (2-3 minutos)
5. Ve a **Settings** → **Database** → **Connection string**
6. Copia la URI y reemplaza `[YOUR-PASSWORD]`

### 3. Desplegar en Vercel (10 minutos)

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Click en "Import Git Repository"
3. Conecta GitHub y selecciona tu repositorio
4. Configura:
   - **Framework:** Next.js
   - **Root Directory:** (deja vacío)
   - **Build Command:** `cd nextjs_space && yarn build`
   - **Output Directory:** `nextjs_space/.next`
   - **Install Command:** `cd nextjs_space && yarn install`

5. Agrega las **Environment Variables** (copia de tu `.env`):

```bash
# Mínimo requerido:
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=wJqizZO73C6pU4tjLTNwzjeoGLaMWvr9
NEXTAUTH_URL=https://tu-proyecto.vercel.app

# AWS (si usas S3)
AWS_REGION=us-west-2
AWS_BUCKET_NAME=tu-bucket

# Stripe (si usas pagos)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

6. Click en **Deploy**
7. Espera 5-10 minutos

### 4. Configurar Base de Datos (5 minutos)

```bash
# Desde tu terminal local
cd /home/ubuntu/homming_vidaro/nextjs_space

# Configura la DATABASE_URL de Supabase
export DATABASE_URL="postgresql://..."

# Ejecuta las migraciones
yarn prisma migrate deploy

# (Opcional) Carga datos de prueba
yarn prisma db seed
```

### 5. Verificar Deployment ✅

1. Ve a la URL de Vercel: `https://tu-proyecto.vercel.app`
2. Intenta hacer login:
   - **Email:** `superadmin@inmova.com`
   - **Password:** `superadmin123`
3. Verifica que cargue el dashboard

---

## 🎯 Resumen de URLs

| Servicio | URL |
|----------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |
| Tu Aplicación | https://tu-proyecto.vercel.app |
| Documentación Completa | [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) |

---

## ⚠️ Problemas Comunes

### Build Failed

```bash
# Verifica localmente
cd nextjs_space
yarn build

# Si hay errores, revísalos y corrígelos
```

### Database Connection Error

1. Verifica que `DATABASE_URL` esté correcta en Vercel
2. En Supabase: **Settings** → **Database** → Enable **Connection Pooling**
3. Usa la URL de Connection Pooling en Vercel

### Environment Variables Missing

```bash
# Verifica qué variables faltan
cd nextjs_space
node scripts/check-env.js
```

---

## 📚 Recursos

- [Guía Completa de Deployment](./VERCEL_DEPLOYMENT_GUIDE.md)
- [Checklist de Deployment](./DEPLOYMENT_CHECKLIST.md)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

**Tiempo Total:** ~25 minutos  
**Dificultad:** Fácil 🜢🜢▫️▫️▫️
