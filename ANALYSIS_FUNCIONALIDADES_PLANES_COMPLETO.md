# Análisis Completo: Funcionalidades, Planes, Add-ons y Facturación

**Fecha:** 19 Enero 2026  
**Estado:** AUDITORÍA COMPLETADA

---

## 📊 RESUMEN EJECUTIVO

### Estado Actual de Integraciones

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Planes de Suscripción** | ✅ Definidos | 4 planes en `lib/pricing-config.ts` |
| **Add-ons** | ✅ Definidos | 20+ add-ons en 3 categorías |
| **Stripe - Productos** | ⚠️ Parcial | Sincronización automática disponible |
| **Stripe - Webhooks** | ✅ Completo | Eventos de pago, suscripción, add-ons |
| **Contasimple** | ✅ Completo | Facturación B2B sincronizada |
| **API Billing** | ✅ Implementada | `/api/billing/*` |
| **Frontend Billing** | ⚠️ Parcial | Falta lógica de pago en botones |
| **Middleware de Planes** | ✅ Disponible | `lib/middleware/plan-access-middleware.ts` |

---

## 🏷️ PLANES DE SUSCRIPCIÓN

### Definidos en `lib/pricing-config.ts`

| Plan | Precio/mes | Max Props | Max Users | Firmas/mes | Storage |
|------|------------|-----------|-----------|------------|---------|
| **Starter** | €35 | 5 | 1 | 5 | 2GB |
| **Professional** | €59 | 25 | 3 | 20 | 10GB |
| **Business** | €129 | 100 | 10 | 50 | 50GB |
| **Enterprise** | €299 | ∞ | ∞ | ∞ | ∞ |

### APIs Relacionadas

| Endpoint | Método | Descripción | Estado |
|----------|--------|-------------|--------|
| `/api/public/subscription-plans` | GET | Lista planes públicos | ✅ |
| `/api/billing/subscribe` | POST | Checkout de suscripción | ✅ |
| `/api/billing/addons` | GET/POST/DELETE | Gestión de add-ons | ✅ |
| `/api/billing/validate-coupon` | POST | Validar cupón promocional | ✅ |

---

## 🧩 ADD-ONS DISPONIBLES

### Categoría: USAGE (Packs de Consumo)

| Add-on | Precio | Unidades | Disponible Para |
|--------|--------|----------|-----------------|
| Pack 10 Firmas | €15/mes | 10 firmas | Todos |
| Pack 50 Firmas | €60/mes | 50 firmas | Pro+ |
| Pack 100 Firmas | €100/mes | 100 firmas | Business+ |
| Pack 100 SMS | €10/mes | 100 SMS | Todos |
| Pack 500 SMS | €40/mes | 500 SMS | Pro+ |
| Pack IA 50K tokens | €10/mes | 50K tokens | Todos |
| Pack IA 200K tokens | €35/mes | 200K tokens | Pro+ |
| Pack Storage 10GB | €5/mes | 10 GB | Todos |
| Pack Storage 50GB | €20/mes | 50 GB | Pro+ |

### Categoría: FEATURE (Funcionalidades)

| Add-on | Precio | Incluido En | Descripción |
|--------|--------|-------------|-------------|
| Reportes Avanzados | €15/mes | Business+ | Informes financieros detallados |
| Multi-idioma | €10/mes | Business+ | 5 idiomas disponibles |
| Publicación Portales | €25/mes | Enterprise | Idealista, Fotocasa, Habitaclia |
| Recordatorios Auto | €8/mes | Pro+ | Pagos, vencimientos, mantenimiento |
| Screening Inquilinos | €20/mes | Enterprise | Verificación de solvencia |
| Integración Contabilidad | €30/mes | Enterprise | A3, Sage, Holded |
| Conciliación Bancaria | €29/mes | Enterprise | Open Banking + IA |

### Categoría: PREMIUM (Alto Valor)

