# Recomendaciones de Mejora - Inmova App (Basadas en .cursorrules)

Analisis del estado actual del codigo vs lo que .cursorrules define como objetivo.
No son desarrollos nuevos, sino mejoras sobre lo que ya existe.

---

## 1. SEGURIDAD - PRIORIDAD CRITICA

### 1.1 API Routes sin autenticacion (165 de 939)

**Problema**: 165 API routes (~17.5%) no tienen verificacion de sesion (`getServerSession`, `getToken`).

**Rutas criticas expuestas** (seleccion):
- `/api/partners/dashboard` - Dashboard de partners sin auth
- `/api/partners/commissions` - Comisiones sin auth
- `/api/partners/calculate-commissions` - Calculo de comisiones sin auth
- `/api/community/*` (posts, events, announcements) - CRUD completo sin auth
- `/api/scheduled-reports/*` - Reportes programados sin auth
- `/api/reports` - Reportes sin auth

**Impacto**: Cualquier persona puede acceder a datos de negocio, crear/modificar registros y leer informacion sensible.

**Accion**: Auditar las 165 rutas. Clasificar cuales son publicas legitimamente (signup, health, webhooks) y proteger el resto con `getServerSession(authOptions)`.

### 1.2 Validacion con Zod insuficiente

**Problema**: Solo ~195 de 939 API routes usan validacion Zod. El 79% de las rutas aceptan datos sin validar.

**Riesgo**: Inyeccion de datos malformados, errores no controlados, posibles vectores de ataque.

**Accion**: Implementar schemas Zod en todos los endpoints POST/PUT/PATCH. El cursorrules ya define el patron:

```typescript
const validatedData = schema.parse(body);
```

### 1.3 Rate Limiting fragmentado

**Problema**: Existen 3 implementaciones de rate limiting separadas:
- `lib/rate-limiting.ts` (hibrido Redis/memoria)
- `lib/rate-limit.ts` (memoria con fallback Redis)
- `lib/rate-limit-enhanced.ts` (Upstash Redis)

Ademas, la mayoria de API routes no aplican ninguno.

**Accion**: Consolidar en una sola implementacion. Aplicar como middleware en `middleware.ts` o al menos en endpoints criticos (auth, payments, admin).

### 1.4 `ignoreBuildErrors: true` y `ignoreDuringBuilds: true`

**Problema**: `next.config.js` desactiva TypeScript errors y ESLint en build. El propio cursorrules documenta que se "revirtio temporalmente" pero lleva meses asi.

**Impacto**: Errores de tipos y lint pasan a produccion sin deteccion. Esto contradice directamente la seccion de "Code Review Checklist" del cursorrules.

**Accion**: Priorizar la correccion de errores TS/ESLint y reactivar las verificaciones. Hacerlo en fases:
1. Listar errores con `tsc --noEmit` y `next lint`
2. Corregir errores criticos (rutas API, auth, servicios core)
3. Activar `ignoreBuildErrors: false` cuando queden <10 errores

---

## 2. ARQUITECTURA Y CODIGO - PRIORIDAD ALTA

### 2.1 Schema Prisma excesivo (15,780 lineas, 367 modelos)

**Problema**: El schema tiene 367 modelos en un solo archivo de casi 16K lineas. Esto impacta:
- Tiempo de `prisma generate` (cada build)
- Tamano del Prisma Client generado
- Mantenibilidad
- Cold starts (el cliente cargado en memoria es enorme)

**Accion**: No se puede dividir el schema con Prisma nativo, pero si se puede:
- Eliminar modelos no usados (auditar cuales tienen tablas vacias)
- Reducir campos opcionales redundantes
- Considerar `prisma-multischema` o migracion a Drizzle para schemas grandes

### 2.2 Duplicacion masiva en lib/ (295 archivos, 113K+ lineas)

