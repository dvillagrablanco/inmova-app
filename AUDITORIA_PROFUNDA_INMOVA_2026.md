# AUDITORÍA PROFUNDA - INMOVA APP
## Fecha: 7 de Febrero de 2026
## Auditor: Claude Opus 4.6 (High Thinking)

---

# RESUMEN EJECUTIVO

| Categoría | Estado | Hallazgos Críticos | Hallazgos Medios | Hallazgos Menores |
|-----------|--------|--------------------|--------------------|-------------------|
| APIs Backend | DEFICIENTE | 8 | 12 | 15+ |
| Frontend-Backend Conexión | DEFICIENTE | 6 | 10 | 8 |
| Autenticación y Seguridad | ACEPTABLE | 3 | 4 | 5 |
| UI/UX Visual | ACEPTABLE | 2 | 6 | 10 |
| Configuración e Integraciones | DEFICIENTE | 5 | 4 | 3 |
| Arquitectura y Código | ACEPTABLE | 4 | 8 | 12 |
| **TOTAL** | **REQUIERE ACCIÓN** | **28** | **44** | **53+** |

**Escala**: Óptimo > Bueno > Aceptable > Deficiente > Crítico

---

# SECCIÓN 1: FALLOS CRÍTICOS (Requieren acción inmediata)

## 1.1 STRIPE COMPLETAMENTE ROTO

**Severidad**: CRÍTICA
**Archivos afectados**: `lib/stripe-config.ts`, `app/api/stripe/*/route.ts`

**Descripción**: El export `stripe` de `lib/stripe-config.ts` está hardcodeado como `null`:

```typescript
// lib/stripe-config.ts línea 33
export const stripe: Stripe | null = null; // Deprecated: use getStripe()
```

Sin embargo, 2 API routes de Stripe importan `{ stripe }` directamente:
- `app/api/stripe/payment-methods/route.ts`
- `app/api/stripe/cancel-subscription/route.ts`

Otros routes de Stripe (`create-payment-intent`, `create-subscription`, `webhook`, `stats`, `payments`) también importan `{ stripe }` pero **ninguno usa `getStripe()`** que es la función correcta.

**Consecuencia**: Todos los endpoints de Stripe fallan con `stripe is null`. Los pagos, suscripciones, webhooks y métodos de pago NO FUNCIONAN.

**Fix requerido**:
- Reemplazar `import { stripe }` por `const stripe = getStripe()` en TODOS los routes de Stripe
- O cambiar el export en `lib/stripe-config.ts` para que `stripe` sea lazy-initialized

---

## 1.2 PÁGINA forgot-password NO EXISTE

**Severidad**: CRÍTICA
**Archivo afectado**: Link en `app/login/page.tsx` línea 218

```html
<Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
```

No existe ninguna página en `/forgot-password` ni `/reset-password`. El enlace lleva a un 404.

**Consecuencia**: Los usuarios que olvidan su contraseña no pueden recuperarla. Flujo crítico de UX roto.

**Fix requerido**: Crear `app/forgot-password/page.tsx` con:
- Formulario de email
- API `POST /api/auth/forgot-password` para enviar token por email
- Página `app/reset-password/page.tsx` para establecer nueva contraseña

---

## 1.3 APIs FALTANTES - Frontend llama a endpoints que NO EXISTEN

**Severidad**: CRÍTICA

Las siguientes páginas hacen `fetch()` a APIs que **no existen**, causando errores 404 silenciosos:

| Página | API llamada | ¿Existe? | Impacto |
|--------|-------------|----------|---------|
| `app/votaciones/page.tsx` | `GET /api/votaciones` | NO (solo `/api/votaciones/[id]/votar`) | Página vacía, sin datos |
| `app/reuniones/page.tsx` | `GET /api/reuniones` | NO (solo `/api/reuniones/[id]/generar-acta`) | Página vacía |
| `app/screening/page.tsx` | `GET /api/screening` | NO | Página vacía |
| `app/coliving/propiedades/page.tsx` | `GET /api/coliving/properties` | NO | Página vacía |
| `app/coliving/reservas/page.tsx` | `GET /api/coliving/reservations` | NO | Página vacía |
| `app/coliving/reservas/nueva/page.tsx` | `GET /api/coliving/spaces` | NO | Formulario roto |
| `app/coliving/comunidad/page.tsx` | `GET /api/coliving/residents` | NO | Página vacía |
| `app/coliving/eventos/page.tsx` | `GET /api/coliving/leaderboard` | NO | Sección rota |
| `app/firma-digital/page.tsx` | Ninguna API de firma digital | NO existen APIs | Módulo no funcional |

