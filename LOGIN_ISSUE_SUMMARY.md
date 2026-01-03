# 🔍 RESUMEN DEL PROBLEMA DE LOGIN

**Fecha**: 3 de Enero 2026  
**Estado**: ⚠️ **LOGIN NO FUNCIONAL** - Requiere revisión de auth-options.ts

---

## 📊 ESTADO ACTUAL

### ✅ Lo que funciona
- Landing page: ✅ Funciona perfectamente (modo production)
- Health check: ✅ OK
- PM2: ✅ Online (2 instancias, cluster mode)
- Build: ✅ Modo production activo
- Database: ✅ Conectada

### ❌ Lo que NO funciona
- **Login**: ⚠️ Retorna error CSRF en lugar de crear sesión
- **Autenticación**: No se está creando sesión válida

---

## 🔍 DIAGNÓSTICO COMPLETO

### Problemas Identificados y Resueltos

1. ✅ **subscriptionPlanId NULL** - RESUELTO
   - Plan de suscripción creado
   - Companies actualizadas
   - Error de Prisma eliminado

2. ✅ **Password hash** - VERIFICADO
   - `admin@inmova.app` tiene password correctamente hasheado
   - bcrypt comparison retorna `true`

3. ✅ **Variables de entorno** - VERIFICADAS
   - `NEXTAUTH_URL`: https://inmovaapp.com
   - `NEXTAUTH_SECRET`: Configurado
   - `DATABASE_URL`: Configurado

4. ✅ **PM2 y dependencias** - VERIFICADOS
   - PM2 ejecutándose correctamente
   - Todas las dependencias instaladas
   - Build de producción exitoso

### Problema Actual: CSRF Token

**Síntoma**:
```json
{"url":"https://inmovaapp.com/api/auth/signin?csrf=true"}
```

**Causa**:
NextAuth está rechazando el login request porque detecta un problema con el CSRF token.

**Posibles razones**:
1. **Domain mismatch**: localhost vs inmovaapp.com
2. **Cookie settings**: Secure cookies no funcionan en HTTP
3. **NextAuth configuration**: Problema en `lib/auth-options.ts`
4. **Redirect flow**: El flujo de NextAuth puede estar mal configurado

---

## 🔧 PRÓXIMOS PASOS

### Opción 1: Test Manual (RECOMENDADO)

Probar el login manualmente desde el navegador para ver el comportamiento real:

1. Abrir https://inmovaapp.com/login
2. Usar credenciales: `admin@inmova.app` / `Admin123!`
3. Ver qué pasa:
   - ¿Redirect a dashboard? → **Login funciona**
   - ¿Error visible? → Anotar el mensaje
   - ¿Se queda en login? → Ver consola del navegador (F12)

### Opción 2: Revisar auth-options.ts

El archivo `lib/auth-options.ts` puede tener configuración incorrecta:

```typescript
// Verificar:
- CredentialsProvider configuration
- authorize() function
- callbacks (jwt, session)
- pages: { signIn: '/login' }
- cookies configuration (si está)
```

### Opción 3: Verificar Dominio vs Localhost

El test desde `localhost` puede no funcionar igual que desde `inmovaapp.com` porque:
- Cookies con `Secure` flag solo funcionan en HTTPS
- Domain de las cookies puede no coincidir
- NextAuth puede requerir URL exacta

---

## 📝 CREDENCIALES DE PRUEBA

```
Email: admin@inmova.app
Password: Admin123!

Email: test@inmova.app
Password: Test123456!
```

---

## 🌐 URLs

| URL | Estado |
|-----|--------|
| https://inmovaapp.com/landing | ✅ Funciona |
| https://inmovaapp.com/login | ⚠️ Página carga OK, login no funciona |
| https://inmovaapp.com/dashboard | ⚠️ Redirige a login (sin sesión) |
| https://inmovaapp.com/api/health | ✅ OK |
| https://inmovaapp.com/api/auth/providers | ✅ OK |

---

## 🔍 COMANDOS DE DEBUGGING

### Ver logs en tiempo real
```bash
ssh root@157.180.119.236 'pm2 logs inmova-app'
```

