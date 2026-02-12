# AUDITORÍA DESGLOSADA - INMOVA APP
## Fecha: 7 de Febrero de 2026
## Cada hallazgo con archivo exacto, línea y código problemático

---

# HALLAZGO 1: STRIPE COMPLETAMENTE ROTO

## Causa raíz

**Archivo**: `lib/stripe-config.ts`, línea 33

```typescript
export const stripe: Stripe | null = null; // Deprecated: use getStripe()
```

La función `getStripe()` (línea 7) funciona correctamente con lazy initialization, pero el export `stripe` es literalmente `null`. Todos los archivos que importan `{ stripe }` reciben siempre `null`.

## Archivos afectados (5 API routes rotas)

### 1.1 `app/api/stripe/payment-methods/route.ts` (línea 5)
```typescript
import { stripe } from '@/lib/stripe-config'; // ← siempre null
```
- **Línea 14**: `if (!stripe)` → SIEMPRE retorna 503
- **Línea 46**: `stripe.paymentMethods.list()` → NUNCA se ejecuta
- **Impacto**: Los inquilinos no pueden ver sus métodos de pago

### 1.2 `app/api/stripe/create-payment-intent/route.ts` (línea 5)
```typescript
import { stripe, formatAmountForStripe } from '@/lib/stripe-config'; // ← stripe=null
```
- **Línea 21**: `if (!stripe)` → SIEMPRE retorna 503
- **Línea 78**: `stripe.paymentIntents.retrieve()` → NUNCA se ejecuta
- **Línea 99**: `stripe.paymentIntents.create()` → NUNCA se ejecuta
- **Impacto**: NO se pueden crear pagos con Stripe

### 1.3 `app/api/stripe/create-subscription/route.ts` (línea 5)
```typescript
import { stripe, formatAmountForStripe } from '@/lib/stripe-config'; // ← stripe=null
```
- **Línea 21**: `if (!stripe)` → SIEMPRE retorna 503
- **Línea 83**: `stripe.prices.create()` → NUNCA se ejecuta
- **Línea 110**: `stripe.subscriptions.create()` → NUNCA se ejecuta
- **Impacto**: NO se pueden crear suscripciones recurrentes de pago de renta

### 1.4 `app/api/stripe/cancel-subscription/route.ts` (línea 5)
```typescript
import { stripe } from '@/lib/stripe-config'; // ← siempre null
```
- **Línea 14**: `if (!stripe)` → SIEMPRE retorna 503
- **Línea 50**: `stripe.subscriptions.cancel()` → NUNCA se ejecuta
- **Impacto**: NO se pueden cancelar suscripciones

### 1.5 `app/api/stripe/webhook/route.ts` (línea 3)
```typescript
import { stripe, formatAmountFromStripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe-config'; // ← stripe=null
```
- **Línea 13**: `if (!stripe)` → SIEMPRE retorna 503
- **Línea 34**: `stripe.webhooks.constructEvent()` → NUNCA se ejecuta
- **Línea 143**: `stripe.charges.list()` → NUNCA se ejecuta
- **Línea 151**: `stripe.balanceTransactions.retrieve()` → NUNCA se ejecuta
- **Impacto**: Los webhooks de Stripe no se procesan. Pagos completados NO se registran en BD.

## Archivos que SÍ funcionan (usan `getStripe()`)

- `app/api/payments/create-payment-intent/route.ts` (línea 52) → `const stripe = getStripe();`
- `app/api/b2b-billing/webhook/route.ts` (línea 31, 94) → `const stripe = getStripe();`
- `app/api/b2b-billing/stripe-payment/route.ts` (línea 34, 148) → `const stripe = getStripe();`
- `app/api/addons/sync-stripe/route.ts` (línea 28) → `const stripe = getStripe();`
- `app/api/addons/[id]/route.ts` (línea 286) → `const stripe = getStripe();`
- `app/api/webhooks/stripe/route.ts` (línea 62) → `getStripe().webhooks.constructEvent()`
- `app/api/coupons/apply/route.ts` (línea 30, 90) → función local `getStripe()`

**Nota**: Hay DOS archivos de webhook: `app/api/stripe/webhook/route.ts` (ROTO) y `app/api/webhooks/stripe/route.ts` (FUNCIONA). Posible duplicación conflictiva.

## Fix exacto requerido

