# 📊 Guía Visual: Integración de Contasimple

## 🎯 Resumen de 1 minuto

Inmova ahora tiene integración **dual** con Contasimple:

1. **Para clientes**: Conectan su cuenta de Contasimple para su contabilidad
2. **Para Inmova**: Factura oficialmente a sus clientes usando su cuenta de Contasimple

---

## 🏗️ Arquitectura Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                         INMOVA APP                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│  CLIENTES (B2C)           │   │  INMOVA (B2B)                 │
│                           │   │                               │
│  Company.contasimpleAuthKey│   │  INMOVA_CONTASIMPLE_AUTH_KEY │
│  (encriptada)             │   │  (env var)                    │
│                           │   │                               │
│  ✓ Su contabilidad        │   │  ✓ Factura a clientes        │
│  ✓ Sus facturas           │   │  ✓ Registra pagos            │
│  ✓ Sus gastos             │   │  ✓ Contabilidad oficial      │
└───────────────────────────┘   └───────────────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│  API Contasimple          │   │  API Contasimple              │
│  (cuenta del cliente)     │   │  (cuenta de Inmova)           │
└───────────────────────────┘   └───────────────────────────────┘
```

---

## 📊 Flujo 1: Cliente Configura Contasimple

```
┌────────────┐
│  Usuario   │
│   (Admin)  │
└─────┬──────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Dashboard → Integraciones             │
│  → Contasimple                         │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  1. Ingresa Auth Key                   │
│     [____________________________]     │
│                                        │
│  2. Click "Probar" ──────────────────┐│
└────────────────────────────────────┬──┘│
                                     │   │
                ┌────────────────────┘   │
                │                        │
                ▼                        │
     ┌──────────────────────┐            │
     │  POST /api/          │            │
     │  integrations/       │            │
     │  contasimple/test    │            │
     └──────┬───────────────┘            │
            │                            │
            ▼                            │
  ┌─────────────────────┐                │
  │ Valida contra       │                │
  │ API Contasimple     │                │
  └──────┬──────────────┘                │
         │                               │
         ▼                               │
    ┌────────┐                           │
    │ ✅ OK  │ ◄─────────────────────────┘
    └───┬────┘
        │
        ▼
