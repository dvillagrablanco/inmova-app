# AUDITORIA TOTAL DEL PROYECTO INMOVA APP
## Fecha: 11 de Febrero de 2026
## Basada en: `.cursorrules` (Reglas de Arquitectura)

---

## RESUMEN EJECUTIVO

| Area | Estado | Hallazgos Criticos | Hallazgos Importantes | Hallazgos Menores |
|------|--------|--------------------|-----------------------|-------------------|
| Seguridad (OWASP) | AMARILLO | 3 | 5 | 4 |
| API Routes | VERDE | 0 | 3 | 6 |
| Prisma & BD | VERDE | 0 | 2 | 3 |
| Produccion (PM2/Nginx) | VERDE | 0 | 1 | 2 |
| Testing & QA | AMARILLO | 1 | 3 | 2 |
| Performance & SEO | VERDE | 0 | 2 | 3 |
| UI/UX & Accesibilidad | VERDE | 0 | 1 | 2 |
| Configuracion Build | ROJO | 2 | 1 | 0 |
| **TOTAL** | **AMARILLO** | **6** | **18** | **22** |

**Puntuacion General: 72/100**

---

## 1. SEGURIDAD (OWASP TOP 10)

### 1.1 CRITICO: Signup sin rate limiting ni validacion robusta

**Archivo:** `app/api/signup/route.ts`

**Problema:** El endpoint de registro no usa Zod para validar inputs, no aplica rate limiting, y no valida formato de email ni fuerza de password con esquemas estrictos. Solo verifica que `email`, `password` y `name` no esten vacios.

```typescript
// Actual (linea 28-33)
if (!email || !password || !name) {
  return NextResponse.json(
    { error: 'Faltan campos requeridos' },
    { status: 400 }
  );
}
```

**Riesgo:** Account enumeration, brute force de registro, spam de cuentas.

**Recomendacion:**
- Aplicar `withAuthRateLimit()` de `lib/rate-limiting.ts`
- Validar con Zod: email valido, password minimo 8 caracteres, name sanitizado
- Agregar CAPTCHA o honeypot

---

### 1.2 CRITICO: `next.config.js` ignora errores de TypeScript y ESLint en build

**Archivo:** `next.config.js` (lineas 51-56)

```javascript
typescript: {
  ignoreBuildErrors: true,
},
eslint: {
  ignoreDuringBuilds: true,
},
```

**Problema:** Esto permite deployar codigo con errores de tipo y problemas de lint, incluyendo posibles vulnerabilidades de seguridad que TypeScript strict mode detectaria.

**Riesgo:** Errores de tipo en produccion, vulnerabilidades no detectadas en build.

**Recomendacion:** Cambiar a `false` progresivamente. Priorizar `typescript.ignoreBuildErrors: false` ya que `tsconfig.json` tiene `strict: true`.

---

### 1.3 CRITICO: `.env.production` commiteado con datos de build en repositorio

**Archivo:** `.env.production`

**Problema:** Aunque contiene solo un DATABASE_URL dummy para build, el archivo esta commiteado al repositorio (esta en `.gitignore` pero ya fue committed previamente). Ademas, la linea `NEXTAUTH_URL=https://inmovaapp.com` expone la URL de produccion.

**Recomendacion:** Verificar que el archivo no contiene secrets reales y eliminarlo del tracking si es necesario.

---

### 1.4 IMPORTANTE: Endpoint `/api/public/init-admin` potencialmente peligroso

**Archivo:** `app/api/public/init-admin/route.ts`

**Problema:** Aunque protegido por `NODE_ENV === 'production'` y `DEBUG_SECRET`, el archivo crea un super_admin con password hardcodeado `demo123`. Si alguien cambia NODE_ENV o el check se bypasea, crea un backdoor.

**Recomendacion:** 
- Eliminar este endpoint en produccion
- Si se necesita, proteger con token temporal de un solo uso

---

### 1.5 IMPORTANTE: Upload sin validacion de tipo MIME real

**Archivo:** `app/api/upload/route.ts`

**Problema:** El endpoint confia en `file.type` (MIME del cliente) sin verificar el contenido real del archivo. Segun cursorrules OWASP A08, se debe verificar con `file-type` la firma magica del archivo.

**Recomendacion:**
```typescript
import { fileTypeFromBuffer } from 'file-type';
const detectedType = await fileTypeFromBuffer(buffer);
if (!detectedType || !ALLOWED_MIMES.includes(detectedType.mime)) {
  return error;
}
```

---

### 1.6 IMPORTANTE: Muchas API routes sin validacion Zod

**Hallazgo:** De ~400+ API routes, solo ~130 usan Zod para validacion de entrada. El resto confian en validacion manual basica o no validan inputs.

