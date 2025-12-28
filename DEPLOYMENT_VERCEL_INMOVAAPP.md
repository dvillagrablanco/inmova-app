# 🚀 Deployment a Vercel - www.inmovaapp.com

**Fecha**: 28 Dic 2025  
**Estado**: ✅ Listo para deployment

---

## ✅ PREPARACIÓN COMPLETA

### Fixes Aplicados:

- ✅ Graceful error handling para NextAuth/Prisma
- ✅ Health check endpoint (`/api/health-check`)
- ✅ Rate limiting corregido
- ✅ Middleware re-habilitado
- ✅ Todos los imports de authOptions corregidos
- ✅ Variables de entorno documentadas

---

## 🚀 OPCIÓN 1: Deployment Automático desde GitHub (RECOMENDADO)

### Paso 1: Conectar Repositorio a Vercel

1. Ve a: **https://vercel.com/new**
2. Click en **"Import Git Repository"**
3. Busca: `dvillagrablanco/inmova-app`
4. Click en **"Import"**

### Paso 2: Configurar Variables de Entorno

En la página de configuración de Vercel, agregar estas variables:

#### Variables CRÍTICAS (Obligatorias):

```bash
# ✅ NEXTAUTH_URL (DEBE ser exactamente tu dominio)
NEXTAUTH_URL=https://www.inmovaapp.com

# ✅ NEXTAUTH_SECRET
NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=

# ✅ DATABASE_URL (obtener de tu proveedor de PostgreSQL)
DATABASE_URL=postgresql://usuario:password@host:5432/database

# ✅ ENCRYPTION_KEY
ENCRYPTION_KEY=e2dd0f8a254cc6aee7b93f45329363b9

# ✅ NODE_ENV
NODE_ENV=production
```

#### ¿Dónde obtener DATABASE_URL?

**Si usas Railway PostgreSQL**:

1. Railway Dashboard → PostgreSQL service
2. Tab "Connect" → Copiar "DATABASE_URL"

**Si usas otro proveedor**:

- Neon: https://neon.tech
- Supabase: https://supabase.com
- PlanetScale: https://planetscale.com

### Paso 3: Configurar Dominio

1. En Vercel Dashboard → Settings → Domains
2. Agregar: `www.inmovaapp.com`
3. Configurar DNS según instrucciones de Vercel

### Paso 4: Deploy!

1. Click en **"Deploy"**
2. Esperar ~5 minutos
3. ✅ Sitio live en www.inmovaapp.com

---

## 🚀 OPCIÓN 2: Deployment Manual con Vercel CLI

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
# o
yarn global add vercel
```

### Paso 2: Login

```bash
vercel login
# Seguir instrucciones en navegador
```

### Paso 3: Configurar Proyecto

```bash
cd /workspace

# Configurar variables de entorno
vercel env add NEXTAUTH_URL production
# Ingresar: https://www.inmovaapp.com

vercel env add NEXTAUTH_SECRET production
# Ingresar: l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=

vercel env add DATABASE_URL production
# Ingresar: tu DATABASE_URL de PostgreSQL

vercel env add ENCRYPTION_KEY production
# Ingresar: e2dd0f8a254cc6aee7b93f45329363b9

vercel env add NODE_ENV production
# Ingresar: production
```

### Paso 4: Deploy!

```bash
# Deploy a producción
vercel --prod

