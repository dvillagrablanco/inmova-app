# AUDITORIA V2 - INMOVA APP
## Fecha: 11 Febrero 2026 (segunda pasada post-fixes)
## Branch: main (commit 82e248dc)

---

## RESUMEN EJECUTIVO

| Area | Puntuacion | Criticos | Importantes | Menores |
|------|-----------|----------|-------------|---------|
| 1. Seguridad OWASP | 78/100 | 2 | 3 | 2 |
| 2. API Routes | 85/100 | 0 | 2 | 3 |
| 3. Prisma & BD | 82/100 | 0 | 2 | 2 |
| 4. Build & Produccion | 75/100 | 1 | 1 | 2 |
| 5. Testing & QA | 80/100 | 0 | 2 | 1 |
| 6. Performance & SEO | 90/100 | 0 | 1 | 1 |
| 7. Middleware & Rate Limit | 88/100 | 0 | 1 | 0 |
| **TOTAL** | **82/100** | **3** | **12** | **11** |

**Mejora desde auditoria V1: 72/100 -> 82/100 (+10 puntos)**

---

## METRICAS DEL PROYECTO

| Metrica | Valor |
|---------|-------|
| API Routes (route.ts) | 906 |
| Paginas (page.tsx) | 543 |
| Librerias (lib/*.ts) | 443 |
| Tests | 359 archivos |
| Schema Prisma | 15,745 lineas |
| Next.js | 14.2.35 |
| React | 18.3.1 |
| TypeScript | 5.2.2 (strict: true) |

---

## 1. SEGURIDAD (OWASP TOP 10) — 78/100

### CORREGIDOS desde V1
- [x] Signup con Zod + rate limiting (era critico)
- [x] Upload con magic bytes validation (era importante)
- [x] dangerouslySetInnerHTML sanitizado en VirtualTourViewer y plantillas email
- [x] HSTS header agregado a vercel.json
- [x] Rate limiting migrado a Redis+fallback

### CRITICO: S-01 — Credenciales de test en `.env.test` commiteado

**Archivo:** `.env.test` (en git)

```
TEST_USER_PASSWORD=Admin123!
ADMIN_PASSWORD=Admin123!
```

**Riesgo:** Passwords reales de produccion expuestos en repositorio publico/compartido. Cualquiera con acceso al repo conoce las credenciales de admin.

**Fix:** Mover a `.env.test.local` (que esta en .gitignore) o usar placeholders.

---

### CRITICO: S-02 — 17 rutas cron sin autenticacion

**Archivos:** Todos en `app/api/cron/*/route.ts`

**Problema:** Las 17 rutas cron no verifican ninguna autenticacion. Cualquier persona puede invocar:
- `POST /api/cron/execute` — ejecuta tareas arbitrarias
- `POST /api/cron/process-payment-reminders` — dispara recordatorios de pago
- `POST /api/cron/process-contract-renewals` — renueva contratos
- `POST /api/cron/cleanup-notifications` — borra notificaciones

**Riesgo:** Ejecucion no autorizada de operaciones de negocio criticas.

**Fix:** Agregar verificacion de `CRON_SECRET` header o usar `lib/cron-auth.ts` existente.

---

### IMPORTANTE: S-03 — Endpoint debug en produccion

**Archivo:** `app/api/debug/create-test-user/route.ts`

**Problema:** Aunque tiene check `NODE_ENV === 'production'`, el archivo existe en el repo y crea un super_admin con password `demo123`. El check de NODE_ENV es bypasseable si la variable no esta seteada.

**Fix:** Eliminar archivo o moverlo a un directorio excluido del build.

---

### IMPORTANTE: S-04 — CSP definido pero NO aplicado

**Archivos:** `lib/csp.ts`, `lib/csp-strict.ts`

**Problema:** Existe una configuracion CSP completa en `lib/csp.ts` con `securityHeaders`, pero NO se aplica en ningun lugar:
- No esta en `middleware.ts`
- No esta en `next.config.js` headers()
- No esta en `vercel.json`

**Riesgo:** Sin CSP, ataques XSS pueden cargar scripts externos arbitrarios.

**Fix:** Aplicar CSP header en `next.config.js` headers() o en middleware.

---

### IMPORTANTE: S-05 — 64 rutas POST sin verificacion de auth

**Problema:** De las rutas que aceptan POST, 64 no verifican `getServerSession`, `requireAuth` ni similar. Muchas son legitimamente publicas (auth, webhooks, signup, cron), pero varias deberian estar protegidas:
- `app/api/partners/calculate-commissions/route.ts`
- `app/api/ai/detect-intent/route.ts`
- `app/api/ai/detect-business-model/route.ts`
- Multiples rutas de `cron/`

---

### MENOR: S-06 — partner-landing CSS injection teorico

**Archivo:** `app/p/[slug]/partner-landing-client.tsx`

CSS inyectado via `dangerouslySetInnerHTML` con variables del tema del partner. Bajo riesgo (CSS, no JS) pero podria usarse para exfiltrar datos via CSS selectors.

---

### MENOR: S-07 — `unsafe-eval` y `unsafe-inline` en CSP

**Archivo:** `lib/csp.ts` lineas 26-27

Necesarios para Next.js pero debilitan la CSP. Documentar como deuda tecnica.

---

## 2. API ROUTES — 85/100

### CORREGIDOS desde V1
- [x] 100% rutas tienen `export const dynamic = 'force-dynamic'` (906/906)
- [x] 100% rutas con Prisma tienen `export const runtime = 'nodejs'`
- [x] 31 rutas criticas migradas a lazy Prisma loading
- [x] Signup con Zod + rate limiting

### IMPORTANTE: A-01 — 480 rutas con import directo de Prisma

**Problema:** 480 de 556 rutas que usan Prisma importan directamente `import { prisma } from '@/lib/db'` en vez de lazy loading. Solo 76 usan `getPrismaClient()`.

**Riesgo:** En build-time, Prisma puede intentar conectar a BD causando errores. Actualmente mitigado por la deteccion `isBuildTime` en `lib/db.ts`.

**Accion:** Migrar progresivamente. Prioridad baja dado que `lib/db.ts` ya tiene proteccion.

---

### IMPORTANTE: A-02 — 700 de 906 rutas sin validacion Zod

**Problema:** Solo 206 de 906 rutas (23%) usan Zod para validar input. El 77% restante confia en validacion manual o ninguna.

**Accion:** Agregar Zod a rutas que reciben input de usuario (POST/PUT/PATCH). Prioridad: rutas publicas primero.

---

### MENOR: A-03 — Codigos HTTP inconsistentes

Algunas rutas retornan 500 para errores de validacion, otras 400. Patron recomendado del cursorrules seguido en ~80% de rutas.

### MENOR: A-04 — Rutas auth-propietario/auth-proveedor duplican logica

Tres sistemas de auth separados (user, propietario, proveedor) con codigo duplicado. Considerar unificar.

### MENOR: A-05 — `logError` importado pero no siempre usado

Patron inconsistente entre `logger.error()` y `logError()`.

---

## 3. PRISMA & BASE DE DATOS — 82/100

### CORREGIDOS desde V1
- [x] 6 archivos lib/ migrados a `@/types/prisma-types`
- [x] Singleton pattern correcto en `lib/db.ts`
- [x] Proteccion build-time funcional

### IMPORTANTE: P-01 — Schema de 15,745 lineas en un archivo

**Problema:** `prisma/schema.prisma` es un archivo monolitico. Mantenimiento dificil, tiempos de generacion largos.

**Fix:** Usar Prisma multi-file schema (disponible desde Prisma 5.15+, proyecto usa 6.7.0).

---

### IMPORTANTE: P-02 — 28 archivos lib/ importan de @prisma/client

**Problema:** 28 archivos en `lib/` importan tipos directamente de `@prisma/client` en vez de `@/types/prisma-types`. Incluye archivos criticos como `onboarding-service.ts`, `valoracion-service.ts`, `sms-service.ts`.

---

### MENOR: P-03 — Raw queries en 11 archivos

11 archivos usan `$queryRaw`/`$executeRaw`. Todos usan tagged template literals (seguros contra SQL injection) pero deberian documentarse.

### MENOR: P-04 — `.env.production` con DATABASE_URL placeholder en repo

El archivo `.env.production` contiene un URL dummy. Aceptable para build pero confuso.

---

## 4. BUILD & PRODUCCION — 75/100

### CRITICO: B-01 — ignoreBuildErrors: true (SIN CAMBIO)

**Archivo:** `next.config.js` lineas 54-58

```javascript
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

**Problema:** Errores de TypeScript y ESLint no se detectan durante el build. Esto permite desplegar codigo con bugs de tipo, variables sin definir, y vulnerabilidades que el compilador detectaria.

**Impacto:** `tsconfig.json` tiene `strict: true`, `strictNullChecks: true`, `noImplicitAny: true` — todo anulado por `ignoreBuildErrors`.

**Fix:** Corregir errores TS incrementalmente y luego cambiar a `false`.

---

### IMPORTANTE: B-02 — Multiple archivos .env en repositorio

9 archivos `.env*` trackeados en git:
- `.env.production` (dummy, OK)
- `.env.test` (con passwords reales, CRITICO — ver S-01)
- `.env.build`, `.env.coolify`, `.env.vercel` (potencialmente con secrets)

**Fix:** Auditar contenido de cada uno y excluir los que tengan secrets.

---

### MENOR: B-03 — `output: 'standalone'` deshabilitado

Necesario para Docker optimizado. Comentado por bug de prerender-manifest.

### MENOR: B-04 — 72 vulnerabilidades en npm audit

```
72 vulnerabilities (12 low, 19 moderate, 40 high, 1 critical)
```

**Fix:** `npm audit fix` para las seguras, evaluar las que requieren breaking changes.

---

## 5. TESTING & QA — 80/100

### CORREGIDOS desde V1
- [x] Vitest como framework principal (`test` y `test:ci`)
- [x] Jest conservado como `test:jest-legacy`

### IMPORTANTE: T-01 — 359 tests pero cobertura desconocida

Tests existen pero no se ha verificado que pasen ni la cobertura real. `vitest.config.ts` tiene thresholds de 100% pero no se ejecuta en CI.

**Fix:** Ejecutar `vitest run --coverage` y verificar estado real.

---

### IMPORTANTE: T-02 — Pre-deploy tests no integrados en deployment

Los scripts `test:smoke`, `test:critical`, `test:pre-deploy` existen pero no se ejecutan automaticamente antes del deployment SSH.

---

### MENOR: T-03 — Jest y Vitest coexisten

`jest.config.js` sigue existiendo. No causa problemas pero es confuso.

---

## 6. PERFORMANCE & SEO — 90/100

### OK
- [x] Image optimization con AVIF/WebP
- [x] modularizeImports para lucide-react y radix
- [x] Cache headers correctos (static: immutable, API: no-store)
- [x] removeConsole en produccion
- [x] reactStrictMode: true
- [x] poweredByHeader: false
- [x] compress: true
- [x] optimizePackageImports configurado

### IMPORTANTE: F-01 — CSP no aplicado (impacta Lighthouse score)

CSP existe en `lib/csp.ts` pero no se aplica. Penaliza en auditorias de seguridad.

---

### MENOR: F-02 — Next.js 14.2.35 (no 15.x)

El cursorrules menciona Next.js 15 pero el proyecto usa 14.2.35. No es un problema per se pero la documentacion esta desalineada.

---

## 7. MIDDLEWARE & RATE LIMITING — 88/100

### OK
- [x] Rate limiting hibrido Redis+memoria implementado
- [x] Anti-timing attack en auth (150ms constant delay)
- [x] CF-Connecting-IP para Cloudflare
- [x] Rate limits por tipo (auth:10/5min, api:100/min, admin:500/min)

### IMPORTANTE: M-01 — Middleware no aplica rate limiting global

**Archivo:** `middleware.ts`

El middleware solo maneja i18n. No aplica rate limiting ni CSP ni auth checks. El `rateLimitMiddleware` exportado en `lib/rate-limiting.ts` no se invoca desde middleware.

**Fix:** Integrar `rateLimitMiddleware` en `middleware.ts` para proteccion global, o aplicar `withRateLimit` en cada ruta individualmente.

---

## CUMPLIMIENTO CON CURSORRULES

| Regla | Estado | Nota |
|-------|--------|------|
| `dynamic = 'force-dynamic'` en APIs | **100%** | 906/906 |
| `runtime = 'nodejs'` con Prisma | **100%** | Todas las rutas con Prisma |
| No operaciones > 60s | **OK** | BullMQ para tareas largas |
| No archivos en filesystem | **OK** | AWS S3 + /tmp |
| Validar con Zod | **23%** | 206/906 rutas |
| Auth con getServerSession | **82%** | 740/906 rutas |
| Tipos de @/types/prisma-types | **PARCIAL** | 6 migrados, 28 pendientes en lib/ |
| Lazy Prisma loading | **14%** | 76/556 rutas con Prisma |
| Error handling try/catch | **97%** | 880/906 rutas |
| Codigos HTTP correctos | **~80%** | Mayoria correctos |
| Rate limiting | **OK** | Redis+fallback implementado |
| Security headers | **PARCIAL** | Vercel.json OK, CSP no aplicado |
| Anti-timing auth | **OK** | 150ms constant delay |
| XSS sanitization | **OK** | DOMPurify en dangerouslySetInnerHTML |
| PM2 cluster mode | **OK** | 2 workers, auto-restart |
| Health checks | **OK** | /api/health con DB check |
| Login verification | **OK** | /api/auth/session funcional |
| Testing pre-deploy | **EXISTE** | Scripts disponibles, no automatizados |

---

## TOP 5 ACCIONES PRIORITARIAS

| # | Accion | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 1 | Proteger 17 rutas cron con CRON_SECRET | CRITICO | 30 min |
| 2 | Eliminar passwords de .env.test | CRITICO | 5 min |
| 3 | Aplicar CSP desde lib/csp.ts en next.config.js | ALTO | 15 min |
| 4 | Eliminar/desactivar endpoint debug | ALTO | 5 min |
| 5 | Plan para ignoreBuildErrors: false | ALTO | Semanas |

---

*Auditoria V2 generada el 11 de Febrero de 2026*
*Estado: post-fixes de auditoria V1*
*Puntuacion: 82/100 (mejora de +10 desde V1)*