**Consecuencia**: 9+ páginas muestran estado vacío o error. Módulos completos no funcionales.

---

## 1.4 CONSOLE.LOG EN AUTENTICACIÓN PRODUCCIÓN

**Severidad**: ALTA
**Archivo**: `lib/auth-options.ts`

Hay 8 `console.log()` en el flujo de autenticación que exponen información sensible:

```typescript
console.log('[NextAuth] authorize() llamado', { email, hasPassword });
console.log('[NextAuth] Usuario encontrado:', { found, email, activo, hasPassword, companyId });
console.log('[NextAuth] Password válido:', isPasswordValid);
```

**Consecuencia**: En producción, los logs exponen emails, estados de password, companyIds, etc. Riesgo de seguridad.

**Fix requerido**: Reemplazar todos los `console.log` por `logger.debug()` o eliminarlos.

---

## 1.5 APIs CON DATOS MOCK/FAKE EN PRODUCCIÓN

**Severidad**: ALTA

Múltiples API routes caen en datos mock cuando la BD falla, sin informar al usuario:

| API | Comportamiento |
|-----|---------------|
| `app/api/reservas/route.ts` | Usa datos mock en catch de BD |
| `app/api/reportes/operacionales/route.ts` | Usa datos mock en catch de BD |
| `app/api/reportes/financieros/route.ts` | Usa datos mock en catch de BD |
| `app/api/impuestos/route.ts` | Usa datos mock en catch de BD |
| `app/api/inspecciones-digitales/route.ts` | Usa datos mock en catch de BD |
| `app/api/verificacion-inquilinos/route.ts` | Usa datos mock en catch de BD |

**Consecuencia**: Si la BD tiene problemas, los usuarios ven datos falsos creyendo que son reales. Información financiera falsa puede causar decisiones erróneas.

---

# SECCIÓN 2: APIs NO IMPLEMENTADAS (Backend vacío o TODO)

## 2.1 APIs con `// TODO: Implementar desde base de datos`

| API Route | Estado | Notas |
|-----------|--------|-------|
| `app/api/str/pricing/settings/route.ts` | TODO | No lee/guarda en BD |
| `app/api/str/pricing/apply/route.ts` | TODO | No actualiza precios realmente |
| `app/api/scheduled-reports/[id]/history/route.ts` | TODO | Modelo `ReportHistory` no existe |
| `app/api/professional/clients/route.ts` | TODO | `nextBilling` y `paymentStatus` hardcoded |
| `app/api/portal-proveedor/work-orders/route.ts` | TODO | Lógica no implementada |
| `app/api/proyectos/flipping/route.ts` | TODO (4x) | CRUD completo sin BD |
| `app/api/proyectos/flipping/tasks/route.ts` | TODO (3x) | CRUD sin BD |
| `app/api/proyectos/construccion/route.ts` | TODO (4x) | CRUD completo sin BD |
| `app/api/proyectos/construccion/tasks/route.ts` | TODO (3x) | CRUD sin BD |
| `app/api/proyectos/professional/route.ts` | TODO (4x) | CRUD completo sin BD |

**Total**: 10+ APIs con funcionalidad no implementada realmente.

---

# SECCIÓN 3: PROBLEMAS DE ARQUITECTURA

## 3.1 Discrepancia de versión Next.js

**Documento** `.cursorrules` dice **Next.js 15.5.9, React 19.2.3**
**Realidad** `package.json`: **Next.js ^14.2.35, React ^18.3.1**

Las referencias a Next.js 15 App Router features y React 19 pueden causar confusión y código incompatible.

## 3.2 TypeScript y ESLint deshabilitados en build