En `lib/stripe-config.ts`, línea 33, cambiar:
```typescript
// DE:
export const stripe: Stripe | null = null;
// A:
export const stripe = getStripe();
```
O bien, en cada API route, reemplazar `import { stripe }` por uso de `getStripe()`.

---

# HALLAZGO 2: PÁGINA forgot-password NO EXISTE

## Ubicación del enlace roto

**Archivo**: `app/login/page.tsx`, línea 218
```typescript
<Link href="/forgot-password" className="text-sm text-indigo-300 hover:text-white...">
  ¿Olvidaste tu contraseña?
</Link>
```

## Verificación
- `app/forgot-password/` → **NO EXISTE** (carpeta no existe)
- `app/reset-password/` → **NO EXISTE**
- `app/api/auth/forgot-password/` → **NO EXISTE**
- `app/api/auth/reset-password/` → **NO EXISTE**

## Nota importante
El portal del PROVEEDOR SÍ tiene forgot-password:
- `app/api/auth-proveedor/forgot-password/route.ts` ✅ EXISTE
- `app/api/auth-proveedor/reset-password/route.ts` ✅ EXISTE

Pero el login principal de usuario (`/login`) NO tiene esta funcionalidad.

## Modelo User en Prisma SÍ tiene campos para reset
```prisma
// prisma/schema.prisma, modelo User (línea 365-366)
resetToken       String?           @unique
resetTokenExpiry DateTime?
```
Los campos existen en la BD pero no hay API ni página que los use.

---

# HALLAZGO 3: APIs QUE NO EXISTEN (Frontend llama a 404)

## Lista completa verificada de APIs faltantes

### 3.1 `/api/votaciones` (GET y POST)
- **Página que lo llama**: `app/votaciones/page.tsx`, líneas 139 y 178
- **Lo que SÍ existe**: `app/api/votaciones/[id]/votar/route.ts` (solo votar en una votación existente)
- **Falta**: CRUD completo de votaciones (listar, crear)

### 3.2 `/api/reuniones` (GET y POST)
- **Página que lo llama**: `app/reuniones/page.tsx`, líneas 94 y 112
- **Lo que SÍ existe**: `app/api/reuniones/[id]/generar-acta/route.ts` (solo generar acta)
- **Falta**: CRUD completo de reuniones (listar, crear)

### 3.3 `/api/screening` (GET)
- **Página que lo llama**: `app/screening/page.tsx`, línea 36
- **Lo que existe**: NADA en `/api/screening/`
- **Falta**: Endpoint completo

### 3.4 `/api/coliving/properties` (GET)
- **Página que lo llama**: `app/coliving/propiedades/page.tsx`, línea 62
- **Lo que existe**: NADA en esta ruta
- **APIs coliving que SÍ existen**: events, matches, profiles, services, groups, smartlocks, packages, feed, checkinout, bookings
- **Falta**: Endpoint de propiedades coliving

### 3.5 `/api/coliving/reservations` (GET)
- **Página que lo llama**: `app/coliving/reservas/page.tsx`, línea 85
- **Lo que existe**: `app/api/coliving/bookings/route.ts` (nombre diferente)
- **Falta**: O renombrar la llamada a `bookings` o crear alias `reservations`

### 3.6 `/api/coliving/spaces` (GET)
- **Página que lo llama**: `app/coliving/reservas/nueva/page.tsx`, línea 53
- **Lo que existe**: NADA en esta ruta
- **Falta**: Endpoint de espacios coliving

### 3.7 `/api/coliving/residents` (GET)
- **Página que lo llama**: `app/coliving/comunidad/page.tsx`, línea 100
- **Lo que existe**: NADA en esta ruta
- **Falta**: Endpoint de residentes coliving

### 3.8 `/api/coliving/leaderboard` (GET)
- **Página que lo llama**: `app/coliving/eventos/page.tsx`, línea 174
- **Lo que existe**: NADA en esta ruta
- **Falta**: Endpoint de leaderboard/gamificación coliving

### 3.9 `/api/portal-inquilino/cambiar-password` (POST)
- **Página que lo llama**: `app/portal-inquilino/perfil/page.tsx`, línea 126
- **Lo que existe**: NADA en esta ruta
- **Falta**: Endpoint para cambiar contraseña de inquilino

