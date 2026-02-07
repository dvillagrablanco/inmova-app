# 📊 Integración Completa de Contasimple

## 🎯 Objetivo

Implementar Contasimple con **dos usos distintos**:

1. **Para clientes de Inmova**: Que puedan conectar su propia cuenta de Contasimple
2. **Para Inmova (B2B)**: Que Inmova use Contasimple para facturar a sus clientes

---

## 🏗️ Arquitectura

### 1. Para Clientes (B2C)

```
┌─────────────────────────────────────────────────────────┐
│ CLIENTE DE INMOVA                                       │
│                                                         │
│  1. Configura su Auth Key de Contasimple en UI        │
│  2. Se guarda encriptada en BD (Company.contasimpleAuthKey) │
│  3. Puede sincronizar su contabilidad                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ API de Contasimple del cliente                         │
│ (usando SU Auth Key)                                    │
└─────────────────────────────────────────────────────────┘
```

### 2. Para Inmova (B2B)

```
┌─────────────────────────────────────────────────────────┐
│ INMOVA PROPTECH                                         │
│                                                         │
│  1. Tiene credenciales globales en env vars            │
│     INMOVA_CONTASIMPLE_AUTH_KEY                        │
│  2. Cuando crea una B2BInvoice...                      │
│  3. Se sincroniza automáticamente con Contasimple      │
│  4. Cuando Stripe cobra, se registra en Contasimple    │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ API de Contasimple de INMOVA                           │
│ (usando credenciales de Inmova)                        │
│                                                         │
│  - Crea clientes (Company → Customer)                  │
│  - Emite facturas oficiales (B2BInvoice → Invoice)    │
│  - Registra pagos (Stripe → Payment)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Archivos Implementados

### Backend

#### 1. **Servicio de Puente B2B** (`lib/inmova-contasimple-bridge.ts`)

**Responsabilidades**:
- Sincronizar B2BInvoice con Contasimple
- Crear clientes en Contasimple cuando Inmova factura por primera vez
- Registrar pagos de Stripe en Contasimple
- Mantener contabilidad oficial de Inmova

**Métodos principales**:
```typescript
class InmovaContasimpleBridge {
  // Sincroniza una factura B2B de Inmova con Contasimple
  async syncB2BInvoiceToContasimple(b2bInvoiceId: string): Promise<string | null>
  
  // Registra un pago de Stripe en Contasimple
  async syncPaymentToContasimple(b2bInvoiceId: string, paymentData: {...}): Promise<string | null>
  
  // Sincroniza todas las facturas pendientes de un período
  async syncPendingInvoices(startDate: Date, endDate: Date): Promise<{synced, errors}>
}
```

**Variables de entorno requeridas**:
```env
# Credenciales de Contasimple para INMOVA (no para clientes)
INMOVA_CONTASIMPLE_AUTH_KEY=tu-auth-key-de-inmova

# Datos fiscales de Inmova
INMOVA_CIF=B12345678
INMOVA_DIRECCION=Calle Principal 123
INMOVA_CIUDAD=Madrid
INMOVA_CP=28001
INMOVA_EMAIL=facturacion@inmova.app
INMOVA_TELEFONO=+34 912 345 678

# Encriptación de credenciales de clientes
CONTASIMPLE_ENCRYPTION_KEY=tu-clave-de-32-caracteres-aqui
```

#### 2. **Webhook de Stripe** (`app/api/webhooks/stripe/route.ts`)

**Actualizado para**:
- Detectar cuando se crea una factura B2B en Stripe → Sincronizar con Contasimple
- Detectar cuando se paga una factura → Registrar pago en Contasimple
- Detectar cuando falla un pago → Marcar factura como vencida

**Nuevos eventos manejados**:
- `invoice.created` → `handleB2BInvoiceCreated()`
- `invoice.payment_succeeded` → `handleB2BInvoicePaymentSucceeded()`
- `invoice.payment_failed` → `handleB2BInvoicePaymentFailed()`

#### 3. **API de Configuración por Empresa** (`app/api/integrations/contasimple/config/route.ts`)

**Endpoints**:
- `GET /api/integrations/contasimple/config` - Obtener configuración actual
- `POST /api/integrations/contasimple/config` - Guardar credenciales
- `DELETE /api/integrations/contasimple/config` - Eliminar integración

**Características**:
- Encripta credenciales con AES-256-CBC
- Solo admins pueden configurar
- Devuelve Auth Key enmascarada (`****xxxxx`) por seguridad

#### 4. **API de Test de Credenciales** (`app/api/integrations/contasimple/test/route.ts`)

**Endpoint**:
- `POST /api/integrations/contasimple/test`

**Funcionalidad**:
- Verifica que las credenciales del cliente son válidas
- Prueba con endpoint `/ping` o `/customers`
- Retorna `success: true/false`

### Frontend

#### 5. **Componente de Configuración** (`components/integrations/contasimple-config.tsx`)

**Features**:
- UI para que clientes ingresen su Auth Key
- Botón "Probar" para validar credenciales antes de guardar
- Switch para activar/desactivar integración
- Instrucciones de cómo obtener Auth Key
- Botón para eliminar integración

**Estado visual**:
- ✅ Verde si credenciales son válidas
- ❌ Rojo si credenciales son inválidas
- 🔒 Auth Key enmascarada si ya está configurada

### Base de Datos

#### 6. **Schema Actualizado** (`prisma/schema.prisma`)

**Cambios en `Company`**:
```prisma
model Company {
  // ... otros campos
  
  // Contasimple - Configuración por empresa (para clientes)
  contasimpleEnabled    Boolean @default(false)
  contasimpleAuthKey    String? // Credenciales del cliente (encriptadas)
  contasimpleCustomerId String? // ID del cliente en Contasimple de Inmova
}
```

**Cambios en `B2BInvoice`**:
```prisma
model B2BInvoice {
  // ... otros campos
  
  // Contasimple Integration
  contasimpleInvoiceId String? @unique
}
```

---

## 🔄 Flujos de Trabajo

### Flujo 1: Cliente Configura Contasimple

```
1. Cliente va a Integraciones → Contasimple
2. Ingresa su Auth Key
3. Click en "Probar"
   ├─ POST /api/integrations/contasimple/test
   └─ Valida credenciales contra API de Contasimple
