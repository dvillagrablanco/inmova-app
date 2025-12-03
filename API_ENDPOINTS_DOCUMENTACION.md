# Documentación API - INMOVA

## Índice
1. [Autenticación](#autenticación)
2. [Buildings (Edificios)](#buildings-edificios)
3. [Units (Unidades)](#units-unidades)
4. [Tenants (Inquilinos)](#tenants-inquilinos)
5. [Contracts (Contratos)](#contracts-contratos)
6. [Payments (Pagos)](#payments-pagos)
7. [Maintenance (Mantenimiento)](#maintenance-mantenimiento)
8. [Stripe Integration](#stripe-integration)
9. [Room Rental (Coliving)](#room-rental-coliving)
10. [Super Admin](#super-admin)
11. [Códigos de Error](#códigos-de-error)

---

## Base URL

```
Producción: https://inmova.app/api
Desarrollo: http://localhost:3000/api
```

---

## Autenticación

### Login

**POST** `/auth/[...nextauth]`

Autenticación con credenciales.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "tu_contraseña"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "usr_123",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "role": "administrador",
    "companyId": "cmp_456"
  },
  "token": "jwt_token_here"
}
```

### Get Session

**GET** `/auth/session`

Obtiene la sesión actual del usuario autenticado.

**Headers:**
```
Cookie: next-auth.session-token=...
```

**Response (200):**
```json
{
  "user": {
    "id": "usr_123",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "role": "administrador",
    "companyId": "cmp_456"
  },
  "expires": "2025-12-31T23:59:59.999Z"
}
```

---

## Buildings (Edificios)

### Listar Edificios

**GET** `/buildings`

Obtiene todos los edificios de la empresa del usuario autenticado.

**Query Parameters:**
- `tipo` (opcional): Filtrar por tipo de propiedad

**Response (200):**
```json
[
  {
    "id": "bld_123",
    "nombre": "Edificio Central",
    "direccion": "Calle Mayor 10, Madrid",
    "tipo": "residencial",
    "numeroUnidades": 12,
    "unidadesOcupadas": 10,
    "tasaOcupacion": 83.33,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-06-20T14:30:00.000Z"
  }
]
```

### Crear Edificio

**POST** `/buildings`

Crea un nuevo edificio.

**Body:**
```json
{
  "nombre": "Nuevo Edificio",
  "direccion": "Calle Nueva 25, Barcelona",
  "codigoPostal": "08001",
  "ciudad": "Barcelona",
  "tipo": "residencial",
  "numeroUnidades": 8,
  "administrador": "Juan Pérez"
}
```

**Response (201):**
```json
{
  "id": "bld_789",
  "nombre": "Nuevo Edificio",
  "direccion": "Calle Nueva 25, Barcelona",
  "tipo": "residencial",
  "numeroUnidades": 8,
  "createdAt": "2025-12-03T15:00:00.000Z"
}
```

### Obtener Edificio por ID

**GET** `/buildings/[id]`

**Response (200):**
```json
{
  "id": "bld_123",
  "nombre": "Edificio Central",
  "direccion": "Calle Mayor 10, Madrid",
  "tipo": "residencial",
  "numeroUnidades": 12,
  "units": [
    {
      "id": "unt_1",
      "nombre": "Piso 1A",
      "rentaMensual": 1200,
      "estado": "ocupada"
    }
  ],
  "ingresosMensuales": 14400,
  "tasaOcupacion": 83.33
}
```

### Actualizar Edificio

**PATCH** `/buildings/[id]`

**Body:**
```json
{
  "nombre": "Edificio Central Actualizado",
  "numeroUnidades": 15
}
```

**Response (200):**
```json
{
  "id": "bld_123",
  "nombre": "Edificio Central Actualizado",
  "numeroUnidades": 15,
  "updatedAt": "2025-12-03T16:00:00.000Z"
}
```

### Eliminar Edificio

**DELETE** `/buildings/[id]`

**Response (200):**
```json
{
  "message": "Edificio eliminado correctamente"
}
```

---

## Units (Unidades)

### Listar Unidades

**GET** `/units`

**Query Parameters:**
- `buildingId` (opcional): Filtrar por edificio
- `estado` (opcional): `disponible`, `ocupada`, `mantenimiento`

**Response (200):**
```json
[
  {
    "id": "unt_1",
    "nombre": "Piso 1A",
    "buildingId": "bld_123",
    "building": {
      "nombre": "Edificio Central"
    },
    "rentaMensual": 1200,
    "deposito": 2400,
    "habitaciones": 3,
    "banos": 2,
    "metrosCuadrados": 95,
    "estado": "ocupada",
    "contract": {
      "tenant": {
        "nombre": "María García"
      }
    }
  }
]
```

### Crear Unidad

**POST** `/units`

**Body:**
```json
{
  "buildingId": "bld_123",
  "nombre": "Piso 2B",
  "piso": 2,
  "rentaMensual": 1300,
  "deposito": 2600,
  "habitaciones": 3,
  "banos": 2,
  "metrosCuadrados": 100,
  "estado": "disponible"
}
```

**Response (201):**
```json
{
  "id": "unt_456",
  "nombre": "Piso 2B",
  "rentaMensual": 1300,
  "estado": "disponible",
  "createdAt": "2025-12-03T15:30:00.000Z"
}
```

---

## Tenants (Inquilinos)

### Listar Inquilinos

**GET** `/tenants`

**Query Parameters:**
- `search` (opcional): Buscar por nombre o email

**Response (200):**
```json
[
  {
    "id": "tnt_1",
    "nombre": "María García",
    "email": "maria@example.com",
    "telefono": "+34 600 123 456",
    "dni": "12345678A",
    "createdAt": "2025-02-10T09:00:00.000Z",
    "contracts": [
      {
        "unit": {
          "nombre": "Piso 1A"
        },
        "estado": "activo"
      }
    ]
  }
]
```

### Crear Inquilino

**POST** `/tenants`

**Body:**
```json
{
  "nombre": "Carlos López",
  "email": "carlos@example.com",
  "telefono": "+34 600 789 012",
  "dni": "87654321B",
  "empresa": "Tech Corp",
  "ingresosMensuales": 2500,
  "contactoEmergencia": "Ana López",
  "telefonoEmergencia": "+34 600 111 222"
}
```

**Response (201):**
```json
{
  "id": "tnt_789",
  "nombre": "Carlos López",
  "email": "carlos@example.com",
  "createdAt": "2025-12-03T16:00:00.000Z"
}
```

---

## Contracts (Contratos)

### Listar Contratos

**GET** `/contracts`

**Query Parameters:**
- `estado` (opcional): `activo`, `vencido`, `cancelado`
- `tenantId` (opcional)

**Response (200):**
```json
[
  {
    "id": "cnt_1",
    "unit": {
      "nombre": "Piso 1A",
      "building": {
        "nombre": "Edificio Central"
      }
    },
    "tenant": {
      "nombre": "María García",
      "email": "maria@example.com"
    },
    "fechaInicio": "2025-01-01T00:00:00.000Z",
    "fechaFin": "2026-01-01T00:00:00.000Z",
    "rentaMensual": 1200,
    "deposito": 2400,
    "estado": "activo",
    "diasRestantes": 365
  }
]
```

### Crear Contrato

**POST** `/contracts`

**Body:**
```json
{
  "unitId": "unt_1",
  "tenantId": "tnt_1",
  "fechaInicio": "2025-12-15",
  "fechaFin": "2026-12-15",
  "rentaMensual": 1200,
  "deposito": 2400,
  "diaPago": 5,
  "observaciones": "Contrato estándar"
}
```

**Response (201):**
```json
{
  "id": "cnt_456",
  "unitId": "unt_1",
  "tenantId": "tnt_1",
  "fechaInicio": "2025-12-15T00:00:00.000Z",
  "fechaFin": "2026-12-15T00:00:00.000Z",
  "rentaMensual": 1200,
  "estado": "activo",
  "createdAt": "2025-12-03T16:30:00.000Z"
}
```

---

## Payments (Pagos)

### Listar Pagos

**GET** `/payments`

**Query Parameters:**
- `estado` (opcional): `pendiente`, `pagado`, `vencido`
- `contractId` (opcional)
- `startDate`, `endDate` (opcional): Filtrar por rango de fechas

**Response (200):**
```json
[
  {
    "id": "pmt_1",
    "contract": {
      "tenant": {
        "nombre": "María García"
      },
      "unit": {
        "nombre": "Piso 1A"
      }
    },
    "monto": 1200,
    "fechaVencimiento": "2025-12-05T00:00:00.000Z",
    "estado": "pendiente",
    "metodoPago": null,
    "fechaPago": null
  }
]
```

### Marcar Pago como Pagado

**PATCH** `/payments/[id]`

**Body:**
```json
{
  "estado": "pagado",
  "fechaPago": "2025-12-03",
  "metodoPago": "transferencia",
  "comprobante": "https://s3.../comprobante.pdf"
}
```

**Response (200):**
```json
{
  "id": "pmt_1",
  "estado": "pagado",
  "fechaPago": "2025-12-03T00:00:00.000Z",
  "metodoPago": "transferencia"
}
```

---

## Maintenance (Mantenimiento)

### Listar Solicitudes

**GET** `/maintenance`

**Query Parameters:**
- `estado` (opcional): `pendiente`, `asignada`, `en_progreso`, `completada`
- `prioridad` (opcional): `baja`, `media`, `alta`, `urgente`
- `buildingId` (opcional)

**Response (200):**
```json
[
  {
    "id": "mnt_1",
    "titulo": "Fuga en el baño",
    "descripcion": "Hay una pequeña fuga en el lavabo",
    "prioridad": "alta",
    "estado": "pendiente",
    "unit": {
      "nombre": "Piso 1A"
    },
    "building": {
      "nombre": "Edificio Central"
    },
    "provider": null,
    "costoEstimado": 150,
    "createdAt": "2025-12-01T10:00:00.000Z"
  }
]
```

### Crear Solicitud

**POST** `/maintenance`

**Body:**
```json
{
  "unitId": "unt_1",
  "titulo": "Problema eléctrico",
  "descripcion": "No funciona la luz del salón",
  "prioridad": "media",
  "categoria": "electricidad",
  "fotos": ["https://i.ytimg.com/vi/_Q5wYV3flKI/hqdefault.jpg
}
```

**Response (201):**
```json
{
  "id": "mnt_789",
  "titulo": "Problema eléctrico",
  "estado": "pendiente",
  "prioridad": "media",
  "createdAt": "2025-12-03T17:00:00.000Z"
}
```

---

## Stripe Integration

### Crear Payment Intent

**POST** `/stripe/create-payment-intent`

Crea un Payment Intent para que el inquilino pague con tarjeta.

**Body:**
```json
{
  "paymentId": "pmt_123"
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### Crear Suscripción

**POST** `/stripe/create-subscription`

Configura pagos recurrentes mensuales para un contrato.

**Body:**
```json
{
  "contractId": "cnt_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "status": "active",
    "current_period_end": 1735689600
  }
}
```

### Cancelar Suscripción

**POST** `/stripe/cancel-subscription`

**Body:**
```json
{
  "subscriptionId": "sub_xxx",
  "cancelAtPeriodEnd": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Suscripción cancelada al final del período"
}
```

---

## Room Rental (Coliving)

### Listar Habitaciones

**GET** `/room-rental/rooms`

**Query Parameters:**
- `unitId` (opcional): Filtrar por unidad
- `disponible` (opcional): `true` / `false`

**Response (200):**
```json
[
  {
    "id": "room_1",
    "nombre": "Habitación 1",
    "unitId": "unt_coliving_1",
    "unit": {
      "nombre": "Piso compartido C/ Mayor"
    },
    "precioMensual": 450,
    "metrosCuadrados": 12,
    "tieneBalcon": false,
    "disponible": true,
    "contracts": []
  }
]
```

### Prorrateo de Gastos

**POST** `/room-rental/proration`

Calcula el prorrateo de gastos comunes entre habitaciones.

**Body:**
```json
{
  "unitId": "unt_coliving_1",
  "utilities": {
    "electricidad": 120,
    "agua": 60,
    "gas": 40,
    "internet": 50
  },
  "metodo": "igual"
}
```

**Response (200):**
```json
{
  "proration": [
    {
      "roomId": "room_1",
      "roomName": "Habitación 1",
      "tenantName": "Juan Pérez",
      "montoProrrateo": 67.5
    },
    {
      "roomId": "room_2",
      "roomName": "Habitación 2",
      "tenantName": "Ana García",
      "montoProrrateo": 67.5
    }
  ],
  "totalUtilities": 270
}
```

---

## Super Admin

### Dashboard Stats

**GET** `/admin/dashboard-stats`

Estadísticas globales de toda la plataforma.

**Authorization**: Requiere rol `super_admin`

**Response (200):**
```json
{
  "overview": {
    "totalCompanies": 150,
    "activeCompanies": 142,
    "totalUsers": 1250,
    "totalBuildings": 3500,
    "totalUnits": 12000,
    "totalTenants": 10500,
    "occupancyRate": 87.5
  },
  "financial": {
    "mrr": 447500,
    "arr": 5370000,
    "lastMonthRevenue": 445000,
    "revenueGrowth": 3.2
  },
  "growth": {
    "newCompaniesLast30Days": 12,
    "newUsersLast30Days": 85,
    "trialToActiveRate": 68.5
  },
  "historicalData": [
    {
      "month": "2025-01",
      "companies": 138,
      "users": 1165,
      "buildings": 3200,
      "revenue": 412000
    }
  ]
}
```

### Listar Empresas

**GET** `/admin/companies`

**Authorization**: Requiere rol `super_admin`

**Response (200):**
```json
[
  {
    "id": "cmp_1",
    "nombre": "Inmobiliaria XYZ",
    "email": "contacto@xyz.com",
    "activo": true,
    "estadoCliente": "activo",
    "subscriptionPlan": {
      "nombre": "Professional",
      "precioMensual": 149
    },
    "_count": {
      "users": 8,
      "buildings": 25,
      "tenants": 180
    },
    "createdAt": "2024-06-15T10:00:00.000Z"
  }
]
```

### Impersonar Cliente

**POST** `/admin/impersonate`

Permite al super-admin "iniciar sesión como" un cliente.

**Body:**
```json
{
  "companyId": "cmp_1"
}
```

**Response (200):**
```json
{
  "success": true,
  "companyId": "cmp_1",
  "companyName": "Inmobiliaria XYZ",
  "originalUser": {
    "id": "usr_super",
    "email": "superadmin@inmova.com"
  },
  "redirect": true
}
```

---

## Códigos de Error

### Códigos HTTP

- `200`: OK
- `201`: Created
- `400`: Bad Request (datos inválidos)
- `401`: Unauthorized (no autenticado)
- `403`: Forbidden (sin permisos)
- `404`: Not Found (recurso no encontrado)
- `409`: Conflict (ej: email duplicado)
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

### Formato de Error

```json
{
  "error": "Descripción del error",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email ya registrado"
  }
}
```

### Errores Comunes

#### 401 - No Autorizado
```json
{
  "error": "No autorizado. Por favor, inicie sesión."
}
```

#### 403 - Sin Permisos
```json
{
  "error": "No tiene permisos para realizar esta acción",
  "requiredRole": "administrador"
}
```

#### 404 - No Encontrado
```json
{
  "error": "Recurso no encontrado",
  "resourceType": "Building",
  "resourceId": "bld_xxx"
}
```

#### 429 - Rate Limit
```json
{
  "error": "Demasiadas solicitudes. Intente nuevamente más tarde.",
  "retryAfter": 60
}
```

---

## Rate Limiting

La API implementa rate limiting para proteger el sistema:

- **Público**: 20 requests / minuto
- **Autenticado**: 100 requests / minuto
- **Super Admin**: 500 requests / minuto

**Headers de respuesta:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701616800
```

---

## Paginación

Los endpoints que devuelven listas soportan paginación:

**Query Parameters:**
```
?page=1&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Webhooks

### Stripe Webhook

**POST** `/stripe/webhook`

Endpoint para recibir eventos de Stripe (pagos, suscripciones).

**Headers:**
```
Stripe-Signature: t=xxx,v1=yyy
```

**Eventos soportados:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Versionado

Actualmente en **v1**.

Futuras versiones se indicarán en la URL:
```
/api/v2/...
```

---

## Soporte

¿Preguntas sobre la API?

- **Email**: dev@inmova.com
- **Documentación interactiva**: https://inmova.app/api-docs

---

**Última actualización**: Diciembre 2025  
*