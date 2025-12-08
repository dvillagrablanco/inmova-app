# 📦 Resumen de Configuración de Deployment

## ✅ Archivos Creados

### 📁 Configuración de Vercel
- `.github/workflows/deploy-vercel.yml` - Workflow de GitHub Actions para CI/CD
- `nextjs_space/vercel.json` - Configuración de Vercel
- `nextjs_space/.env.example` - Plantilla de variables de entorno

### 📜 Scripts de Deployment
- `scripts/deploy.sh` - Script para deployment manual
- `scripts/setup-vercel.sh` - Script de configuración inicial
- `scripts/README.md` - Documentación de scripts

### 📖 Documentación
- `DEPLOYMENT_GUIDE.md` - Guía completa de deployment (+ PDF)
- `QUICK_START.md` - Guía de inicio rápido (+ PDF)
- `DEPLOYMENT_SUMMARY.md` - Este archivo

### 🔐 Seguridad
- `.gitignore` - Actualizado para proteger credenciales

---

## 🎯 Próximos Pasos

### 1️⃣ Obtener Token de Vercel (2 min)

**URL**: https://vercel.com/account/tokens

**Pasos:**
1. Inicia sesión en Vercel
2. Ve a Settings → Tokens
3. Clic en "Create Token"
4. Nombre: `inmova-deployment-token`
5. Alcance: Full Account
6. Expiración: 1 año
7. Copia el token (solo se muestra una vez)

---

### 2️⃣ Configurar Proyecto (3 min)

```bash
# Ejecutar desde la raíz del proyecto
./scripts/setup-vercel.sh
```

**Este script:**
- ✅ Instala/verifica Vercel CLI
- ✅ Te autentica en Vercel
- ✅ Vincula el proyecto
- ✅ Guarda tu token en .env
- ✅ Extrae Project ID y Org ID

**Lo que necesitarás:**
- Tu token de Vercel (del paso 1)
- Acceso a tu cuenta de Vercel

---

### 3️⃣ Configurar Variables de Entorno (5 min)

**En Vercel Dashboard:**

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto (o créalo)
3. Settings → Environment Variables
4. Agrega cada variable de tu `.env`:

**Variables críticas:**
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://inmova.app
AWS_PROFILE=hosted_storage
AWS_REGION=us-west-2
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
CRON_SECRET=...
ENCRYPTION_KEY=...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

**Para cada variable:**
- Selecciona: Production ✅ Preview ✅ Development ⬜
- Clic en "Save"

---

### 4️⃣ Primer Deployment Manual (2 min)

```bash
# Preview (temporal)
./scripts/deploy.sh

# O Production (inmova.app)
./scripts/deploy.sh prod
```

**Verificar:**
1. Abre la URL proporcionada
2. Verifica que la app cargue
3. Prueba login/autenticación
4. Verifica conexión a DB

---

### 5️⃣ Configurar CI/CD con GitHub (5 min)

**En GitHub:**

1. Ve a tu repositorio
2. Settings → Secrets and variables → Actions
3. Clic en "New repository secret"
4. Agrega estos secrets:

```
Nombre: VERCEL_TOKEN
Valor: <tu_token_de_vercel>

Nombre: VERCEL_ORG_ID
Valor: <del archivo nextjs_space/.env>

Nombre: VERCEL_PROJECT_ID
Valor: <del archivo nextjs_space/.env>

Nombre: DATABASE_URL
Valor: <tu_database_url>

Nombre: NEXTAUTH_SECRET
Valor: <tu_nextauth_secret>

Nombre: NEXTAUTH_URL
Valor: https://inmova.app
```

**Flujo automático activado:**
- Push a `main` → Deploy a producción
- Pull Request → Deploy preview + comentario en PR
- Manual → Actions → "Run workflow"

---

## 📋 Checklist Completo

### ✅ Configuración Inicial

- [ ] Token de Vercel obtenido
- [ ] Ejecutado `./scripts/setup-vercel.sh`
- [ ] Proyecto vinculado con Vercel
- [ ] VERCEL_TOKEN en `.env`
- [ ] VERCEL_ORG_ID en `.env`
- [ ] VERCEL_PROJECT_ID en `.env`

### ✅ Variables de Entorno

**En Vercel Dashboard:**
- [ ] DATABASE_URL
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL
- [ ] AWS_PROFILE
- [ ] AWS_REGION
- [ ] AWS_BUCKET_NAME
- [ ] AWS_FOLDER_PREFIX
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] CRON_SECRET
- [ ] ENCRYPTION_KEY
- [ ] VAPID_PRIVATE_KEY
- [ ] NEXT_PUBLIC_VAPID_PUBLIC_KEY
- [ ] Todas las variables de Redsys/Bankinter
- [ ] Todas las variables de DocuSign
- [ ] Todas las variables de ContaSimple

