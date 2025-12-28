# 🚀 DEPLOYMENT EN VERCEL - INSTRUCCIONES PASO A PASO

**¡Todo está listo para deployar en Vercel!**

---

## ✅ LO QUE YA ESTÁ HECHO:

- ✅ Todos los fixes de código aplicados
- ✅ Variables de entorno documentadas en `.env.production`
- ✅ Configuración de Vercel lista en `vercel.json`
- ✅ Cambios pusheados a GitHub (commit: `e379c986`)
- ✅ Guía completa en `DEPLOYMENT_VERCEL_INMOVAAPP.md`

---

## 🚀 DEPLOYMENT EN 3 PASOS (5 minutos)

### ⚡ PASO 1: Importar Proyecto en Vercel (2 min)

1. **Ve a**: https://vercel.com/new

2. **Login/Sign up**:
   - Si no tienes cuenta: Sign up with GitHub (recomendado)
   - Si ya tienes cuenta: Login

3. **Import Git Repository**:
   - Click en "Import Project"
   - Buscar: `dvillagrablanco/inmova-app`
   - Click en "Import"

4. **Configure Project**:
   - **Project Name**: `inmovaapp` (o el que prefieras)
   - **Framework Preset**: Next.js (auto-detectado)
   - **Root Directory**: `./` (dejar por defecto)
   - **Build Command**: `npx prisma generate && npm run build` (ya configurado en vercel.json)
   - **Output Directory**: `.next` (auto-detectado)

---

### 🔐 PASO 2: Agregar Variables de Entorno (2 min)

En la misma página de configuración, **antes de hacer deploy**, agregar estas variables:

#### Variables CRÍTICAS (OBLIGATORIAS):

```bash
# ✅ 1. NEXTAUTH_URL (EXACTAMENTE tu dominio)
NEXTAUTH_URL=https://www.inmovaapp.com

# ✅ 2. NEXTAUTH_SECRET (usar este valor)
NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=

# ✅ 3. DATABASE_URL (IMPORTANTE: obtener de tu proveedor PostgreSQL)
DATABASE_URL=postgresql://usuario:password@host:5432/database

# ✅ 4. ENCRYPTION_KEY
ENCRYPTION_KEY=e2dd0f8a254cc6aee7b93f45329363b9

# ✅ 5. NODE_ENV
NODE_ENV=production
```

#### ⚠️ ¿Dónde obtener DATABASE_URL?

**OPCIÓN A: Si ya tienes PostgreSQL en Railway**:

1. Ve a: https://railway.app/dashboard
2. Tu Proyecto → PostgreSQL service
3. Tab "Connect" → Copiar "DATABASE_URL"
4. Pegar en Vercel

**OPCIÓN B: Crear nueva DB en Neon (GRATIS, 30 segundos)**:

1. Ve a: https://console.neon.tech/signup
2. Sign up with GitHub
3. Click "Create Project"
4. Copiar "Connection string"
5. Pegar en Vercel

**OPCIÓN C: Crear nueva DB en Supabase (GRATIS)**:

1. Ve a: https://supabase.com/dashboard
2. Sign up with GitHub
3. "New Project"
4. Settings → Database → Connection String → "Transaction" mode
5. Copiar y pegar en Vercel

---

### 🎯 PASO 3: Deploy! (1 min)

1. **Click en "Deploy"**
2. **Esperar ~3-5 minutos** (Vercel build + deploy)
3. **✅ LISTO!** Tu sitio estará live

Vercel te dará una URL tipo: `https://inmovaapp.vercel.app`

---

## 🌐 CONFIGURAR DOMINIO PERSONALIZADO (www.inmovaapp.com)

### Después del primer deployment:

1. **En Vercel Dashboard**:
   - Tu proyecto → Settings → Domains
   - Click "Add Domain"
   - Ingresar: `www.inmovaapp.com`
   - Click "Add"

2. **Vercel te dará registros DNS**:

   ```
   Tipo: CNAME
   Nombre: www
   Valor: cname.vercel-dns.com
   ```

3. **Ir a tu proveedor de dominio** (GoDaddy, Namecheap, etc.):
   - Panel de DNS
   - Agregar/Editar registro CNAME
   - Nombre: `www`
   - Valor: `cname.vercel-dns.com`
   - TTL: 3600 (o automático)
   - Guardar

4. **Esperar propagación DNS** (5-60 minutos):

   ```bash
   # Verificar:
   nslookup www.inmovaapp.com
   ```

5. **✅ Una vez propagado**: www.inmovaapp.com apuntará a Vercel automáticamente

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

### 1️⃣ Verificar que el sitio carga:

```bash
curl -I https://inmovaapp.vercel.app
# O si ya configuraste dominio:
curl -I https://www.inmovaapp.com

# Debe responder: HTTP/2 200
```

### 2️⃣ Verificar NextAuth funciona:

```bash
curl -s https://inmovaapp.vercel.app/api/auth/session

# Debe responder (sin errores):
{"user":null}
```

### 3️⃣ Verificar Health Check:

```bash
curl -s https://inmovaapp.vercel.app/api/health-check | jq .

# Debe mostrar:
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy"
    }
  }
}
```

### 4️⃣ Verificar en navegador:

1. Abre: https://inmovaapp.vercel.app (o tu dominio)
2. **F12 → Console**
3. ✅ **NO debe haber errores NextAuth**
4. ✅ **NO debe haber errores 500**

