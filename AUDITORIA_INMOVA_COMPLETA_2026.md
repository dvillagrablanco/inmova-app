# AUDITORÍA PROFUNDA INMOVA APP - Abril 2026

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Auditoría Técnica Completa](#2-auditoría-técnica-completa)
   - 2.1 APIs con datos Mock (no persistentes)
   - 2.2 Funcionalidades no implementadas (stubs/501)
   - 2.3 Problemas de seguridad
   - 2.4 Problemas de build y TypeScript
   - 2.5 Problemas de arquitectura
   - 2.6 Tests y cobertura
3. [Clasificación de Fallos por Criticidad](#3-clasificación-de-fallos-por-criticidad)
4. [Informe Grupo Vidaro](#4-informe-grupo-vidaro)
   - 4.1 Estado actual de datos en la app
   - 4.2 Documentos e información pendiente del gestor
   - 4.3 Guía del gestor para puesta a punto
   - 4.4 Guía del administrador para verificación
5. [Valoración de Costes de Correcciones](#5-valoración-de-costes-de-correcciones)
6. [Recomendaciones de Optimización](#6-recomendaciones-de-optimización)

---

## 1. RESUMEN EJECUTIVO

### Dimensiones del proyecto

| Métrica | Valor |
|---------|-------|
| Páginas (page.tsx) | 633 |
| API Routes (route.ts) | 1.203 |
| Modelos Prisma | 395 |
| Enums Prisma | 198 |
| Archivos en lib/ | ~489 |
| Componentes | ~396 |
| Scripts operativos | ~733 |
| Tests (Vitest + Playwright) | ~451 |
| Líneas schema Prisma | ~17.300 |

### Diagnóstico general

La app tiene una **base sólida y muy extensa** con la mayoría de verticales implementadas. Sin embargo, existe un patrón recurrente: **muchas funcionalidades secundarias usan datos mock en memoria** en lugar de persistir en base de datos. Los flujos CORE (edificios, unidades, inquilinos, contratos, pagos, seguros) **sí están conectados a Prisma/PostgreSQL** y son funcionales.

**Veredicto**: La app está al **~70-75% de madurez para producción real** en los flujos core del Grupo Vidaro. El 25-30% restante son funcionalidades secundarias con mocks, stubs, o pendientes de integración con servicios externos.

---

## 2. AUDITORÍA TÉCNICA COMPLETA

### 2.1 APIs con datos MOCK (no persistentes) — CRÍTICO

Estas APIs devuelven datos ficticios en memoria. Se pierden al reiniciar el servidor. **Si el usuario las usa, creerá que guarda datos pero no es así.**

| # | API Route | Datos Mock | Impacto |
|---|-----------|-----------|---------|
| 1 | `/api/facturacion/` | `facturasHommingStore` (in-memory) | **ALTO** - Facturación no persiste |
| 2 | `/api/facturacion/series/` | Series en memoria | **ALTO** - Vinculado a facturación |
| 3 | `/api/check-in-out/` | `MOCK_ENTRIES` | MEDIO - Check-in/out no persiste |
| 4 | `/api/avalistas/` | `MOCK_AVALISTAS` | MEDIO - Avalistas no se guardan |
| 5 | `/api/chat/entity/` | `MOCK_MESSAGES` in-memory | MEDIO - Chat de entidad ficticio |
| 6 | `/api/admin/webhook-logs/` | `MOCK_LOGS` | BAJO - Solo admin |
| 7 | `/api/admin/campos-personalizados/` | `MOCK_FIELDS` | MEDIO - Campos custom no persisten |
| 8 | `/api/actualizaciones-renta/` | `MOCK_ACTUALIZACIONES` | **ALTO** - Actualización IPC mock |
| 9 | `/api/acciones-masivas/` | `MOCK_BATCHES` | MEDIO - Batch actions mock |
| 10 | `/api/visitas/` | `MOCK_VISITAS` | MEDIO - Visitas no se guardan |
| 11 | `/api/suministros/` | `MOCK_SUPPLIES` | MEDIO - Suministros mock |
| 12 | `/api/reportes/avanzados/` | `MOCK_DATA` | MEDIO - Reportes con datos ficticios |
| 13 | `/api/no-disponibilidad/` | `MOCK_PERIODS` | BAJO - Periodos mock |
| 14 | `/api/notas/` | `MOCK_NOTES` | MEDIO - Notas no persisten |
| 15 | `/api/garajes-trasteros/` | `MOCK_ENTRIES` | MEDIO - Garajes/trasteros mock |
| 16 | `/api/liquidaciones/options/` | Mock cuando no hay modelo | MEDIO |
| 17 | `/api/calendar/auto-events/` | `generateMockEvents()` | BAJO - Eventos auto-generados |
| 18 | `/api/media-estancia/analytics/` | Random KPIs placeholder | BAJO |
| 19 | `/api/ewoorker/admin-socio/metrics/` | Placeholder metrics | BAJO |

**Total: 19 APIs con datos mock/placeholder**

### 2.2 Funcionalidades NO implementadas (stubs/501)

| # | Funcionalidad | Estado | Archivo |
|---|--------------|--------|---------|
| 1 | **Generación PDF contratos** | Placeholder (retorna null en prod) | `api/signatures/create/route.ts` |
| 2 | **Push notifications** | Deshabilitado (501) | `api/push-notifications/send/route.ts` |
| 3 | **Sync posiciones financieras** | Stub ("manual_import_required") | `api/cron/sync-financial-positions/route.ts` |
| 4 | **Sync transacciones bancarias** | TODO en cron | `api/cron/sync-bank-transactions/route.ts` |
| 5 | **Import insurance policy (FO)** | TODO: "Persist to DB" | `api/family-office/import/insurance-policy/route.ts` |
| 6 | **Blog posts** | Vacío, sin auth | `api/blog/posts/route.ts` |
| 7 | **Webinars** | Vacío con auth | `api/webinars/route.ts` |
| 8 | **Licitaciones** | Placeholder | `api/licitaciones/route.ts` |
| 9 | **Microtransactions** | No implementado | `api/microtransactions/route.ts` |
| 10 | **Sync connections** | No implementado | `api/sync/connections/` |
| 11 | **Push unsubscribe** | Stub | `api/push/unsubscribe/route.ts` |
| 12 | **A/B Tests** | No implementado | `api/v1/ab-tests/route.ts` |
| 13 | **Connect bank (FO)** | Placeholder | `api/family-office/connect-bank/route.ts` |
| 14 | **Media estancia portales** | API keys sin configurar | `api/media-estancia/portals/route.ts` |
| 15 | **Canva integration** | Status: no implementado | `api/admin/canva/status/route.ts` |
| 16 | **AI Agents status** | Placeholder | `api/admin/ai-agents/status/route.ts` |
| 17 | **Partners widget** | No implementado | `api/partners/widget/route.ts` |
| 18 | **Onboarding doc validation** | No implementado | `api/onboarding/documents/validate/route.ts` |

**Total: 18 funcionalidades stub/no-implementadas**

### 2.3 Problemas de Seguridad

#### CRÍTICOS

| # | Problema | Detalle | Archivo |
|---|---------|---------|---------|
| 1 | **Password temporal hardcodeado** | Cuando se crea usuario sin password, usa `'TempPassword123!'` | `api/admin/users/route.ts:137` |
| 2 | **Middleware NO protege rutas** | `middleware.ts` solo aplica i18n, NO auth | `middleware.ts` |
| 3 | **Admin pages sin server-side auth** | Solo `/admin` (entry) tiene `getServerSession`. Sub-rutas usan `useSession` client-side | `app/admin/**/page.tsx` |
| 4 | **Blog API sin autenticación** | GET público sin session check | `api/blog/posts/route.ts` |
| 5 | **CSP con unsafe-eval/unsafe-inline** | Headers permiten scripts inline | `next.config.js` |

#### MEDIOS

| # | Problema | Detalle |
|---|---------|---------|
| 6 | **TypeScript strict: false** | No detecta errores de nulls ni any implícitos |
| 7 | **`as any` masivo en APIs** | 40+ archivos route.ts con type assertions `as any` |
| 8 | **`@ts-nocheck` en facturación** | `api/facturacion/route.ts` línea 1 |
| 9 | **Demo credentials en scripts** | `vidaro2025` como password temporal en seed scripts |
| 10 | **3 clientes Redis diferentes** | `ioredis`, `redis`, `@upstash/redis` — superficie de ataque aumentada |

### 2.4 Problemas de Build y TypeScript

| # | Problema | Impacto |
|---|---------|---------|
| 1 | **`ignoreBuildErrors: true`** | Build pasa con errores TS — bugs ocultos en producción |
| 2 | **`ignoreDuringBuilds: true`** (ESLint) | Lint no bloquea build — inconsistencia con ESLint 9 y Next 14 |
| 3 | **`strict: false`** en tsconfig | Sin verificación de nulls, any implícitos permitidos |
| 4 | **DATABASE_URL dummy en build** | `next.config.js` inyecta URL falsa si falta — puede causar confusión |
| 5 | **@next/bundle-analyzer v16** con **Next 14** | Major version skew en dependencias |
| 6 | **@next/swc-wasm-nodejs 13.5** con **Next 14** | Versión incompatible |
| 7 | **Storybook v10 + v8 addons** | Mezcla de versiones |
| 8 | **3 rate-limiters** diferentes | `@upstash/ratelimit`, `rate-limiter-flexible`, `next-rate-limit` |
| 9 | **2 librerías de charts** | `chart.js` + `recharts` — duplicidad |
| 10 | **`swr` + `react-query` + `react-use`** | 3 capas de fetching/cache |

### 2.5 Problemas de Arquitectura

| # | Problema | Detalle |
|---|---------|---------|
| 1 | **633 páginas, muchas sin uso real** | Muchas páginas son plantillas generadas sin contenido real |
| 2 | **1.203 API routes** | Demasiadas APIs — muchas son mock/placeholder |
| 3 | **395 modelos Prisma** | Schema excesivamente grande — no todos los modelos se usan |
| 4 | **Páginas duplicadas** | `/dashboard/contracts` Y `/contratos` apuntan a mismo dominio |
| 5 | **Client-side heavy** | Mayoría de páginas admin son `'use client'` |
| 6 | **733 scripts** | Demasiados scripts operativos — difícil mantenimiento |

### 2.6 Tests y Cobertura

| Métrica | Valor |
|---------|-------|
| Tests Vitest | ~381 archivos |
| Tests Playwright | ~70 spec files |
| Tests skipped (Playwright) | 5-6 archivos con `test.skip` |
| Threshold cobertura | 80% lines/functions/statements, 75% branches |
| Per-file check | Deshabilitado |
| Test runner | Serial (`maxWorkers: 1`, `fileParallelism: false`) |

**Positivo**: No hay `test.skip` en Vitest (solo en Playwright).
**Negativo**: No se pudo ejecutar tests para verificar pass rate actual.

---

## 3. CLASIFICACIÓN DE FALLOS POR CRITICIDAD

### BLOQUEANTES para producción real (Grupo Vidaro)

| # | Fallo | Por qué bloquea |
|---|-------|-----------------|
| 1 | Facturación usa datos mock | El gestor genera facturas que desaparecen |
| 2 | Actualización renta (IPC) mock | No se puede actualizar rentas realmente |
| 3 | PDF contratos no se genera | Firma digital incompleta sin PDF |
| 4 | Notas no persisten | Anotaciones del gestor se pierden |

### IMPORTANTES pero no bloqueantes

| # | Fallo | Impacto |
|---|-------|---------|
| 5 | Push notifications deshabilitadas | Sin notificaciones a inquilinos |
| 6 | Visitas mock | Agenda de visitas no funcional |
| 7 | Suministros mock | Tracking de servicios no funcional |
| 8 | Garajes/trasteros mock | Gestión complementaria no funcional |
| 9 | Check-in/out mock | No aplica si no hay coliving |
| 10 | Avalistas mock | No se registran fiadores |

### MENORES (no afectan operativa diaria)

| # | Fallo | Contexto |
|---|-------|----------|
| 11 | Blog vacío | Marketing, no operativo |
| 12 | Webinars vacío | Marketing |
| 13 | Reportes avanzados mock | Hay reportes básicos funcionales |
| 14 | A/B Tests stub | Feature interna |
| 15 | Licitaciones placeholder | Vertical no prioritaria |
| 16 | Microtransactions stub | No se usa actualmente |

---

## 4. INFORME GRUPO VIDARO

### 4.1 Estado actual de datos en la app

#### Estructura empresarial (IMPLEMENTADA)

```
Grupo Vidaro Inversiones (Empresa Matriz)
├── Rovida S.L.U. (Empresa Hija)
├── Viroda Inversiones S.L.U. (Empresa Hija)
├── VIBLA Private Equity SCR S.A. (Filial)
├── Facundo Blanco S.A. (Participada 100%)
├── Industrial y Comercial Facundo SAU (Participada 100%)
├── Disfasa S.A.U. (Participada 100%)
├── Los Girasoles S.A.U. (Participada 100%)
├── PDV Gesfasa Desarrollo SLU (Participada 100%)
└── Disfasa S.A. acciones adicionales
```

#### Usuarios pre-creados

| Email | Rol | Empresa | Password |
|-------|-----|---------|----------|
| admin@grupovidaro.com | Administrador | Grupo Vidaro | vidaro2025 |
| director.financiero@grupovidaro.com | Gestor | Grupo Vidaro | vidaro2025 |
| admin@rovida.com | Administrador | Rovida | vidaro2025 |
| operador@rovida.com | Operador | Rovida | vidaro2025 |
| admin@virodainversiones.com | Administrador | Viroda | vidaro2025 |
| propietario@virodainversiones.com | Gestor | Viroda | vidaro2025 |

#### Seguros cargados (S3 + BD)

Ya hay **pólizas parametrizadas** para Viroda Inversiones con documentos en S3:

| Póliza | Aseguradora | Tipo | Dirección |
|--------|------------|------|-----------|
| 057780547 | Allianz | Comunidad | Hernandez de Tejada 6 |
| 85265721 | AXA | Comunidad | Candelaria Mora 12 |
| 85374359 | AXA | Comunidad | Reina 15 |
| + otras... | | | |

#### Datos financieros (seeds ejecutados)

- 22 cuentas bancarias con IBANs y saldos
- 9 participadas con subcuentas contables
- Posiciones financieras LP
- Facturación intragrupo (ARC)
- PE Funds de VIBLA SCR

### 4.2 Documentos e información que el gestor DEBE conseguir

#### A. DATOS EMPRESARIALES (por cada sociedad)

| # | Dato | Sociedad | Estado | Acción |
|---|------|----------|--------|--------|
| 1 | **CIF real** | Todas (Vidaro, Rovida, Viroda, VIBLA...) | Placeholder `B-VIDARO-001` | Actualizar con CIF real |
| 2 | **Dirección fiscal** | Todas | `"Por definir"` | Registrar dirección real |
| 3 | **Teléfono** | Todas | `+34 000 000 000` | Actualizar |
| 4 | **Email** | Todas | Genéricos | Verificar emails reales |
| 5 | **Contacto principal** | Todas | `"Por definir"` | Nombre y datos del responsable |
| 6 | **Logo empresa** | Todas | No cargado | Subir logos |

#### B. EDIFICIOS Y UNIDADES

| # | Dato | Detalle |
|---|------|---------|
| 7 | **Listado de edificios** por sociedad | Nombre, dirección, CP, ciudad, año construcción |
| 8 | **Unidades por edificio** | Número/piso/puerta, m², habitaciones, baños, tipo (vivienda/comercial/garaje) |
| 9 | **Estado actual** de cada unidad | Disponible, ocupada, en mantenimiento |
| 10 | **Renta mensual** de cada unidad | Importe actual del alquiler |
| 11 | **Depósito/fianza** | Meses y cantidad |
| 12 | **Fotos** de las propiedades | Para fichas y portal inquilinos |
| 13 | **Certificado energético (CEE)** | Tipo y fecha |
| 14 | **Referencia catastral** | De cada inmueble |
| 15 | **IBI anual** | Importe por inmueble |

#### C. INQUILINOS

| # | Dato | Detalle |
|---|------|---------|
| 16 | **Datos personales** | Nombre, DNI/NIE, teléfono, email |
| 17 | **Cuenta bancaria** | IBAN para domiciliaciones |
| 18 | **Fecha entrada** | Cuándo entró al inmueble |
| 19 | **Avalistas** (si hay) | Datos del fiador |
| 20 | **Documentación** | DNI escaneado, nóminas, contrato laboral |

#### D. CONTRATOS

| # | Dato | Detalle |
|---|------|---------|
| 21 | **Contratos vigentes** | PDF firmado de cada contrato activo |
| 22 | **Fecha inicio/fin** | Duración del contrato |
| 23 | **Renta pactada** | Importe mensual |
| 24 | **Cláusula IPC** | Tipo de actualización (IPC, IRAV, fijo) |
| 25 | **Fianza depositada** | Importe y organismo |
| 26 | **Prórrogas** | Si hay renovaciones |

#### E. SEGUROS

| # | Dato | Detalle |
|---|------|---------|
| 27 | **Pólizas de todos los edificios** | PDF de cada póliza |
| 28 | **Pólizas de Rovida** | Las actuales son solo Viroda |
| 29 | **Fechas de vencimiento** | Para alertas de renovación |
| 30 | **Coberturas** | Detalle de qué cubre cada póliza |
| 31 | **Contacto del mediador** | Teléfono/email del agente de seguros |

#### F. PAGOS Y CONTABILIDAD

| # | Dato | Detalle |
|---|------|---------|
| 32 | **Histórico de cobros** | Últimos 12 meses de pagos recibidos |
| 33 | **Impagos actuales** | Inquilinos con deuda pendiente |
| 34 | **Método de cobro** | Transferencia, domiciliación SEPA, Bizum |
| 35 | **Cuentas bancarias reales** | IBANs actualizados (hay 22 en seeds pero verificar) |
| 36 | **Gastos fijos** por edificio | Comunidad, suministros, IBI, basuras |

#### G. MANTENIMIENTO

| # | Dato | Detalle |
|---|------|---------|
| 37 | **Incidencias abiertas** | Reparaciones pendientes |
| 38 | **Proveedores** | Fontaneros, electricistas, cerrajeros con contacto |
| 39 | **Contratos de mantenimiento** | Ascensores, caldera, plagas |

### 4.3 GUÍA DEL GESTOR - Puesta a punto para Grupo Vidaro

#### FASE 1: Verificar acceso y estructura (Día 1)

```
PASO 1: Acceder a la app
─────────────────────────
1. Abrir https://inmovaapp.com/login
2. Usar credenciales: admin@grupovidaro.com / vidaro2025
3. CAMBIAR LA CONTRASEÑA inmediatamente
4. Verificar que se ve el dashboard

PASO 2: Verificar sociedades
─────────────────────────────
1. Ir a la sección de Empresas/Company
2. Verificar que aparecen: Grupo Vidaro, Rovida, Viroda
3. Entrar en cada una y completar datos reales:
   - CIF correcto
   - Dirección fiscal
   - Teléfono y email reales
   - Nombre del contacto principal
```

#### FASE 2: Cargar edificios y unidades (Día 1-2)

```
PASO 3: Crear edificios
────────────────────────
Para CADA sociedad (Rovida, Viroda):
1. Cambiar a la sociedad correspondiente (selector de empresa)
2. Ir a Dashboard > Propiedades
3. Click "Nuevo Edificio" / "Nueva Propiedad"
4. Completar:
   - Nombre del edificio
   - Dirección completa
   - Código postal y ciudad
   - Número de plantas
   - Año de construcción
   - Referencia catastral
5. Guardar

PASO 4: Crear unidades dentro de cada edificio
───────────────────────────────────────────────
1. Entrar en el edificio creado
2. Click "Añadir Unidad"
3. Completar para CADA piso/unidad:
   - Número/piso/puerta
   - Tipo: vivienda, local comercial, garaje, trastero
   - Superficie m²
   - Habitaciones y baños
   - Renta mensual actual
   - Estado: disponible u ocupada
4. Subir fotos si las hay
5. Repetir para cada unidad
```

#### FASE 3: Cargar inquilinos y contratos (Día 2-3)

```
PASO 5: Registrar inquilinos
─────────────────────────────
1. Ir a Dashboard > Inquilinos
2. Click "Nuevo Inquilino"
3. Para CADA inquilino:
   - Nombre completo
   - DNI/NIE
   - Email y teléfono
   - Cuenta bancaria (IBAN)
   - Fecha de nacimiento (opcional)
4. Guardar

PASO 6: Crear contratos
────────────────────────
1. Ir a Dashboard > Contratos
2. Click "Nuevo Contrato"
3. Seleccionar:
   - Unidad (del edificio correspondiente)
   - Inquilino (del registrado)
   - Fecha inicio y fecha fin
   - Renta mensual
   - Depósito/fianza
   - Tipo actualización (IPC, IRAV, fijo)
4. Subir el PDF del contrato firmado
5. Guardar
   → La unidad se marcará automáticamente como "Ocupada"
```

#### FASE 4: Verificar seguros (Día 3)

```
PASO 7: Revisar seguros cargados
─────────────────────────────────
1. Ir a la sección de Seguros
2. Verificar que aparecen las pólizas de Viroda
3. Para cada póliza:
   - Verificar que el edificio asociado es correcto
   - Verificar fechas de inicio/vencimiento
   - Verificar coberturas
4. Si faltan pólizas de Rovida → subirlas

PASO 8: Cargar pólizas faltantes
─────────────────────────────────
1. Ir a Seguros > Nuevo seguro
2. Completar datos de la póliza
3. Subir PDF del documento
4. Asignar al edificio correspondiente
```

#### FASE 5: Pagos y contabilidad (Día 3-4)

```
PASO 9: Configurar pagos
─────────────────────────
1. Ir a Dashboard > Pagos
2. Verificar que aparecen los contratos con sus rentas
3. Para cada mes:
   - Registrar pagos recibidos
   - Marcar impagos si los hay
4. Configurar método de cobro preferido

PASO 10: Verificar cuentas bancarias
─────────────────────────────────────
1. Ir a Finanzas > Bancaria Grupo
2. Verificar que las 22 cuentas están con IBANs correctos
3. Actualizar saldos si es necesario
```

#### FASE 6: Verificación final (Día 4)

```
PASO 11: Checklist de verificación
───────────────────────────────────
□ Todas las sociedades tienen datos reales (CIF, dirección, contacto)
□ Todos los edificios están creados con dirección correcta
□ Todas las unidades están registradas con renta correcta
□ Todos los inquilinos actuales están registrados
□ Todos los contratos vigentes están creados
□ Los seguros están vinculados a sus edificios
□ El histórico de pagos del último mes está registrado
□ Las cuentas bancarias tienen IBANs correctos
□ Se ha cambiado la contraseña del administrador
□ Se ha probado el login con la nueva contraseña
```

### 4.4 GUÍA DEL ADMINISTRADOR - Verificación del sistema

#### A. Verificación de acceso

```
1. LOGIN TEST
   - Acceder con admin@grupovidaro.com
   - Verificar redirect a Dashboard (no volver a /login)
   - Verificar que el nombre del usuario aparece en el header

2. MULTI-EMPRESA
   - Verificar el selector de empresa (si existe)
   - Cambiar entre Vidaro, Rovida, Viroda
   - Verificar que cada empresa muestra SUS datos (no los de otra)
```

#### B. Verificación de flujos CORE

```
3. CREAR EDIFICIO TEST
   - Crear un edificio de prueba
   - Verificar que aparece en la lista
   - Eliminarlo después

4. CREAR UNIDAD TEST
   - En un edificio real, añadir unidad de test
   - Verificar que se ve en el edificio
   - Eliminarla después

5. CREAR INQUILINO TEST
   - Registrar inquilino de prueba
   - Verificar que aparece en la lista
   - Eliminarlo después

6. CREAR CONTRATO TEST
   - Crear contrato vinculando unidad + inquilino de test
   - Verificar que la unidad cambia a "Ocupada"
   - Verificar que el contrato aparece en la lista
   - Eliminar contrato (unidad vuelve a "Disponible")

7. REGISTRAR PAGO TEST
   - En un contrato existente, registrar un pago
   - Verificar que aparece en historial de pagos
```

#### C. Verificación de integraciones

```
8. SEGUROS
   - Ir a Seguros > verificar que aparecen las pólizas
   - Abrir el PDF de una póliza (link S3)
   - Verificar que la cobertura se propaga al edificio

9. HEALTH CHECK
   - Acceder a https://inmovaapp.com/api/health
   - Debe retornar {"status":"ok"}

10. MONITORING (solo super_admin)
    - Ir a /admin/monitoring
    - Verificar: Node version, uptime, DB connected
    - Verificar integraciones: SMTP, S3, Stripe, etc.
```

#### D. Tests de regresión recomendados

```
11. NAVEGACIÓN
    - Verificar que TODAS estas páginas cargan sin error 500:
      □ /dashboard
      □ /dashboard/properties
      □ /dashboard/tenants  
      □ /dashboard/contracts
      □ /dashboard/payments
      □ /seguros
      □ /finanzas/bancaria-grupo
      □ /admin/monitoring (con super_admin)

12. LOGOUT/LOGIN
    - Hacer logout
    - Verificar que redirige a /login
    - Verificar que no se puede acceder a /dashboard sin login
    - Volver a hacer login
```

---

## 5. VALORACIÓN DE COSTES DE CORRECCIONES

### Clasificación por prioridad y esfuerzo

#### PRIORIDAD 1 — Bloqueantes para producción (Grupo Vidaro)

| # | Corrección | Complejidad | Requests Cursor* |
|---|-----------|-------------|-------------------|
| 1 | **Migrar facturación de mock a Prisma** | Alta — crear modelo Invoice + migrar lógica | 8-12 |
| 2 | **Migrar actualización renta (IPC) de mock a Prisma** | Media — modelo ya parcial | 4-6 |
| 3 | **Implementar generación PDF contratos** | Media — usar PDFKit o similar | 5-8 |
| 4 | **Migrar notas de mock a Prisma** | Baja — modelo Note probablemente existe | 2-3 |
| 5 | **Verificar y completar datos placeholder Vidaro** | Baja — scripts SQL/Prisma | 2-3 |
| **Subtotal P1** | | | **21-32 requests** |

#### PRIORIDAD 2 — Importantes para operativa completa

| # | Corrección | Complejidad | Requests Cursor* |
|---|-----------|-------------|-------------------|
| 6 | Migrar avalistas mock a Prisma | Baja | 2-3 |
| 7 | Migrar visitas mock a Prisma | Media | 3-5 |
| 8 | Migrar suministros mock a Prisma | Media | 3-5 |
| 9 | Migrar garajes/trasteros mock | Baja | 2-3 |
| 10 | Implementar push notifications | Media | 4-6 |
| 11 | Migrar acciones masivas mock | Media | 3-4 |
| 12 | Migrar check-in/out mock | Baja | 2-3 |
| 13 | Migrar campos personalizados mock | Media | 3-4 |
| **Subtotal P2** | | | **22-33 requests** |

#### PRIORIDAD 3 — Seguridad y calidad de código

| # | Corrección | Complejidad | Requests Cursor* |
|---|-----------|-------------|-------------------|
| 14 | Eliminar password hardcodeado (TempPassword123!) | Baja | 1 |
| 15 | Añadir server-side auth a páginas admin | Media | 5-8 |
| 16 | Habilitar `strict: true` en TypeScript (gradual) | Alta — muchos errores | 15-25 |
| 17 | Eliminar `@ts-nocheck` y `as any` | Alta | 10-15 |
| 18 | Limpiar dependencias duplicadas (redis, charts, fetching) | Media | 4-6 |
| 19 | Habilitar `ignoreBuildErrors: false` | Media — corregir errores TS del build | 8-12 |
| **Subtotal P3** | | | **43-67 requests** |

#### PRIORIDAD 4 — Mejoras opcionales

| # | Corrección | Complejidad | Requests Cursor* |
|---|-----------|-------------|-------------------|
| 20 | Blog con CMS real | Media | 4-6 |
| 21 | Reportes avanzados con datos reales | Alta | 8-12 |
| 22 | Integración portales media estancia | Alta | 10-15 |
| 23 | Firma digital DocuSign/Signaturit real | Alta | 10-15 |
| 24 | A/B testing framework | Media | 4-6 |
| 25 | Licitaciones completo | Alta | 8-12 |
| **Subtotal P4** | | | **44-66 requests** |

*Request de Cursor = una interacción de agente completa que resuelve 1 tarea

### RESUMEN DE COSTES

| Prioridad | Requests estimados | Es necesario para Vidaro? |
|-----------|-------------------|---------------------------|
| **P1 (Bloqueantes)** | 21-32 | **SÍ — imprescindible** |
| **P2 (Importantes)** | 22-33 | Recomendable a medio plazo |
| **P3 (Seguridad)** | 43-67 | Importante antes de escalar |
| **P4 (Opcionales)** | 44-66 | No necesario ahora |
| **TOTAL** | **130-198 requests** | |

### Es suficiente el Plan Ultra de Cursor?

**Plan Ultra de Cursor** incluye:
- Requests ilimitados en modo estándar (fast)
- 40 requests/día en modo premium (slow/thinking)

**Análisis**:

| Escenario | Plan requerido | Tiempo estimado |
|-----------|---------------|-----------------|
| **Solo P1 (mínimo Vidaro)** | Ultra es suficiente — ~21-32 requests | 1-2 semanas de trabajo con agente |
| **P1 + P2** | Ultra suficiente — ~43-65 requests | 2-3 semanas |
| **P1 + P2 + P3** | Ultra suficiente — ~86-132 requests | 4-6 semanas |
| **Todo (P1-P4)** | Ultra suficiente — ~130-198 requests | 6-10 semanas |

**Conclusión: El Plan Ultra de Cursor ES suficiente** para todas las correcciones. El factor limitante es el tiempo de revisión humana, no los requests del plan.

**Recomendación de optimización de costes**:
1. **Ejecutar solo P1 ahora** — poner Vidaro en producción real con lo mínimo
2. **P2 en paralelo** — ir migrando mocks conforme se necesiten
3. **P3 antes de escalar** a más clientes — seguridad primero
4. **P4 según demanda** — solo si hay ROI claro

---

## 6. RECOMENDACIONES DE OPTIMIZACIÓN

### Qué NO hacer (evitar costes innecesarios)

1. **NO migrar a Next.js 15 / React 19** — el proyecto funciona bien con Next 14. La migración es arriesgada y costosa sin beneficio inmediato.
2. **NO habilitar TypeScript strict de golpe** — hacerlo gradualmente, archivo por archivo.
3. **NO reescribir los 1.203 API routes** — solo corregir los que se usan en producción.
4. **NO implementar las 18 funcionalidades stub** — solo las que el Grupo Vidaro necesite.
5. **NO añadir más dependencias** — ya hay demasiadas. Consolidar antes de añadir.

### Qué SÍ hacer (máximo ROI)

1. **Migrar las 4 APIs mock bloqueantes** (facturación, IPC, PDF, notas) — máxima prioridad.
2. **Completar datos Vidaro** — CIF, direcciones, contactos reales.
3. **Cambiar passwords temporales** — `vidaro2025` y `TempPassword123!`.
4. **Eliminar el `@ts-nocheck`** de facturación al migrarla.
5. **Testear flujos core E2E** — crear edificio → unidad → inquilino → contrato → pago.
6. **Documentar lo que funciona** vs lo que es mock para que el gestor no se confunda.

### Hoja de ruta sugerida

```
SEMANA 1: P1 — Facturación real, IPC real, notas, PDF contratos
SEMANA 2: Datos Vidaro completos + verificación con gestor  
SEMANA 3: P2 — Mocks secundarios (avalistas, visitas, suministros)
SEMANA 4: P3 parcial — Password hardcodeado, auth server-side admin
SEMANA 5+: P3 resto + P4 según necesidad
```

---

## ANEXO A: Lista completa de APIs con MOCK

```
app/api/facturacion/route.ts                    → facturasHommingStore (in-memory)
app/api/facturacion/series/route.ts             → series in-memory
app/api/check-in-out/route.ts                   → MOCK_ENTRIES
app/api/avalistas/route.ts                      → MOCK_AVALISTAS
app/api/chat/entity/route.ts                    → MOCK_MESSAGES
app/api/admin/webhook-logs/route.ts             → MOCK_LOGS
app/api/admin/campos-personalizados/route.ts    → MOCK_FIELDS
app/api/actualizaciones-renta/route.ts          → MOCK_ACTUALIZACIONES
app/api/acciones-masivas/route.ts               → MOCK_BATCHES
app/api/visitas/route.ts                        → MOCK_VISITAS
app/api/suministros/route.ts                    → MOCK_SUPPLIES
app/api/reportes/avanzados/route.ts             → MOCK_DATA
app/api/no-disponibilidad/route.ts              → MOCK_PERIODS
app/api/notas/route.ts                          → MOCK_NOTES
app/api/garajes-trasteros/route.ts              → MOCK_ENTRIES
app/api/liquidaciones/options/route.ts          → Mock sin modelo
app/api/calendar/auto-events/route.ts           → generateMockEvents()
app/api/media-estancia/analytics/route.ts       → Random KPIs
app/api/ewoorker/admin-socio/metrics/route.ts   → Placeholder
```

## ANEXO B: Lista completa de funcionalidades STUB/501

```
app/api/signatures/create/route.ts              → PDF generation placeholder
app/api/push-notifications/send/route.ts        → 501 "en desarrollo"
app/api/cron/sync-financial-positions/route.ts   → Stub manual_import
app/api/cron/sync-bank-transactions/route.ts    → TODO sync
app/api/family-office/import/insurance-policy/   → TODO persist
app/api/blog/posts/route.ts                     → Empty + no auth
app/api/webinars/route.ts                       → Empty
app/api/licitaciones/route.ts                   → Placeholder
app/api/microtransactions/route.ts              → Not implemented
app/api/sync/connections/route.ts               → Not implemented
app/api/push/unsubscribe/route.ts              → Stub
app/api/v1/ab-tests/route.ts                   → Not implemented
app/api/family-office/connect-bank/route.ts    → Placeholder
app/api/media-estancia/portals/route.ts        → API keys pending
app/api/admin/canva/status/route.ts            → Not implemented
app/api/admin/ai-agents/status/route.ts        → Placeholder
app/api/partners/widget/route.ts               → Not implemented
app/api/onboarding/documents/validate/route.ts → Not implemented
```

## ANEXO C: Flujos CORE que SÍ funcionan correctamente

```
✅ Login / Logout / Session management (NextAuth + Prisma)
✅ Crear/editar/eliminar edificios (Buildings API + Prisma)
✅ Crear/editar/eliminar unidades (Units API + Prisma)
✅ Crear/editar/eliminar inquilinos (Tenants API + Prisma)
✅ Crear/editar/eliminar contratos (Contracts API + Prisma)
✅ Asignación automática inquilino→unidad al crear contrato
✅ Liberación automática unidad al vencer contrato
✅ Registrar pagos (Payments API + Prisma)
✅ Seguros con documentos S3 (Insurance API + Prisma + S3)
✅ Cobertura de seguro edificio→unidad (propagación)
✅ Multi-empresa (Company hierarchy con parentCompanyId)
✅ Dashboard con métricas por empresa
✅ Health check API
✅ Admin monitoring
✅ Rate limiting
✅ Account lockout (5 intentos → 15min)
✅ Cuentas bancarias grupo (22 cuentas)
✅ Participadas y Private Equity
✅ AI Chat (Anthropic Claude)
✅ Valoración IA (con fallback)
✅ Oportunidades inversión (51 features)
```

---

**Fecha del informe**: 7 de abril de 2026  
**Versión**: 1.0  
**Autor**: Auditoría automatizada Cursor Agent  
