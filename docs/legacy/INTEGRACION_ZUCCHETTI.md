# 🔗 INTEGRACIÓN ZUCCHETTI (Antes Altai)

## Guía Técnica de Integración Contable INMOVA

---

## 📋 ÍNDICE

1. [Introducción](#introduccion)
2. [Arquitectura de Integración](#arquitectura)
3. [API Zucchetti](#api)
4. [Flujos de Datos](#flujos)
5. [Implementación](#implementacion)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Roadmap](#roadmap)

---

## 🎯 INTRODUCCIÓN {#introduccion}

### Contexto

**Zucchetti** (antes Altai) es un líder europeo en software de gestión empresarial (ERP, contabilidad, nóminas). Muchas gestoras inmobiliarias en España usan **Zucchetti Contabilidad** para su gestión financiera.

**Problema**: Los datos de INMOVA (ingresos por rentas, gastos, facturas) deben exportarse manualmente a Zucchetti, causando:
- Doble entrada de datos
- Errores humanos
- Pérdida de tiempo (5-10 horas/mes)
- Desincronización entre sistemas

**Solución INMOVA**: Integración bidireccional automática mediante API.

### Objetivos de la Integración
✅ **Sincronización automática** de asientos contables  
✅ **Bidireccional**: INMOVA ↔ Zucchetti  
✅ **Tiempo real**: Cambios reflejados en <5 minutos  
✅ **Cero intervención manual**: Set and forget  
✅ **Auditable**: Logs completos de todas las transacciones  
✅ **Seguro**: Encriptación, OAuth, GDPR-compliant

### Scope

**Fase 1** (Q1 2026):
- Exportar asientos contables de INMOVA a Zucchetti
- Ingresos (rentas cobradas)
- Gastos (mantenimiento, suministros, comunidad)
- Facturas emitidas y recibidas

**Fase 2** (Q2 2026):
- Importar datos contables de Zucchetti a INMOVA
- Conciliación bancaria automática
- Dashboards financieros en INMOVA con datos Zucchetti

**Fase 3** (Q3 2026):
- Reporting fiscal automático (Modelo 347, 180, etc.)
- Integración con Zucchetti Nóminas (si aplica)

---

## 🏛️ ARQUITECTURA DE INTEGRACIÓN {#arquitectura}

### Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────┐
│                    INMOVA PLATFORM                     │
├──────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐ │
│  │    Core App (Next.js + Prisma)            │ │
│  │                                            │ │
│  │  - Payments, Expenses, Invoices         │ │
│  │  - Financial Transactions               │ │
│  └────────────────┬─────────────────────────┘ │
│                  │                                │
│                  ↓ Webhook Events                │
│                  │                                │
│  ┌───────────────┴─────────────────────────┐ │
│  │    Zucchetti Integration Service        │ │
│  │                                            │ │
│  │  - Event Queue (BullMQ)                 │ │
│  │  - Mapping Logic                        │ │
│  │  - Retry Mechanism                      │ │
│  │  - Error Handling & Logs                │ │
│  └────────────────┬─────────────────────────┘ │
│                  │                                │
└──────────────────↓───────────────────────────────┘
                  │ HTTPS/REST API
                  │ (OAuth 2.0)
                  │
┌─────────────────↓───────────────────────────────┐
│             ZUCCHETTI API                        │
├──────────────────────────────────────────────────┤
│                                                │
│  Endpoints:                                     │
│  - POST /api/v1/accounting/entries              │
│  - GET  /api/v1/accounting/entries              │
│  - POST /api/v1/customers                       │
│  - POST /api/v1/suppliers                       │
│  - GET  /api/v1/chart-of-accounts               │
│                                                │
└──────────────────────────────────────────────────┘
```

### Componentes

#### 1. INMOVA Core App

- **Next.js API Routes**: Endpoints internos para manejar eventos financieros
- **Prisma ORM**: Acceso a base de datos de pagos, gastos, facturas
- **Webhooks**: Emiten eventos cuando hay cambios financieros

#### 2. Zucchetti Integration Service

**Tecnologías**:
- **Node.js**: Runtime
- **BullMQ**: Cola de eventos para procesamiento asíncrono
- **Redis**: Backend para BullMQ
- **Axios**: Cliente HTTP para llamadas a Zucchetti API
- **Winston**: Logging

**Funcionalidades**:
1. **Event Listener**: Escucha eventos financieros de INMOVA
2. **Mapping Engine**: Transforma datos INMOVA a formato Zucchetti
3. **API Client**: Comunica con Zucchetti API
4. **Retry Logic**: Reintenta peticiones fallidas (exponential backoff)
5. **Error Handler**: Captura y loguea errores
6. **Sync Log**: Almacena historial de sincronizaciones

#### 3. Zucchetti API

**Documentación Oficial**: https://api.zucchetti.com/docs  
**Autenticación**: OAuth 2.0 Client Credentials  
**Rate Limits**: 100 requests/minuto  
**Formato**: JSON (REST)

---

## 🔌 API ZUCCHETTI {#api}

### Autenticación

**OAuth 2.0 Client Credentials Flow**

```typescript
// lib/zucchetti-auth.ts
import axios from 'axios';

interface ZucchettiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // segundos
}

let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;

export async function getZucchettiAccessToken(): Promise<string> {
  // Check if token is still valid
  if (cachedToken && tokenExpiry && tokenExpiry > new Date()) {
    return cachedToken;
  }

  // Request new token
  const response = await axios.post<ZucchettiTokenResponse>(
    'https://api.zucchetti.com/oauth/token',
    {
      grant_type: 'client_credentials',
      client_id: process.env.ZUCCHETTI_CLIENT_ID!,
      client_secret: process.env.ZUCCHETTI_CLIENT_SECRET!,
      scope: 'accounting:write accounting:read'
    },
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  cachedToken = response.data.access_token;
  // Set expiry to 5 minutes before actual expiration
  tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

  return cachedToken;
}
```

### Endpoints Principales

#### 1. Crear Asiento Contable

**POST** `/api/v1/accounting/entries`

**Request**:

```json
{
  "company_id": "INMOVA_COMPANY_123",
  "entry_date": "2025-11-29",
  "description": "Cobro renta Habitación 3 - Edificio Gran Vía 45",
  "reference": "PAYMENT_cuid123456",
  "lines": [
    {
      "account_code": "570001",
      "account_name": "Caja/Bancos",
      "debit": 600.00,
      "credit": 0,
      "cost_center": "BUILDING_001"
    },
    {
      "account_code": "705001",
      "account_name": "Ingresos por Arrendamientos",
      "debit": 0,
      "credit": 600.00,
      "cost_center": "BUILDING_001"
    }
  ]
}
```

**Response**:

```json
{
  "entry_id": "ZUC_ENTRY_789",
  "status": "posted",
  "entry_number": "00012345",
  "created_at": "2025-11-29T10:30:00Z"
}
```

#### 2. Obtener Plan Contable

**GET** `/api/v1/chart-of-accounts?company_id=INMOVA_COMPANY_123`

**Response**:

```json
{
  "accounts": [
    {
      "code": "570001",
      "name": "Caja",
      "type": "asset",
      "parent_code": "570"
    },
    {
      "code": "705001",
      "name": "Ingresos por Arrendamientos Residenciales",
      "type": "revenue",
      "parent_code": "705"
    },
    {
      "code": "629001",
      "name": "Gastos Mantenimiento y Reparaciones",
      "type": "expense",
      "parent_code": "629"
    }
    // ... más cuentas
  ]
}
```

#### 3. Crear Cliente

**POST** `/api/v1/customers`

```json
{
  "company_id": "INMOVA_COMPANY_123",
  "customer_code": "TENANT_cuid7890",
  "name": "Juan Pérez Gómez",
  "tax_id": "12345678Z",
  "email": "juan.perez@example.com",
  "address": {
    "street": "Calle Mayor 10",
    "city": "Madrid",
    "postal_code": "28013",
    "country": "ES"
  },
  "payment_terms": "5_dias"
}
```

#### 4. Crear Proveedor

**POST** `/api/v1/suppliers`

```json
{
  "company_id": "INMOVA_COMPANY_123",
  "supplier_code": "PROV_cuid3456",
  "name": "Fontanería Rápida SL",
  "tax_id": "B87654321",
  "email": "contacto@fontanerirapida.com",
  "address": {
    "street": "Avenida Industria 50",
    "city": "Madrid",
    "postal_code": "28040",
    "country": "ES"
  },
  "payment_terms": "30_dias"
}
```

---

## 🔄 FLUJOS DE DATOS {#flujos}

### Flujo 1: Cobro de Renta (INMOVA → Zucchetti)

```
1. Inquilino paga renta en Portal INMOVA
   ↓
2. Payment record se marca como "pagado" en INMOVA DB
   ↓
3. Webhook event: "payment.received"
   ↓
4. Zucchetti Integration Service escucha event
   ↓
5. Mapping: Payment → Accounting Entry
   - Debe: 570001 (Bancos)
   - Haber: 705001 (Ingresos Arrendamientos)
   ↓
6. POST a Zucchetti API /accounting/entries
   ↓
7. Zucchetti confirma: entry_id = "ZUC_ENTRY_789"
   ↓
8. INMOVA guarda sync log:
   - payment_id → zucchetti_entry_id
   - status: "synced"
   - synced_at: timestamp
```

### Flujo 2: Gasto de Mantenimiento (INMOVA → Zucchetti)

```
1. Gestor registra gasto de fontanería en INMOVA
   - Expense: €150
   - Category: Mantenimiento
   - Supplier: Fontanería Rápida SL
   ↓
2. Webhook event: "expense.created"
   ↓
3. Zucchetti Integration Service procesa
   ↓
4. Check: ¿Supplier existe en Zucchetti?
   - Si NO: POST /suppliers primero
   - Si SÍ: Continuar
   ↓
5. Mapping: Expense → Accounting Entry
   - Debe: 629001 