# 🚀 GUÍA COMPLETA DE DEPLOYMENT A PRODUCCIÓN

**Dominio:** inmovaapp.com  
**Plataforma:** Vercel (recomendado)  
**Base de Datos:** PostgreSQL  
**Tiempo estimado:** 10-15 minutos

---

## 📋 REQUISITOS PREVIOS

Antes de empezar, necesitas tener:

- [ ] Cuenta en Vercel (gratis): https://vercel.com/signup
- [ ] Dominio inmovaapp.com configurado (o usar vercel.app temporalmente)
- [ ] Git instalado localmente
- [ ] Node.js 18+ instalado
- [ ] Acceso al código del proyecto

---

## 🎯 OPCIÓN 1: DEPLOYMENT RÁPIDO (COPY-PASTE)

### Paso 1: Instalar Vercel CLI

```bash
npm i -g vercel
```

### Paso 2: Login en Vercel

```bash
vercel login
```

### Paso 3: Link del proyecto

```bash
cd /workspace
vercel link
```

Sigue las instrucciones:

- Set up new project? → **Yes**
- Project name → **inmovaapp** (o el nombre que prefieras)
- Link to existing project? → **No**

### Paso 4: Crear Base de Datos

**Opción A: Vercel Postgres (Recomendado - Más Fácil)**

1. Ve a https://vercel.com/dashboard
2. Click en tu proyecto
3. Ve a "Storage" en el sidebar
4. Click "Create Database"
5. Selecciona "Postgres"
6. Nombre: `inmova-production-db`
7. Region: Selecciona la más cercana a tus usuarios
8. Click "Create"

✅ **La DATABASE_URL se configurará automáticamente**

**Opción B: Base de Datos Externa (Supabase, Neon, Railway)**

Si prefieres usar otro proveedor:

```bash
# Ejemplo con Supabase
# 1. Crea proyecto en https://supabase.com
# 2. Ve a Settings → Database
# 3. Copia la "Connection string" (URI)
# 4. Agrégala en Vercel (siguiente paso)
```

### Paso 5: Configurar Variables de Entorno

```bash
# En Vercel Dashboard:
# 1. Ve a tu proyecto → Settings → Environment Variables
# 2. Agrega estas variables para PRODUCTION:

# OBLIGATORIAS:
DATABASE_URL=postgresql://... # (ya está si usaste Vercel Postgres)
NEXTAUTH_URL=https://inmovaapp.com
NEXTAUTH_SECRET= # Genera con: openssl rand -base64 32

# RECOMENDADAS:
NODE_ENV=production
```

### Paso 6: Deploy a Producción

```bash
# Ejecutar script automatizado
./deploy-to-vercel.sh

# O manualmente:
vercel --prod
```

### Paso 7: Aplicar Migraciones de Base de Datos

```bash
# Después del deployment, ejecuta:
npx prisma migrate deploy

# O si prefieres:
npx prisma db push
```

### Paso 8: Crear Datos Iniciales

```bash
npm run db:seed
```

Esto creará:

- Usuario administrador (admin@inmova.app / Admin2025!)
- Datos de ejemplo
- Configuración inicial

### Paso 9: Configurar Dominio (Si tienes inmovaapp.com)

1. En Vercel Dashboard → Settings → Domains
2. Click "Add Domain"
3. Ingresa: `inmovaapp.com` y `www.inmovaapp.com`
4. Sigue las instrucciones para configurar DNS:

```
# Agregar estos registros en tu proveedor de DNS:
A Record:
  Host: @
  Value: 76.76.21.21

CNAME Record:
  Host: www
  Value: cname.vercel-dns.com
```

5. Espera propagación (5-60 minutos)

### Paso 10: Verificar Deployment

```bash
# Abrir en navegador:
https://inmovaapp.com

# Login:
Email: admin@inmova.app
Password: Admin2025!
```

---

## 🎯 OPCIÓN 2: DEPLOYMENT DETALLADO PASO A PASO

### Parte 1: Preparación Local

#### 1.1 Instalar Dependencias

```bash
cd /workspace
yarn install  # o npm install
```

#### 1.2 Generar Prisma Client