### 5️⃣ Probar Login:

1. Click en "Login" o ve a `/login`
2. Ingresa credenciales
3. ✅ Debe redirigir a dashboard sin errores

---

## 🚨 TROUBLESHOOTING

### ❌ Error: "Build Failed"

**Causa**: Falta Prisma generate

**Solución**:

1. Vercel Dashboard → Project Settings → General → Build & Development Settings
2. **Build Command**: `npx prisma generate && npm run build`
3. Redeploy

### ❌ Error: "DATABASE_URL is not defined"

**Causa**: Variable no configurada

**Solución**:

1. Vercel Dashboard → Settings → Environment Variables
2. Agregar `DATABASE_URL` con tu connection string
3. **IMPORTANTE**: Seleccionar "Production" environment
4. Redeploy

### ❌ Error: "NEXTAUTH_URL mismatch"

**Causa**: URL no coincide con dominio

**Solución**:

1. Si usas Vercel URL: `https://inmovaapp.vercel.app`
2. Si usas dominio custom: `https://www.inmovaapp.com`
3. Debe coincidir EXACTAMENTE con donde accedes
4. Redeploy después de cambiar

### ❌ Error: "Prisma Client initialization failed"

**Causa**: Database no accesible desde Vercel

**Solución**:

1. Verificar que DATABASE_URL es accesible públicamente
2. Si usas Railway: Verificar que no hay whitelist de IPs
3. Si usas Neon/Supabase: Verificar que "Connection Pooling" está habilitado

---

## 📊 VENTAJAS DE VERCEL

✅ **Deployment automático**: Cada push a `main` se deploya automáticamente  
✅ **CDN Global**: Tu sitio carga rápido en todo el mundo  
✅ **Edge Functions**: SSR ultra-rápido  
✅ **Zero Config**: Next.js funciona out-of-the-box  
✅ **Preview Deployments**: Cada PR tiene su URL de preview  
✅ **SSL Automático**: HTTPS gratis incluido  
✅ **Logs en tiempo real**: Ver errores al instante

---

## 💰 COSTOS

### Plan Hobby (GRATIS):

- ✅ Ilimitados proyectos
- ✅ 100GB bandwidth/mes
- ✅ SSL incluido
- ✅ Deploy automático
- ❌ No analytics avanzados

### Plan Pro ($20/mes):

- ✅ Todo del Hobby
- ✅ Analytics avanzados
- ✅ Team collaboration
- ✅ Soporte prioritario
- ✅ 1TB bandwidth

**Recomendación**: Empezar con Hobby (gratis) y upgradar si necesitas

---

## 🎯 COMANDOS ÚTILES (Para después)

```bash
# Ver deployments
vercel ls

# Ver logs en tiempo real
vercel logs inmovaapp --follow

# Deploy desde CLI (si quieres deployar manualmente)
vercel --prod

# Ver variables de entorno
vercel env ls

# Agregar variable desde CLI
vercel env add DATABASE_URL production
```

---

## ✅ CHECKLIST FINAL

### Pre-Deployment:

- [x] ✅ Código con todos los fixes
- [x] ✅ Pusheado a GitHub
- [x] ✅ Variables de entorno documentadas
- [x] ✅ vercel.json configurado

### Durante Deployment:

- [ ] ⏳ Cuenta Vercel creada
- [ ] ⏳ Proyecto importado desde GitHub
- [ ] ⏳ 5 variables de entorno configuradas
- [ ] ⏳ Deploy iniciado
- [ ] ⏳ Build completado exitosamente

### Post-Deployment:

- [ ] ⏳ Sitio accesible (HTTP 200)
- [ ] ⏳ NextAuth sin errores (500)
- [ ] ⏳ Health check OK
- [ ] ⏳ Login funciona
- [ ] ⏳ Dashboard accesible
- [ ] ⏳ Todas las páginas cargan sin errores

### Dominio (Opcional):

- [ ] ⏳ Dominio agregado en Vercel
- [ ] ⏳ CNAME configurado en proveedor DNS
- [ ] ⏳ DNS propagado
- [ ] ⏳ www.inmovaapp.com apunta a Vercel

---

## 🎬 SIGUIENTE PASO INMEDIATO

### 🔴 AHORA MISMO (5 minutos):

1. **Abre**: https://vercel.com/new
2. **Login** con GitHub
3. **Import**: `dvillagrablanco/inmova-app`
4. **Agregar** las 5 variables de entorno (copiar de arriba)
5. **Click** en "Deploy"
6. **Esperar** 3-5 minutos
7. **✅ LISTO!**

---

## 📞 RECURSOS

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Next.js on Vercel**: https://vercel.com/docs/frameworks/nextjs
- **Prisma on Vercel**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

---

## 🎉 RESULTADO ESPERADO

Después de completar estos pasos:

✅ **www.inmovaapp.com** funcionará perfectamente  
✅ **Sin errores NextAuth**  
✅ **Login funcional**  
✅ **Dashboard accesible**  
✅ **Todas las páginas cargando**  
✅ **Health check OK**

**Tiempo total**: ~5 minutos  
**Dificultad**: Muy fácil  
**Resultado**: 🚀 Sitio live en producción

---

**¡Todo está listo! Solo necesitas conectar el repo en Vercel y agregar las variables.** 🚀