┌────────────────────────────────────────┐
│  3. Click "Guardar"                    │
│                                        │
│  POST /api/integrations/               │
│       contasimple/config               │
│                                        │
│  ├─ Encripta con AES-256-CBC          │
│  └─ Guarda en BD                       │
└────────────────────────────────────────┘
```

---

## 💰 Flujo 2: Inmova Factura a Cliente

```
┌────────────────────────────────────────────────────┐
│  Sistema de Facturación de Inmova                 │
│  (Cron mensual o manual)                          │
└─────┬──────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  Crea B2BInvoice en BD                            │
│                                                    │
│  {                                                 │
│    companyId: "cliente-123",                      │
│    numeroFactura: "INV-2026-0042",                │
│    total: 149.00,                                 │
│    conceptos: [                                   │
│      {                                            │
│        descripcion: "Plan Professional",          │
│        cantidad: 1,                               │
│        precioUnitario: 149,                       │
│        total: 149                                 │
│      }                                            │
│    ],                                             │
│    estado: "PENDIENTE"                            │
│  }                                                 │
└─────┬──────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  Crea Invoice en Stripe                           │
│                                                    │
│  stripe.invoices.create({                         │
│    customer: stripeCustomerId,                    │
│    auto_advance: true                             │
│  })                                                │
│                                                    │
│  ├─ Guarda stripeInvoiceId en B2BInvoice         │
│  └─ Stripe envía email al cliente                 │
└─────┬──────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  Stripe Webhook: invoice.created                  │
│                                                    │
│  POST /api/webhooks/stripe                        │
└─────┬──────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  handleB2BInvoiceCreated()                        │
│                                                    │
│  1. Busca B2BInvoice por stripeInvoiceId         │
│  2. Llama inmovaContasimpleBridge                 │
│     .syncB2BInvoiceToContasimple()                │
└─────┬──────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  inmovaContasimpleBridge                          │
│  .syncB2BInvoiceToContasimple()                   │
│                                                    │
│  A. Verifica si cliente existe en Contasimple    │
│     ├─ Si NO → createCustomer()                  │
│     └─ Guarda Company.contasimpleCustomerId      │
│                                                    │
│  B. Crea factura en Contasimple                  │
│     {                                             │
│       number: "INV-2026-0042",                   │
│       customerId: "...",                         │
│       items: [...],                              │
│       total: 149.00,                             │
│       status: "sent"                             │
│     }                                             │
│     └─ Guarda B2BInvoice.contasimpleInvoiceId   │
│                                                    │
│  C. Envía factura por email desde Contasimple   │
└────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  Cliente recibe:                                   │
│                                                    │
│  1. Email de Stripe (para pagar)                  │
│  2. Email de Contasimple (factura oficial PDF)   │
└────────────────────────────────────────────────────┘
```

---

## 💳 Flujo 3: Cliente Paga la Factura

```
┌────────────────────────────────────────────────────┐
│  Cliente paga en Stripe                           │
│  (tarjeta, domiciliación, etc.)                   │
└─────┬──────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  Stripe Webhook: invoice.payment_succeeded        │
│                                                    │
│  POST /api/webhooks/stripe                        │
└─────┬──────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  handleB2BInvoicePaymentSucceeded()               │
│                                                    │
│  1. Busca B2BInvoice por stripeInvoiceId         │
│  2. Actualiza estado en BD                        │
│     ├─ B2BInvoice.estado = "PAGADA"              │
│     ├─ B2BInvoice.fechaPago = now()              │
│     └─ B2BInvoice.metodoPago = "stripe"          │
│                                                    │
│  3. Crea B2BPaymentHistory                       │
│     {                                             │
│       amount: 149.00,                             │
│       date: now(),                                │
│       method: "stripe",                           │
│       status: "completed",                        │
│       stripePaymentIntentId: "pi_..."            │
│     }                                             │
│                                                    │
│  4. Sincroniza pago con Contasimple              │
│     inmovaContasimpleBridge                       │
│       .syncPaymentToContasimple()                 │
└─────┬──────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  inmovaContasimpleBridge                          │
│  .syncPaymentToContasimple()                      │
│                                                    │
│  A. Verifica que factura existe en Contasimple   │
│     (si no, la sincroniza primero)                │
│                                                    │
│  B. Registra pago en Contasimple                 │
│     contasimple.registerPayment({                 │
│       invoiceId: "...",                           │
│       amount: 149.00,                             │
│       date: now(),                                │
│       method: "card",                             │
│       reference: "Stripe: pi_..."                 │
│     })                                             │
│                                                    │
│  C. Contasimple marca factura como PAGADA        │
└────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────┐
│  ✅ Contabilidad de Inmova actualizada           │
│                                                    │
│  - Balance: +149.00 EUR                           │
│  - Ingresos del mes: actualizado                 │
│  - Factura marcada como cobrada                  │
└────────────────────────────────────────────────────┘
```

---

## 🗄️ Base de Datos - Campos Añadidos

### Tabla: `Company`

```sql
ALTER TABLE "Company"
  ADD COLUMN "contasimpleEnabled"    BOOLEAN DEFAULT false,
  ADD COLUMN "contasimpleAuthKey"    TEXT,          -- Encriptada
  ADD COLUMN "contasimpleCustomerId" TEXT;          -- ID en Contasimple
```

**Ejemplo de datos**:

| id | nombre | contasimpleEnabled | contasimpleAuthKey | contasimpleCustomerId |
|----|--------|-------------------|-------------------|----------------------|
| comp_1 | Inmobiliaria ABC | `true` | `iv:encrypted...` | `cs_cust_123` |
| comp_2 | Gestora XYZ | `false` | `null` | `cs_cust_456` |

### Tabla: `B2BInvoice`

```sql
ALTER TABLE "B2BInvoice"
  ADD COLUMN "contasimpleInvoiceId" TEXT UNIQUE;