**Problema**: Hay 295 archivos en `lib/` con 113,282 lineas de codigo. Muchos son servicios que se solapan:
- `lib/ai-service.ts`, `lib/ai-assistant-service.ts`, `lib/ai-support-service.ts`, `lib/ai-chatbot-service.ts`, `lib/ai-workflow-service.ts`, `lib/ai-automation-service.ts`, `lib/ai-enhanced-assistant-service.ts`
- `lib/rate-limiting.ts`, `lib/rate-limit.ts`, `lib/rate-limit-enhanced.ts`
- `lib/redis.ts`, `lib/redis-config.ts`, `lib/redis-cache-service.ts`
- `lib/push-notification-service.ts`, `lib/push-notifications.ts`, `lib/push-service.ts`
- `lib/onboarding-service.ts`, `lib/onboarding-configs.ts`, `lib/onboarding-config.ts`, `lib/onboarding-email-service.ts`, `lib/onboarding-email-automation.ts`, `lib/onboarding-chatbot-service.ts`, `lib/onboarding-role-adapter.ts`, `lib/onboarding-webhook-system.ts`
- `lib/stripe-config.ts`, `lib/stripe-connect-service.ts`, `lib/stripe-subscription-service.ts`, `lib/stripe-coupon-service.ts`, `lib/stripe-customer.ts`
- `lib/pagination.ts`, `lib/pagination-helper.ts`
- `lib/performance.ts`, `lib/performance-utils.ts`

**Accion**: Consolidar servicios duplicados. Un servicio por dominio. Eliminar los que no se importan en ningun lugar.

### 2.3 Error boundaries insuficientes

**Problema**: Solo hay 5 archivos `error.tsx` y 5 `loading.tsx` para 548 paginas.

**Impacto**: Si una pagina falla, el error burbujea hasta el root `error.tsx`, perdiendo todo el contexto de la pagina. No hay feedback de carga en la mayoria de secciones.

**Accion**: Anadir `error.tsx` y `loading.tsx` al menos en:
- `app/(protected)/` - layout protegido
- `app/admin/` - zona admin
- `app/dashboard/` - dashboard principal
- Cada vertical principal (ewoorker, partners, etc.)

### 2.4 `noUnusedLocals: false` y `noUnusedParameters: false`

**Problema**: TypeScript no detecta variables y parametros sin usar. Esto acumula codigo muerto y dificulta refactoring.

**Accion**: Activar ambas opciones y limpiar warnings progresivamente. Esto identificara codigo muerto que se puede eliminar.

---

## 3. RENDIMIENTO - PRIORIDAD ALTA

### 3.1 Next.js 14.2 en lugar de 15.x

**Problema**: El cursorrules documenta "Next.js 15.5.9" y "React 19.2.3" pero `package.json` tiene `next: ^14.2.35` y `react: ^18.3.1`.

**Impacto**:
- Sin React 19 Server Components optimizados
- Sin Turbopack estable
- Sin mejoras de caching de Next 15
- El `experimental.typedRoutes` que esta activado es mas maduro en v15

**Accion**: Actualizar a Next.js 15 + React 19. Requiere:
1. Actualizar deps
2. Verificar cambios breaking (params async, `cookies()` async)
3. Testing completo post-migracion

### 3.2 `output: 'standalone'` desactivado

**Problema**: La opcion standalone esta comentada ("causa problemas con prerender-manifest.json"). Sin standalone, el deploy incluye todo `node_modules` innecesario.

**Impacto**: Deploy mas pesado, cold starts mas lentos, consumo de disco mayor en servidor.

**Accion**: Investigar y resolver el bug con prerender-manifest. Standalone reduce el tamano del deploy de ~1GB a ~50-100MB.

### 3.3 Optimizacion de chunks desactivada

**Problema**: La configuracion de `splitChunks` personalizada esta comentada en webpack porque "causaba que CSS se cargue como `<script>`".

**Impacto**: Bundles de cliente no optimizados. Paginas cargan mas JS del necesario.

**Accion**: Con la migracion a Next 15 + Turbopack, este problema probablemente se resuelva. Alternativamente, probar configuraciones mas conservadoras de splitChunks.

### 3.4 browserslist incluye IE 11

**Problema**: `"ie >= 11"` en browserslist. IE 11 esta descontinuado desde 2022. Esto fuerza polyfills innecesarios en el bundle.

**Accion**: Eliminar `"ie >= 11"` de browserslist. Esto reducira el tamano del bundle de cliente.

---

## 4. TESTING - PRIORIDAD ALTA

### 4.1 Cobertura de tests vs codigo

**Problema**: 384 archivos de test para 939 API routes + 548 pages + 331 componentes = 1,818 archivos testeables.

**Cobertura estimada**: ~21%. El cursorrules marca como objetivo 80%+ en codigo critico.

**Accion**: Priorizar tests en:
1. Rutas de auth (ya existen parcialmente)
2. APIs de payment (Stripe, billing)
3. CRUD critico (properties, contracts, tenants)
4. Middleware de seguridad

### 4.2 Dual test framework (Vitest + Jest)

