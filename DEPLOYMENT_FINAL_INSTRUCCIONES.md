# 🚀 Instrucciones Finales - Deployment INMOVA

## ✅ Estado Actual: TODO LISTO

### Lo que ya está hecho:

- ✅ Código subido a GitHub: `dvillagrablanco/inmova-app`
- ✅ Branch: `cursor/app-deployment-to-vercel-7c94`
- ✅ Token de Vercel: `mrahnG6wAoMRYDyGA9sWXGQH`
- ✅ Usuario Vercel: `dvillagrab-7604`
- ✅ Secrets generados y listos
- ✅ Proyecto configurado correctamente
- ✅ Dependencias instaladas
- ✅ Prisma Client generado

---

## 🎯 DEPLOYMENT EN 5 MINUTOS

### Paso 1: Abre Vercel Dashboard

```
https://vercel.com/new
```

### Paso 2: Importa el Repositorio

1. En la página, verás "Import Git Repository"
2. Si no ves tu repositorio `dvillagrablanco/inmova-app`:
   - Click en "Add GitHub Account" o "Adjust GitHub App Permissions"
   - Autoriza acceso a tu repositorio

### Paso 3: Configura el Proyecto

Vercel detectará automáticamente que es Next.js.

**Configuración que verás** (ya está correcta por vercel.json):

- Framework Preset: Next.js ✅
- Root Directory: `./` ✅
- Build Command: `yarn build` ✅
- Output Directory: `.next` ✅
- Install Command: `yarn install` ✅

### Paso 4: Añade Variables de Entorno

Antes de hacer clic en "Deploy", expande "Environment Variables" y añade **SOLO ESTAS CRÍTICAS**:

```env
NEXTAUTH_SECRET=34Z15OHM7VJIU5JTX4LlbGRvlFkX6VGRY3HYlghi+YY=
ENCRYPTION_KEY=2ae9029120303be4a34206d19364ea8d3f3f33232bd234f5a0ae8e4e18565a2f
CRON_SECRET=0a1012992791d1a0e7108e3716667cf516dd81776a281d4c317818bfcd39e38d
```

**IMPORTANTE**: Para cada variable:

1. Pega el nombre en "Name"
2. Pega el valor en "Value"
3. Deja seleccionado "Production", "Preview", "Development"

### Paso 5: Deploy

Click en el botón **"Deploy"**

El deployment tardará 5-7 minutos.

---

## ⚙️ PASO 6: Configurar Más Variables (DESPUÉS del primer deploy)

Una vez que el primer deployment termine:

1. Ve a tu proyecto en Vercel Dashboard
2. Click en **"Settings"** → **"Environment Variables"**
3. Añade estas variables adicionales (las que tengas):

```env
# Base de Datos (OBLIGATORIA)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# URL de la app (actualizar después)
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app

# AWS S3 (si lo usas)
AWS_REGION=tu-region
AWS_BUCKET_NAME=tu-bucket
AWS_FOLDER_PREFIX=tu-prefix

# Stripe (si lo usas)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Abacus AI (si lo usas)
ABACUSAI_API_KEY=tu-api-key

# Email (si lo usas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email
SMTP_PASSWORD=tu-password
SMTP_FROM=INMOVA <noreply@inmova.app>
```

### Paso 7: Re-deploy

Después de añadir las variables:

1. Ve a **"Deployments"**
2. Click en los 3 puntos del último deployment
3. Click **"Redeploy"**

---

## 🌐 PASO 8: Configurar Dominio Personalizado (Opcional)

Si quieres usar `inmova.app`:

1. En tu proyecto → **Settings** → **Domains**
2. Click **"Add"**
3. Ingresa: `inmova.app`
4. Vercel te dará registros DNS:
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```
5. Configura estos registros en tu proveedor de DNS
6. Espera 5-30 minutos para propagación
7. Actualiza `NEXTAUTH_URL` a `https://inmova.app`
8. Re-despliega

---

## ✅ Verificación Post-Deployment

Abre tu app y verifica:

- [ ] La página principal carga
- [ ] El login funciona
- [ ] Dashboard muestra datos
- [ ] No hay errores en consola
- [ ] Las imágenes cargan (si usas S3)
- [ ] Los APIs responden

---

## 🔗 Enlaces Útiles

### Tu Proyecto en GitHub:

```
https://github.com/dvillagrablanco/inmova-app
```

### Crear Proyecto en Vercel:

```
https://vercel.com/new
```

### Tus Secrets (guárdalos):

```env
NEXTAUTH_SECRET=34Z15OHM7VJIU5JTX4LlbGRvlFkX6VGRY3HYlghi+YY=
ENCRYPTION_KEY=2ae9029120303be4a34206d19364ea8d3f3f33232bd234f5a0ae8e4e18565a2f
CRON_SECRET=0a1012992791d1a0e7108e3716667cf516dd81776a281d4c317818bfcd39e38d
```

### Tu Token de Vercel:

```
mrahnG6wAoMRYDyGA9sWXGQH
```

---

## 🆘 Solución de Problemas

### Error: "Build failed"

- Revisa los logs en Vercel Dashboard
- Verifica que todas las variables estén configuradas
- Especialmente `DATABASE_URL`

### Error: "Cannot connect to database"

- Verifica que `DATABASE_URL` esté bien escrita
- La base de datos debe ser accesible desde internet (no localhost)

### Error: "NEXTAUTH_SECRET is not defined"

- Ve a Settings → Environment Variables
- Añade `NEXTAUTH_SECRET` con el valor de arriba
- Re-despliega

### La app carga pero el login no funciona

- Verifica que `NEXTAUTH_URL` tenga la URL correcta de Vercel
- Debe ser `https://` (con S)
- Debe coincidir exactamente con el dominio

---

## 📊 Resumen de Tiempo

| Paso                             | Tiempo Estimado   |
| -------------------------------- | ----------------- |
| Importar repo en Vercel          | 1 minuto          |
| Configurar variables básicas     | 2 minutos         |
| Deployment inicial               | 5-7 minutos       |
| Configurar variables adicionales | 3 minutos         |
| Re-deployment                    | 5 minutos         |
| **TOTAL**                        | **15-20 minutos** |

---

## 🎉 ¡Eso es Todo!

Una vez completados estos pasos, tu aplicación INMOVA estará en producción en Vercel.

**Próximo paso**: Abre https://vercel.com/new y sigue los pasos de arriba.

---

_Preparado por: Cursor AI Agent_  
_Fecha: Diciembre 27, 2024_  
_Tu código ya está en GitHub, listo para importar en Vercel_