```bash
npx prisma generate
```

#### 1.3 Verificar Build Local

```bash
yarn build  # o npm run build
```

Si hay errores, corrígelos antes de continuar.

#### 1.4 Commit de Cambios

```bash
git add .
git commit -m "Preparar para deployment a producción"
```

---

### Parte 2: Setup en Vercel

#### 2.1 Crear Cuenta Vercel

1. Ve a https://vercel.com/signup
2. Registra con GitHub, GitLab o Email
3. Verifica tu email

#### 2.2 Crear Nuevo Proyecto

**Opción A: Desde GitHub (Recomendado)**

1. Push tu código a GitHub:

```bash
git remote add origin https://github.com/tu-usuario/inmova.git
git branch -M main
git push -u origin main
```

2. En Vercel:
   - Click "New Project"
   - Importa tu repositorio de GitHub
   - Configure:
     - Framework: Next.js
     - Build Command: `yarn build`
     - Output Directory: `.next`

**Opción B: Desde CLI**

```bash
vercel
```

Sigue el wizard interactivo.

---

### Parte 3: Configurar Base de Datos

#### 3.1 Opción Vercel Postgres

1. En tu proyecto de Vercel → Storage
2. Create Database → Postgres
3. Configuración:
   - Name: `inmova-production-db`
   - Region: `Frankfurt` (o la más cercana)
   - Plan: `Hobby` (gratis) o `Pro` (según necesites)

4. Click "Create"

✅ **Vercel agregará DATABASE_URL automáticamente a tus variables de entorno**

#### 3.2 Opción Supabase

1. Ve a https://supabase.com
2. Create new project
3. Configuración:
   - Name: `inmova-production`
   - Database Password: (genera uno seguro)
   - Region: Selecciona la más cercana

4. Espera ~2 minutos a que se cree

5. Ve a Settings → Database
6. Copia "Connection string" (URI mode)

7. En Vercel:
   - Settings → Environment Variables
   - Add: `DATABASE_URL` = `postgresql://...`

#### 3.3 Opción Railway

1. Ve a https://railway.app
2. New Project → Provision PostgreSQL
3. Click en la base de datos
4. Variables → Copy `DATABASE_URL`

5. Pegar en Vercel Environment Variables

---

### Parte 4: Variables de Entorno

#### 4.1 Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copia el resultado.

#### 4.2 Agregar en Vercel

1. Settings → Environment Variables
2. Para cada variable, selecciona entorno: **Production**

```
DATABASE_URL=postgresql://... # (ya está si usaste Vercel Postgres)
NEXTAUTH_URL=https://inmovaapp.com
NEXTAUTH_SECRET=tu-secret-generado-arriba
NODE_ENV=production
```

3. Click "Save"

---

### Parte 5: Desplegar

#### 5.1 Trigger Deployment

Si usaste GitHub:

- Vercel desplegará automáticamente en cada push a `main`
- O manualmente: Deployments → Redeploy

Si usaste CLI:

```bash
vercel --prod
```

#### 5.2 Monitorear Deployment

1. Ve a Deployments en Vercel
2. Click en el deployment en curso
3. Revisa los logs

Debería completar en 2-5 minutos.

---

### Parte 6: Migraciones y Seed

Una vez desplegado:

#### 6.1 Aplicar Schema

Opción A: Desde local (recomendado)

```bash
# Asegúrate de tener DATABASE_URL de producción
export DATABASE_URL="postgresql://..." # Copia de Vercel

# Aplicar migraciones
npx prisma migrate deploy
```

Opción B: Desde Vercel

1. Ve a tu proyecto en Vercel
2. Settings → General → Build & Development Settings
3. En "Build Command" cambiar a:
   ```
   prisma generate && prisma migrate deploy && next build
   ```
4. Redeploy

#### 6.2 Ejecutar Seed

```bash
# Desde local con DATABASE_URL de producción
export DATABASE_URL="postgresql://..."

npm run db:seed
```

Esto creará:

- ✅ Usuario admin (admin@inmova.app / Admin2025!)
- ✅ Empresa demo
- ✅ Configuración inicial

---

### Parte 7: Configurar Dominio Personalizado