**Problema**: Existen dependencias de Vitest Y Jest simultaneamente. Los scripts tienen `test:jest-legacy`.

**Accion**: Migrar todo a Vitest (ya es el principal) y eliminar Jest como dependencia.

---

## 5. OBSERVABILIDAD - PRIORIDAD MEDIA

### 5.1 console.log en produccion

**Problema**: 36 API routes usan `console.log/warn/error` directamente en lugar del logger Winston configurado. El `removeConsole` en next.config solo elimina `console.log` pero no `console.warn/error`.

**Accion**: Reemplazar todos los `console.*` por `logger.*` en API routes. Winston ya esta configurado y la mayoria (831 routes) ya lo usan.

### 5.2 Sentry parcialmente integrado

**Problema**: `@sentry/nextjs` esta en dependencias pero no hay evidencia de `sentry.server.config.ts`, `sentry.client.config.ts` o `sentry.edge.config.ts` en la raiz.

**Accion**: Verificar que Sentry este correctamente instrumentado para capturar errores en servidor, cliente y edge.

---

## 6. DX (Developer Experience) - PRIORIDAD MEDIA

### 6.1 Dependencias masivas sin audit

**Problema**: 160+ dependencias de produccion. Muchas parecen no estar activamente usadas o son redundantes:
- `swr` + `@tanstack/react-query` (dos librerias de data fetching)
- `react-hot-toast` + `sonner` (dos librerias de toasts)
- `axios` + `fetch` nativo (Next.js ya incluye fetch mejorado)
- `puppeteer` en dependencias de produccion (deberia ser devDep)
- `canvas` en produccion (pesado, solo para generacion de imagenes)
- `webpack` como dependencia directa (Next.js ya lo incluye)
- `jspdf` + `pdfkit` + `pdf-lib` (tres librerias de PDF)
- `@apollo/client` + `@apollo/server` + `graphql` (GraphQL completo cuando la app usa REST)

**Accion**:
1. Mover `puppeteer` a devDependencies
2. Elegir una libreria de toasts (sonner) y eliminar react-hot-toast
3. Elegir una libreria de PDF y consolidar
4. Evaluar si GraphQL/Apollo se usa realmente
5. Eliminar `axios` si solo se usa fetch
6. Eliminar `webpack` como dep directa

### 6.2 Storybook configurado pero probablemente sin uso

**Problema**: Storybook v10 esta en devDependencies pero no hay evidencia de archivos `.stories.tsx`.

**Accion**: Si no se usa, eliminar las dependencias de Storybook (4-5 packages). Si se planea usar, crear stories para componentes UI core.

---

## 7. CURSORRULES ESPECIFICOS - DEUDA DOCUMENTADA

El propio `.cursorrules` documenta problemas conocidos que no se han resuelto:

| Problema documentado | Status | Seccion |
|---|---|---|
| `strict: false` en tsconfig | YA CORREGIDO (strict: true activo) | Stack Tecnologico |
| 105+ funciones helper con prisma scope por revisar | PENDIENTE | next.config.js comentario |
| DATABASE_URL placeholder en produccion | PENDIENTE (documentado como "pendiente critico") | Aprendizajes 3 Enero |
| TypeScript `ignoreBuildErrors: true` revertido temporalmente | SIGUE REVERTIDO | next.config.js |
| ESLint `ignoreDuringBuilds: true` | SIGUE ACTIVO | next.config.js |
| Next.js 15 documentado pero usando 14.2 | DISCREPANCIA | Stack vs package.json |
| React 19 documentado pero usando 18.3 | DISCREPANCIA | Stack vs package.json |

---

## RESUMEN PRIORIZADO

### Critico (hacer ya)
1. Proteger las 165 API routes sin autenticacion
2. Resolver `ignoreBuildErrors: true` progresivamente
3. Fix DATABASE_URL placeholder en produccion

### Alta (proximas 2-4 semanas)
4. Consolidar rate limiting (3 implementaciones -> 1)
5. Consolidar servicios duplicados en lib/
6. Anadir error.tsx y loading.tsx en secciones principales
7. Implementar validacion Zod en endpoints POST/PUT sin validar
8. Eliminar `"ie >= 11"` de browserslist

### Media (proximo mes)
9. Actualizar a Next.js 15 + React 19
10. Limpiar dependencias duplicadas/no usadas
11. Migrar todos los console.* a logger
12. Activar noUnusedLocals/noUnusedParameters
13. Consolidar test framework en Vitest
14. Auditar los 367 modelos Prisma (eliminar no usados)
