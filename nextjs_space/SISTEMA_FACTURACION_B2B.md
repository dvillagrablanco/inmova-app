# Sistema de Facturación B2B - INMOVA

## 📋 Descripción General

Sistema completo de facturación Business-to-Business (B2B) que permite a INMOVA gestionar la facturación automatizada de sus servicios a empresas clientes, con integración de pagos, reportes financieros y notificaciones automáticas.

---

## 🏛️ Arquitectura del Sistema

### Componentes Principales

1. **Base de Datos (Prisma)**
   - `B2BInvoice`: Facturas emitidas a empresas
   - `B2BPaymentHistory`: Historial de pagos
   - `B2BSubscriptionHistory`: Cambios en suscripciones
   - `B2BFinancialReport`: Reportes financieros agregados

2. **Servicios Backend**
   - `b2b-billing-service.ts`: Lógica de negocio de facturación
   - Generación automática de facturas mensuales
   - Cálculo de métricas financieras
   - Gestión de suscripciones

3. **APIs REST**
   - `/api/b2b-billing/invoices`: Gestión de facturas
   - `/api/b2b-billing/payments`: Registro de pagos
   - `/api/b2b-billing/reports`: Reportes financieros
   - `/api/b2b-billing/subscriptions`: Cambios de plan
   - `/api/b2b-billing/stripe-payment`: Integración con Stripe
   - `/api/b2b-billing/webhook`: Webhooks de Stripe
   - `/api/b2b-billing/notifications`: Sistema de notificaciones

4. **Interfaces de Usuario**
   - Dashboard SuperAdmin: `/admin/facturacion-b2b`
   - Portal Empresas: `/facturacion`

---

## 📦 Modelos de Datos

### B2BInvoice

```prisma
model B2BInvoice {
  id                String        @id @default(uuid())
  companyId         String
  numeroFactura     String        @unique // INV-2026-01-0001
  fechaEmision      DateTime      @default(now())
  fechaVencimiento  DateTime
  periodo           String        // "2026-01"
  
  // Importes
  subtotal          Float
  descuento         Float         @default(0)
  impuestos         Float         // IVA 21%
  total             Float
  
  // Estado y Pago
  estado            InvoiceStatus @default(PENDIENTE)
  metodoPago        String?
  fechaPago         DateTime?
  
  // Stripe
  stripeInvoiceId       String?   @unique
  stripePaymentIntentId String?
  stripePdfUrl          String?
  
  // Detalles
  conceptos         Json          // Array de items
  notas             String?
  terminosPago      String?       @default("30 días")
  
  // Relaciones
  company           Company       @relation(...)
  subscriptionPlan  SubscriptionPlan? @relation(...)
}

enum InvoiceStatus {
  PENDIENTE
  PAGADA
  VENCIDA
  CANCELADA
  PARCIALMENTE_PAGADA
}
```

### B2BPaymentHistory

Registra todos los pagos realizados (exitosos o fallidos).

```prisma
model B2BPaymentHistory {
  id              String   @id @default(uuid())
  companyId       String
  invoiceId       String?
  
  monto           Float
  metodoPago      String
  fechaPago       DateTime @default(now())
  referencia      String?
  
  // Stripe
  stripePaymentId String?  @unique
  stripeChargeId  String?
  stripeFee       Float?
  stripeNetAmount Float?
  
  estado          String   // "completado", "fallido", "reembolsado"
  notas           String?
}
```

### B2BFinancialReport

Reportes agregados por período (mensual, trimestral, anual).

```prisma
model B2BFinancialReport {
  id                  String   @id @default(uuid())
  periodo             String   @unique // "2026-01"
  tipoReporte         String   // "mensual", "trimestral", "anual"
  
  // Métricas de Ingresos
  ingresosBrutos      Float
  descuentosTotal     Float
  impuestosTotal      Float
  ingresosNetos       Float
  
  // Métricas de Suscripciones
  empresasActivas     Int
  empresasNuevas      Int
  empresasCanceladas  Int
  tasaRetencion       Float    // %
  
  // Métricas de Facturas
  facturasEmitidas    Int
  facturasPagadas     Int
  facturasVencidas    Int
  ticketPromedio      Float
  
  // Crecimiento
  crecimientoMoM      Float?   // Month over Month %
  crecimientoYoY      Float?   // Year over Year %
  
  detalles            Json     // Breakdown detallado
}
```

