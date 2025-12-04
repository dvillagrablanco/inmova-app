# Documentación del Portal de Proveedores - Nuevas Funcionalidades

## Índice

1. [Introducción](#introducción)
2. [Sistema de Facturas](#sistema-de-facturas)
3. [Sistema de Presupuestos](#sistema-de-presupuestos)
4. [Sistema de Reseñas y Calificaciones](#sistema-de-reseñas-y-calificaciones)
5. [Sistema de Mensajería](#sistema-de-mensajería)
6. [APIs Disponibles](#apis-disponibles)
7. [Modelos de Base de Datos](#modelos-de-base-de-datos)

---

## Introducción

El portal de proveedores de Homming Vidaro ha sido ampliado con nuevas funcionalidades que permiten una gestión más completa y eficiente de la relación con los proveedores de servicios. Las nuevas funcionalidades incluyen:

- **Sistema de Facturas**: Permite a los proveedores crear, gestionar y realizar seguimiento de facturas y pagos.
- **Sistema de Presupuestos**: Facilita la creación y envío de presupuestos para órdenes de trabajo.
- **Sistema de Reseñas**: Permite visualizar las calificaciones y reseñas recibidas por el trabajo realizado.
- **Sistema de Mensajería**: Ofrece comunicación directa entre proveedores y gestores.

---

## Sistema de Facturas

### Descripción

El sistema de facturas permite a los proveedores:
- Crear facturas para órdenes de trabajo completadas
- Gestionar conceptos con cantidad y precio unitario
- Visualizar el estado de las facturas (borrador, enviada, pagada, cancelada)
- Realizar seguimiento de pagos recibidos

### Acceso

Desde el dashboard del proveedor, hacer clic en **"Facturas"** en el menú de acceso rápido.

### Funcionalidades

#### 1. Listado de Facturas (`/portal-proveedor/facturas`)

**Características:**
- Vista general de todas las facturas del proveedor
- Filtros por estado (borrador, enviada, pagada, cancelada)
- Resumen de totales:
  - Total facturado
  - Pendiente de pago
  - Total cobrado
- Tabla con información clave: número, orden de trabajo, edificio, fecha, total, estado

#### 2. Crear Nueva Factura (`/portal-proveedor/facturas/nueva`)

**Datos requeridos:**
- Orden de trabajo asociada
- Número de factura
- Conceptos (descripción, cantidad, precio unitario)
- Notas adicionales (opcional)

**Cálculos automáticos:**
- Subtotal de cada concepto
- Subtotal general
- IVA (21%)
- Total

**Flujo:**
1. Seleccionar orden de trabajo
2. Ingresar número de factura
3. Añadir conceptos (uno o varios)
4. Agregar notas si es necesario
5. Revisar resumen y confirmar
6. La factura se crea en estado "borrador"

#### 3. Detalle de Factura (`/portal-proveedor/facturas/[id]`)

**Información mostrada:**
- Datos de la factura (número, fechas, estado)
- Información de la orden de trabajo asociada
- Conceptos detallados
- Resumen financiero (subtotal, IVA, total)
- Historial de pagos
- Datos del proveedor

**Acciones disponibles:**
- Enviar factura (cambia estado de "borrador" a "enviada")
- Descargar PDF (funcionalidad preparada)

### Estados de Factura

- **Borrador**: Factura creada pero no enviada al cliente
- **Enviada**: Factura enviada y pendiente de pago
- **Pagada**: Factura completamente pagada
- **Cancelada**: Factura anulada

---

## Sistema de Presupuestos

### Descripción

El sistema de presupuestos permite a los proveedores:
- Crear presupuestos para órdenes de trabajo
- Definir conceptos, condiciones de pago y tiempo de ejecución
- Visualizar el estado de los presupuestos (pendiente, aceptado, rechazado, expirado)
- Realizar seguimiento de presupuestos enviados

### Acceso

Desde el dashboard del proveedor, hacer clic en **"Presupuestos"** en el menú de acceso rápido.

### Funcionalidades

#### 1. Listado de Presupuestos (`/portal-proveedor/presupuestos`)

**Características:**
- Vista general de todos los presupuestos del proveedor
- Filtros por estado
- Resúmenes:
  - Total presupuestado
  - Presupuestos aceptados
  - Pendientes de respuesta
- Tabla con información: orden de trabajo, edificio, fecha, validez, total, estado

#### 2. Crear Nuevo Presupuesto (`/portal-proveedor/presupuestos/nuevo`)

**Datos requeridos:**
- Orden de trabajo asociada
- Conceptos (descripción, cantidad, precio unitario)
- Validez en días (por defecto 30 días)
- Tiempo de ejecución (opcional)
- Condiciones de pago (opcional)
- Notas adicionales (opcional)

**Cálculos automáticos:**
- Subtotal de cada concepto
- Subtotal general
- IVA (21%)
- Total
- Fecha de validez (calculada automáticamente)

**Flujo:**
1. Seleccionar orden de trabajo
2. Definir validez del presupuesto
3. Añadir conceptos del servicio
4. Especificar tiempo de ejecución y condiciones de pago
5. Agregar notas si es necesario
6. Revisar resumen y confirmar
7. El presupuesto se crea en estado "pendiente"

### Estados de Presupuesto

- **Pendiente**: Presupuesto enviado y esperando respuesta
- **Aceptado**: Presupuesto aprobado por el cliente
- **Rechazado**: Presupuesto no aceptado
- **Expirado**: Presupuesto fuera de fecha de validez

---

## Sistema de Reseñas y Calificaciones

### Descripción

El sistema de reseñas permite a los proveedores:
- Visualizar todas las reseñas recibidas
- Ver estadísticas de calificación general
- Analizar desempeño por categorías
- Monitorear tendencias de calificaciones

### Acceso

Desde el dashboard del proveedor, hacer clic en **"Reseñas"** en el menú de acceso rápido.

### Funcionalidades

#### Vista de Reseñas (`/portal-proveedor/reseñas`)

**Estadísticas generales:**
- Calificación promedio (sobre 5 estrellas)
- Total de reseñas recibidas
- Cantidad de reseñas con 5 estrellas
- Porcentaje de recomendación (4-5 estrellas)

**Distribución de calificaciones:**
- Gráfico visual mostrando cuántas reseñas de cada calificación (1-5 estrellas)

**Calificaciones por categoría:**
- Calidad del trabajo
- Puntualidad
- Profesionalismo
- Limpieza
- Comunicación

**Listado de reseñas:**
- Calificación general por reseña
- Comentarios de los clientes
- Orden de trabajo asociada
- Fecha de la reseña
- Calificaciones detalladas por categoría

### Categorías de Calificación

Cada reseña puede incluir calificaciones específicas para:

1. **Calidad del Trabajo**: Evaluación de la calidad técnica del servicio
2. **Puntualidad**: Cumplimiento de horarios y plazos
3. **Profesionalismo**: Actitud y comportamiento profesional
4. **Limpieza**: Estado del área de trabajo después del servicio
5. **Comunicación**: Claridad y efectividad en la comunicación

> **Nota**: Los proveedores pueden ver las reseñas pero no pueden crearlas ni modificarlas. Las reseñas son creadas por los usuarios del sistema de gestión.

---

## Sistema de Mensajería

### Descripción

El sistema de mensajería permite:
- Comunicación directa entre proveedores y gestores
- Crear nuevas conversaciones
- Enviar y recibir mensajes en tiempo real
- Seguimiento de mensajes leídos/no leídos
- Organizar conversaciones por asunto

### Acceso

Desde el dashboard del proveedor, hacer clic en **"Mensajería"** en el menú de acceso rápido.

### Funcionalidades

#### Vista de Chat (`/portal-proveedor/chat`)

**Panel de conversaciones (izquierda):**
- Lista de todas las conversaciones
- Asunto de cada conversación
- Último mensaje y fecha
- Badge con cantidad de mensajes no leídos
- Estado de conversación (activa/archivada)

**Panel de mensajes (derecha):**
- Historial completo de mensajes de la conversación seleccionada
- Mensajes del proveedor (azul, alineados a la derecha)
- Mensajes del gestor (gris, alineados a la izquierda)
- Nombres de remitentes
- Hora de envío
- Campo de entrada para nuevos mensajes

#### Crear Nueva Conversación

**Proceso:**
1. Hacer clic en "Nueva Conversación"
2. Ingresar asunto de la conversación
3. Escribir mensaje inicial
4. Confirmar
5. La conversación se crea y queda activa

**Actualización automática:**
- Las conversaciones se actualizan cada 30 segundos
- Los mensajes de una conversación abierta se actualizan cada 10 segundos
- Permite comunicación casi en tiempo real

### Estados de Conversación

- **Activa**: Conversación en curso
- **Archivada**: Conversación finalizada y archivada

---

## APIs Disponibles

### Autenticación

Todas las APIs del portal de proveedores requieren autenticación mediante JWT almacenado en cookies httpOnly. El header `x-provider-id` se utiliza para identificar al proveedor autenticado.

### Endpoints de Facturas

#### GET `/api/portal-proveedor/invoices`

Obtiene las facturas del proveedor autenticado.

**Query Parameters:**
- `estado` (opcional): Filtrar por estado (borrador, enviada, pagada, cancelada)
- `workOrderId` (opcional): Filtrar por orden de trabajo

**Respuesta:**
```json
[
  {
    "id": "string",
    "numeroFactura": "string",
    "workOrderId": "string",
    "estado": "string",
    "subtotal": number,
    "iva": number,
    "total": number,
    "fechaEmision": "string (ISO date)",
    "fechaEnvio": "string (ISO date) | null",
    "fechaVencimiento": "string (ISO date) | null",
    "workOrder": {
      "id": "string",
      "titulo": "string",
      "building": {
        "id": "string",
        "nombre": "string"
      }
    },
    "payments": []
  }
]
```

#### POST `/api/portal-proveedor/invoices`

Crea una nueva factura.

**Body:**
```json
{
  "workOrderId": "string",
  "numeroFactura": "string",
  "conceptos": [
    {
      "descripcion": "string",
      "cantidad": number,
      "precioUnitario": number
    }
  ],
  "notas": "string (opcional)"
}
```

**Respuesta:** Objeto de factura creada (estado 201)

#### GET `/api/portal-proveedor/invoices/[id]`

Obtiene los detalles de una factura específica.

**Respuesta:** Objeto de factura con todos los detalles, incluyendo pagos y datos del proveedor

#### PATCH `/api/portal-proveedor/invoices/[id]`

Actualiza una factura (por ejemplo, enviarla).

**Body:**
```json
{
  "estado": "enviada",
  "notas": "string (opcional)"
}
```

**Respuesta:** Objeto de factura actualizada

---

### Endpoints de Presupuestos

#### GET `/api/portal-proveedor/quotes`

Obtiene los presupuestos del proveedor autenticado.

**Query Parameters:**
- `estado` (opcional): Filtrar por estado
- `workOrderId` (opcional): Filtrar por orden de trabajo

**Respuesta:** Array de presupuestos

#### POST `/api/portal-proveedor/quotes`

Crea un nuevo presupuesto.

**Body:**
```json
{
  "workOrderId": "string",
  "conceptos": [
    {
      "descripcion": "string",
      "cantidad": number,
      "precioUnitario": number
    }
  ],
  "validezDias": number,
  "condicionesPago": "string (opcional)",
  "tiempoEjecucion": "string (opcional)",
  "notas": "string (opcional)"
}
```

**Respuesta:** Objeto de presupuesto creado (estado 201)

#### GET `/api/portal-proveedor/quotes/[id]`

Obtiene los detalles de un presupuesto específico.

#### PATCH `/api/portal-proveedor/quotes/[id]`

Actualiza un presupuesto.

**Body:**
```json
{
  "conceptos": [] (opcional),
  "notas": "string (opcional)",
  "tiempoEjecucion": "string (opcional)",
  "condicionesPago": "string (opcional)"
}
```

---

### Endpoints de Reseñas

#### GET `/api/portal-proveedor/reviews`

Obtiene las reseñas del proveedor autenticado.

**Respuesta:**
```json
{
  "reviews": [
    {
      "id": "string",
      "calificacionGeneral": number,
      "calidadTrabajo": number,
      "puntualidad": number,
      "profesionalismo": number,
      "limpieza": number,
      "comunicacion": number,
      "comentario": "string",
      "createdAt": "string (ISO date)",
      "workOrder": {
        "id": "string",
        "titulo": "string",
        "building": {
          "id": "string",
          "nombre": "string"
        }
      }
    }
  ],
  "stats": {
    "totalReviews": number,
    "averageRating": number,
    "ratingDistribution": {
      "1": number,
      "2": number,
      "3": number,
      "4": number,
      "5": number
    },
    "categoryAverages": {
      "calidadTrabajo": number,
      "puntualidad": number,
      "profesionalismo": number,
      "limpieza": number,
      "comunicacion": number
    }
  }
}
```

---

### Endpoints de Chat

#### GET `/api/portal-proveedor/chat/conversations`

Obtiene las conversaciones del proveedor.

**Respuesta:** Array de conversaciones con último mensaje

#### POST `/api/portal-proveedor/chat/conversations`

Crea una nueva conversación.

**Body:**
```json
{
  "asunto": "string",
  "mensajeInicial": "string"
}
```

**Respuesta:** Objeto de conversación creada (estado 201)

#### GET `/api/portal-proveedor/chat/messages`

Obtiene los mensajes de una conversación.

**Query Parameters:**
- `conversacionId` (requerido): ID de la conversación

**Respuesta:** Array de mensajes

**Efecto secundario:** Marca los mensajes del gestor como leídos

#### POST `/api/portal-proveedor/chat/messages`

Envía un nuevo mensaje.

**Body:**
```json
{
  "conversacionId": "string",
  "contenido": "string",
  "adjuntos": [] (opcional)
}
```

**Respuesta:** Objeto de mensaje creado (estado 201)

---

## Modelos de Base de Datos

### ProviderInvoice

```prisma
model ProviderInvoice {
  id                   String                    @id @default(uuid())
  numeroFactura        String                    // Número único de factura
  workOrderId          String
  providerId           String
  companyId            String
  conceptos            Json                      // Array de conceptos
  subtotal             Float
  iva                  Float
  total                Float
  estado               String                    // borrador, enviada, pagada, cancelada
  fechaEmision         DateTime
  fechaEnvio           DateTime?
  fechaVencimiento     DateTime?
  notas                String?
  createdAt            DateTime                  @default(now())
  updatedAt            DateTime                  @updatedAt
  
  workOrder            ProviderWorkOrder         @relation(fields: [workOrderId], references: [id])
  provider             Provider                  @relation(fields: [providerId], references: [id])
  company              Company                   @relation(fields: [companyId], references: [id])
  payments             ProviderInvoicePayment[]
}
```

### ProviderInvoicePayment

```prisma
model ProviderInvoicePayment {
  id                   String          @id @default(uuid())
  invoiceId            String
  companyId            String
  monto                Float
  fechaPago            DateTime
  metodoPago           String?         // transferencia, efectivo, etc.
  referencia           String?
  notas                String?
  createdAt            DateTime        @default(now())
  
  invoice              ProviderInvoice @relation(fields: [invoiceId], references: [id])
  company              Company         @relation(fields: [companyId], references: [id])
}
```

### ProviderQuote

```prisma
model ProviderQuote {
  id                   String                @id @default(uuid())
  workOrderId          String
  providerId           String
  companyId            String
  conceptos            Json                  // Array de conceptos
  subtotal             Float
  iva                  Float
  total                Float
  estado               String                // pendiente, aceptado, rechazado, expirado
  validezDias          Int
  fechaValidez         DateTime
  condicionesPago      String?
  tiempoEjecucion      String?
  notas                String?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  
  workOrder            ProviderWorkOrder     @relation(fields: [workOrderId], references: [id])
  provider             Provider              @relation(fields: [providerId], references: [id])
  company              Company               @relation(fields: [companyId], references: [id])
}
```

### ProviderReview

```prisma
model ProviderReview {
  id                   String                @id @default(uuid())
  workOrderId          String                @unique
  providerId           String
  companyId            String
  calificacionGeneral  Float                 // 1-5
  calidadTrabajo       Float?
  puntualidad          Float?
  profesionalismo      Float?
  limpieza             Float?
  comunicacion         Float?
  comentario           String?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  
  workOrder            ProviderWorkOrder     @relation(fields: [workOrderId], references: [id])
  provider             Provider              @relation(fields: [providerId], references: [id])
  company              Company               @relation(fields: [companyId], references: [id])
}
```

### ProviderChatConversation

```prisma
model ProviderChatConversation {
  id                          String                  @id @default(uuid())
  providerId                  String
  companyId                   String
  asunto                      String
  estado                      String                  // activa, archivada, cerrada
  ultimoMensaje               String
  ultimoMensajeFecha          DateTime
  ultimoMensajePor            String                  // proveedor, gestor
  mensajesNoLeidosGestor      Int                     @default(0)
  mensajesNoLeidosProveedor   Int                     @default(0)
  createdAt                   DateTime                @default(now())
  updatedAt                   DateTime                @updatedAt
  
  provider                    Provider                @relation(fields: [providerId], references: [id])
  company                     Company                 @relation(fields: [companyId], references: [id])
  mensajes                    ProviderChatMessage[]
}
```

### ProviderChatMessage

```prisma
model ProviderChatMessage {
  id                   String                      @id @default(uuid())
  conversacionId       String
  companyId            String
  remitenteTipo        String                      // proveedor, gestor
  remitenteId          String
  remitenteNombre      String
  contenido            String
  adjuntos             Json?                       // Array de URLs de archivos adjuntos
  leido                Boolean                     @default(false)
  fechaLectura         DateTime?
  createdAt            DateTime                    @default(now())
  
  conversacion         ProviderChatConversation    @relation(fields: [conversacionId], references: [id])
  company              Company                     @relation(fields: [companyId], references: [id])
}
```

---

## Consideraciones Técnicas

### Seguridad

- Todas las APIs validan que el proveedor autenticado tenga acceso a los recursos solicitados
- Las facturas, presupuestos y conversaciones sólo pueden ser accedidos por el proveedor propietario
- Las reseñas son de sólo lectura para proveedores

### Rendimiento

- El sistema de chat actualiza conversaciones cada 30 segundos
- Los mensajes se actualizan cada 10 segundos cuando hay una conversación activa
- Se utilizan índices en base de datos para consultas eficientes

### Validaciones

- Los conceptos de facturas y presupuestos deben tener cantidad > 0 y precio > 0
- Las facturas se crean inicialmente en estado "borrador"
- Los presupuestos se crean en estado "pendiente"
- El IVA se calcula automáticamente al 21%

---

## Próximos Pasos

Posibles mejoras futuras:

1. **Sistema de Notificaciones**: Alertas en tiempo real para nuevos mensajes y cambios de estado
2. **Exportación de Datos**: Exportar facturas y presupuestos a PDF
3. **Estadísticas Avanzadas**: Dashboard con gráficos de rendimiento y tendencias
4. **Adjuntos en Chat**: Permitir envío de archivos en las conversaciones
5. **Móvil**: Versión responsive optimizada para dispositivos móviles
6. **Integraciones**: Conectar con sistemas contables externos

---

## Soporte

Para soporte técnico o consultas sobre las nuevas funcionalidades, contactar al equipo de desarrollo.
