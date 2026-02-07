# 🚂 DEPLOYMENT EN RAILWAY - INSTRUCCIONES COMPLETAS

## ✅ ARCHIVOS PREPARADOS

- `railway.json` - Configuración de build
- `railway.toml` - Configuración de deployment
- `.env.railway` - Variables de entorno generadas
- Código completo con 545 APIs

## 🚀 PASOS PARA DEPLOYMENT

### 1. Acceder a Railway Dashboard

Ir a: https://railway.app/

### 2. Crear/Acceder al Proyecto

Si ya tienes el proyecto "loving-creation":
- Click en el proyecto existente
- Verificar que PostgreSQL esté activo

Si necesitas crear uno nuevo:
- Click "New Project"
- Select "Deploy from GitHub repo"
- Conectar este repositorio: dvillagrablanco/inmova-app

### 3. Configurar Variables de Entorno

En el dashboard de Railway, ir a tu servicio → Variables:

```bash
# Copiar desde .env.railway:
NODE_ENV=production
NEXTAUTH_URL=https://www.inmova.app
NEXTAUTH_SECRET=<ver .env.railway>
ENCRYPTION_KEY=<ver .env.railway>

# Railway auto-configura:
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 4. Conectar PostgreSQL

Si no está conectado:
- En el dashboard, click "New" → "Database" → "Add PostgreSQL"
- Railway auto-genera DATABASE_URL
- La variable estará disponible como ${{Postgres.DATABASE_URL}}

### 5. Deploy

**Opción A: Via GitHub (Recomendado)**

1. Conectar repositorio GitHub
2. Railway auto-detecta cambios
3. Auto-deploy en cada push a main

**Opción B: Via Railway CLI (Si tienes token)**

```bash
# Login
railway login

# Link proyecto
railway link <project-id>

# Deploy
railway up
```

**Opción C: Via API**

Railway tiene una API REST para deployments programáticos.

### 6. Configurar Dominio

En Railway Dashboard:
1. Ir a tu servicio
2. Click "Settings" → "Domains"
3. Click "Generate Domain" (Railway te dará uno gratis: *.up.railway.app)
4. Para dominio custom:
   - Click "Custom Domain"
   - Agregar: www.inmova.app
   - Copiar el CNAME/A record que te da Railway
   - Configurar en tu DNS:
     ```
     CNAME: www → <tu-proyecto>.up.railway.app
     ```

### 7. Ejecutar Migraciones

Una vez deployado:

**Via Railway CLI:**
```bash
railway run npx prisma migrate deploy
```

**Via Dashboard:**
- Settings → Variables → Add Command
- Comando: `npx prisma migrate deploy`

**Alternativa (si no tienes migraciones):**
```bash
railway run npx prisma db push
```

## 🔍 VERIFICACIÓN

Después del deployment:

```bash
# Health check
curl https://www.inmova.app/api/health

# Test API específica
curl https://www.inmova.app/api/version

# Logs
railway logs
```

## 📊 ARQUITECTURA FINAL

```
┌─────────────────────────────────────┐
│      www.inmova.app                 │
│      (Railway)                      │
│  ┌────────────────────────────┐     │
│  │  Next.js Full Stack        │     │
│  │  - Frontend (240 páginas)  │     │
│  │  - Backend (545 APIs)      │     │
│  │  - NextAuth                │     │
│  └────────────────────────────┘     │
│              ▼                       │
│  ┌────────────────────────────┐     │
│  │  Prisma ORM                │     │
│  └────────────────────────────┘     │
│              ▼                       │
│  ┌────────────────────────────┐     │
│  │  PostgreSQL Database       │     │
│  │  (Railway managed)         │     │
│  └────────────────────────────┘     │
└─────────────────────────────────────┘
```

## 🎯 VENTAJAS DE RAILWAY

✅ Build nativo de Prisma
✅ PostgreSQL incluido
✅ Variables de entorno automáticas  
✅ Auto-deploy desde GitHub
✅ Logs en tiempo real
✅ Rollback fácil
✅ $5/mes plan gratuito

## 🆘 TROUBLESHOOTING

### Build Falla

```bash
# Ver logs completos
railway logs --build

# Verificar Prisma
railway run npx prisma generate
```

### Database Connection Error

```bash
# Verificar DATABASE_URL
railway variables

# Test conexión
railway run npx prisma db pull
```

### API 500 Errors

```bash
# Ver logs runtime
railway logs

# Verificar variables
railway variables
```

## 📝 PRÓXIMOS PASOS

Una vez deployado en Railway:

1. ✅ Frontend y Backend en producción
2. ✅ Base de datos funcionando
3. ✅ Dominio www.inmova.app activo
4. ⚙️  Configurar backups automáticos
5. ⚙️  Configurar alertas de monitoreo
6. ⚙️  Setup CI/CD desde GitHub

## 🔗 RECURSOS

- Railway Docs: https://docs.railway.app/
- Prisma + Railway: https://docs.railway.app/guides/prisma
- Next.js + Railway: https://docs.railway.app/guides/nextjs