```javascript
// next.config.js
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

**Consecuencia**: Los errores de tipo y lint no se detectan en build. Código potencialmente roto se despliega a producción sin detectar.

## 3.3 Rol `tenant` en PERMISSIONS pero no en Prisma UserRole

`lib/permissions.ts` define permisos para un rol `tenant` que NO existe en el enum `UserRole` de Prisma:

```prisma
enum UserRole {
  super_admin
  administrador
  gestor
  operador
  soporte
  community_manager
  socio_ewoorker
  contratista_ewoorker
  subcontratista_ewoorker
}
```

No hay `tenant` aquí. Si algún código intenta buscar permisos de `tenant`, fallará silenciosamente.

## 3.4 Grupo de rutas `(protected)` sin layout

Existe `app/(protected)/` con 8 páginas pero NO tiene `layout.tsx`. Esto significa:
- No hay protección de autenticación a nivel de grupo
- Estas páginas se renderizan con el layout raíz sin sidebar
- Duplicación: `app/crm/page.tsx` Y `app/(protected)/dashboard/crm/page.tsx`

## 3.5 Middleware demasiado restrictivo en i18n

El middleware actual solo aplica i18n a 2 rutas específicas. Esto es intencional pero deja todo el resto de la app sin soporte de internacionalización, aunque se importan `i18next`, `next-intl` y `react-i18next`.

## 3.6 Schema Prisma extremadamente grande

El schema tiene 15,744+ líneas con 100+ modelos. Esto causa:
- Builds lentos de `prisma generate`
- Mayor superficie de ataque
- Dificultad de mantenimiento
- Muchas relaciones que pueden no estar indexadas

---

# SECCIÓN 4: PROBLEMAS DE CONEXIÓN FRONTEND-BACKEND

## 4.1 Páginas que llaman a APIs inexistentes (completo)

Además de las críticas mencionadas en 1.3:

| Página | API llamada | ¿Existe? |
|--------|-------------|----------|
| `app/str-housekeeping/page.tsx` | `GET /api/housekeeping` | Sí pero diferente path que `str-housekeeping` |
| `app/sincronizacion-avanzada/page.tsx` | `GET /api/sync` | Sí |
| `app/visitas/page.tsx` | `POST /api/visits` (línea 121 `// TODO: Call API`) | Existe pero POST puede no funcionar |
| `app/servicios-concierge/page.tsx` | `GET /api/concierge?tipo=bookings` | Sí |
| `app/admin/marketplace/page.tsx` | `// Mock providers (TODO: crear API)` | No hay API real |
| `app/admin/marketplace/reservas/page.tsx` | `// TODO: Conectar con API real` | Sin conexión |
| `app/admin/marketplace/comisiones/page.tsx` | `// TODO: Conectar con API real` | Sin conexión |
| `app/admin/marketplace/proveedores/page.tsx` | `// TODO: Conectar con API real` | Sin conexión |
| `app/admin/sales-team/page.tsx` | `// TODO: Conectar con API real` | Sin conexión |
| `app/admin/partners/landings/page.tsx` | `// TODO: Conectar con analytics real` | Datos random |
| `app/admin/partners/invitaciones/page.tsx` | `// TODO: Implementar reenvío` | Botón no funciona |
| `app/admin/canva/page.tsx` | `// TODO: Implementar OAuth con Canva` | Sin conexión |
| `app/flipping/timeline/page.tsx` | `// TODO: Cargar proyecto real desde API` | Datos mock |
| `app/construction/gantt/page.tsx` | `// TODO: Cargar desde API` | Datos mock |
| `app/portal-propietario/page.tsx` | `// TODO: Implementar generación de reporte` | Botón no funciona |
| `app/matching/page.tsx` | `// TODO: Implementar actualización de estado` | Botón no funciona |

## 4.2 Páginas con datos hardcodeados

Múltiples páginas muestran datos de ejemplo/placeholder en lugar de datos reales:
- `app/dashboard/ayuda/page.tsx`: Teléfono placeholder `+1 (XXX) XXX-XXXX`
- `app/partners/soporte/page.tsx`: Teléfono `+34 91 XXX XX XX`
- `app/admin/personalizacion/page.tsx`: Placeholder `+34 XXX XXX XXX`
- `app/garantias/page.tsx`: Placeholder `POL-2025-XXXXX`
- `app/admin/integraciones-plataforma/analytics/page.tsx`: Google Analytics ID `G-XXXXXXXXXX`

---

# SECCIÓN 5: PROBLEMAS DE SEGURIDAD

