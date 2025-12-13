# Documentación API del Sistema de Partners B2B - INMOVA

## 📚 Índice

1. [Autenticación](#autenticación)
2. [Endpoints Disponibles](#endpoints-disponibles)
3. [Modelos de Datos](#modelos-de-datos)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Códigos de Error](#códigos-de-error)

---

## 🔐 Autenticación

Todas las peticiones a la API de Partners (excepto registro y login) requieren autenticación mediante un token JWT que se debe incluir en el header `Authorization`:

```
Authorization: Bearer {tu-token-jwt}
```

### Obtener Token

Debes hacer login en el endpoint `/api/partners/login` que devuelve el token.

---

## 🚀 Endpoints Disponibles

### 1. Registro de Partner

**POST** `/api/partners/register`

Registra un nuevo Partner en el sistema.

**Body (JSON):**
```json
{
  "nombre": "Banco Ejemplo",
  "razonSocial": "Banco Ejemplo S.A.",
  "cif": "A12345678",
  "tipo": "BANCO",
  "contactoNombre": "Juan Pérez",
  "contactoEmail": "juan.perez@bancoejemplo.com",
  "contactoTelefono": "+34 600 000 000",
  "email": "partners@bancoejemplo.com",
  "password": "securePassword123"
}
```

**Tipos de Partner disponibles:**
- `BANCO`
- `MULTIFAMILY_OFFICE`
- `PLATAFORMA_MEMBRESIA`
- `ASOCIACION`
- `CONSULTORA`
- `INMOBILIARIA`
- `OTRO`

**Respuesta (201):**
```json
{
  "message": "Partner registrado correctamente. Pendiente de aprobación.",
  "partner": {
    "id": "clxxx123",
    "nombre": "Banco Ejemplo",
    "email": "partners@bancoejemplo.com",
    "estado": "PENDING",
    "comisionPorcentaje": 20.0
  }
}
```

---

### 2. Login de Partner

**POST** `/api/partners/login`

Autenticación de un Partner para obtener el token JWT.

**Body (JSON):**
```json
{
  "email": "partners@bancoejemplo.com",
  "password": "securePassword123"
}
```

**Respuesta (200):**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "partner": {
    "id": "clxxx123",
    "nombre": "Banco Ejemplo",
    "email": "partners@bancoejemplo.com",
    "tipo": "BANCO",
    "comisionPorcentaje": 20.0,
    "estado": "ACTIVE"
  }
}
```

---

### 3. Dashboard del Partner

**GET** `/api/partners/dashboard`

Obtiene todas las métricas y datos del Partner.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "partner": {
    "id": "clxxx123",
    "nombre": "Banco Ejemplo",
    "comisionPorcentaje": 40.0
  },
  "metrics": {
    "totalClientes": 35,
    "totalComisionMes": "2086.00",
    "totalComisionHistorica": "15450.00",
    "totalPendientePago": "4172.00",
    "invitacionesPendientes": 12,
    "invitacionesAceptadas": 35,
    "tasaConversion": "74.5"
  },
  "clientes": [
    {
      "id": "pc123",
      "estado": "activo",
      "fechaActivacion": "2025-01-15T00:00:00Z",
      "totalComisionGenerada": 445.50,
      "company": {
        "id": "comp123",
        "nombre": "Inmobiliaria Costa",
        "email": "info@inmobiliariacosta.com"
      }
    }
  ],
  "comisiones": [...],
  "invitacionesRecientes": [...]
}
```

---

### 4. Enviar Invitación

**POST** `/api/partners/invitations`

Envía una invitación a un nuevo cliente potencial.

**Headers:**
```
Authorization: Bearer {token}
```

**Body (JSON):**
```json
{
  "email": "cliente@empresa.com",
  "nombre": "Pedro García",
  "telefono": "+34 600 111 222",
  "mensaje": "Hola Pedro, te invitamos a probar INMOVA para gestionar tus propiedades."
}
```

**Respuesta (201):**
```json
{
  "message": "Invitación creada exitosamente",
  "invitation": {
    "id": "inv123",
    "email": "cliente@empresa.com",
    "nombre": "Pedro García",
    "token": "a1b2c3d4e5f6...",
    "estado": "PENDING",
    "expiraFecha": "2025-02-05T00:00:00Z"
  }
}
```

---

### 5. Listar Invitaciones

**GET** `/api/partners/invitations`

Obtiene todas las invitaciones enviadas por el Partner.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "invitaciones": [
    {
      "id": "inv123",
      "email": "cliente@empresa.com",
      "nombre": "Pedro García",
      "estado": "PENDING",
      "enviadoFecha": "2025-01-06T10:00:00Z",
      "expiraFecha": "2025-02-05T10:00:00Z"
    },
    {
      "id": "inv124",
      "email": "otro@empresa.com",
      "nombre": "Ana Martínez",
      "estado": "ACCEPTED",
      "enviadoFecha": "2025-01-05T15:00:00Z",
      "aceptadoFecha": "2025-01-06T09:30:00Z"
    }
  ]
}
```

---

### 6. Listar Comisiones

**GET** `/api/partners/commissions`

Obtiene todas las comisiones del Partner.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `periodo`: Filtrar por periodo específico (formato: `YYYY-MM`)

**Ejemplo:**
```
GET /api/partners/commissions?periodo=2025-01
```

**Respuesta (200):**
```json
{
  "comisiones": [
    {
      "id": "com123",
      "periodo": "2025-01",
      "montoBruto": 149.00,
      "porcentaje": 40.0,
      "montoComision": 59.60,
      "estado": "PAID",
      "planNombre": "Plan Profesional",
      "clientesActivos": 35,
      "company": {
        "id": "comp123",
        "nombre": "Inmobiliaria Costa"
      },
      "fechaPago": "2025-01-31T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "totales": {
    "pending": 2086.00,
    "approved": 4172.00,
    "paid": 15450.00,
    "total": 21708.00
  }
}
```

**Estados de Comisión:**
- `PENDING`: Pendiente de aprobación
- `APPROVED`: Aprobada, pendiente de pago
- `PAID`: Pagada
- `CANCELLED`: Cancelada

---

### 7. Verificar Invitación (Pública)

**GET** `/api/partners/accept-invitation?token={invitation-token}`

Verifica si una invitación es válida. **No requiere autenticación.**

**Respuesta (200):**
```json
{
  "invitation": {
    "email": "cliente@empresa.com",
    "nombre": "Pedro García",
    "mensaje": "Hola Pedro, te invitamos a probar INMOVA...",
    "partner": {
      "id": "partner123",
      "nombre": "Banco Ejemplo",
      "logo": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Logobm.svg",
      "coloresPrimarios": {
        "primary": "#1E40AF",
        "secondary": "#3B82F6"
      }
    },
    "expiraFecha": "2025-02-05T10:00:00Z",
    "estado": "PENDING",
    "isValid": true
  }
}
```

---

### 8. Aceptar Invitación (Pública)

**POST** `/api/partners/accept-invitation`

Acepta una invitación y crea la cuenta del cliente. **No requiere autenticación.**

**Body (JSON):**
```json
{
  "token": "a1b2c3d4e5f6...",
  "userData": {
    "nombre": "Inmobiliaria Costa",
    "email": "admin@inmobiliariacosta.com",
    "password": "securePassword123",
    "telefono": "+34 600 111 222",
    "direccion": "Calle Principal 123, Madrid"
  }
}
```

**Respuesta (201):**
```json
{
  "message": "Cuenta creada exitosamente",
  "company": {
    "id": "comp123",
    "nombre": "Inmobiliaria Costa",
    "email": "admin@inmobiliariacosta.com"
  },
  "user": {
    "id": "user123",
    "nombre": "Inmobiliaria Costa",
    "email": "admin@inmobiliariacosta.com"
  }
}
```

---

### 9. Calcular Comisiones (CRON / Admin)

**POST** `/api/partners/calculate-commissions`

Calcula y genera las comisiones mensuales para todos los Partners activos.

**Este endpoint debe ser llamado por un CRON job al inicio de cada mes.**

**Respuesta (200):**
```json
{
  "message": "Comisiones calculadas para 87 clientes",
  "periodo": "2025-01",
  "results": [
    {
      "partner": "Banco Ejemplo",
      "cliente": "Inmobiliaria Costa",
      "periodo": "2025-01",
      "montoBruto": 149.00,
      "porcentaje": 40.0,
      "montoComision": 59.60,
      "commissionId": "com123"
    }
  ]
}
```

**GET** `/api/partners/calculate-commissions`

Obtiene información del último cálculo de comisiones.

---

## 📊 Modelos de Datos

### Partner

```typescript
{
  id: string;
  nombre: string; // Nombre comercial
  razonSocial: string;
  cif: string;
  tipo: PartnerType;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono?: string;
  email: string; // Email de login
  comisionPorcentaje: number; // % actual
  estado: PartnerStatus;
  activo: boolean;
  fechaActivacion?: Date;
  logo?: string;
  coloresPrimarios?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### PartnerClient

```typescript
{
  id: string;
  partnerId: string;
  companyId: string;
  estado: string; // activo, suspendido, cancelado
  fechaActivacion: Date;
  fechaCancelacion?: Date;
  origenInvitacion?: string;
  codigoReferido?: string;
  totalComisionGenerada: number;
  ultimaComisionFecha?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Commission

```typescript
{
  id: string;
  partnerId: string;
  companyId: string;
  periodo: string; // "YYYY-MM"
  montoBruto: number;
  porcentaje: number;
  montoComision: number;
  planId?: string;
  planNombre?: string;
  estado: CommissionStatus;
  fechaAprobacion?: Date;
  fechaPago?: Date;
  referenciaPago?: string;
  clientesActivos: number;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PartnerInvitation

```typescript
{
  id: string;
  partnerId: string;
  email: string;
  nombre?: string;
  telefono?: string;
  token: string; // Token único para el link
  mensaje?: string;
  estado: PartnerInvitationStatus;
  enviadoFecha: Date;
  aceptadoFecha?: Date;
  expiraFecha: Date; // +30 días
  companyId?: string; // Si fue aceptada
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos o incompletos |
| 401 | Unauthorized - Token inválido o no proporcionado |
| 403 | Forbidden - Partner no activo o sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso ya existe |
| 500 | Internal Server Error - Error del servidor |

### Ejemplos de Errores

```json
{
  "error": "No autorizado"
}
```

```json
{
  "error": "Ya existe un Partner con estos datos (email, CIF o contacto)"
}
```

```json
{
  "error": "Error interno del servidor",
  "details": "Database connection failed"
}
```

---

## 🔄 Flujo Completo de Invitación

1. **Partner envía invitación:**
   - `POST /api/partners/invitations`
   - Se genera un token único
   - (En el futuro: se envía email al cliente)

2. **Cliente recibe el link:**
   - Link: `https://inmova.app/partners/accept/{token}`

3. **Cliente verifica invitación:**
   - `GET /api/partners/accept-invitation?token={token}`
   - Muestra información del Partner y validez

4. **Cliente acepta y crea cuenta:**
   - `POST /api/partners/accept-invitation`
   - Se crea la Company y User
   - Se vincula con el Partner (PartnerClient)
   - Invitación se marca como ACCEPTED

5. **Sistema calcula comisiones (mensual):**
   - `POST /api/partners/calculate-commissions` (CRON)
   - Se generan comisiones para todos los clientes activos

6. **Partner consulta dashboard:**
   - `GET /api/partners/dashboard`
   - Ve métricas, clientes, comisiones, invitaciones

---

## 💻 Ejemplos de Código

### JavaScript / TypeScript

```typescript
// Login
const login = async (email: string, password: string) => {
  const response = await fetch('/api/partners/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error);
  }
  
  // Guardar token
  localStorage.setItem('partnerToken', data.token);
  return data;
};

// Obtener Dashboard
const getDashboard = async (token: string) => {
  const response = await fetch('/api/partners/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  return data;
};

// Enviar Invitación
const sendInvitation = async (token: string, invitationData: any) => {
  const response = await fetch('/api/partners/invitations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invitationData),
  });
  
  const data = await response.json();
  return data;
};
```

### cURL

```bash
# Login
curl -X POST https://inmova.app/api/partners/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "partners@bancoejemplo.com",
    "password": "securePassword123"
  }'

# Dashboard (con token)
curl -X GET https://inmova.app/api/partners/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Enviar Invitación
curl -X POST https://inmova.app/api/partners/invitations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@empresa.com",
    "nombre": "Pedro García",
    "mensaje": "Te invitamos a probar INMOVA"
  }'
```

---

## 🔒 Seguridad

- Todas las contraseñas se almacenan hasheadas con bcrypt
- Los tokens JWT expiran en 7 días
- Las invitaciones expiran en 30 días
- Se requiere autenticación para todos los endpoints de Partner (excepto públicos)
- Validación de datos en todos los endpoints

---

## 📞 Soporte

Para cualquier duda o problema con la API:

- **Email:** partners@inmova.com
- **Teléfono:** +34 900 123 456
- **Portal:** https://inmova.app/partners

---

© 2025 INMOVA - Enxames Investments SL
