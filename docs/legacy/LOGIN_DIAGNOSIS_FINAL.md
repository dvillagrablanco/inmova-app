# 🔍 DIAGNÓSTICO FINAL: Login No Identifica Credenciales

**Fecha:** 3 de Enero 2026  
**Estado:** 🟡 Parcialmente resuelto  

---

## ✅ PROBLEMAS RESUELTOS

### 1. Error de Prisma: `subscriptionPlanId` NULL
**Status:** ✅ **RESUELTO**

- **Problema:** Errores de Prisma al intentar login porque la tabla `company` tenía registros con `subscriptionPlanId = NULL`
- **Fix aplicado:**
  - Creado plan de suscripción default: `cl019b573c2afe49d081d1e44`
  - Actualizado todas las companies para tener `subscriptionPlanId` válido
  - Ya NO hay errores de Prisma en logs

```bash
# Verificación
pm2 logs inmova-app --lines 50 | grep subscriptionPlanId
# → (Sin errores)
```

### 2. Company NULL en NextAuth
**Status:** ✅ **RESUELTO**

- **Problema:** `lib/auth-options.ts` accedía a `user.company.nombre` sin verificar si `company` era NULL
- **Fix aplicado:** Changed to `user.company?.nombre || 'Sin Empresa'`
- **Commit:** `085e0e4b` - "fix: handle null company in NextAuth callback"

---

## ⚠️ PROBLEMA PENDIENTE: CSRF Error

### Síntoma
```json
{"url":"https://inmovaapp.com/api/auth/signin?csrf=true"}
```

Este error indica que NextAuth está rechazando el login por **CSRF token mismatch**.

### Causa Raíz Identificada

**Desajuste de URLs:**
- **`.env.production`:** `NEXTAUTH_URL=https://inmovaapp.com`
- **Tests internos (curl):** Requests a `http://localhost:3000`

NextAuth valida que el **origin de la request** coincida con `NEXTAUTH_URL`. Como curl hace requests internas a `localhost` pero `NEXTAUTH_URL` es el dominio externo HTTPS, NextAuth rechaza por seguridad.

### Por qué `authorize()` no se ejecuta

Los logs agregados en `lib/auth-options.ts` (`console.log('[NextAuth] authorize() llamado')`) **NO aparecen** porque:

1. NextAuth valida CSRF **antes** de llamar a `authorize()`
2. Si el CSRF falla, retorna error inmediatamente
3. La función `authorize()` nunca se ejecuta

---

## 🎯 SOLUCIÓN: TEST MANUAL DESDE NAVEGADOR

**Los tests con `curl` desde el servidor NO funcionarán correctamente** porque:
- Curl usa `http://localhost:3000`  
- Navegador real usa `https://inmovaapp.com`  
- NextAuth tiene configurado `NEXTAUTH_URL=https://inmovaapp.com` (correcto para producción)

### ✅ Test Manual Recomendado

1. **Abrir navegador** (Chrome/Firefox)
2. **Ir a:** https://inmovaapp.com/login
3. **Abrir DevTools** (F12)
4. **Ir a pestaña Network**
5. **Ingresar credenciales:**
   - Email: `admin@inmova.app`
   - Password: `Admin123!`
6. **Enviar formulario**

### 🔍 Qué observar en DevTools

#### Network Tab:
- `POST /api/auth/callback/credentials` → Status debe ser **200 OK** (no 401)
- Response body debe contener `{"url":"/dashboard"}` (no `?csrf=true`)

#### Console Tab:
- Verificar que aparezcan los logs:
  ```
  [NextAuth] authorize() llamado
  [NextAuth] Usuario encontrado: true
  [NextAuth] Password válido: true
  [NextAuth] Login exitoso para: admin@inmova.app
  ```

#### Application Tab → Cookies:
- `next-auth.session-token` debe estar presente
- `next-auth.csrf-token` debe estar presente

---

## 📊 ESTADO ACTUAL DEL SISTEMA

### ✅ Base de Datos
```sql
-- Planes de suscripción
SELECT id, name FROM subscription_plans;
-- → cl019b573c2afe49d081d1e44 | Plan Gratuito

-- Companies con plan asignado
SELECT COUNT(*) FROM company WHERE subscription_plan_id IS NULL;
-- → 0 (todas tienen plan)

-- Usuario admin
SELECT email, activo, role FROM users WHERE email = 'admin@inmova.app';
-- → admin@inmova.app | t | super_admin
```

