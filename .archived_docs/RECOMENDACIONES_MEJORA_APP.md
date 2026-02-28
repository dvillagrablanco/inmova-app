# Recomendaciones de Mejora - Inmova App (Estado: Feb 2026)

## RESUMEN DE CAMBIOS APLICADOS

### SEGURIDAD
- [x] **Auth guards en 37+ API routes** criticas (portal-proveedor, portal-propietario, accounting, support, cron)
- [x] **Creado `lib/api-auth-guard.ts`** con helpers: `requireSession`, `requireJWT`, `requireCronSecret`
- [x] **17 cron jobs protegidos** con CRON_SECRET
- [x] **`ignoreBuildErrors: false`** reactivado - 0 errores TS en codigo propio

### ARQUITECTURA
- [x] **96 archivos lib/ eliminados** (dead code) - de 295 a 199 archivos, ~35K lineas removidas
- [x] **Rate limiting consolidado** - de 3 implementaciones a 1 (`lib/rate-limiting.ts`)
- [x] **20 error.tsx + 20 loading.tsx** creados en secciones principales
- [x] **Import fix en `api-cache-helpers.ts`** - inline cache reemplaza dependencia eliminada

### RENDIMIENTO
- [x] **IE 11 eliminado de browserslist** - menos polyfills en bundle
- [x] **`noUnusedLocals: true` y `noUnusedParameters: true`** activados en tsconfig

### DX
- [x] **Jest eliminado** - consolidado en Vitest unicamente
- [x] **7 dependencias eliminadas**: Apollo/GraphQL (5 pkgs), pdf-lib, webpack directo
- [x] **puppeteer movido a devDependencies**
- [x] **36 API routes migradas** de `console.*` a `logger.*`

### DOCUMENTACION
- [x] **cursorrules actualizado**: Next.js 14.2.35, React 18.3.1, migracion a v15 postponida Q3 2026
- [x] **65 modelos Prisma sin uso documentados** en PRISMA_UNUSED_MODELS.md

## PENDIENTE (no ejecutado por limitaciones del entorno)

### Requiere acceso al servidor de produccion
- [ ] Fix DATABASE_URL placeholder en produccion
- [ ] Verificar CRON_SECRET configurado en .env.production

### Requiere evaluacion con mas contexto
- [ ] Migrar a Next.js 15 + React 19 (postponido por inestabilidad)
- [ ] Activar `output: 'standalone'` (requiere resolver bug prerender-manifest)
- [ ] Activar `eslint.ignoreDuringBuilds: false` (requiere fix de warnings ESLint)
- [ ] Eliminar 65 modelos Prisma no usados (requiere verificar datos en produccion)
- [ ] Consolidar react-hot-toast -> sonner (33+ archivos a migrar)
- [ ] Consolidar swr -> react-query (1 archivo, bajo impacto)
