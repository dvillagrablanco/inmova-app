# Proximos Pasos - Basados en .cursorrules

Priorizados por impacto y dependencias. No son features nuevas, sino lo que el cursorrules ya define como necesario.

---

## PRIORIDAD 1: TESTING (el cursorrules lo marca como OBLIGATORIO pre-deployment)

### 1.1 Arreglar tests rotos
Los tests actuales fallan por 3 razones:
- `api-cache-helpers.ts` referenciaba `redis-cache-service.ts` eliminado (ya arreglado en codigo pero tests no actualizados)
- Mocks de Prisma usan `prisma.model` directo pero el codigo usa `getPrismaClient()` lazy
- `payments-api-complete.test.ts` tiene error de hoisting en `vi.mock`

**Accion**: Actualizar los 5 tests rotos para que usen el patron lazy de Prisma.

### 1.2 Cobertura de tests criticos
El cursorrules define 4 tests que **NUNCA pueden fallar**:
- `npm run test:smoke` - Paginas cargan
- `npm run test:api-contract` - APIs formato correcto
- `npm run verify:schema` - Schema BD sincronizado
- `npm run test:e2e` - CRUD funciona

**Accion**: Verificar que los 4 comandos pasan. Arreglar los que no.

### 1.3 Husky pre-commit/pre-push deprecation
Husky muestra warnings de deprecacion (v10 rompe). El `.husky/pre-commit` usa formato viejo.

**Accion**: Actualizar formato de hooks Husky (eliminar las 2 lineas deprecadas).

---

## PRIORIDAD 2: CONSOLIDAR TOASTS (react-hot-toast -> sonner)

34 archivos usan `react-hot-toast` vs 427 que usan `sonner`. El cursorrules no menciona react-hot-toast en el stack.

**Accion**: Migrar los 34 archivos de `toast()` de react-hot-toast a `toast()` de sonner. Eliminar dependencia `react-hot-toast`.

---

## PRIORIDAD 3: ESLINT (reactivar en builds)

`eslint.ignoreDuringBuilds: true` sigue activo. ESLint no esta configurado interactivamente (falta `.eslintrc` finalizado - solo hay `eslint.config.js`).

**Accion**:
1. Ejecutar `next lint` y contar warnings/errors
2. Arreglar errores criticos
3. Cambiar `ignoreDuringBuilds: false`

---

## PRIORIDAD 4: SENTRY INSTRUMENTACION COMPLETA

Sentry configs existen (`sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`) pero el cursorrules documenta que en muchas API routes se usa `console.error` (ya migrado a logger) sin capturar en Sentry.

**Accion**: Verificar que `Sentry.captureException` se llama en los catch blocks de API routes criticas (auth, payments, contracts).

---

## PRIORIDAD 5: CURSORRULES DESACTUALIZADO

El `.cursorrules` tiene informacion incorrecta despues del cleanup:

1. **Seccion Testing** dice "Integration Tests: Jest 30.2.0" - Jest fue eliminado
2. **Seccion Rate Limiting** dice "@upstash/ratelimit + rate-limiter-flexible" - ahora es solo `lib/rate-limiting.ts`
3. **Seccion Integraciones** lista servicios que fueron eliminados (Zucchetti sync, etc.)
4. **Metricas** dice "Integraciones: 7/11 operativas (64%)" - desactualizado tras cleanup
5. **Seccion "strict: false"** - ya se corrigio a `strict: true`

**Accion**: Actualizar las secciones del cursorrules para reflejar el estado real post-cleanup.

---

## PRIORIDAD 6: OUTPUT STANDALONE

`output: 'standalone'` esta desactivado por "problemas con prerender-manifest.json".

**Accion**: Investigar si el bug persiste con la version actual. Standalone reduce el deploy de ~1GB a ~100MB.

---

## PRIORIDAD 7: VERTICALES EN AMARILLO/ROJO DEL CURSORRULES

El cursorrules lista 3 verticales incompletas:

- **IA & Automatizacion** (amarillo): Las APIs de valoracion (`/api/valuations/*`) existen. Falta conectar con frontend completo y afinar prompts.
- **Firma Digital** (rojo): La API `/api/signatures/create` existe. Falta integrar con Signaturit/DocuSign en produccion.
- **Tours Virtuales** (rojo): La API `/api/virtual-tours` existe. Falta integrar con Matterport o similar.

**Nota**: Estos son desarrollos nuevos, no mejoras sobre lo existente. Se mencionan porque el cursorrules los marca como criticos faltantes.

---

## ORDEN DE EJECUCION RECOMENDADO

```
Semana 1: Tests (1.1, 1.2, 1.3) + Consolidar toasts (2)
Semana 2: ESLint (3) + Sentry (4) + Actualizar cursorrules (5)
Semana 3: Output standalone (6)
Futuro:   Verticales IA/Firma/Tours (7) - cuando haya decisiones de producto
```
