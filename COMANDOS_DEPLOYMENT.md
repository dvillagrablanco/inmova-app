# ⚡ COMANDOS RÁPIDOS PARA DEPLOYMENT

**COPY-PASTE estos comandos en orden**

---

## 🚀 DEPLOYMENT RÁPIDO (5 MINUTOS)

### 1. Instalar Vercel CLI (solo primera vez)

```bash
npm i -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Link Proyecto (solo primera vez)

```bash
cd /workspace
vercel link
```

### 4. Deploy a Producción

```bash
vercel --prod
```

### 5. Configurar Base de Datos

**VE A:** https://vercel.com/dashboard

1. Click en tu proyecto
2. Storage → Create Database → Postgres
3. Name: `inmova-production-db`
4. Create

### 6. Configurar Variables de Entorno

**VE A:** https://vercel.com/tu-proyecto/settings/environment-variables

Agregar para **Production**:

```bash
# NEXTAUTH_SECRET - Generar con:
openssl rand -base64 32

# NEXTAUTH_URL
https://inmovaapp.com

# NODE_ENV
production
```

### 7. Redeploy (después de configurar variables)

```bash
vercel --prod
```

### 8. Aplicar Migraciones

```bash
# Copia DATABASE_URL de Vercel Dashboard
export DATABASE_URL="postgresql://..."

npx prisma migrate deploy
```

### 9. Crear Datos Iniciales

```bash
npm run db:seed
```

### 10. ¡Listo! Verifica

```
https://tu-app.vercel.app
o
https://inmovaapp.com (si configuraste el dominio)

Login:
Email: admin@inmova.app
Password: Admin2025!
```

---

## 🔧 COMANDOS ÚTILES

### Ver Deployment Actual

```bash
vercel ls
```

### Ver Logs

```bash
vercel logs
vercel logs --follow  # En tiempo real
```

### Variables de Entorno

```bash
vercel env ls                    # Ver variables
vercel env add DATABASE_URL      # Agregar variable
vercel env pull                  # Descargar a local
```

### Redeploy

```bash
vercel --prod                    # Nuevo deployment
vercel redeploy [url] --prod    # Redeploy específico
```

### Ver Info del Proyecto

```bash
vercel whoami                    # Usuario actual
vercel list                      # Tus proyectos
vercel inspect [url]             # Info del deployment
```

---

## 🗄️ COMANDOS DE BASE DE DATOS

### Conectar a BD de Producción

```bash
# 1. Copia DATABASE_URL de Vercel
export DATABASE_URL="postgresql://..."

# 2. Abrir Prisma Studio
npx prisma studio
```

### Aplicar Migraciones

```bash
npx prisma migrate deploy
```

### Crear Migration

```bash
npx prisma migrate dev --name nombre_migration
```

### Reiniciar BD (⚠️ CUIDADO - Borra datos)

```bash
npx prisma migrate reset
```

### Seed

```bash
npm run db:seed
```

---

## 🌐 CONFIGURAR DOMINIO PERSONALIZADO

### 1. En Vercel

```bash
# Dashboard → Settings → Domains
# Add: inmovaapp.com
```

### 2. En tu Proveedor DNS

**Registro A:**

```
Type: A
Name: @
Value: 76.76.21.21
```

**Registro CNAME:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Verificar DNS

```bash
dig inmovaapp.com
nslookup inmovaapp.com

# O en: https://dnschecker.org/
```

---

## 🔍 TROUBLESHOOTING

### Error en Build

```bash
# Local
rm -rf .next node_modules/.cache
yarn install
yarn build

# Si funciona local, redeploy
vercel --prod
```

### Error de BD

```bash
# Verificar conexión
export DATABASE_URL="postgresql://..."
npx prisma db pull

# Verificar schema
npx prisma validate

# Regenerar cliente
npx prisma generate
```

### Ver Logs de Error

```bash
vercel logs [deployment-url] --follow
```

### Limpiar Cache

```bash
# En Vercel Dashboard
# Settings → Advanced → Clear Build Cache
```

---

## 📊 MONITOREO

### Ver Analytics

```bash
# Dashboard → Analytics
```

### Ver Logs en Tiempo Real

```bash
vercel logs --follow
```

### Ver Uso de Recursos

```bash
# Dashboard → Usage
```

---

## 🎯 WORKFLOW TÍPICO

### Hacer Cambios y Desplegar

```bash
# 1. Hacer cambios en el código
git add .
git commit -m "Descripción de cambios"

# 2. Push a GitHub (si usas GitHub)
git push origin main

# Vercel desplegará automáticamente

# O manualmente:
vercel --prod
```

### Actualizar Base de Datos

```bash
# 1. Crear migración
npx prisma migrate dev --name nombre_cambio

# 2. Aplicar en producción
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy

# 3. Redeploy si es necesario
vercel --prod
```

---

## ⚡ TIPS PRO

### Pre-commit Hook

```bash
# Ya configurado con Husky
# Ejecuta linting antes de cada commit
```

### Build Time

```bash
# Para builds más rápidos:
# - Usa .vercelignore para excluir archivos innecesarios
# - Mantén node_modules/.cache en cache de Vercel
```

### Performance

```bash
# Lighthouse audit
npm run lighthouse:audit

# Analizar bundle
npm run analyze
```

---

## 🚨 COMANDOS DE EMERGENCIA

### Rollback a Deployment Anterior

```bash
# Dashboard → Deployments → [deployment anterior]
# Click botón "Promote to Production"
```

### Desactivar Temporalmente

```bash
# Dashboard → Settings → General
# Maintenance Mode (si disponible)
```

### Backup de BD

```bash
npm run db:backup
```

---

## ✅ CHECKLIST POST-DEPLOYMENT

```bash
# 1. App carga
curl https://inmovaapp.com

# 2. Health check
curl https://inmovaapp.com/api/health

# 3. Login funciona
# Manual: ir a https://inmovaapp.com/login

# 4. Sin errores en consola
# Manual: F12 en navegador

# 5. BD tiene datos
npx prisma studio

# 6. SSL activo
curl -I https://inmovaapp.com | grep -i "strict-transport"
```

---

**TIP:** Guarda esta página para referencia rápida

**Documentación Vercel:** https://vercel.com/docs
**Documentación Prisma:** https://www.prisma.io/docs