## 5.1 Secrets en logs de autenticación
- Ya documentado en 1.4. Información sensible en console.log.

## 5.2 Credenciales de test en archivos públicos
- `.env.example` expone credenciales de test: `admin@inmova.app / Admin123!`
- Múltiples archivos `.md` en raíz contienen credenciales

## 5.3 `NEXTAUTH_SECRET` depende de variable de entorno
- Si `NEXTAUTH_SECRET` no está configurado, NextAuth usa un fallback inseguro
- No hay validación al inicio de la app

## 5.4 APIs sin autenticación potencial
- `app/api/public/*` routes no verifican autenticación (correcto por diseño)
- Pero `app/api/public/init-admin/route.ts` podría ser peligroso si no está protegido

## 5.5 Dashboard API no tiene try-catch visible
- `app/api/dashboard/route.ts` usa `requireAuth()` pero si falla la query de BD, el error podría no estar capturado correctamente en todas las ramas.

---

# SECCIÓN 6: PROBLEMAS VISUALES / UI/UX

## 6.1 Sidebar con 3,300+ líneas
- `components/layout/sidebar.tsx` tiene 3,331 líneas
- Extremadamente difícil de mantener
- Debería dividirse en componentes más pequeños

## 6.2 535 páginas en total
- El proyecto tiene 535 archivos `page.tsx`
- Muchas de estas páginas son módulos parcialmente implementados
- La navegación puede ser confusa para el usuario

## 6.3 Flujo de registro funcional pero sin verificación de email
- `app/register/page.tsx` llama a `/api/signup`
- No hay verificación de email
- El usuario se activa inmediatamente

## 6.4 Páginas duplicadas
- `/crm/page.tsx` y `/(protected)/dashboard/crm/page.tsx` - contenido similar
- Puede causar confusión en navegación y SEO

## 6.5 CSS workaround desactivado
- En `app/layout.tsx` hay un script de supresión de errores CSS desactivado
- Indica un bug subyacente no resuelto con CSS en Next.js streaming

---

# SECCIÓN 7: INTEGRACIONES Y CONFIGURACIÓN

## 7.1 Estado de integraciones

| Integración | Configurada | Funcional | Notas |
|-------------|-------------|-----------|-------|
| PostgreSQL | Sí | Depende de env | `DATABASE_URL` puede ser placeholder |
| NextAuth | Sí | Sí | Pero con console.logs |
| Stripe | Sí pero ROTO | NO | Import de `null` |
| AWS S3 | Sí | Depende de env | Sin validación de keys |
| Redis/ioredis | Sí | Opcional | Fallback sin cache |
| Anthropic AI | Sí | Depende de key | |
| Nodemailer/Gmail | Sí | Depende de env | |
| Twilio SMS | Sí | Depende de env | |
| Sentry | Configurado | Depende de DSN | |
| Google Analytics | Configurado | Depende de env | |
| Hotjar | Configurado | Depende de env | |
| Crisp Chat | Hardcoded | Sí | ID en código, no en env |
| Signaturit | Código existe | No implementado | API route faltante |
| DocuSign | En .env.example | No implementado | |

## 7.2 Crisp Chat ID hardcodeado
```javascript
// app/layout.tsx línea 149
window.CRISP_WEBSITE_ID="1f115549-e9ef-49e5-8fd7-174e6d896a7e";
```
Debería ser `process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID`.

## 7.3 Dependencias excesivas
- 289 dependencias en `package.json`
- Múltiples librerías que hacen lo mismo:
  - State management: Zustand + Jotai + SWR + React Query
  - HTTP: fetch + axios + swr
  - Forms: React Hook Form + Formik
  - Validation: Zod + Yup
  - Charts: Recharts + Chart.js + Plotly

---

# SECCIÓN 8: PLAN DE ACCIÓN PRIORIZADO

## PRIORIDAD 1 - CRÍTICO (Semana 1)

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | **Fix Stripe**: Reemplazar `{ stripe }` por `getStripe()` en todos los routes | 2h | Pagos funcionan |
| 2 | **Crear forgot-password**: Página + API de reset password | 4h | Flujo usuario crítico |
| 3 | **Crear APIs faltantes**: votaciones, reuniones, screening | 8h | 3+ páginas funcionan |
| 4 | **Eliminar console.log de auth**: Reemplazar por logger.debug | 1h | Seguridad |
| 5 | **Fix APIs mock**: Retornar error 503 en vez de datos falsos | 3h | Integridad datos |