**Ejemplos sin Zod:**
- `app/api/admin/impersonate/route.ts` - No valida formato de companyId
- `app/api/signup/route.ts` - No valida formato de email
- Muchas rutas solo verifican `if (!campo)` sin schema

**Recomendacion:** Implementar Zod en todos los endpoints que reciben input del usuario.

---

### 1.7 IMPORTANTE: Rate limiting solo en memoria (no distribuido)

**Archivo:** `lib/rate-limiting.ts`

**Problema:** El rate limiter usa `Map()` en memoria. Con PM2 cluster mode (2 workers), cada worker tiene su propio Map, duplicando el limite efectivo. No sobrevive reinicios.

**Recomendacion:** Migrar a Redis (`@upstash/ratelimit` ya esta como dependencia).

---

### 1.8 IMPORTANTE: 7 archivos con `dangerouslySetInnerHTML`

**Archivos afectados:**
- `app/admin/plantillas-email/page.tsx`
- `app/p/[slug]/partner-landing-client.tsx`
- `app/landing-layout-backup.tsx`
- `app/docs/page.tsx`
- `components/property/VirtualTourViewer.tsx`
- `components/seo/StructuredDataScript.tsx`
- `components/StructuredData.tsx`

**Riesgo:** XSS si el contenido no esta sanitizado con DOMPurify antes de renderizar.

**Recomendacion:** Verificar que todos usen `sanitizeHtml()` de `lib/sanitize.ts` antes de inyectar HTML.

---

### 1.9 MENOR: Headers de seguridad correctos en `vercel.json`

**Estado:** OK. X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection, Referrer-Policy y Permissions-Policy estan configurados.

---

### 1.10 MENOR: Autenticacion anti-timing attack implementada

**Estado:** OK. `lib/auth-options.ts` implementa delay constante de 150ms y bcrypt compare con dummy hash cuando usuario no existe.

---

### 1.11 MENOR: Sistema de permisos robusto

**Estado:** OK. `lib/permissions.ts` implementa RBAC con 8 roles y verificacion de ownership por companyId.

---

### 1.12 MENOR: Sanitizacion HTML disponible

**Estado:** OK. `lib/sanitize.ts` implementa DOMPurify con presets para texto, basico y rico.

---

## 2. API ROUTES

### 2.1 OK: `export const dynamic = 'force-dynamic'` presente en todas las routes

Todas las API routes auditadas (~400+) incluyen `export const dynamic = 'force-dynamic'` segun lo requerido por cursorrules.

### 2.2 OK: Runtime `nodejs` en rutas criticas con Prisma

Las rutas de auth (`[...nextauth]`, MFA, health) tienen `export const runtime = 'nodejs'`. Sin embargo, ~200+ rutas con Prisma no declaran runtime explicitamente.

### 2.3 IMPORTANTE: ~200 API routes sin `runtime = 'nodejs'` explicito

**Problema:** Muchas rutas que usan Prisma no declaran `runtime = 'nodejs'`. Mientras que Next.js usa Node.js por defecto para API routes en Pages Router, en App Router el runtime puede variar.

**Recomendacion:** Agregar `export const runtime = 'nodejs'` a todas las rutas que usan Prisma o librerias nativas.

---

### 2.4 IMPORTANTE: Lazy loading de Prisma inconsistente

**Problema:** Algunas rutas importan `prisma` directamente (`import { prisma } from '@/lib/db'`) en top-level, mientras que las mejores practican usan `const { getPrismaClient } = await import('@/lib/db')`.

**Ejemplos con import directo (riesgo en build):**
- `app/api/signup/route.ts`
- `app/api/admin/impersonate/route.ts`
- `app/api/public/init-admin/route.ts`

**Rutas bien implementadas (lazy loading):**
- `app/api/admin/init-all-data/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/health/route.ts`

**Recomendacion:** Migrar todas las rutas al patron lazy loading.

---

### 2.5 IMPORTANTE: Webhook de Stripe acepta requests sin firma en dev

**Archivo:** `app/api/webhooks/stripe/route.ts` (lineas 65-74)

```typescript
if (!webhookSecret) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 503 });
  }
  event = JSON.parse(body); // Sin verificacion en dev
}
```

**Estado:** Aceptable para desarrollo, pero verificar que `STRIPE_WEBHOOK_SECRET` este siempre configurado en produccion.

---

### 2.6 MENOR: Patron de error handling consistente

La mayoria de rutas siguen el patron try/catch con logging via `logger` de winston. Correcto segun cursorrules.

---

## 3. PRISMA & BASE DE DATOS

### 3.1 OK: Singleton pattern implementado

`lib/db.ts` usa el patron singleton recomendado con `globalForPrisma` y proteccion de build-time.

### 3.2 OK: Query middleware para detectar queries lentas

Implementado con warning para queries >1000ms en desarrollo.