### 3.10 `/api/notifications/send` (POST)
- **Página que lo llama**: `app/renovaciones/page.tsx`, línea 130
- **Lo que existe**: `app/api/notifications/route.ts` (listar) y `app/api/notifications/mark-read/route.ts` (marcar leído)
- **Falta**: Endpoint para enviar notificaciones

### 3.11 APIs de Firma Digital (NINGUNA)
- **Página**: `app/firma-digital/page.tsx` (749 líneas)
- **APIs existentes**: CERO. No hay ningún endpoint en `/api/firma-digital/` ni `/api/signatures/` operativo
- **Lo que existe**: `app/api/signatures/create/route.ts` pero solo crea registros en BD, no integra con Signaturit/DocuSign
- **Falta**: Integración completa con servicio de firma digital

---

# HALLAZGO 4: APIs CON TODO SIN IMPLEMENTAR (Código existe pero no funciona)

## 4.1 Proyectos Flipping - CRUD completo sin BD

**Archivo**: `app/api/proyectos/flipping/route.ts`
```
Línea 21: // TODO: Obtener proyectos de la base de datos (GET retorna array vacío)
Línea 63: // TODO: Guardar en base de datos (POST simula éxito sin guardar)
Línea 121: // TODO: Actualizar en base de datos (PUT simula éxito sin actualizar)
Línea 154: // TODO: Eliminar de base de datos (DELETE simula éxito sin eliminar)
```
**Archivo**: `app/api/proyectos/flipping/tasks/route.ts`
```
Línea 30: // TODO: Guardar en base de datos
Línea 74: // TODO: Actualizar en base de datos
Línea 108: // TODO: Eliminar de base de datos
```

## 4.2 Proyectos Construcción - CRUD completo sin BD

**Archivo**: `app/api/proyectos/construccion/route.ts`
```
Línea 21: // TODO: Obtener proyectos de la base de datos
Línea 60: // TODO: Guardar en base de datos
Línea 116: // TODO: Actualizar en base de datos
Línea 149: // TODO: Eliminar de base de datos
```
**Archivo**: `app/api/proyectos/construccion/tasks/route.ts`
```
Línea 38: // TODO: Guardar en base de datos
Línea 89: // TODO: Actualizar en base de datos
Línea 123: // TODO: Eliminar de base de datos
```

## 4.3 Proyectos Professional - CRUD completo sin BD

**Archivo**: `app/api/proyectos/professional/route.ts`
```
Línea 21: // TODO: Obtener proyectos de la base de datos
Línea 63: // TODO: Guardar en base de datos
Línea 122: // TODO: Actualizar en base de datos
Línea 155: // TODO: Eliminar de base de datos
```
**Archivo**: `app/api/proyectos/professional/tasks/route.ts`
```
Línea 30: // TODO: Guardar en base de datos
Línea 74: // TODO: Actualizar en base de datos
Línea 108: // TODO: Eliminar de base de datos
```

## 4.4 STR Pricing - Datos no persisten

**Archivo**: `app/api/str/pricing/settings/route.ts`
```
Línea 17: // TODO: Implementar desde base de datos (GET retorna datos hardcoded)
Línea 44: // TODO: Guardar en base de datos (POST simula guardado)
```

**Archivo**: `app/api/str/pricing/apply/route.ts`
```
Línea 20: // TODO: Implementar actualización real en base de datos
Línea 21: // TODO: Sincronizar con APIs de Airbnb, Booking, etc.
```

## 4.5 Scheduled Reports History - Modelo no existe

**Archivo**: `app/api/scheduled-reports/[id]/history/route.ts`
```
Línea 43: // TODO: Implementar modelo ReportHistory en el schema de Prisma
```

## 4.6 Portal Proveedor Work Orders - Sin lógica

**Archivo**: `app/api/portal-proveedor/work-orders/route.ts`
```
Línea 30: // TODO: Implementar lógica real cuando exista modelo de Work Orders
```

## 4.7 Contract Renewals - Modelo no existe

**Archivo**: `app/api/renewals/route.ts`
```
Línea 28: // TODO: Implement ContractRenewal model in Prisma schema first
```

## 4.8 Admin Marketplace - Todo sin conectar