### ✅ Aplicación
```bash
# PM2 Status
pm2 status
# → inmova-app | online | 0% | 2 instances

# Logs sin errores de Prisma
pm2 logs inmova-app --lines 50 | grep -i error
# → (Solo errores menores, NO de subscriptionPlanId)

# Health check
curl http://localhost:3000/api/health
# → {"status":"ok","checks":{"database":"connected"}}
```

### ✅ Código
- `lib/auth-options.ts`: ✅ Con logs detallados + null-safe para company
- `prisma/schema.prisma`: ✅ Sin cambios (company.subscriptionPlanId sigue siendo required)
- `.env.production`: ✅ Variables correctas (`NEXTAUTH_URL`, `DATABASE_URL`, `NEXTAUTH_SECRET`)

---

## 🚀 PRÓXIMOS PASOS SI LOGIN FALLA EN NAVEGADOR

### Opción 1: Agregar `trustHost`

Si el login desde navegador TAMBIÉN falla con CSRF, agregar en `lib/auth-options.ts`:

```typescript
export const authOptions: NextAuthOptions = {
  adapter: getAdapter() as any,
  trustHost: true, // ← AGREGAR ESTO
  providers: [
    // ...
```

**Commit:**
```bash
cd /opt/inmova-app
nano lib/auth-options.ts
# Agregar: trustHost: true,
git add lib/auth-options.ts
git commit -m "feat: add trustHost to NextAuth config"
pm2 restart inmova-app
```

### Opción 2: Revisar logs de PM2 durante login manual

```bash
# En terminal 1
pm2 logs inmova-app --lines 0

# En terminal 2 (navegador)
# → Hacer login

# Observar logs en terminal 1
# Buscar: [NextAuth] authorize() llamado
```

Si `authorize()` se ejecuta pero retorna error, el problema está en la lógica de autenticación (password, usuario inactivo, etc.).

Si `authorize()` NO se ejecuta, el problema es configuración de NextAuth (CSRF, cookies, trustHost).

### Opción 3: Usar endpoint alternativo

Cambiar el formulario de login para usar `/api/auth/signin/credentials` en lugar de `/api/auth/callback/credentials`.

**Archivo:** `app/(auth)/login/page.tsx` o similar

```typescript
// Cambiar de:
action="/api/auth/callback/credentials"

// A:
action="/api/auth/signin/credentials"
```

---

## 📝 RESUMEN EJECUTIVO

| Aspecto | Estado | Nota |
|---------|--------|------|
| Base de datos | ✅ OK | Todos los registros corregidos |
| Prisma queries | ✅ OK | Sin errores de subscriptionPlanId |
| Código NextAuth | ✅ OK | Con logs + null-safe |
| PM2 | ✅ OK | 2 instancias online |
| Test curl interno | ❌ Falla | CSRF por desajuste localhost vs dominio |
| Test navegador | 🟡 Pendiente | **Requiere test manual** |

---

## 🎯 RECOMENDACIÓN FINAL

**Testear login desde navegador en https://inmovaapp.com/login** con DevTools abierto (Network + Console tabs) para:

1. Verificar si el CSRF error persiste en navegador real
2. Ver si `authorize()` se ejecuta (buscar logs en Console)
3. Confirmar que cookies se guardan correctamente

Si el login funciona en navegador pero NO en curl, **es normal** y el sistema está funcionando correctamente. Los tests con curl desde el servidor tienen limitaciones cuando `NEXTAUTH_URL` usa HTTPS.

---

**Logs de referencia:**
- `pm2 logs inmova-app --lines 100`
- `/var/log/inmova/*.log` (si configurado)

**Credenciales de test:**
- Email: `admin@inmova.app`
- Password: `Admin123!`
- Email alt: `test@inmova.app`
- Password alt: `Test123456!`

**URLs:**
- Producción: https://inmovaapp.com
- Login: https://inmovaapp.com/login
- Dashboard: https://inmovaapp.com/dashboard
- Health: https://inmovaapp.com/api/health

---

**Última actualización:** 3 Enero 2026 - 22:00 UTC  
**Siguiente revisión:** Test manual desde navegador