### 3.3 OK: Graceful shutdown implementado

SIGTERM y SIGINT desconectan Prisma correctamente.

### 3.4 IMPORTANTE: Schema Prisma masivo (~15700 lineas)

**Problema:** El schema de Prisma es extremadamente grande. Esto puede causar:
- Tiempos de generacion largos
- Client bundle grande
- Dificultad de mantenimiento

**Recomendacion:** Considerar dividir en schemas parciales con Prisma multi-file schema (disponible desde Prisma 5.15+).

---

### 3.5 IMPORTANTE: `checkDbConnection()` usa `$queryRaw` correctamente

Estado: OK. `SELECT 1` es el patron correcto para health checks.

---

### 3.6 MENOR: Tipos importados directamente de `@prisma/client`

**Problema:** `lib/permissions.ts` importa `UserRole` directamente de `@prisma/client`, lo cual va en contra de la regla de cursorrules que dice usar `@/types/prisma-types`.

---

## 4. CONFIGURACION DE PRODUCCION

### 4.1 OK: PM2 Cluster Mode configurado

`ecosystem.config.js` tiene 2 instancias en cluster mode, auto-restart, max memory 1G, logs centralizados.

### 4.2 OK: Vercel configurado con funciones de 60s

`vercel.json` configura `maxDuration: 60` y `memory: 1024` para API routes.

### 4.3 IMPORTANTE: `.env.production` tiene DATABASE_URL placeholder

```
DATABASE_URL="postgresql://dummy_build_user:dummy_build_pass@dummy-build-host.local:5432/dummy_build_db"
```

**Problema:** El archivo `.env.production` en el repo solo tiene el placeholder para build. Hay que asegurar que el servidor real tiene la URL correcta.

---

### 4.4 MENOR: `poweredByHeader: false` configurado

Estado: OK. Oculta el header `X-Powered-By: Next.js`.

---

### 4.5 MENOR: Compresion activada

`compress: true` en `next.config.js`. Correcto.

---

## 5. TESTING & QA

### 5.1 CRITICO: Dos frameworks de testing (Jest + Vitest)

**Problema:** El proyecto tiene tanto Jest como Vitest configurados:
- `"test": "jest --watch"`
- `"test:unit": "vitest"`

Esto genera confusion sobre cual ejecutar y posible drift en configuraciones.

**Recomendacion:** Unificar en Vitest (ya es el recomendado en cursorrules).

---

### 5.2 IMPORTANTE: 358 test files detectados

**Estado:** Buena cobertura numerica. Sin embargo, necesita verificarse:
- Que los tests realmente pasan
- Que la cobertura es >= 80% en codigo critico

---

### 5.3 IMPORTANTE: Scripts de pre-deploy existen

- `test:smoke`, `test:api-contract`, `test:critical`, `test:pre-deploy`, `verify:schema`

**Estado:** OK. Alineado con cursorrules.

---

### 5.4 IMPORTANTE: Playwright configurado para E2E

Con `test:e2e`, `test:e2e:ui`, `test:e2e:debug`. Correcto.

---

### 5.5 MENOR: Scripts de generacion automatica de tests

`generate:tests` y `generate:tests-components` generan tests automaticamente. Buena practica.

---

## 6. PERFORMANCE & SEO

### 6.1 OK: Optimizacion de imagenes configurada

`next.config.js` tiene formatos AVIF/WebP, cache 1 ano, tamanios optimizados.

### 6.2 OK: Modularize imports para lucide-react y radix-ui

Reduce bundle size significativamente.

### 6.3 OK: Cache headers correctos

- Static assets: `immutable, max-age=31536000`
- Landing pages: `must-revalidate`
- API routes: `no-store`

### 6.4 IMPORTANTE: `console.log` eliminado en produccion (excepto error/warn)

Estado: OK via `compiler.removeConsole`.

### 6.5 IMPORTANTE: `reactStrictMode: true` activado

Estado: OK.

---

### 6.6 MENOR: Output standalone deshabilitado

`output: 'standalone'` esta comentado. Esto significa que no se genera un build standalone para Docker.

---

## 7. UI/UX & ACCESIBILIDAD

### 7.1 OK: Shadcn/ui con Radix primitivos

Accesibilidad built-in por Radix UI.

### 7.2 OK: Testing de accesibilidad disponible

`@axe-core/cli`, `pa11y`, `@storybook/addon-a11y` como dependencias.

### 7.3 IMPORTANTE: Storybook configurado pero estado desconocido

Dependencias de Storybook 10.x presentes. Verificar que los stories esten actualizados.

---

## 8. CONFIGURACION DE BUILD

### 8.1 CRITICO: TypeScript errors ignorados en build

**Ya mencionado en 1.2.** `ignoreBuildErrors: true` permite codigo inseguro en produccion.