### ✅ GitHub Secrets (para CI/CD)

- [ ] VERCEL_TOKEN
- [ ] VERCEL_ORG_ID
- [ ] VERCEL_PROJECT_ID
- [ ] DATABASE_URL
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL

### ✅ Primer Deployment

- [ ] Build local exitoso
- [ ] Deployment preview exitoso
- [ ] App carga correctamente
- [ ] Login funciona
- [ ] Conexión a DB verificada
- [ ] Deployment a producción exitoso

---

## 🚀 Comandos Rápidos

### Deployment Manual

```bash
# Preview
./scripts/deploy.sh

# Production
./scripts/deploy.sh prod
```

### Vercel CLI

```bash
# Logs en tiempo real
vercel logs --follow

# Listar deployments
vercel ls

# Rollback
vercel rollback [deployment-url]

# Info del proyecto
vercel inspect

# Ver variables de entorno
vercel env ls
```

### Desarrollo Local

```bash
cd nextjs_space

# Instalar
yarn install

# Prisma
yarn prisma generate
yarn prisma migrate deploy

# Dev
yarn dev

# Build
yarn build

# Start
yarn start
```

---

## 🔍 Verificación de Deployment

### Checklist Post-Deployment:

**Funcionalidad básica:**
- [ ] Página principal carga
- [ ] Navegación funciona
- [ ] Imágenes/assets cargan

**Autenticación:**
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Logout funciona
- [ ] Sesión persiste

**Base de datos:**
- [ ] Datos se muestran
- [ ] CRUD funciona
- [ ] Migraciones aplicadas

**Integraciones:**
- [ ] Stripe funciona
- [ ] AWS S3 uploads funcionan
- [ ] Push notifications funcionan
- [ ] APIs externas responden

**Performance:**
- [ ] Tiempo de carga < 3s
- [ ] No hay errores en consola
- [ ] No hay memory leaks
- [ ] Lighthouse score > 80

---

## 🆘 Troubleshooting Rápido

### Error: "Invalid token"
```bash
# Regenera token en Vercel
# Actualiza en .env y GitHub Secrets
```

### Error: "Build failed"
```bash
cd nextjs_space
rm -rf node_modules .next
yarn install
yarn prisma generate
yarn build
```

### Error: "DATABASE_URL not defined"
```bash
# Verifica en Vercel Dashboard
# Settings → Environment Variables
# Agrega DATABASE_URL para Production y Preview
```

### Error: "Module not found"
```bash
cd nextjs_space
yarn install
yarn prisma generate
```

### Deployment lento
```bash
# Aumenta timeout en vercel.json
# "maxDuration": 60
```

---

## 📊 Monitoreo

### Vercel Dashboard
- **URL**: https://vercel.com/dashboard
- **Analytics**: Métricas de tráfico
- **Logs**: Errores en tiempo real
- **Deployments**: Historial completo

### GitHub Actions
- **URL**: https://github.com/[tu-repo]/actions
- **Workflows**: Estado de deployments
- **Logs**: Logs detallados de CI/CD

---

## 📚 Documentación

### Guías creadas:
1. **QUICK_START.md** - Inicio rápido (léelo primero)
2. **DEPLOYMENT_GUIDE.md** - Guía completa y detallada
3. **scripts/README.md** - Documentación de scripts
4. **DEPLOYMENT_SUMMARY.md** - Este resumen

### Recursos externos:
- [Vercel Docs](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ⚡ TL;DR (Versión Ultra Rápida)

```bash
# 1. Obtener token: https://vercel.com/account/tokens
# 2. Setup
./scripts/setup-vercel.sh

# 3. Agregar variables en Vercel Dashboard
#    https://vercel.com/dashboard → Settings → Environment Variables

# 4. Deploy
./scripts/deploy.sh prod

# 5. Para CI/CD: Agregar secrets en GitHub
#    Settings → Secrets → VERCEL_TOKEN, etc.
```

---

## 🎉 ¡Felicidades!

Tu proyecto INMOVA ahora está configurado para deployments automáticos a Vercel.

**Próximos pasos:**
1. Lee [QUICK_START.md](QUICK_START.md) para comenzar
2. Haz tu primer deployment
3. Configura CI/CD en GitHub
4. Monitorea en Vercel Dashboard

**¿Problemas?** Consulta [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0.0  
**Mantenido por:** Equipo INMOVA