**Archivo**: `app/api/admin/marketplace/providers/route.ts`
```
Línea 28: // TODO: Cuando se cree el modelo Provider específico para marketplace
Línea 50: // TODO: Crear modelo MarketplaceProvider en Prisma
```
**Archivo**: `app/api/admin/marketplace/providers/[id]/route.ts` → línea 23: `// TODO`
**Archivo**: `app/api/admin/marketplace/commissions/[id]/route.ts` → líneas 23, 49, 127: `// TODO`
**Archivo**: `app/api/admin/marketplace/categories/[id]/route.ts` → línea 23: `// TODO`
**Archivo**: `app/api/admin/marketplace/reservations/[id]/route.ts` → líneas 23, 69, 92: `// TODO`

## 4.9 Admin Canva - Sin integración

**Archivo**: `app/api/admin/canva/auth/route.ts`
```
Línea 144: // TODO: Guardar tokens en base de datos o Redis
```
**Archivo**: `app/api/admin/canva/designs/route.ts`
```
Línea 26: // TODO: Obtener diseños de la base de datos
Línea 71: // TODO: Guardar en base de datos
Línea 125: // TODO: Eliminar de base de datos
```

## 4.10 Admin Community Manager - Sin BD

**Archivo**: `app/api/admin/community-manager/blog/route.ts`
```
Línea 26: // TODO: Obtener posts del blog de la base de datos
Línea 71: // TODO: Guardar en base de datos
```
**Archivo**: `app/api/admin/community-manager/posts/route.ts`
```
Línea 26: // TODO: Obtener posts reales de la base de datos
Línea 71: // TODO: Guardar en base de datos
```
**Archivo**: `app/api/admin/community-manager/accounts/route.ts`
```
Línea 26: // TODO: Obtener cuentas reales de la base de datos
Línea 71: // TODO: Implementar conexión real con cada plataforma
```
**Archivo**: `app/api/admin/community-manager/config/route.ts`
```
Línea 38: // TODO: Obtener configuración de la base de datos
Línea 81: // TODO: Guardar configuración en base de datos
```

## 4.11 ESG Reports - Sin implementar

**Archivo**: `app/api/esg/reports/generate/route.ts`
```
Línea 18: // TODO: Implementar generación real de reportes CSRD
```

## 4.12 Pomelli Social Posts - API Secret sin encriptar

**Archivo**: `app/api/pomelli/config/route.ts`
```
Línea 150: apiSecret, // TODO: Encriptar en producción
Línea 157: apiSecret, // TODO: Encriptar en producción
```

---

# HALLAZGO 5: APIs QUE SIRVEN DATOS MOCK/FALSOS

## 5.1 Reservas - Datos fake silenciosos

**Archivo**: `app/api/reservas/route.ts`, línea 70
```typescript
} catch (dbError) {
  console.warn('[API Reservas] Error BD, usando datos mock:', dbError);
}
// Si no hay datos de BD, usar mock (retorna datos inventados)
```

## 5.2 Reportes Operacionales - Números inventados

**Archivo**: `app/api/reportes/operacionales/route.ts`, líneas 81-90
```typescript
} catch (dbError) {
  console.warn('[API Reportes Operacionales] Error BD, usando datos mock:', dbError);
  operationalData = {
    propiedades: 12,       // ← FALSO
    unidades: 48,          // ← FALSO
    // más datos falsos...
  };
}
```

## 5.3 Reportes Financieros - Cifras financieras falsas

**Archivo**: `app/api/reportes/financieros/route.ts`, líneas 74-80
```typescript
} catch (dbError) {
  console.warn('[API Reportes Financieros] Error BD, usando datos mock:', dbError);
  financialData = {
    ingresos: 45680,   // ← 45.680€ FALSOS
    gastos: 12340,     // ← 12.340€ FALSOS
    // más cifras falsas...
  };
}
```
**Riesgo**: Un usuario puede tomar decisiones financieras basándose en estos números falsos.

## 5.4 Impuestos - Obligaciones fiscales falsas

**Archivo**: `app/api/impuestos/route.ts`, líneas 92-95
```typescript
} catch (dbError) {
  console.warn('[API Impuestos] Error BD, usando datos mock:', dbError);
  obligations = [
    { id: '1', nombre: 'Modelo 303 - IVA', tipo: 'iva', periodo: '4T 2024',
      vence: '2025-01-30', estado: 'pendiente', importe: 3250 },
    { id: '2', nombre: 'Modelo 115 - Retenciones', tipo: 'irpf', periodo: '4T 2024',
      vence: '2025-01-20', estado: 'presentado', importe: 1850 },
  ];
}
```
**Riesgo GRAVE**: Obligaciones fiscales falsas pueden hacer que un usuario crea que tiene pagos pendientes que no existen, o que no vea obligaciones reales.