```

**Ejemplo de datos**:

| id | numeroFactura | companyId | total | estado | stripeInvoiceId | contasimpleInvoiceId |
|----|--------------|----------|-------|--------|----------------|---------------------|
| inv_1 | INV-2026-0042 | comp_1 | 149.00 | PAGADA | in_1... | cs_inv_789 |
| inv_2 | INV-2026-0043 | comp_2 | 49.00 | PENDIENTE | in_2... | cs_inv_790 |

---

## 🔐 Seguridad - Encriptación Visual

```
┌──────────────────────────────────────────────────────────┐
│  Cliente ingresa Auth Key en UI                         │
│                                                          │
│  plaintext: "cs_auth_1234567890abcdefghijklmnopqrstu"  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────┐
           │  Backend recibe         │
           │  POST /api/integrations/│
           │       contasimple/config│
           └────────────┬────────────┘
                        │
                        ▼
          ┌──────────────────────────┐
          │  Función encrypt()       │
          │                          │
          │  1. Genera IV aleatorio  │
          │  2. Usa AES-256-CBC     │
          │  3. Clave: CONTASIMPLE_ │
          │           ENCRYPTION_KEY │
          └────────────┬─────────────┘
                       │
                       ▼
     ┌─────────────────────────────────────┐
     │  Resultado encriptado:              │
     │                                     │
     │  "a1b2c3d4:e5f6g7h8i9j0k1l2m3n4..." │
     │   ↑       ↑                         │
     │   │       └─ Datos encriptados      │
     │   └─ IV (Initialization Vector)     │
     └─────────────────┬───────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Guarda en BD  │
              │                │
              │  Company.      │
              │  contasimple-  │
              │  AuthKey       │
              └────────────────┘
```

**Para usar**:

```
┌────────────────────┐
│  BD devuelve       │
│  encriptado        │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────┐
│  decrypt()           │
│                      │
│  1. Separa IV        │
│  2. Desencripta      │
│  3. Retorna plaintext│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Usa en API de       │
│  Contasimple         │
└──────────────────────┘
```

---

## 📱 UI - Pantalla de Configuración

```
┌───────────────────────────────────────────────────────────┐
│  📊 Contasimple                                [Toggle] ✓ │
│                                                           │
│  Sincroniza tu contabilidad automáticamente con          │
│  Contasimple                                             │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ✅ Contasimple está configurado. Auth Key: ****3n4o5p6 │
│                                                           │
│  ⚠️  ¿Cómo obtener tu Auth Key?                          │
│     1. Inicia sesión en tu cuenta de Contasimple         │
│     2. Ve a Configuración → API                          │
│     3. Genera una nueva Auth Key                         │
│     4. Copia y pega la clave aquí                        │
│     [Ir a Contasimple ↗]                                 │
│                                                           │
│  Auth Key de Contasimple                                 │
│  [________________________________] [Probar]              │
│                                                           │
│  ✅ Credenciales válidas                                 │
│                                                           │
│  Funcionalidades                                         │
│  • Sincronización automática de facturas                │
│  • Registro de gastos e ingresos                        │
│  • Gestión de clientes y proveedores                    │
│  • Informes contables en tiempo real                    │
│  • Cumplimiento fiscal automático                       │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  [Eliminar integración]         [Guardar configuración] │
└───────────────────────────────────────────────────────────┘
```

---

## 📊 Comparativa: Antes vs Después

### ANTES

```
Inmova factura a cliente
    ├─ Crea B2BInvoice en BD ✓
    ├─ Crea Invoice en Stripe ✓
    └─ Envía email a cliente ✓

❌ NO hay factura oficial en contabilidad
❌ NO se registran pagos oficialmente
❌ NO hay cumplimiento fiscal automático
```

### DESPUÉS

```
Inmova factura a cliente
    ├─ Crea B2BInvoice en BD ✓
    ├─ Crea Invoice en Stripe ✓
    ├─ Sincroniza con Contasimple ✓
    │   ├─ Crea customer si no existe
    │   ├─ Emite factura oficial
    │   └─ Envía PDF por email
    └─ Cuando cliente paga:
        ├─ Stripe webhook ✓
        └─ Registra pago en Contasimple ✓