| Add-on | Precio | Incluido En | Descripción |
|--------|--------|-------------|-------------|
| White-Label Básico | €35/mes | Enterprise | Marca y colores |
| White-Label Completo | €99/mes | Enterprise | Dominio propio + app |
| API Access | €49/mes | Enterprise | API REST completa |
| ESG & Sostenibilidad | €50/mes | Enterprise | Huella carbono, CSRD |
| Pricing Dinámico IA | €45/mes | Enterprise | ML para optimización |
| Tours Virtuales 360° | €35/mes | Enterprise | Matterport/Kuula |
| IoT Smart Buildings | €75/mes | Enterprise | Cerraduras, sensores |
| Soporte Dedicado | €99/mes | Enterprise | 24/7 + account manager |

---

## 💳 INTEGRACIÓN STRIPE

### Flujo de Suscripción

```
1. Usuario selecciona plan → /planes
2. POST /api/billing/subscribe
   - Valida usuario y plan
   - Sincroniza plan con Stripe (crea producto/precio)
   - Crea/recupera Stripe Customer
   - Genera checkout session
3. Redirección a Stripe Checkout
4. Pago completado → Webhook
5. Webhook actualiza BD + Contasimple
```

### Webhooks Implementados

| Evento | Handler | Acción |
|--------|---------|--------|
| `payment_intent.succeeded` | `handlePaymentSucceeded` | Actualiza pago en BD |
| `payment_intent.payment_failed` | `handlePaymentFailed` | Marca pago como fallido |
| `invoice.payment_succeeded` | `handleB2BInvoicePaymentSucceeded` | Actualiza factura B2B |
| `customer.subscription.created` | `handleSubscriptionEvent` | Activa plan/add-on |
| `customer.subscription.updated` | `handleSubscriptionEvent` | Actualiza estado |
| `customer.subscription.deleted` | `handleSubscriptionEvent` | Cancela suscripción |

### Archivos Clave

- `lib/stripe-subscription-service.ts` - Sincronización de planes/add-ons
- `lib/stripe-config.ts` - Configuración Stripe
- `app/api/webhooks/stripe/route.ts` - Webhook handler
- `app/api/billing/subscribe/route.ts` - Checkout de suscripción

---

## 📄 INTEGRACIÓN CONTASIMPLE

### Flujo de Facturación B2B

```
1. Stripe cobra suscripción
2. Webhook detecta pago exitoso
3. InmovaContasimpleBridge.syncB2BInvoiceToContasimple()
   - Crea cliente en Contasimple si no existe
   - Crea factura oficial
   - Envía factura por email
4. InmovaContasimpleBridge.syncPaymentToContasimple()
   - Registra pago en Contasimple
```

### APIs de Contasimple

| Endpoint | Descripción | Estado |
|----------|-------------|--------|
| `/api/admin/integrations/contasimple/config` | Configuración | ✅ |
| `/api/admin/integrations/contasimple/status` | Estado conexión | ✅ |
| `/api/admin/integrations/contasimple/sync` | Sincronizar facturas | ✅ |
| `/api/admin/integrations/contasimple/invoices` | Listar facturas | ✅ |
| `/api/admin/integrations/contasimple/test` | Test conexión | ✅ |

### Archivos Clave

- `lib/contasimple-integration-service.ts` - Servicio de integración
- `lib/inmova-contasimple-bridge.ts` - Puente Inmova ↔ Contasimple
- `lib/b2b-billing-service.ts` - Facturación B2B

---

## 🔐 CONTROL DE ACCESO POR PLAN

### Middleware Implementado

Ubicación: `lib/middleware/plan-access-middleware.ts`

```typescript
// Funciones disponibles:
checkPlanAccess(request)      // Verifica acceso a ruta por plan
checkOnboardingComplete(request) // Verifica onboarding
checkPlanLimits(request, type, count) // Verifica límites
planAccessMiddleware(request) // Middleware combinado
```

### Límites por Plan