## PRIORIDAD 2 - ALTA (Semana 2)

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 6 | **Crear APIs coliving faltantes**: properties, reservations, spaces, residents, leaderboard | 12h | Módulo coliving funcional |
| 7 | **Implementar APIs flipping/construcción/professional**: Conectar con BD real | 16h | 3 módulos funcionales |
| 8 | **Fix Crisp Chat hardcoded**: Mover a env var | 0.5h | Buena práctica |
| 9 | **Crear layout para (protected)**: Añadir auth guard | 2h | Seguridad |
| 10 | **Eliminar página CRM duplicada** | 1h | Limpieza |

## PRIORIDAD 3 - MEDIA (Semana 3-4)

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 11 | **Habilitar TypeScript strict en build**: Gradualmente | 8h | Calidad código |
| 12 | **Habilitar ESLint en build**: Gradualmente | 4h | Calidad código |
| 13 | **Refactorizar sidebar**: Dividir en componentes | 8h | Mantenibilidad |
| 14 | **Actualizar cursorrules**: Versiones reales (Next 14, React 18) | 1h | Documentación |
| 15 | **Implementar firma digital API**: Signaturit o DocuSign | 16h | Feature diferencial |
| 16 | **Implementar verificación de email**: En registro | 4h | Seguridad |
| 17 | **Conectar admin/marketplace con APIs reales** | 8h | Admin funcional |
| 18 | **Reemplazar placeholders de teléfono/analytics** | 2h | Profesionalidad |

## PRIORIDAD 4 - BAJA (Mes siguiente)

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 19 | **Consolidar librerías duplicadas**: Elegir Zod vs Yup, Zustand vs Jotai | 16h | Bundle size |
| 20 | **Dividir schema Prisma**: Multi-file con `prisma-merge` | 8h | DX |
| 21 | **Fix CSS streaming bug**: Investigar y resolver | 4h | UX |
| 22 | **Implementar i18n completo**: O eliminar dependencias | 8h | Decisión |
| 23 | **Auditoría de 535 páginas**: Identificar cuáles son realmente necesarias | 16h | Limpieza |
| 24 | **Fix rol `tenant` en permissions**: Alinear con enum Prisma | 2h | Consistencia |

---

# SECCIÓN 9: MÉTRICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Páginas totales (`page.tsx`) | 535 |
| API routes (`route.ts`) | 867 |
| Archivos en `lib/` | 444 |
| Líneas de schema Prisma | 15,744+ |
| Líneas de sidebar | 3,331 |
| Dependencias en package.json | 289 |
| APIs con `// TODO` | 30+ |
| APIs con datos mock | 6 |
| Páginas con fetch a API inexistente | 9+ |
| Botones sin funcionalidad (`// TODO`) | 15+ |
| Archivos `.md` en raíz | 80+ |

---

# SECCIÓN 10: RECOMENDACIONES ESTRATÉGICAS

## 10.1 Deuda técnica
La deuda técnica es **muy alta**. El proyecto tiene 535 páginas y 867 API routes, pero muchas están parcialmente implementadas. Se recomienda:
1. **Freezar el desarrollo de nuevos módulos**
2. **Completar los módulos existentes** que tienen usuarios activos
3. **Eliminar módulos no utilizados** o marcarlos claramente como "Beta"

## 10.2 Testing
- No hay evidencia de tests pasando exitosamente
- Los tests E2E existentes (`__tests__/e2e/`) parecen antiguos
- Implementar smoke tests mínimos antes de cada deploy

## 10.3 Performance
- 289 dependencias impactan el bundle size
- Considerar lazy loading agresivo para módulos opcionales
- `optimizePackageImports` en next.config.js es bueno pero incompleto

## 10.4 Monitoreo
- Sentry está configurado pero no hay evidencia de uso activo
- Redis es opcional - sin cache, las queries son más lentas
- Los health checks están bien implementados

---

**FIN DE AUDITORÍA**

*Este informe fue generado mediante análisis estático del código fuente. Se recomienda complementar con pruebas manuales en producción y revisión de logs del servidor.*