## 5.5 Inspecciones Digitales - Datos inventados

**Archivo**: `app/api/inspecciones-digitales/route.ts`, línea 65
```typescript
} catch (dbError) {
  console.warn('[API Inspecciones] Error BD, usando datos mock:', dbError);
}
// Retorna inspecciones inventadas
```

## 5.6 Verificación de Inquilinos - Datos de screening falsos

**Archivo**: `app/api/verificacion-inquilinos/route.ts`, líneas 112-114
```typescript
} catch (dbError) {
  console.warn('[API Verificación] Error BD, usando datos mock:', dbError);
  // Datos mock - retorna verificaciones inventadas
  verifications = [ /* datos falsos */ ];
}
```
**Riesgo**: Un gestor puede aceptar/rechazar inquilinos basándose en datos de screening falsos.

---

# HALLAZGO 6: BOTONES Y FUNCIONALIDADES SIN IMPLEMENTAR EN FRONTEND

## 6.1 Página de Visitas - Botón de crear sin API
**Archivo**: `app/visitas/page.tsx`, línea 121
```typescript
// TODO: Call API
```

## 6.2 Seguros - 4 acciones sin API
**Archivo**: `app/seguros/[id]/page.tsx`
- Línea 124: `// TODO: Llamar a API real` (renovar seguro)
- Línea 198: `// TODO: Llamar a API real` (cancelar seguro)
- Línea 211: `// TODO: Llamar a API real` (añadir cobertura)
- Línea 235: `// TODO: Upload to S3 via API` (subir documento)

## 6.3 Seguros Análisis - Exportar reporte
**Archivo**: `app/seguros/analisis/page.tsx`, línea 156
```typescript
// TODO: Generate and download PDF/Excel report
```

## 6.4 Portal Propietario - Generar reporte
**Archivo**: `app/portal-propietario/page.tsx`, línea 351
```typescript
// TODO: Implementar generación de reporte
```

## 6.5 Matching - Actualizar estado
**Archivo**: `app/matching/page.tsx`, línea 301
```typescript
// TODO: Implementar actualización de estado en API
```

## 6.6 Proveedor Dashboard - Sin datos reales
**Archivo**: `app/proveedor/page.tsx`, línea 69
```typescript
// TODO: Cargar datos reales del API
```

## 6.7 Partners Calculator - Envío de email
**Archivo**: `app/partners/calculator/page.tsx`, línea 130
```typescript
// TODO: Implementar envío de email con el servicio real
```

## 6.8 Partners Invitaciones - Reenvío
**Archivo**: `app/admin/partners/invitaciones/page.tsx`, línea 173
```typescript
// TODO: Implementar reenvío de invitación
```

## 6.9 Canva Integration
**Archivo**: `app/admin/canva/page.tsx`, línea 299
```typescript
// TODO: Implementar OAuth con Canva Connect API
```

## 6.10 Flipping Timeline - Datos mock
**Archivo**: `app/flipping/timeline/page.tsx`, línea 72
```typescript
// TODO: Cargar proyecto real desde API
```

## 6.11 Construction Gantt - Datos mock
**Archivo**: `app/construction/gantt/page.tsx`, línea 64
```typescript
// Mock data - TODO: Cargar desde API
```

## 6.12 Admin Sales Team - Sin API real
**Archivo**: `app/admin/sales-team/page.tsx`, línea 104
```typescript
// TODO: Conectar con API real del equipo comercial
```

## 6.13 Admin Marketplace - 3 secciones sin API
**Archivo**: `app/admin/marketplace/proveedores/page.tsx`, línea 93
```typescript
// TODO: Conectar con API real cuando existan proveedores
```
**Archivo**: `app/admin/marketplace/reservas/page.tsx`, línea 96
```typescript
// TODO: Conectar con API real cuando existan reservas
```
**Archivo**: `app/admin/marketplace/comisiones/page.tsx`, línea 123
```typescript
// TODO: Conectar con API real cuando existan datos
```