```typescript
const limits = {
  free: { properties: 1, users: 1, tenants: 2, documents: 100 },
  starter: { properties: 5, users: 2, tenants: 10, documents: 1000 },
  basic: { properties: 15, users: 3, tenants: 30, documents: 5000 },
  professional: { properties: 50, users: 10, tenants: 100, documents: 20000 },
  business: { properties: 200, users: 25, tenants: 500, documents: 100000 },
  enterprise: { properties: -1, users: -1, tenants: -1, documents: -1 }, // Ilimitado
};
```

---

## ⚠️ GAPS IDENTIFICADOS

### 1. Frontend de Billing Incompleto
- [ ] Botón "Pagar Ahora" en `/facturacion` no tiene lógica
- [ ] Falta página dedicada de cambio de plan
- [ ] Falta gestión visual de add-ons contratados

### 2. Sincronización de Planes con Stripe
- [ ] Los planes en BD no tienen `stripePriceIdMonthly/Annual`
- [ ] Ejecutar `syncAllToStripe()` para sincronizar

### 3. Verificación de Límites en APIs
- [ ] Algunas APIs no verifican límites del plan antes de crear recursos
- [ ] Implementar hook `useCheckPlanLimits` para frontend

### 4. Página de Suscripciones
- [ ] `/suscripciones` es "Coming Soon"
- [ ] Necesita desarrollo completo

---

## 🛠️ ACCIONES REQUERIDAS

### Prioridad Alta

1. **Sincronizar planes y add-ons con Stripe**
   ```bash
   # Ejecutar script de sincronización
   npx tsx scripts/sync-stripe-products.ts
   ```

2. **Implementar lógica de pago en frontend**
   - Conectar botón "Pagar" con `/api/stripe/create-payment-intent`
   - Añadir Stripe Elements para pago

3. **Crear página de gestión de suscripción**
   - Cambio de plan
   - Cancelación
   - Historial de cambios

### Prioridad Media

4. **Añadir verificación de límites en APIs críticas**
   - POST `/api/properties` → checkPlanLimits('properties')
   - POST `/api/users` → checkPlanLimits('users')
   - POST `/api/tenants` → checkPlanLimits('tenants')

5. **Implementar página de add-ons**
   - Ver add-ons disponibles
   - Comprar/cancelar add-ons
   - Ver uso actual

### Prioridad Baja

6. **Mejorar reporting de uso**
   - Dashboard de consumo de add-ons
   - Alertas cuando se acerca al límite

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
lib/
├── pricing-config.ts           # Definición de planes y add-ons
├── stripe-config.ts            # Configuración Stripe
├── stripe-subscription-service.ts # Sincronización Stripe
├── stripe-coupon-service.ts    # Gestión de cupones
├── contasimple-integration-service.ts # API Contasimple
├── inmova-contasimple-bridge.ts # Bridge facturación
├── b2b-billing-service.ts      # Servicio facturación B2B
└── middleware/
    └── plan-access-middleware.ts # Control de acceso

app/api/
├── billing/
│   ├── subscribe/route.ts      # Checkout suscripción
│   ├── addons/route.ts         # Gestión add-ons
│   └── validate-coupon/route.ts # Validar cupones
├── stripe/
│   ├── webhook/route.ts        # Webhook handler
│   ├── create-subscription/route.ts
│   ├── cancel-subscription/route.ts
│   └── ...
├── webhooks/stripe/route.ts    # Webhook principal
├── b2b-billing/
│   └── invoices/route.ts       # Facturas B2B
└── admin/integrations/contasimple/
    ├── config/route.ts
    ├── status/route.ts
    ├── sync/route.ts
    └── invoices/route.ts
```

---

## ✅ CONCLUSIÓN

El sistema tiene una base sólida con:
- Planes y add-ons bien definidos
- Integración Stripe funcional
- Integración Contasimple completa
- APIs de billing implementadas

**Se requiere:**
1. Sincronizar productos con Stripe
2. Completar frontend de billing/suscripciones
3. Añadir verificación de límites en APIs
4. Desarrollar página de suscripciones

**Tiempo estimado:** 4-6 horas de desarrollo