✅ Factura oficial emitida
✅ Contabilidad actualizada automáticamente
✅ Cumplimiento fiscal automático
✅ Cliente recibe factura PDF oficial
```

---

## 🧪 Testing Rápido

### Test 1: Configuración de Cliente

```bash
# 1. Login como admin
# 2. Ir a Dashboard → Integraciones → Contasimple
# 3. Ingresar Auth Key: "cs_test_1234567890"
# 4. Click "Probar" → Debe mostrar ✅ verde
# 5. Click "Guardar" → Debe guardar correctamente
# 6. Recargar página → Auth Key debe aparecer enmascarada
```

### Test 2: Facturación B2B

```typescript
// 1. Crear factura de prueba
const invoice = await prisma.b2BInvoice.create({
  data: {
    companyId: 'test-company-id',
    numeroFactura: 'INV-TEST-001',
    fechaEmision: new Date(),
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    subtotal: 100,
    impuestos: 21,
    total: 121,
    conceptos: [{ descripcion: 'Test', cantidad: 1, precioUnitario: 100, total: 100 }],
    estado: 'PENDIENTE'
  }
});

// 2. Sincronizar manualmente
import { inmovaContasimpleBridge } from '@/lib/inmova-contasimple-bridge';
const contasimpleId = await inmovaContasimpleBridge.syncB2BInvoiceToContasimple(invoice.id);

// 3. Verificar en Contasimple Dashboard
// La factura INV-TEST-001 debe aparecer
```

---

## 🚀 Deployment - Checklist Visual

```
┌─────────────────────────────────────────────────┐
│  ANTES DE DEPLOYMENT                            │
├─────────────────────────────────────────────────┤
│  ☐ Obtener Auth Key de Contasimple de Inmova   │
│  ☐ Generar CONTASIMPLE_ENCRYPTION_KEY (32 chars)│
│  ☐ Preparar datos fiscales de Inmova           │
│  ☐ Backup de BD                                 │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  EJECUTAR DEPLOYMENT                            │
├─────────────────────────────────────────────────┤
│  $ python3 scripts/deploy-contasimple-          │
│             integration.py                      │
│                                                 │
│  ├─ Git pull                                    │
│  ├─ npm install                                 │
│  ├─ Prisma generate                             │
│  ├─ Prisma migrate deploy ← CRÍTICO            │
│  ├─ npm run build                               │
│  └─ PM2 restart                                 │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  CONFIGURAR VARIABLES DE ENTORNO                │
├─────────────────────────────────────────────────┤
│  $ ssh root@157.180.119.236                     │
│  $ cd /opt/inmova-app                           │
│  $ nano .env.production                         │
│                                                 │
│  Añadir:                                        │
│  INMOVA_CONTASIMPLE_AUTH_KEY=...                │
│  CONTASIMPLE_ENCRYPTION_KEY=...                 │
│  INMOVA_CIF=...                                 │
│  ... (resto de variables)                       │
│                                                 │
│  $ pm2 restart inmova-app --update-env          │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  VERIFICAR                                      │
├─────────────────────────────────────────────────┤
│  ☐ Health check: https://inmovaapp.com/api/    │
│                   health                        │
│  ☐ UI accesible: https://inmovaapp.com         │
│  ☐ Login funciona                               │
│  ☐ PM2 online: pm2 status                      │
│  ☐ Logs sin errores: pm2 logs inmova-app       │
└─────────────────────────────────────────────────┘
```

---

## 💰 Costos

### Para Inmova

| Concepto | Costo | Notas |
|----------|-------|-------|
| Contasimple Pro | €25-50/mes | Para emitir facturas oficiales |
| Desarrollo | ✅ Completado | Una sola vez |
| Mantenimiento | ~1h/mes | Verificar sincronizaciones |

**ROI**: Se recupera en 1-2 meses con la automatización y cumplimiento fiscal.

### Para Clientes

| Concepto | Costo | Notas |
|----------|-------|-------|
| Uso de integración | €0 | Gratis dentro de su plan de Inmova |
| Contasimple (si lo usan) | €25-50/mes | Solo si quieren sincronizar su contabilidad |

---

## 📞 Soporte

**Documentación completa**: `INTEGRACION_CONTASIMPLE_COMPLETA.md`

**API Contasimple**: https://docs.contasimple.com

**Soporte Contasimple**: soporte@contasimple.com

---

**Creado**: 4 de enero de 2026
**Versión**: 1.0.0
**Estado**: ✅ Listo para deployment