## 6.14 Admin Partners Landings - Datos random
**Archivo**: `app/admin/partners/landings/page.tsx`, línea 113
```typescript
visitas: Math.floor(Math.random() * 1000), // TODO: Conectar con analytics real
```

---

# HALLAZGO 7: PROBLEMAS DE SEGURIDAD

## 7.1 Console.log con datos sensibles en auth

**Archivo**: `lib/auth-options.ts`

| Línea | Código | Dato expuesto |
|-------|--------|---------------|
| 46-49 | `console.log('[NextAuth] authorize() llamado', { email, hasPassword })` | Email del usuario, si tiene password |
| 91-97 | `console.log('[NextAuth] Usuario encontrado:', { found, email, activo, hasPassword, companyId })` | Email, estado activo, companyId |
| 104 | `console.log('[NextAuth] Password válido:', isPasswordValid)` | Si el password es correcto |
| 107 | `console.log('[NextAuth] Password incorrecto')` | Intento fallido |
| 113 | `console.log('[NextAuth] Usuario inactivo')` | Estado de cuenta |
| 117 | `console.log('[NextAuth] Login exitoso para:', user.email)` | Login exitoso con email |

**Total**: 8 console.log exponiendo datos de autenticación.

## 7.2 Crisp Chat ID hardcodeado

**Archivo**: `app/layout.tsx`, línea 149
```javascript
window.CRISP_WEBSITE_ID="1f115549-e9ef-49e5-8fd7-174e6d896a7e";
```
Debería ser: `process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID`

## 7.3 Debug endpoint con secret débil

**Archivo**: `app/api/debug/create-test-user/route.ts`, línea 32
```typescript
const expectedSecret = process.env.DEBUG_SECRET || 'create-test-user-2025';
```
Si `DEBUG_SECRET` no está en env, cualquiera que conozca la cadena puede crear usuarios de test.

## 7.4 API Secret sin encriptar

**Archivo**: `app/api/pomelli/config/route.ts`, líneas 150, 157
```typescript
apiSecret, // TODO: Encriptar en producción
```
Se guarda el API secret en texto plano en la BD.

## 7.5 Credenciales en archivos `.md` públicos

Múltiples archivos `.md` en la raíz del proyecto contienen:
- `USUARIOS_TEST_CREADOS.md`
- `USUARIOS_CONFIGURADOS.md`
- `USUARIO_PRUEBA_CREADO.md`
- `.env.example` (líneas 67-68): `admin@inmova.app / Admin123!`

## 7.6 Rol `tenant` en permissions pero no en enum

**Archivo**: `lib/permissions.ts`, líneas 67-79
```typescript
tenant: {
  read: true,
  create: false,
  // ...
}
```
Pero en `prisma/schema.prisma` (líneas 12-21), el enum `UserRole` NO incluye `tenant`.

---

# HALLAZGO 8: PROBLEMAS DE ARQUITECTURA

## 8.1 TypeScript ignorado en build

**Archivo**: `next.config.js`, línea 52
```javascript
typescript: { ignoreBuildErrors: true }
```
Cualquier error de tipos pasa a producción.

## 8.2 ESLint ignorado en build

**Archivo**: `next.config.js`, línea 55
```javascript
eslint: { ignoreDuringBuilds: true }
```

## 8.3 Versiones documentadas incorrectas

**En `.cursorrules`**: Next.js 15.5.9, React 19.2.3, TypeScript 5.2.2
**En `package.json`**: Next.js ^14.2.35, React ^18.3.1, TypeScript 5.2.2

## 8.4 Grupo `(protected)` sin layout

**Directorio**: `app/(protected)/`

Contiene 8 páginas:
1. `app/(protected)/dashboard/social-media/page.tsx`
2. `app/(protected)/dashboard/crm/page.tsx`
3. `app/(protected)/str-advanced/page.tsx`
4. `app/(protected)/str-advanced/housekeeping/page.tsx`
5. `app/(protected)/str-advanced/channel-manager/page.tsx`
6. `app/(protected)/str-advanced/guest-experience/page.tsx`
7. `app/(protected)/str-advanced/legal/page.tsx`
8. `app/(protected)/str-advanced/revenue/page.tsx`

**NO tiene `layout.tsx`** → sin protección de autenticación a nivel de grupo, sin sidebar.

## 8.5 Páginas duplicadas