---

## 🚀 Funcionalidades Principales

### 1. Generación Automática de Facturas

**Endpoint:** `POST /api/b2b-billing/invoices`

```json
{
  "action": "generate-monthly",
  "periodo": "2026-01"
}
```

**Funcionalidad:**
- Itera sobre todas las empresas activas con plan de suscripción
- Genera factura mensual automáticamente
- Calcula subtotal, IVA (21%), descuentos
- Asigna número de factura único: `INV-2026-01-0001`
- Fecha de vencimiento: 30 días desde emisión

### 2. Registro de Pagos

**Endpoint:** `POST /api/b2b-billing/payments`

```json
{
  "invoiceId": "uuid",
  "monto": 150.00,
  "metodoPago": "stripe",
  "referencia": "tx_12345"
}
```

**Funcionalidad:**
- Registra pago en historial
- Actualiza estado de factura (PAGADA o PARCIALMENTE_PAGADA)
- Registra información de Stripe (fees, charge ID, etc.)

### 3. Integración con Stripe

#### Crear Payment Intent

**Endpoint:** `POST /api/b2b-billing/stripe-payment`

```json
{
  "invoiceId": "uuid",
  "returnUrl": "https://inmova.app/facturacion"
}
```

**Respuesta:**

```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_..."
}
```

#### Webhook de Stripe

**Endpoint:** `POST /api/b2b-billing/webhook`

**Eventos Soportados:**
- `payment_intent.succeeded`: Pago exitoso
- `payment_intent.payment_failed`: Pago fallido
- `invoice.payment_succeeded`: Factura de suscripción pagada

### 4. Reportes Financieros

**Endpoint:** `POST /api/b2b-billing/reports`

```json
{
  "periodo": "2026-01",
  "tipoReporte": "mensual"
}
```

**Métricas Generadas:**
- Ingresos brutos, netos, impuestos
- Número de facturas (emitidas, pagadas, vencidas)
- Ticket promedio
- Empresas activas, nuevas, canceladas
- Tasa de retención
- Crecimiento MoM (Month-over-Month)
- Desglose por plan de suscripción

### 5. Gestión de Suscripciones

**Endpoint:** `POST /api/b2b-billing/subscriptions`

#### Upgrade de Plan

```json
{
  "companyId": "uuid",
  "action": "upgrade",
  "planId": "uuid",
  "razon": "Necesitan más usuarios"
}
```

**Funcionalidad:**
- Calcula prorrateo del costo adicional
- Actualiza límites de la empresa (maxUsuarios, maxPropiedades)
- Genera factura adicional si aplica
- Registra cambio en historial

#### Cancelación

```json
{
  "companyId": "uuid",
  "action": "cancelacion",
  "razon": "Cliente solicitó baja"
}
```

### 6. Sistema de Notificaciones

**Endpoint:** `POST /api/b2b-billing/notifications`

#### Marcar Facturas Vencidas

```json
{
  "action": "mark-overdue"
}
```

#### Enviar Recordatorios Automáticos

```json
{
  "action": "send-reminders"
}
```

**Criterios:**
- Facturas pendientes con vencimiento en 3 días o menos
- No se ha enviado recordatorio en los últimos 15 días

#### Recordatorio Manual

```json
{
  "action": "send-single-reminder",
  "invoiceId": "uuid",
  "customMessage": "Por favor, realice el pago a la brevedad."
}
```

#### Resumen Mensual

```json
{
  "action": "send-monthly-summary"
}
```

Envía resumen a todas las empresas con:
- Total facturado del mes
- Facturas pagadas y pendientes
- Información del plan actual

---

## 🖥️ Interfaces de Usuario

### Dashboard SuperAdmin

**Ruta:** `/admin/facturacion-b2b`

**Características:**
- 📊 KPIs principales:
  - Ingresos del mes
  - Pendiente de cobro
  - Total de facturas
  - Tasa de pago
- 📋 Listado de facturas con filtros por estado
- ⚙️ Botón de generación mensual automática
- 📝 Creación de facturas manuales
- 👁️ Vista detallada de cada factura

### Detalle de Factura (SuperAdmin)

**Ruta:** `/admin/facturacion-b2b/[id]`