4. Si válidas, click en "Guardar"
   ├─ POST /api/integrations/contasimple/config
   ├─ Encripta Auth Key con AES-256
   └─ Guarda en Company.contasimpleAuthKey
5. Activa toggle "Activado"
   └─ Company.contasimpleEnabled = true
```

### Flujo 2: Inmova Factura a un Cliente (B2B)

```
1. Sistema de facturación crea B2BInvoice
   ├─ Datos: companyId, total, conceptos, etc.
   └─ Se guarda en BD con estado PENDIENTE

2. Sistema crea Invoice en Stripe
   ├─ Stripe Invoice ID → B2BInvoice.stripeInvoiceId
   └─ Webhook: invoice.created

3. Webhook sincroniza con Contasimple
   ├─ Busca B2BInvoice por stripeInvoiceId
   ├─ Llama a inmovaContasimpleBridge.syncB2BInvoiceToContasimple()
   │   ├─ Verifica si cliente ya existe en Contasimple
   │   │   ├─ Si NO existe → contasimple.createCustomer()
   │   │   └─ Guarda Company.contasimpleCustomerId
   │   ├─ Crea factura en Contasimple
   │   └─ Guarda B2BInvoice.contasimpleInvoiceId
   └─ Envía factura por email al cliente

4. Cliente recibe:
   ├─ Email de Stripe con enlace de pago
   └─ Email de Contasimple con factura oficial PDF
```

### Flujo 3: Cliente Paga Factura (Stripe → Contasimple)

```
1. Cliente paga en Stripe
   └─ Webhook: invoice.payment_succeeded

2. Webhook de Stripe
   ├─ Busca B2BInvoice por stripeInvoiceId
   ├─ Actualiza estado a PAGADA
   │   ├─ B2BInvoice.estado = PAGADA
   │   ├─ B2BInvoice.fechaPago = now()
   │   └─ B2BInvoice.metodoPago = 'stripe'
   ├─ Crea B2BPaymentHistory
   │   ├─ amount, date, method, status
   │   └─ stripePaymentIntentId
   └─ Sincroniza pago con Contasimple
       ├─ inmovaContasimpleBridge.syncPaymentToContasimple()
       ├─ contasimple.registerPayment()
       └─ Factura marcada como PAGADA en Contasimple

3. Contabilidad de Inmova actualizada automáticamente
```

---

## 🔐 Seguridad

### Encriptación de Credenciales de Clientes

**Algoritmo**: AES-256-CBC

**Proceso**:
1. Cliente ingresa Auth Key en plaintext
2. Backend encripta con `crypto.createCipheriv()`
3. Se guarda formato: `iv:encryptedData`
4. Para usar: se desencripta con `crypto.createDecipheriv()`

**Variable de entorno crítica**:
```env
CONTASIMPLE_ENCRYPTION_KEY=tu-clave-de-32-caracteres-minimo
```

⚠️ **IMPORTANTE**: Cambiar esta clave en producción y **nunca** comitearla a Git.

### Separación de Credenciales

| Uso | Variable de Entorno | Almacenamiento |
|-----|---------------------|----------------|
| **Clientes** | - | `Company.contasimpleAuthKey` (encriptada) |
| **Inmova (B2B)** | `INMOVA_CONTASIMPLE_AUTH_KEY` | Variable de entorno |

---

## 📊 Migraciones Necesarias

```bash
# Generar migración de Prisma
npx prisma migrate dev --name add_contasimple_fields

# Aplicar en producción
npx prisma migrate deploy
```

**SQL generado**:
```sql
ALTER TABLE "Company"
  ADD COLUMN "contasimpleEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "contasimpleAuthKey" TEXT,
  ADD COLUMN "contasimpleCustomerId" TEXT;

