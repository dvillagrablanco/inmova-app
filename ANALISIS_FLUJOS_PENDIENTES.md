# 📊 ANÁLISIS DE FLUJOS INTERNOS PENDIENTES - INMOVA

**Fecha**: Enero 2026  
**Basado en**: Cursorrules y análisis de código

---

## 🔴 FLUJOS CRÍTICOS FALTANTES

### 1. GENERACIÓN AUTOMÁTICA DE RECIBOS/PAGOS MENSUALES

**Estado**: ❌ NO IMPLEMENTADO

**Descripción**: No existe un proceso automático que genere los pagos pendientes mensuales para cada contrato activo al inicio de cada mes.

**Lo que existe actualmente**:
- `app/api/payments/route.ts` - API para crear pagos manualmente
- `lib/payment-reminder-service.ts` - Recordatorios de pagos atrasados
- `app/api/cron/process-payment-reminders/route.ts` - CRON para recordatorios

**Lo que falta**:
```typescript
// lib/monthly-payments-generator.ts
// Servicio que:
// 1. Lista todos los contratos activos
// 2. Para cada contrato, verifica si ya existe el pago del mes actual
// 3. Si no existe, crea automáticamente el registro de pago pendiente
// 4. Envía notificación al inquilino

// app/api/cron/generate-monthly-payments/route.ts
// CRON que ejecuta el día 1 de cada mes (o configurable)
```

**Impacto**: ALTO - Sin esto, los administradores deben crear manualmente cada recibo mensual.

---

### 2. CONCILIACIÓN BANCARIA AUTOMÁTICA

**Estado**: ❌ NO IMPLEMENTADO (solo estructura base)

**Descripción**: No existe un sistema que compare las transacciones bancarias con los pagos registrados y los marque como pagados automáticamente.

**Lo que existe actualmente**:
- `lib/open-banking-service.ts` - Conexión con bancos (modo demo)
- `lib/bankinter-integration-service.ts` - Integración Bankinter (parcial)
- `model BankTransaction` en Prisma - Modelo de transacciones
- `app/api/open-banking/redsys/.disabled/` - Código deshabilitado

**Lo que falta**:
```typescript
// lib/bank-reconciliation-service.ts
// Servicio que:
// 1. Obtiene transacciones bancarias (entrantes)
// 2. Para cada transacción, busca pagos pendientes que coincidan:
//    - Mismo importe (con tolerancia)
//    - Referencia en concepto (ej: "ALQUILER PISO 3B")
//    - IBAN del inquilino
// 3. Marca el pago como "pagado" automáticamente
// 4. Registra la conciliación

// app/api/cron/bank-reconciliation/route.ts
// CRON diario para conciliar
```

**Impacto**: ALTO - Los pagos recibidos por transferencia deben marcarse manualmente.

---

### 3. DOMICILIACIÓN SEPA (DIRECT DEBIT)

**Estado**: ❌ NO IMPLEMENTADO

**Descripción**: No existe integración para cobrar automáticamente las rentas mediante domiciliación bancaria SEPA.

**Lo que existe actualmente**:
- Menciones a "SEPA" en código pero sin implementación real
- `lib/gocardless-integration.ts` - Estructura base GoCardless (incompleta)

**Lo que falta**:
```typescript
// lib/sepa-direct-debit-service.ts
// Integración con:
// - GoCardless (recomendado para Europa)
// - Stripe SEPA Direct Debit
// - O pasarela bancaria directa

// Funcionalidades:
// 1. Registrar mandato SEPA del inquilino
// 2. Programar cobros recurrentes
// 3. Procesar devoluciones/rechazos
// 4. Notificar pre-cobro (obligatorio por ley)
```

**Impacto**: ALTO - La domiciliación reduce morosidad drásticamente.

---

### 4. FACTURACIÓN A INQUILINOS

**Estado**: ⚠️ PARCIAL

**Descripción**: No existe un modelo de factura para inquilinos. Solo hay recibos de pago.

**Lo que existe actualmente**:
- `model B2BInvoice` - Facturas B2B (para clientes de INMOVA)
- `lib/invoice-pdf.ts` - Generador de PDF de facturas
- `app/api/payments/[id]/receipt/route.ts` - Genera recibos de pago

**Lo que falta**:
```typescript
// model TenantInvoice en Prisma
// Factura completa con:
// - Serie y número
// - Datos fiscales (CIF/NIF)
// - Conceptos desglosados
// - IVA/IRPF según tipo
// - Base imponible
// - Retenciones
// - PDF oficial

// lib/tenant-invoice-service.ts
// Servicio para:
// 1. Generar factura cuando se cobra renta
// 2. Aplicar retenciones IRPF si aplica
// 3. Numeración automática por serie
// 4. Envío automático por email
```

**Impacto**: MEDIO - Algunos propietarios necesitan factura oficial con IVA/IRPF.

---