#### 7.1 Agregar Dominio en Vercel

1. Settings → Domains
2. Click "Add"
3. Ingresa: `inmovaapp.com`
4. Click "Add"

Vercel te mostrará los registros DNS necesarios.

#### 7.2 Configurar DNS

En tu proveedor de dominio (GoDaddy, Namecheap, etc.):

**Para Apex Domain (inmovaapp.com):**

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Para WWW (www.inmovaapp.com):**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### 7.3 Esperar Propagación

- Tiempo: 5 minutos a 48 horas (normalmente ~30 minutos)
- Verificar: https://dnschecker.org/

#### 7.4 Configurar SSL

✅ Vercel configurará SSL automáticamente con Let's Encrypt
Espera ~5 minutos después de la propagación DNS.

---

### Parte 8: Verificación Post-Deployment

#### 8.1 Verificar la App

1. Abre: https://inmovaapp.com
2. La página de landing debería cargar
3. Click "Iniciar Sesión"
4. Credenciales:
   ```
   Email: admin@inmova.app
   Password: Admin2025!
   ```
5. Deberías entrar al dashboard

#### 8.2 Verificar Base de Datos

```bash
# Desde local
export DATABASE_URL="postgresql://..."

npx prisma studio
```

Deberías ver:

- Tablas creadas
- Usuario admin existente
- Datos de seed

#### 8.3 Verificar APIs

Abre Chrome DevTools (F12) → Network

Navega por la app. Las peticiones API deberían:

- ✅ Status 200 (success)
- ✅ Sin errores 500
- ✅ Sin errores de CORS

---

## ✅ CHECKLIST FINAL

- [ ] App carga en https://inmovaapp.com
- [ ] Login funciona correctamente
- [ ] Dashboard muestra datos
- [ ] Sin errores en consola del navegador
- [ ] Base de datos tiene datos
- [ ] Migraciones aplicadas
- [ ] SSL configurado (https://)
- [ ] Dominio personalizado funciona

---

## 🔧 TROUBLESHOOTING

### Problema: "App no carga"

**Solución:**

```bash
# Verificar logs en Vercel
vercel logs [deployment-url]

# O en Dashboard → Deployments → [tu deployment] → Logs
```

### Problema: "Error de Base de Datos"

**Solución:**

```bash
# Verificar DATABASE_URL está configurada
vercel env ls

# Verificar conexión
export DATABASE_URL="postgresql://..."
npx prisma db pull  # Debe conectar sin errores
```

### Problema: "Error 500 en APIs"

**Solución:**

1. Vercel Dashboard → Logs
2. Busca el error específico
3. Normalmente es por:
   - DATABASE_URL incorrecta
   - Migraciones no aplicadas
   - NEXTAUTH_SECRET faltante

### Problema: "Dominio no resuelve"

**Solución:**

```bash
# Verificar DNS
dig inmovaapp.com
nslookup inmovaapp.com

# Verificar en: https://dnschecker.org/
```

Espera más tiempo para propagación DNS.

---

## 📊 MONITOREO POST-DEPLOYMENT

### Vercel Analytics

1. Settings → Analytics
2. Enable Analytics
3. Ver métricas de rendimiento

### Error Tracking con Sentry (Opcional)

```bash
# Ya está configurado en el código
# Solo necesitas agregar:
NEXT_PUBLIC_SENTRY_DSN="tu-dsn-de-sentry"
SENTRY_AUTH_TOKEN="tu-token"
```

### Logs

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver logs de un deployment específico
vercel logs [deployment-url]
```

---

## 🎉 ¡DEPLOYMENT COMPLETADO!

Tu aplicación ahora está disponible en:

- **Producción:** https://inmovaapp.com
- **Admin:** https://inmovaapp.com/login

**Credenciales de Administrador:**

- Email: `admin@inmova.app`
- Password: `Admin2025!`

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa los logs de Vercel
2. Verifica variables de entorno
3. Consulta la documentación de Vercel: https://vercel.com/docs

---

**Última actualización:** 28 de Diciembre, 2025  
**Plataforma:** Vercel + PostgreSQL  
**Tiempo total:** ~10-15 minutos