ALTER TABLE "B2BInvoice"
  ADD COLUMN "contasimpleInvoiceId" TEXT UNIQUE;
```

---

## 🧪 Testing

### Test Manual - Configuración de Cliente

```bash
# 1. Obtener Auth Key de Contasimple
# (Ir a https://www.contasimple.com → Configuración → API)

# 2. Probar credenciales
curl -X POST http://localhost:3000/api/integrations/contasimple/test \
  -H "Content-Type: application/json" \
  -d '{"authKey":"tu-auth-key"}'

# 3. Guardar configuración
curl -X POST http://localhost:3000/api/integrations/contasimple/config \
  -H "Content-Type: application/json" \
  -d '{"authKey":"tu-auth-key","enabled":true}'

# 4. Obtener configuración
curl http://localhost:3000/api/integrations/contasimple/config
```

### Test Manual - Facturación B2B

```bash
# 1. Crear factura B2B en BD
# (Usar Prisma Studio o API de facturación)

# 2. Sincronizar con Contasimple
node -e "
  const { inmovaContasimpleBridge } = require('./lib/inmova-contasimple-bridge.ts');
  const invoiceId = 'clx...';
  inmovaContasimpleBridge.syncB2BInvoiceToContasimple(invoiceId)
    .then(contasimpleId => console.log('Sincronizada:', contasimpleId))
    .catch(console.error);
"

# 3. Verificar en Contasimple Dashboard
# (Ir a https://www.contasimple.com → Facturas)
```

---

## 🚀 Deployment

### Checklist Pre-Deployment

- [ ] Configurar variables de entorno en producción
  - [ ] `INMOVA_CONTASIMPLE_AUTH_KEY`
  - [ ] `INMOVA_CIF`, `INMOVA_DIRECCION`, etc.
  - [ ] `CONTASIMPLE_ENCRYPTION_KEY` (32 caracteres)
  - [ ] `CONTASIMPLE_API_URL` (si es diferente del default)
- [ ] Aplicar migraciones de Prisma
- [ ] Verificar que webhook de Stripe está configurado
  - Eventos: `invoice.created`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Probar flujo completo en staging
- [ ] Sincronizar facturas B2B existentes (si hay)

### Sincronización de Facturas Existentes

```typescript
// Script one-time para sincronizar facturas antiguas
import { inmovaContasimpleBridge } from './lib/inmova-contasimple-bridge';
import { prisma } from './lib/db';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

async function syncHistoricalInvoices() {
  // Sincronizar últimos 3 meses
  const startDate = startOfMonth(subMonths(new Date(), 3));
  const endDate = endOfMonth(new Date());
  
  const result = await inmovaContasimpleBridge.syncPendingInvoices(startDate, endDate);
  
  console.log(`Sincronizadas: ${result.synced}`);
  console.log(`Errores: ${result.errors}`);
}

syncHistoricalInvoices();
```

---

## 📋 Próximos Pasos Opcionales

### 1. Sincronización Bidireccional

Actualmente: **Inmova → Contasimple** (unidireccional)

Posible mejora:
- Webhook de Contasimple → Inmova
- Actualizar B2BInvoice cuando cliente paga directamente en Contasimple

### 2. Informes Contables

Endpoint para obtener informes de Contasimple:
- Balance general
- Pérdidas y ganancias
- Flujo de caja

### 3. Gestión de Proveedores

Actualmente: Solo clientes (customers)

Posible mejora:
- Sincronizar Provider → Supplier de Contasimple
- Registrar gastos automáticamente

---

## ❓ FAQ

**P: ¿Por qué necesitamos dos sistemas de credenciales?**

R: Porque hay dos usos distintos:
1. **Clientes de Inmova** usan su propia cuenta de Contasimple para su contabilidad
2. **Inmova** usa su cuenta de Contasimple para emitir facturas oficiales a clientes

**P: ¿Es seguro guardar las credenciales en BD?**

R: Sí, se guardan encriptadas con AES-256-CBC. Solo se desencriptan cuando se necesitan usar.

**P: ¿Qué pasa si un cliente no tiene Contasimple?**

R: No pasa nada, la integración es opcional. El cliente puede usar otras integraciones o no usar ninguna.

**P: ¿Inmova necesita pagar por Contasimple?**

R: Sí, Inmova debe tener su propia suscripción de Contasimple para emitir facturas oficiales.

**P: ¿Los clientes de Inmova necesitan pagar por Contasimple?**

R: Solo si quieren usar la integración para su propia contabilidad. No es obligatorio.

---

## 📞 Soporte

Para más información sobre la API de Contasimple:
- **Documentación**: https://docs.contasimple.com
- **Dashboard**: https://www.contasimple.com
- **Soporte**: soporte@contasimple.com

---

**Implementado el**: 4 de enero de 2026
**Versión**: 1.0.0
**Estado**: ✅ Producción