**Características:**
- 📝 Información completa de la factura
- 🏢 Datos del cliente (empresa)
- 📋 Conceptos desglosados
- 💳 Historial de pagos
- ➕ Registro manual de pagos
- 📥 Descarga de PDF (próximamente)

### Portal de Facturación (Empresas)

**Ruta:** `/facturacion`

**Características:**
- 📦 Información del plan actual
- 📈 Uso de recursos (usuarios, propiedades)
- ⚠️ Alertas de facturas pendientes
- 📚 Tabs de facturas (Todas, Pendientes, Pagadas, Vencidas)
- 💳 Botón de pago rápido
- 📥 Descarga de facturas individuales

---

## 🛠️ Configuración

### Variables de Entorno Requeridas

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
NEXTAUTH_URL=https://inmova.app

# Email (para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@inmova.com
SMTP_PASSWORD=...
```

### Configuración de Stripe

1. **Crear Webhook en Stripe Dashboard:**
   - URL: `https://inmova.app/api/b2b-billing/webhook`
   - Eventos a escuchar:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `invoice.payment_succeeded`

2. **Copiar Webhook Secret** y agregarlo a `.env`

### Migración de Base de Datos

```bash
cd nextjs_space
yarn prisma generate
yarn prisma db push
```

---

## 🤖 Automatización Recomendada

### Cron Jobs (Tareas Programadas)

1. **Generación Mensual de Facturas**
   - Frecuencia: 1º día de cada mes a las 00:00
   - Comando:
     ```bash
     curl -X POST https://inmova.app/api/b2b-billing/invoices \
       -H "Authorization: Bearer ADMIN_TOKEN" \
       -d '{"action": "generate-monthly"}'
     ```

2. **Marcar Facturas Vencidas**
   - Frecuencia: Diario a las 01:00
   - Comando:
     ```bash
     curl -X POST https://inmova.app/api/b2b-billing/notifications \
       -H "Authorization: Bearer ADMIN_TOKEN" \
       -d '{"action": "mark-overdue"}'
     ```

3. **Enviar Recordatorios de Pago**
   - Frecuencia: Diario a las 09:00
   - Comando:
     ```bash
     curl -X POST https://inmova.app/api/b2b-billing/notifications \
       -H "Authorization: Bearer ADMIN_TOKEN" \
       -d '{"action": "send-reminders"}'
     ```

4. **Resumen Mensual a Empresas**
   - Frecuencia: Último día del mes a las 18:00
   - Comando:
     ```bash
     curl -X POST https://inmova.app/api/b2b-billing/notifications \
       -H "Authorization: Bearer ADMIN_TOKEN" \
       -d '{"action": "send-monthly-summary"}'
     ```

5. **Generar Reporte Financiero Mensual**
   - Frecuencia: 1º día de cada mes a las 02:00
   - Comando:
     ```bash
     curl -X POST https://inmova.app/api/b2b-billing/reports \
       -H "Authorization: Bearer ADMIN_TOKEN" \
       -d '{"periodo": "2026-01", "tipoReporte": "mensual"}'
     ```

---

## 📊 Casos de Uso

### Caso 1: Facturación Mensual Automática

1. El 1 de cada mes, el sistema ejecuta `generate-monthly-invoices()`
2. Para cada empresa activa:
   - Genera factura con el plan de suscripción actual
   - Calcula IVA (21%)
   - Asigna número de factura secuencial
   - Estado inicial: `PENDIENTE`
3. Se envía email de notificación (opcional)

### Caso 2: Pago con Stripe

1. Cliente accede a `/facturacion`
2. Hace clic en "Pagar" para una factura pendiente
3. Sistema crea Payment Intent en Stripe
4. Cliente completa el pago en el formulario de Stripe
5. Stripe envía webhook `payment_intent.succeeded`
6. Sistema registra pago y actualiza estado a `PAGADA`
7. Cliente recibe confirmación por email

### Caso 3: Upgrade de Plan

1. SuperAdmin decide hacer upgrade de una empresa
2. Llama a `POST /api/b2b-billing/subscriptions`:
   ```json
   {
     "companyId": "company-123",
     "action": "upgrade",
     "planId": "plan-profesional"
   }
   ```
