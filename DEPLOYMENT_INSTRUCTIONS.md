# 🚀 Instrucciones de Deployment - INMOVA

## ✅ Estado Actual del Código

**Fecha del backup:** 27 de diciembre de 2025
**Tag de Git:** `backup-codigo-limpio-20251227-0804`
**Backup comprimido:** `.backups/codigo-limpio-20251227-0804.tar.gz`

### Verificación del Build
- ✅ Build exitoso sin errores de compilación
- ✅ 324 páginas estáticas generadas correctamente
- ✅ Prisma Client configurado y generado
- ✅ 29+ archivos con errores JSX corregidos
- ⚠️ 4 warnings menores (imports opcionales, no críticos)

---

## 📦 Restaurar desde Backup

Si necesitas volver a este estado limpio:

### Opción 1: Usando Git Tag
```bash
git checkout backup-codigo-limpio-20251227-0804
```

### Opción 2: Desde archivo comprimido
```bash
cd /workspace
tar -xzf .backups/codigo-limpio-20251227-0804.tar.gz
npm install
npx prisma generate
npm run build
```

---

## 🌐 Opciones de Deployment

### 1️⃣ Vercel (Recomendado para Next.js)

**Ventajas:**
- Optimizado específicamente para Next.js
- Deploy automático desde Git
- CDN global incluido
- SSL automático
- Preview deployments por cada push

**Pasos:**

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Variables de entorno necesarias en Vercel:**
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=tu-secret-key
```

**Configuración en Vercel Dashboard:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

---

### 2️⃣ Railway

**Ventajas:**
- PostgreSQL incluido
- Deploy desde Git
- Variables de entorno fáciles
- $5 de crédito gratis

**Pasos:**

1. **Conectar repositorio en Railway:**
   - Ve a [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Selecciona tu repositorio

2. **Agregar PostgreSQL:**
   - Add Service → PostgreSQL
   - Se configurará automáticamente `DATABASE_URL`

3. **Variables de entorno:**
```
DATABASE_URL=postgresql://... (automático)
NEXTAUTH_URL=https://tu-app.railway.app
NEXTAUTH_SECRET=tu-secret-key
NODE_ENV=production
```

4. **Ejecutar migraciones:**
```bash
railway run npx prisma migrate deploy
```

---

### 3️⃣ Docker + Manual

**Dockerfile ya incluido en el proyecto**

```bash
# Build imagen
docker build -t inmova-app .

# Ejecutar
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="https://tu-dominio.com" \
  -e NEXTAUTH_SECRET="tu-secret" \
  inmova-app
```

---

## 🔐 Variables de Entorno Críticas

### Mínimas necesarias:

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Autenticación
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32

# Node
NODE_ENV=production
```

### Opcionales (según features usadas):

```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password

# AWS S3 (para uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_S3_BUCKET=...

# Stripe (pagos)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
NEXT_PUBLIC_GA_ID=G-...
```

---

## 📝 Checklist Post-Deployment

Después del deployment, verifica:

- [ ] La aplicación carga correctamente
- [ ] Login funciona (prueba con usuario test)
- [ ] Base de datos está conectada
- [ ] Las páginas principales cargan sin error
- [ ] Los assets estáticos (imágenes, CSS) se sirven correctamente
- [ ] SSL está activo (HTTPS)
- [ ] Variables de entorno están configuradas
- [ ] Migraciones de Prisma ejecutadas: `npx prisma migrate deploy`
- [ ] Seeds iniciales si es necesario: `npx prisma db seed`

---

## 🔧 Comandos Útiles Post-Deployment

### Verificar estado de la base de datos:
```bash
npx prisma db pull
npx prisma studio
```

### Ejecutar migraciones:
```bash
npx prisma migrate deploy
```

### Ver logs (según plataforma):
```bash
# Vercel
vercel logs [deployment-url]

# Railway
railway logs

# Docker
docker logs [container-id]
```

---

## 🆘 Rollback Rápido

Si algo sale mal en producción:

### En Vercel:
1. Ve a Deployments en el dashboard
2. Encuentra el deployment anterior
3. Click en "Promote to Production"

### En Railway:
1. Ve a Deployments
2. Click en el deployment anterior
3. "Redeploy"

### Manual (Git):
```bash
git checkout backup-codigo-limpio-20251227-0804
git push origin main --force
```

---

## 📞 Monitoreo Post-Deployment

Herramientas recomendadas:
- **Sentry** - Tracking de errores
- **Vercel Analytics** - Si usas Vercel
- **Uptime Robot** - Monitoreo de uptime
- **LogRocket** - Session replay

---

## 🎯 Próximos Pasos Recomendados

1. **Configurar CI/CD:** Tests automáticos antes de deploy
2. **Monitoring:** Implementar Sentry o similar
3. **Backups automáticos:** De la base de datos
4. **CDN:** Para assets estáticos (ya incluido en Vercel)
5. **Cache:** Redis para sessions/cache (opcional)

---

**¡Éxito con el deployment! 🚀**

Si necesitas ayuda, este documento tiene toda la información necesaria para volver al estado limpio y funcional del código.
