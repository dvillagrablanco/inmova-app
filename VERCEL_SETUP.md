# 🚀 Guía Completa de Deployment a Vercel - INMOVA

## ✅ Estado Actual
- ✅ Código limpio y respaldado
- ✅ Build exitoso (324 páginas generadas)
- ✅ Vercel CLI instalado
- ✅ Configuración vercel.json lista
- ✅ Script de deployment preparado

---

## 🎯 Deployment en 3 Pasos

### PASO 1: Login en Vercel

```bash
vercel login
```

Selecciona tu método de autenticación:
- GitHub (recomendado)
- GitLab
- Bitbucket
- Email

### PASO 2: Deploy a Producción

Opción A - **Usando el script automatizado** (recomendado):
```bash
./DEPLOY_NOW.sh
```

Opción B - **Manual**:
```bash
vercel --prod
```

El CLI te preguntará:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Selecciona tu cuenta/team
3. **Link to existing project?** → No (primera vez)
4. **What's your project's name?** → inmova (o el nombre que prefieras)
5. **In which directory is your code located?** → ./ (dejar por defecto)

### PASO 3: Configurar Variables de Entorno

Una vez desplegado, ve a: `https://vercel.com/[tu-proyecto]/settings/environment-variables`

#### Variables CRÍTICAS (requeridas):

```env
# 1. Base de Datos
DATABASE_URL=postgresql://user:password@host:5432/dbname

# 2. Autenticación NextAuth
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=[genera uno nuevo]

# 3. Node Environment
NODE_ENV=production
```

**Para generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### Variables OPCIONALES (según features):

```env
# Email (si usas notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# AWS S3 (si usas uploads)
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=tu-bucket

# Stripe (si usas pagos)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_VERCEL_ANALYTICS=1
```

---

## 🗄️ Base de Datos PostgreSQL

### Opciones para PostgreSQL:

#### Opción 1: Vercel Postgres (Recomendado)
1. Ve a tu proyecto en Vercel
2. Click en "Storage" → "Create Database"
3. Selecciona "Postgres"
4. Las variables se configurarán automáticamente

#### Opción 2: Supabase (Gratis)
1. Crea cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings → Database
4. Copia la "Connection String"
5. Agrega `?pgbouncer=true` al final de la URL

#### Opción 3: Railway (Gratis con $5 crédito)
1. Crea cuenta en [railway.app](https://railway.app)
2. New Project → Provision PostgreSQL
3. Copia la DATABASE_URL
4. Pégala en las variables de Vercel

#### Opción 4: Neon.tech (Gratis)
1. Crea cuenta en [neon.tech](https://neon.tech)
2. Crea un proyecto
3. Copia la connection string
4. Agrega como DATABASE_URL en Vercel

---

## 🔄 Ejecutar Migraciones de Prisma

Una vez que la DATABASE_URL esté configurada:

### Método 1: Desde tu terminal local
```bash
# Asegúrate de tener la DATABASE_URL configurada localmente
npx prisma migrate deploy
npx prisma db seed  # Si tienes seeds
```

### Método 2: Desde Vercel CLI
```bash
vercel env pull .env.production.local
npx prisma migrate deploy
```

### Método 3: Build Hook (Automático)
Agrega a `package.json`:
```json
{
  "scripts": {
    "postbuild": "npx prisma generate && npx prisma migrate deploy"
  }
}
```

---

## ✅ Checklist Post-Deployment

Después del deployment, verifica:

- [ ] La app carga correctamente en la URL de Vercel
- [ ] Login funciona (crea un usuario de prueba)
- [ ] La base de datos está conectada
- [ ] Las páginas principales cargan sin error
- [ ] Los assets (imágenes, CSS) se sirven correctamente
- [ ] SSL está activo (HTTPS automático)
- [ ] No hay errores en la consola del navegador
- [ ] Las variables de entorno están configuradas

### Verificar logs en tiempo real:
```bash
vercel logs [deployment-url]
```

---

## 🔧 Comandos Útiles Post-Deployment

### Ver deployments:
```bash
vercel list
```

### Ver logs:
```bash
vercel logs
```

### Pull environment variables:
```bash
vercel env pull .env.local
```

### Ver información del proyecto:
```bash
vercel inspect [deployment-url]
```

### Rollback a deployment anterior:
```bash
vercel rollback [deployment-url]
```

---

## 🌐 Configurar Dominio Personalizado

1. Ve a: `https://vercel.com/[tu-proyecto]/settings/domains`
2. Click en "Add Domain"
3. Ingresa tu dominio (ej: `inmova.app`)
4. Sigue las instrucciones para configurar DNS:

**Si tu dominio está en:**

### Cloudflare:
- Tipo: CNAME
- Nombre: @ (o www)
- Target: cname.vercel-dns.com

### GoDaddy/Namecheap:
- Tipo: A Record
- Host: @
- Value: 76.76.21.21

---

## 🚨 Troubleshooting

### Error: "Database connection failed"
- Verifica que DATABASE_URL esté configurada
- Verifica que la IP de Vercel esté whitelisted en tu DB
- Para Supabase/Neon: agrega `?pgbouncer=true` a la URL

### Error: "NEXTAUTH_URL is not set"
- Configura NEXTAUTH_URL en variables de entorno
- Debe ser la URL completa: `https://tu-app.vercel.app`

### Error: "Prisma Client not found"
- Asegúrate de que `npx prisma generate` se ejecute en build
- Verifica que esté en `package.json` scripts: `"postinstall": "prisma generate"`

### Build falla en Vercel pero funciona local
- Verifica las variables de entorno en Vercel
- Revisa los logs: `vercel logs [deployment-url]`
- Asegúrate de que `.vercelignore` no excluya archivos necesarios

---

## 📊 Monitoring & Analytics

### Activar Vercel Analytics:
1. Ve a tu proyecto en Vercel
2. Click en "Analytics"
3. Click en "Enable"
4. Agrega al código (ya incluido en tu proyecto)

### Activar Web Vitals:
Ya está configurado en el proyecto. Ve a:
`https://vercel.com/[tu-proyecto]/analytics`

---

## 🔄 Actualizaciones Futuras

Para deployments futuros:

```bash
# Commit tus cambios
git add .
git commit -m "Tu mensaje"
git push origin main

# Deploy automático (si conectaste el repo)
# O manualmente:
vercel --prod
```

---

## 🎉 ¡Listo!

Tu aplicación está ahora en producción con:
- ✅ SSL/HTTPS automático
- ✅ CDN global
- ✅ Serverless functions
- ✅ Edge network
- ✅ Automatic scaling
- ✅ Zero-downtime deployments

**URL de tu proyecto:** `https://tu-app.vercel.app`

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs: `vercel logs`
2. Consulta la documentación: https://vercel.com/docs
3. Revisa el archivo: `DEPLOYMENT_INSTRUCTIONS.md`
4. Vercel Support: https://vercel.com/support

---

**¡Felicitaciones! Tu app está en producción! 🎊**