3. Sistema:
   - Calcula prorrateo (€50 del mes antiguo, €100 del nuevo = €25 adicionales)
   - Genera factura adicional por €25 + IVA
   - Actualiza `maxUsuarios` y `maxPropiedades`
   - Registra cambio en `B2BSubscriptionHistory`
4. Empresa recibe notificación del cambio

### Caso 4: Recordatorios Automáticos

1. Diariamente a las 09:00, sistema ejecuta `send-reminders()`
2. Busca facturas:
   - Estado: `PENDIENTE`
   - Vencimiento ≤ 3 días
   - Último recordatorio hace ≥ 15 días (o nunca enviado)
3. Para cada factura:
   - Envía email personalizado con datos de la factura
   - Incrementa contador `recordatoriosEnviados`
   - Actualiza `ultimoRecordatorio`

---

## 🔐 Seguridad y Permisos

### Roles y Acceso

| Funcionalidad | Super Admin | Admin Empresa | Usuario Empresa |
|--------------|-------------|---------------|------------------|
| Ver todas las facturas | ✅ | ❌ | ❌ |
| Ver facturas propias | ✅ | ✅ | ✅ |
| Crear facturas | ✅ | ❌ | ❌ |
| Registrar pagos | ✅ | ❌ | ❌ |
| Generar reportes | ✅ | ❌ | ❌ |
| Cambiar suscripción | ✅ | ❌ | ❌ |
| Pagar facturas | ✅ | ✅ | ✅ |
| Descargar facturas | ✅ | ✅ | ✅ |

### Validaciones

- Todas las APIs validan autenticación con `getServerSession()`
- Verificación de permisos por rol
- Empresas solo pueden ver/pagar sus propias facturas
- SuperAdmin tiene acceso completo

---

## 📦 Testing

### Pruebas Manuales

1. **Generar Facturas:**
   ```bash
   curl -X POST http://localhost:3000/api/b2b-billing/invoices \
     -H "Content-Type: application/json" \
     -d '{"action": "generate-monthly", "periodo": "2026-01"}'
   ```

2. **Listar Facturas:**
   ```bash
   curl http://localhost:3000/api/b2b-billing/invoices?page=1&limit=20
   ```

3. **Ver Detalle:**
   ```bash
   curl http://localhost:3000/api/b2b-billing/invoices/[invoice-id]
   ```

4. **Registrar Pago:**
   ```bash
   curl -X POST http://localhost:3000/api/b2b-billing/payments \
     -H "Content-Type: application/json" \
     -d '{
       "invoiceId": "[invoice-id]",
       "monto": 121.00,
       "metodoPago": "transferencia",
       "referencia": "REF-12345"
     }'
   ```

### Datos de Prueba

Para probar el sistema, crear:

1. **Empresa de Prueba:**
   ```sql
   INSERT INTO Company (id, nombre, email, subscriptionPlanId, estadoCliente, activo)
   VALUES ('test-company-1', 'Empresa Test', 'test@empresa.com', '[plan-id]', 'activo', true);
   ```

2. **Ejecutar Generación de Facturas** para el mes actual

3. **Probar Flujos de Pago** con Stripe en modo test

---

## 📝 Próximas Mejoras

### Corto Plazo
- ✅ Generación de PDF de facturas
- ✅ Dashboard de métricas financieras con gráficos
- ✅ Exportación de reportes a Excel/CSV
- ✅ Notificaciones push/in-app además de email

### Mediano Plazo
- ✅ Suscripciones recurrentes con Stripe Billing
- ✅ Pagos fraccionados (cuotas)
- ✅ Múltiples métodos de pago (PayPal, transferencia SEPA)
- ✅ Sistema de descuentos y promociones

### Largo Plazo
- ✅ Integración con sistemas contables (Sage, A3, etc.)
- ✅ Facturación electrónica certificada (TicketBAI, SII)
- ✅ Múltiples monedas y tipos de cambio
- ✅ Portal de autoservicio para cambios de plan

---

## 👥 Soporte

Para cualquier consulta o incidencia relacionada con el sistema de facturación B2B:

- **Email:** soporte@inmova.com
- **Documentación Técnica:** Este archivo
- **Código Fuente:** Ver carpetas `lib/` y `app/api/b2b-billing/`

---

© 2026 INMOVA - Sistema de Facturación B2B