### 5. FLUJO COMPLETO DE FIRMA DIGITAL → CONTRATO → PAGOS

**Estado**: ⚠️ PARCIAL

**Descripción**: La firma digital existe pero no está completamente conectada con la activación del contrato y generación de pagos.

**Lo que existe actualmente**:
- `lib/digital-signature-service.ts` - Firma con Signaturit/DocuSign
- `lib/signaturit-service.ts` - Integración Signaturit
- `app/api/contracts/[id]/sign/route.ts` - API de firma
- `app/api/webhooks/signaturit/route.ts` - Webhook de firma

**Lo que falta**:
```typescript
// En el webhook de firma completada:
// 1. Cambiar estado del contrato a "activo"
// 2. Generar el primer pago pendiente
// 3. Configurar cobro recurrente (si hay SEPA)
// 4. Notificar a todas las partes
// 5. Guardar documento firmado en S3
// 6. Actualizar estado del inquilino
```

**Impacto**: MEDIO - Actualmente requiere pasos manuales post-firma.

---

## 🟡 FLUJOS PARCIALMENTE IMPLEMENTADOS

### 6. SCREENING DE INQUILINOS

**Estado**: ⚠️ PARCIAL (sin APIs externas)

**Lo que existe**:
- `lib/screening-service.ts` - Sistema de scoring manual
- Sistema de 20+ criterios con puntuación

**Lo que falta**:
- Integración con ASNEF/RAI/Experian para consulta de morosidad
- Verificación automática de identidad (ej: Veriff, Onfido)
- Validación de nóminas con IA

---

### 7. INTEGRACIÓN CONTABLE

**Estado**: ⚠️ PARCIAL (estructura sin conexión real)

**Lo que existe**:
- `lib/a3-integration-service.ts` - Estructura A3
- `lib/alegra-integration-service.ts` - Estructura Alegra
- `lib/inmova-contasimple-bridge.ts` - Estructura Contasimple

**Lo que falta**:
- Conexiones API reales (requieren contrato con proveedores)
- Flujo de exportación automática de asientos
- Conciliación entre INMOVA y contabilidad

---

### 8. RENOVACIÓN AUTOMÁTICA DE CONTRATOS

**Estado**: ⚠️ PARCIAL

**Lo que existe**:
- `lib/contract-renewal-service.ts` - Alertas de renovación
- `app/api/cron/process-contract-renewals/route.ts` - CRON de alertas

**Lo que falta**:
- Generación automática de nuevo contrato
- Flujo de firma para renovación
- Actualización automática de renta (IPC)

---

## 🟢 FLUJOS BIEN IMPLEMENTADOS

| Flujo | Estado | Archivos |
|-------|--------|----------|
| Gestión de propiedades | ✅ | `/edificios`, `/unidades` |
| Gestión de inquilinos | ✅ | `/inquilinos` |
| Contratos básicos | ✅ | `/contratos` |
| Pagos manuales | ✅ | `/pagos` |
| Mantenimiento | ✅ | `/mantenimiento` |
| Recordatorios de pago | ✅ | `payment-reminder-service.ts` |
| Firma digital (base) | ✅ | `digital-signature-service.ts` |
| Portal inquilino | ✅ | `/portal-inquilino` |
| Pago online (Stripe) | ✅ | Stripe integration |
| Recibos de pago | ✅ | `generatePaymentReceiptPDF` |
| Open Banking (demo) | ✅ | `open-banking-service.ts` |

---

## 📋 PRIORIZACIÓN DE DESARROLLO

### CRÍTICO (Impacta operación diaria)
1. **Generación automática de pagos mensuales** - 2-3 días
2. **Conciliación bancaria** - 3-4 días
3. **Domiciliación SEPA** - 4-5 días (requiere GoCardless)

### IMPORTANTE (Mejora significativa)
4. **Flujo completo firma → activación** - 2 días
5. **Facturación a inquilinos** - 3 días
6. **Renovación automática** - 3 días

### DESEABLE (Diferenciación)
7. **Screening con APIs externas** - 5 días (requiere contratos)
8. **Integración contable real** - 5 días (requiere contratos)

---

## 🔧 PRÓXIMOS PASOS RECOMENDADOS

1. **Implementar generación automática de pagos** (CRON día 1 de mes)
2. **Implementar conciliación bancaria básica** (matching por importe/referencia)
3. **Integrar GoCardless para SEPA** (registro de mandatos + cobros)
4. **Completar flujo post-firma** (activar contrato + generar pago)
5. **Crear modelo TenantInvoice** (facturas con IVA/IRPF)

---

## 📚 REFERENCIAS

- cursorrules: Sección "Core Framework" - Pagos, Contratos
- cursorrules: Sección "MÓDULOS CORE" - pagos, contratos, mantenimiento
- Prisma schema: models Payment, Contract, BankTransaction
- Servicios existentes: `/lib/` directory