### 8.2 CRITICO: ESLint ignorado en build

**Ya mencionado en 1.2.** `ignoreDuringBuilds: true` permite problemas de lint en produccion.

### 8.3 IMPORTANTE: `tsconfig.json` tiene `strict: true`

**Estado:** Excelente. Pero su efecto es nulo si `ignoreBuildErrors: true` esta activo.

---

## 9. CUMPLIMIENTO CON CURSORRULES

### Checklist de Codigo (segun cursorrules)

| Regla | Cumplimiento | Nota |
|-------|-------------|------|
| API Routes con `dynamic = 'force-dynamic'` | SI | 100% de rutas auditadas |
| No operaciones > 60 segundos | SI | BullMQ para tareas largas |
| No guardar en filesystem (excepto /tmp) | SI | Usa AWS S3 |
| Validar inputs con Zod/Yup | PARCIAL | ~30% de rutas usan Zod |
| Verificar auth con `getServerSession` | SI | Mayoria de rutas protegidas |
| Tipos de `@/types/prisma-types` | NO | Muchas importan directo de `@prisma/client` |
| Optimizar imports | SI | modularizeImports configurado |
| Logging para debugging | SI | Winston configurado |
| Error handling try/catch | SI | Patron consistente |
| Codigos HTTP apropiados | SI | 200, 201, 400, 401, 403, 500 |

### Infraestructura Vercel (segun cursorrules)

| Regla | Cumplimiento | Nota |
|-------|-------------|------|
| Timeouts < 60s | SI | `maxDuration: 60` en vercel.json |
| Sin archivos en filesystem | SI | Usa S3 y /tmp |
| Rate limiting configurado | PARCIAL | Solo in-memory, no Redis |
| Edge vs Node runtime | PARCIAL | No todas las rutas declaran runtime |
| Cold start optimization | SI | Singleton Prisma, lazy imports |

### Seguridad OWASP (segun cursorrules)

| Categoria | Cumplimiento | Nota |
|-----------|-------------|------|
| A01: Broken Access Control | SI | RBAC + ownership check |
| A02: Cryptographic Failures | SI | bcrypt + env vars |
| A03: Injection | SI | Prisma ORM previene SQLi |
| A04: Insecure Design | PARCIAL | Rate limiting solo in-memory |
| A05: Security Misconfiguration | PARCIAL | Build errors ignorados |
| A06: Vulnerable Components | DESCONOCIDO | No se ejecuto `yarn audit` |
| A07: Auth Failures | SI | Anti-timing, MFA, JWT |
| A08: Data Integrity | PARCIAL | Upload sin MIME real check |
| A09: Logging & Monitoring | SI | Winston + Sentry + audit logs |
| A10: SSRF | SI | URLs controladas |

---

## 10. RECOMENDACIONES PRIORITARIAS

### Prioridad CRITICA (hacer inmediatamente)

1. **Habilitar TypeScript errors en build** - Cambiar `ignoreBuildErrors: false`
2. **Agregar Zod al signup** - Validar email, password, name con schemas
3. **Migrar rate limiting a Redis** - Usar `@upstash/ratelimit` (ya instalado)

### Prioridad ALTA (proximo sprint)

4. **Agregar `runtime = 'nodejs'` a todas las rutas con Prisma**
5. **Migrar todos los imports de Prisma a lazy loading**
6. **Verificar `dangerouslySetInnerHTML` usa sanitizacion**
7. **Unificar testing en Vitest** (eliminar Jest)
8. **Agregar validacion MIME real en upload**

### Prioridad MEDIA (backlog)

9. **Agregar Zod a todas las API routes con input de usuario**
10. **Dividir schema.prisma en multi-file** (15700+ lineas)
11. **Importar tipos desde `@/types/prisma-types`** en vez de `@prisma/client`
12. **Ejecutar `yarn audit` y actualizar dependencias vulnerables**
13. **Habilitar ESLint en build** - `ignoreDuringBuilds: false`

### Prioridad BAJA (mejora continua)

14. **Habilitar `output: 'standalone'` para Docker**
15. **Actualizar Storybook y stories**
16. **Agregar Content-Security-Policy header**

---

## METRICAS DEL PROYECTO

| Metrica | Valor |
|---------|-------|
| API Routes (archivos route.ts) | ~400+ |
| Paginas (archivos page.tsx) | ~589 |
| Librerias en lib/ | ~296 |
| Tests | 358 archivos |
| Schema Prisma | ~15,700 lineas |
| Dependencias (prod) | ~135 |
| Dependencias (dev) | ~60 |
| Next.js version | 14.2.35 |
| React version | 18.3.1 |
| TypeScript | 5.2.2 (strict: true) |

---

*Auditoria generada automaticamente el 11 de Febrero de 2026*
*Basada en las reglas definidas en `.cursorrules`*