### Ver estado PM2
```bash
ssh root@157.180.119.236 'pm2 status'
```

### Test CSRF token
```bash
ssh root@157.180.119.236 'curl -s http://localhost:3000/api/auth/csrf'
```

### Ver logs de error específicos
```bash
ssh root@157.180.119.236 'pm2 logs inmova-app --err --lines 50 | grep -i "auth\|csrf\|error"'
```

---

## 🧪 TEST REALIZADO

### Test Automático (desde servidor)

```bash
# 1. Obtener CSRF token
curl -s -c cookies.txt http://localhost:3000/api/auth/csrf

# 2. Intentar login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -b cookies.txt \
  -d 'csrfToken=...&email=admin%40inmova.app&password=Admin123%21&callbackUrl=%2Fdashboard&json=true'

# Resultado: {"url":"https://inmovaapp.com/api/auth/signin?csrf=true"}
# → Error de CSRF
```

---

## 📚 DOCUMENTACIÓN RELEVANTE

### NextAuth.js CredentialsProvider

El flujo correcto debería ser:

1. Usuario carga `/login`
2. Página obtiene CSRF token automáticamente
3. Usuario llena formulario y submit
4. POST a `/api/auth/callback/credentials` con:
   - csrfToken (del form hidden field)
   - email
   - password
   - callbackUrl
5. NextAuth valida:
   - CSRF token
   - Llama a `authorize()` function
   - Crea JWT
   - Establece cookies de sesión
6. Redirect a callbackUrl

**El problema está probablemente en el paso 5.**

### Posibles fixes

#### Fix 1: Revisar authorize() function

```typescript
// lib/auth-options.ts
CredentialsProvider({
  async authorize(credentials) {
    // ¿Este código funciona correctamente?
    // ¿Retorna el user object con todos los campos necesarios?
    // ¿Maneja errores correctamente?
  }
})
```

#### Fix 2: Verificar callbacks

```typescript
callbacks: {
  async jwt({ token, user }) {
    // ¿Este callback funciona?
  },
  async session({ session, token }) {
    // ¿Este callback retorna session válida?
  }
}
```

#### Fix 3: Cookies configuration

Si las cookies no se están guardando, puede ser por:
```typescript
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true, // ← Puede causar problemas si NEXTAUTH_URL no es HTTPS
    },
  },
}
```

---

## ⚡ SOLUCIÓN RÁPIDA RECOMENDADA

1. **Test manual en navegador** (5 minutos)
   - Abrir https://inmovaapp.com/login
   - Intentar login
   - Ver consola del navegador (F12)
   - Anotar cualquier error

2. **Si falla visiblemente**, revisar `lib/auth-options.ts`:
   - Ver función `authorize()`
   - Ver callbacks `jwt` y `session`
   - Ver si hay configuración de cookies

3. **Si no hay errores visibles**, puede ser:
   - Problema con domain/cookies
   - NEXTAUTH_URL incorrecta
   - Secret incorrecta

---

## 📊 RESUMEN EJECUTIVO

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Landing | ✅ OK | Modo production, 12 secciones |
| Database | ✅ OK | Conectada, planes creados |
| PM2 | ✅ OK | 2 instancias cluster |
| Build | ✅ OK | Production build exitoso |
| Health | ✅ OK | Endpoint responde |
| **Login** | ❌ **FAIL** | **Error CSRF - Requiere fix** |
| Session | ❌ **FAIL** | No se crea sesión |

---

## 🎯 SIGUIENTE ACCIÓN INMEDIATA

**Opción A** (Manual, 5 min):
→ Probar login en https://inmovaapp.com/login desde navegador
→ Ver qué error específico da

**Opción B** (Código, 30 min):
→ Revisar `lib/auth-options.ts` línea por línea
→ Verificar función `authorize()`
→ Añadir logs de debug

**Opción C** (Nuclear, 10 min):
→ Usar template básico de NextAuth
→ Reemplazar auth-options.ts con versión minimalista
→ Test si funciona

---

**Estado final**: Aplicación deployada en production, landing funcional, login requiere debugging de NextAuth configuration.
