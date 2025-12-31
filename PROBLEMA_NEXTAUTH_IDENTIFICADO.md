# 🚨 Problema Crítico Identificado - NextAuth Failing

**Fecha**: 28 Dic 2025
**Sitio**: www.inmovaapp.com
**Estado**: ❌ NextAuth crasheando con HTTP 500

---

## 🔥 PROBLEMA ROOT CAUSE

**NextAuth está failando en TODAS las páginas con HTTP 500**

### Errores Encontrados (en cada página):

1. ❌ `/api/auth/session` - HTTP 500
2. ❌ `next-auth CLIENT_FETCH_ERROR`
3. ❌ `/api/auth/_log` - HTTP 500

---

## 🔍 ANÁLISIS

### Verificación con Playwright:

```
🔍 Verificando: https://www.inmovaapp.com/

[NETWORK 500] https://www.inmovaapp.com/api/auth/session
[ERROR] Failed to load resource: the server responded with a status of 500 ()
[ERROR] [next-auth][error][CLIENT_FETCH_ERROR]
[NETWORK 500] https://www.inmovaapp.com/api/auth/_log
```

### Respuesta del Servidor:

```json
{
  "message": "There is a problem with the server configuration. Check the server logs for more information."
}
```

---

## 💡 CAUSA PROBABLE

### 1. NEXTAUTH_URL Incorrecto

En `.env.railway`:

```bash
NEXTAUTH_URL=https://www.inmova.app  # ❌ INCORRECTO
```

Debería ser:

```bash
NEXTAUTH_URL=https://www.inmovaapp.com  # ✅ CORRECTO
```

**Síntoma**: NextAuth no puede validar el dominio y falla con 500.

### 2. DATABASE_URL No Configurada o Incorrecta

NextAuth usa Prisma que necesita DATABASE_URL:

```typescript
// lib/auth-options.ts
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),  // ← Necesita DB
  ...
}
```

**Síntoma**: Prisma no puede conectar y NextAuth falla.

### 3. Prisma Client No Generado

Si `prisma generate` no se ejecutó correctamente en el deployment, Prisma Client no existe.

**Síntoma**: Import de `@prisma/client` falla.

---

## 🛠️ SOLUCIÓN INMEDIATA

### Paso 1: Actualizar Variables de Entorno en Railway

```bash
# En Railway Dashboard → Variables de Entorno

# ✅ ACTUALIZAR:
NEXTAUTH_URL=https://www.inmovaapp.com

# ✅ VERIFICAR que existe:
DATABASE_URL=postgresql://usuario:password@host:5432/dbname
NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=
```

### Paso 2: Redeploy

Una vez actualizadas las variables:

```bash
# Railway auto-redeploya cuando cambias variables
# O forzar redeploy desde Railway Dashboard
```

### Paso 3: Verificar

```bash
curl -i https://www.inmovaapp.com/api/auth/session

# Debería responder:
# HTTP/2 200
# {"user":null}  # O datos del usuario si está autenticado
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Variables de Entorno Críticas:

- [ ] `NEXTAUTH_URL` = `https://www.inmovaapp.com` ✅
- [ ] `NEXTAUTH_SECRET` = existe y es válido ✅
- [ ] `DATABASE_URL` = existe y es válido ⚠️ (verificar)
- [ ] `NODE_ENV` = `production` ✅

### Build Process:

- [ ] `prisma generate` se ejecuta en build
- [ ] `@prisma/client` se instala correctamente
- [ ] No hay errores de TypeScript en build

### Runtime:

- [ ] Prisma puede conectar a la base de datos
- [ ] NextAuth puede leer/escribir sesiones
- [ ] `/api/auth/session` responde con 200

---

## 🔧 COMANDOS ÚTILES

### Ver Logs de Railway:

```bash
# Usando Railway CLI
railway logs

# O desde Dashboard:
# railway.app → Tu Proyecto → Deployments → View Logs
```

### Testear API Auth Localmente:

```bash
# Con DATABASE_URL válida
export DATABASE_URL="postgresql://..."
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="test-secret"

yarn dev

# Testear
curl http://localhost:3000/api/auth/session
```

### Verificar Prisma:

```bash
# Generar cliente
npx prisma generate

# Verificar conexión
npx prisma db push --skip-generate
```

---

## 📊 IMPACTO

### Páginas Afectadas: **TODAS** (234/234)

Cada página intenta cargar la sesión de usuario al iniciarse, lo que causa:

- ❌ 3 errores de console en cada página
- ❌ Login no funciona
- ❌ Rutas protegidas no son accesibles
- ❌ UX degradada (usuarios ven errores en console)

### Timeouts en Páginas Específicas:

Estas páginas hacen timeout porque dependen de la sesión:

- `/dashboard`
- `/admin/clientes`
- `/admin/dashboard`
- `/admin/firma-digital`
- `/admin/integraciones-contables`
- `/admin/legal`
- `/admin/marketplace`
- `/admin/modulos`
- `/admin/planes`
- `/admin/plantillas-sms`
- `/admin/portales-externos`

---

## 🚀 PRÓXIMOS PASOS

1. **INMEDIATO**: Actualizar `NEXTAUTH_URL` en Railway
2. **VERIFICAR**: `DATABASE_URL` está configurada correctamente
3. **REDEPLOY**: Railway automáticamente
4. **TESTAR**: `/api/auth/session` responde 200
5. **VERIFICAR**: Login funciona
6. **RE-EJECUTAR**: Script de verificación visual completo

---

## 📞 ACCESO A RAILWAY

Para actualizar variables de entorno:

1. Ir a: https://railway.app/dashboard
2. Buscar proyecto (verificar nombre)
3. Click en servicio
4. Tab "Variables"
5. Editar `NEXTAUTH_URL`
6. Guardar → Auto-redeploy

---

**Status**: ⏳ Esperando actualización de variables en Railway
**ETA**: 5-10 minutos después de actualizar variables
**Prioridad**: 🔴 CRÍTICA - Bloquea toda la aplicación
