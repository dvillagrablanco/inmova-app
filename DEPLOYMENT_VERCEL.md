# Guía de Deployment en Vercel - INMOVA

## 📋 Requisitos Previos

1. **Cuenta Vercel Pro**: Confirmado ✅
   - Email: dvillagra@vidaroinversiones.com
   - Password: Pucela00

2. **Base de Datos PostgreSQL**
   - La app necesita una base de datos PostgreSQL
   - Puede ser externa (recomendado) o usar Vercel Postgres

3. **Bucket S3 de AWS** (para archivos subidos)
   - Necesario para almacenar imágenes, documentos, etc.

## 🚀 Pasos para Deployment

### 1. Preparar el Repositorio

Si aún no tienes el código en GitHub/GitLab:

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space

# Inicializar git si no existe
git init

# Crear .gitignore si no existe
echo "node_modules\n.next\n.env\n.env.local\ncore\n*.log" > .gitignore

# Commit inicial
git add .
git commit -m "Initial commit for Vercel deployment"

# Añadir remote (crea un repo en GitHub primero)
git remote add origin https://github.com/tu-usuario/inmova.git
git branch -M main
git push -u origin main
```

### 2. Configurar Variables de Entorno en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Crea un nuevo proyecto desde tu repositorio Git
3. En **Settings → Environment Variables**, añade las siguientes:

#### Variables CRÍTICAS (sin estas, la app no funcionará):

```bash
# Database
DATABASE_URL=postgresql://role_587683780:5kWw7vKJBDp9ZA2Jfkt5BdWrAjR0XDe5@db-587683780.db003.hosteddb.reai.io:5432/587683780?connect_timeout=15

# Authentication
NEXTAUTH_SECRET=wJqizZO73C6pU4tjLTNwzjeoGLaMWvr9
NEXTAUTH_URL=https://tu-proyecto.vercel.app  # Actualizar después del primer deploy

# AWS S3
AWS_REGION=us-west-2
AWS_BUCKET_NAME=abacusai-apps-030d8be4269891ba0e758624-us-west-2
AWS_FOLDER_PREFIX=12952/

# Stripe
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV9p3F-Jq-6-kxq9RwD9qdL4U3JfYxSh_Vu_WG2cEg8u7kJ7-vQTmE
VAPID_PRIVATE_KEY=p-K-PxeghWxVyGxvxHYVsT3xhp5fKWvUqNfNqN-J4XM

# Abacus AI
ABACUSAI_API_KEY=a66d474df9e547058d3b977b3771d53b

# Security
CRON_SECRET=inmova-cron-secret-2024-secure-key-xyz789
ENCRYPTION_KEY=151b21e7b3a0ebb00a2ff5288f3575c9d4167305d3a84ccd385564955adefd2b
```

#### Variables OPCIONALES:

```bash
# Video URL
NEXT_PUBLIC_VIDEO_URL=https://www.youtube.com/embed/zm55Gdl5G1Q

# DocuSign (solo si usas firmas digitales)
DOCUSIGN_ACCOUNT_ID=tu_account_id
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi

# Redsys Open Banking (solo si usas integración bancaria)
REDSYS_API_URL=https://apis-i.redsys.es:20443/psd2/xs2a/api-entrada-xs2a/services
REDSYS_OAUTH_URL=https://apis-i.redsys.es:20443/psd2/xs2a/api-oauth-xs2a
```

### 3. Configurar Build Settings en Vercel

En **Settings → General**:

- **Framework Preset**: Next.js
- **Build Command**: `yarn prisma generate && yarn build`
- **Output Directory**: `.next`
- **Install Command**: `yarn install`
- **Root Directory**: `nextjs_space` (si tu proyecto está en un subdirectorio)

### 4. Deploy

1. Click en **Deploy** en Vercel
2. Espera a que termine el build (puede tardar 5-10 minutos)
3. Una vez completado, Vercel te dará una URL como: `https://tu-proyecto.vercel.app`

### 5. Configurar Dominio Custom (inmova.app)

1. En Vercel, ve a **Settings → Domains**
2. Añade tu dominio: `inmova.app`
3. Vercel te dará registros DNS para configurar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Ve a tu proveedor de DNS (donde compraste inmova.app) y añade estos registros
5. Espera 5-10 minutos para la propagación DNS

### 6. Actualizar NEXTAUTH_URL

**IMPORTANTE**: Después del primer deploy exitoso:

1. Ve a **Settings → Environment Variables**
2. Edita `NEXTAUTH_URL` y actualiza a tu URL de producción:
   - Si usas dominio custom: `https://inmova.app`
   - Si usas URL de Vercel: `https://tu-proyecto.vercel.app`
3. Re-deploy la aplicación

### 7. Configurar Webhooks de Stripe

Si usas Stripe para pagos:

1. Ve a tu Dashboard de Stripe
2. En **Developers → Webhooks**, añade un nuevo endpoint:
   - URL: `https://inmova.app/api/stripe/webhook`
3. Selecciona estos eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copia el **Signing secret** y actualiza `STRIPE_WEBHOOK_SECRET` en Vercel

## 🔧 Troubleshooting

### Build Fails

1. **Error de TypeScript**: Revisa los logs, puede que falten tipos
2. **Error de Prisma**: Asegúrate de que `DATABASE_URL` esté correcta
3. **Timeout**: En Settings → Functions, aumenta el timeout a 60s

### App no carga

1. Verifica que `NEXTAUTH_URL` apunte a tu URL de producción
2. Revisa los **Runtime Logs** en Vercel para ver errores
3. Asegúrate de que la base de datos esté accesible desde internet

### Imágenes no cargan

1. Verifica las credenciales de AWS S3
2. Asegúrate de que el bucket tenga políticas de acceso correctas
3. Revisa que `AWS_REGION` y `AWS_BUCKET_NAME` sean correctos

## 📊 Monitoreo

### Analytics en Vercel

1. Ve a tu proyecto → **Analytics**
2. Verás métricas de:
   - Visitantes únicos
   - Pageviews
   - Top páginas
   - Performance (Web Vitals)

### Logs en Tiempo Real

1. Ve a **Deployments** → Click en el último deployment
2. Selecciona **Runtime Logs** para ver logs en vivo
3. Útil para debugging de errores en producción

## 🔐 Seguridad

### HTTPS

- ✅ Vercel proporciona HTTPS automático con certificados SSL
- ✅ Redirige automáticamente HTTP → HTTPS

### Variables de Entorno

- ✅ Las variables sensibles están encriptadas en Vercel
- ✅ No son visibles en los logs ni en el código del cliente
- ✅ Solo accesibles en el servidor

## 🎯 Próximos Pasos

1. **Configurar dominio custom** (inmova.app)
2. **Actualizar NEXTAUTH_URL** después del primer deploy
3. **Configurar webhooks de Stripe** si usas pagos
4. **Monitorear logs** durante las primeras horas
5. **Hacer pruebas completas** de login, pagos, subida de archivos

## 📞 Soporte

Si tienes problemas:

1. Revisa los **Runtime Logs** en Vercel
2. Verifica que todas las variables de entorno estén configuradas
3. Consulta la [documentación de Vercel](https://vercel.com/docs)
4. Contacta a soporte de Vercel (responden rápido en el plan Pro)

---

**¡Listo!** Tu aplicación INMOVA debería estar corriendo en Vercel 🚀