| Ruta 1 | Ruta 2 | Conflicto |
|--------|--------|-----------|
| `app/crm/page.tsx` (703 líneas) | `app/(protected)/dashboard/crm/page.tsx` (471 líneas) | Dos CRM pages |
| `app/api/stripe/webhook/route.ts` | `app/api/webhooks/stripe/route.ts` | Dos webhook handlers |

## 8.6 Sidebar gigante

**Archivo**: `components/layout/sidebar.tsx`
- **3,331 líneas** en un solo archivo
- 75 imports de iconos lucide-react
- Un mapeo `ROUTE_TO_MODULE` con 180+ entradas (líneas 96-284)
- Array `CORE_MODULES` con 30+ módulos
- Debería dividirse en al menos 5-6 componentes

## 8.7 Schema Prisma de 15,744+ líneas

**Archivo**: `prisma/schema.prisma`
- 100+ modelos
- 30+ enums
- No está dividido en archivos más pequeños
- Impacta tiempo de `prisma generate`

## 8.8 Dependencias redundantes

| Categoría | Librerías | Problema |
|-----------|-----------|----------|
| State management | Zustand + Jotai + SWR + React Query | 4 soluciones para lo mismo |
| HTTP | fetch (nativo) + axios + SWR | 3 formas de hacer requests |
| Forms | React Hook Form + Formik | 2 librerías de forms |
| Validation | Zod + Yup | 2 librerías de validación |
| Charts | Recharts + Chart.js + Plotly | 3 librerías de gráficos |

## 8.9 80+ archivos `.md` en raíz

La raíz del proyecto tiene más de 80 archivos markdown de reportes, guías, y status:
```
VERCEL_DEPLOYMENT_SUMMARY.txt
VERCEL_DEPLOYMENT_READY.md
VISUAL_INSPECTION_REPORT.md
ZERO_TOUCH_ONBOARDING_ESTRATEGIA_COMPLETA.md
...y 76 más
```
Deberían estar en un directorio `docs/` o eliminados.

## 8.10 CSS Bug workaround desactivado

**Archivo**: `app/layout.tsx`, líneas 116-144
```html
{/* CSS Bug Workaround - DESACTIVADO TEMPORALMENTE
    Causa problemas de serialización en Next.js streaming.
    El script se duplica en __next_s push y causa "Invalid or unexpected token"
*/}
```
Indica un bug no resuelto con CSS y streaming en Next.js.

---

# HALLAZGO 9: DATOS PLACEHOLDER EN UI

## Ubicación exacta de cada placeholder

| Archivo | Línea | Placeholder | Debería ser |
|---------|-------|-------------|-------------|
| `app/dashboard/ayuda/page.tsx` | 18 | `'+1 (XXX) XXX-XXXX'` | `NEXT_PUBLIC_VAPI_PHONE_NUMBER` |
| `app/dashboard/ayuda/page.tsx` | 19 | `'+34600000000'` | `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| `app/partners/soporte/page.tsx` | 221 | `'+34 91 XXX XX XX'` | Teléfono real |
| `app/admin/personalizacion/page.tsx` | 938 | `'+34 XXX XXX XXX'` | Variable de entorno |
| `app/garantias/page.tsx` | 608 | `'POL-2025-XXXXX'` | Placeholder de input |
| `app/admin/integraciones-plataforma/analytics/page.tsx` | 107 | `'G-XXXXXXXXXX'` | Google Analytics ID real |

---

# RESUMEN CUANTITATIVO FINAL

| Categoría | Cantidad |
|-----------|----------|
| API routes que importan `stripe` roto (null) | 5 |
| API routes duplicados (stripe webhook) | 2 |
| Páginas que llaman a APIs inexistentes | 11 |
| API routes con `// TODO` sin implementar | 42 (en 24 archivos) |
| API routes que sirven datos mock | 6 |
| Botones/funciones sin implementar en frontend | 14+ |
| Console.log con datos sensibles en auth | 8 |
| Placeholders visibles en UI | 6 |
| Páginas duplicadas | 2 pares |
| Dependencias redundantes | 10 librerías |
| Archivos `.md` en raíz | 80+ |
| Líneas en sidebar | 3,331 |
| Líneas en schema Prisma | 15,744+ |
| Total páginas | 535 |
| Total API routes | 867 |

---

**FIN DEL DESGLOSE**