# Vercel preguntará:
# - Set up and deploy? [Y/n] → Y
# - Which scope? → Seleccionar tu cuenta
# - Link to existing project? [y/N] → N (si es primera vez)
# - What's your project's name? → inmovaapp
# - In which directory is your code located? → ./
# - Want to override settings? [y/N] → N
```

---

## 📋 CONFIGURACIÓN DE DNS (Si usas dominio personalizado)

### Si tu dominio está en otro proveedor (GoDaddy, Namecheap, etc.):

1. **Vercel te dará estos registros DNS**:

```
Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
```

2. **Ir al panel de tu proveedor de dominios**:
   - Agregar el registro CNAME
   - Esperar propagación (5-60 minutos)

3. **Verificar**:

```bash
nslookup www.inmovaapp.com
# Debe apuntar a Vercel
```

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### 1. Verificar que el sitio carga:

```bash
curl -I https://www.inmovaapp.com
# Debe responder: HTTP/2 200
```

### 2. Verificar NextAuth funciona:

```bash
curl -s https://www.inmovaapp.com/api/auth/session
# Debe responder: {"user":null}
```

### 3. Verificar Health Check:

```bash
curl -s https://www.inmovaapp.com/api/health-check | jq .
# Debe mostrar status: "healthy"
```

### 4. Verificar en navegador:

1. Abre: https://www.inmovaapp.com
2. F12 → Console
3. ✅ NO debe haber errores NextAuth

---

## 🔧 CONFIGURACIÓN AVANZADA DE VERCEL

### Build & Development Settings:

```json
{
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### Vercel.json (Ya configurado):

```json
{
  "buildCommand": "npx prisma generate && npm run build",
  "framework": "nextjs"
}
```

---

## 📊 COMPARACIÓN: Vercel vs Railway

| Característica       | Vercel        | Railway       |
| -------------------- | ------------- | ------------- |
| **Velocidad Deploy** | ⚡ ~3 min     | 🐌 ~7 min     |
| **CDN Global**       | ✅ Incluido   | ❌ No         |
| **Edge Functions**   | ✅ Sí         | ❌ No         |
| **Precio**           | 💰 $20/mes    | 💰 $5-20/mes  |
| **Database**         | ❌ Separado   | ✅ Incluido   |
| **Dominio Custom**   | ✅ Fácil      | ✅ Fácil      |
| **Git Integration**  | ✅ Automático | ✅ Automático |

**Recomendación**: Vercel para frontend + Railway/Neon para PostgreSQL

---

## 🗄️ OPCIONES PARA DATABASE

### Opción 1: Neon (GRATIS - RECOMENDADO)

```bash
# 1. Crear cuenta en https://neon.tech
# 2. Crear proyecto
# 3. Copiar DATABASE_URL
# 4. Agregar en Vercel → Environment Variables
```

**Ventajas**:

- ✅ 10GB gratis
- ✅ Serverless PostgreSQL
- ✅ Backup automático
- ✅ Muy rápido

### Opción 2: Supabase (GRATIS)

```bash
# 1. Crear cuenta en https://supabase.com
# 2. Crear proyecto
# 3. Settings → Database → Connection String
# 4. Copiar "Connection Pooling" URL
# 5. Agregar en Vercel
```

### Opción 3: Railway PostgreSQL

```bash
# Si ya tienes Railway configurado:
# 1. Railway Dashboard → PostgreSQL
# 2. Tab "Connect" → Copiar DATABASE_URL
# 3. Agregar en Vercel
```

---

## 🚨 TROUBLESHOOTING

### Error: "Build failed"

**Causa**: Falta alguna variable de entorno

**Solución**:

1. Vercel Dashboard → Settings → Environment Variables
2. Verificar que TODAS las variables críticas existen
3. Redeploy

### Error: "Database connection failed"

**Causa**: DATABASE_URL incorrecta o DB no accesible

**Solución**:

```bash
# Testear conexión:
psql "postgresql://usuario:password@host:5432/database"

# Si falla, verificar:
# - Usuario/password correctos
# - Host accesible
# - Database existe
# - Whitelist IPs si es necesario
```

### Error: "NEXTAUTH_URL mismatch"

**Causa**: NEXTAUTH_URL no coincide con dominio actual

**Solución**:

1. Vercel Dashboard → Settings → Environment Variables
2. Editar NEXTAUTH_URL
3. Valor EXACTO: `https://www.inmovaapp.com`
4. Redeploy

---

## 📱 DEPLOYMENT DESDE CLI (Comando Completo)

```bash
# Desde /workspace
cd /workspace

# Login (solo primera vez)
vercel login

# Deploy a producción
vercel --prod

# Ver logs en tiempo real
vercel logs www.inmovaapp.com --follow

# Ver deployments
vercel ls
```

---

## ✅ CHECKLIST FINAL

### Pre-Deployment:

- [x] ✅ Código corregido y pusheado
- [x] ✅ Variables de entorno documentadas
- [x] ✅ vercel.json configurado
- [x] ✅ DATABASE_URL disponible

### Durante Deployment:

- [ ] ⏳ Cuenta Vercel creada
- [ ] ⏳ Repositorio conectado
- [ ] ⏳ Variables configuradas
- [ ] ⏳ Dominio configurado
- [ ] ⏳ Deploy iniciado

### Post-Deployment:

- [ ] ⏳ Sitio carga (HTTP 200)
- [ ] ⏳ NextAuth funciona (sin errores)
- [ ] ⏳ Health check OK
- [ ] ⏳ Login funciona
- [ ] ⏳ Dashboard accesible
- [ ] ⏳ DNS propagado

---

## 🎯 SIGUIENTE PASO INMEDIATO

### Método Más Rápido (5 minutos):

1. **Ve a**: https://vercel.com/new
2. **Import**: `dvillagrablanco/inmova-app`
3. **Agregar Variables**:
   - NEXTAUTH_URL=https://www.inmovaapp.com
   - NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=
   - DATABASE_URL=(tu PostgreSQL URL)
   - ENCRYPTION_KEY=e2dd0f8a254cc6aee7b93f45329363b9
   - NODE_ENV=production
4. **Click Deploy**
5. **Esperar 3 minutos**
6. ✅ **LISTO!**

---

## 📞 SOPORTE

- **Vercel Docs**: https://vercel.com/docs
- **Deployment Guide**: https://vercel.com/docs/deployments/overview
- **Environment Variables**: https://vercel.com/docs/environment-variables

---

**Todo está listo para deployment en Vercel** 🚀

El código tiene todas las correcciones aplicadas. Solo necesitas:

1. Conectar repo a Vercel
2. Configurar 5 variables de entorno
3. Deploy!

**Tiempo total**: ~5 minutos
