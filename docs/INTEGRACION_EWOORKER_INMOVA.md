# Integración ewoorker → Inmova PropTech

## Resumen Ejecutivo

Este documento analiza el plan de negocio de **ewoorker** (plataforma de subcontratación de trabajadores B2B) y propone su integración en **Inmova** (plataforma PropTech), aprovechando las sinergias naturales entre ambos modelos de negocio.

**Sinergia Principal**: Los gestores inmobiliarios y propietarios de Inmova necesitan constantemente servicios de mantenimiento (electricistas, fontaneros, pintores, albañiles, etc.) - exactamente los sectores que cubre ewoorker.

---

## 1. Análisis Comparativo

### 1.1 Funcionalidades ewoorker vs Inmova Existente

| Funcionalidad ewoorker                   | Estado en Inmova               | Acción Requerida             |
| ---------------------------------------- | ------------------------------ | ---------------------------- |
| Registro de empresas/profesionales       | ✅ `Provider` model            | Ampliar campos               |
| Perfiles por oficio/especialidad         | ⚠️ Campo `tipo` básico         | Crear enum de especialidades |
| Sistema de disponibilidad                | ✅ `ProviderAvailability`      | Mejorar UX                   |
| Chat entre partes                        | ✅ `ProviderChatConversation`  | OK                           |
| Sistema de valoraciones                  | ✅ `rating` + `ProviderReview` | OK                           |
| Marketplace de servicios                 | ✅ `MarketplaceService`        | Ampliar categorías           |
| Búsqueda por ubicación                   | ❌ No implementado             | **NUEVO**                    |
| Modelo bidireccional (ofrecer/contratar) | ❌ Solo contratar              | **NUEVO**                    |
| Trabajadores por empresa                 | ❌ No existe                   | **NUEVO**                    |
| Anuncios/Publicaciones de trabajo        | ❌ No existe                   | **NUEVO**                    |
| Certificaciones/Acreditaciones           | ❌ No existe                   | **NUEVO**                    |
| Comisiones por transacción               | ⚠️ `comisionPorcentaje` existe | Implementar cobro            |

### 1.2 Sectores ewoorker aplicables a PropTech

| Sector ewoorker                   | Aplicación en Inmova                    |
| --------------------------------- | --------------------------------------- |
| Electricidad y telecomunicaciones | ✅ Mantenimiento de propiedades         |
| Fontanería                        | ✅ Mantenimiento de propiedades         |
| Pintura                           | ✅ Renovaciones, turnover inquilinos    |
| Albañilería                       | ✅ Reformas, reparaciones estructurales |
| Carpintería                       | ✅ Reparaciones, mobiliario             |
| Soldadura y calderería            | ⚠️ Menos común pero aplicable           |
| Mecánico industrial               | ⚠️ Ascensores, climatización            |
| **Nuevos para PropTech**          |                                         |
| Limpieza profesional              | ✅ **CRÍTICO** - Turnover inquilinos    |
| Cerrajería                        | ✅ Cambios de cerraduras                |
| Climatización/HVAC                | ✅ Aire acondicionado, calefacción      |
| Jardinería/Paisajismo             | ✅ Comunidades, chalets                 |
| Mudanzas                          | ✅ Entrada/salida inquilinos            |
| Reformas integrales               | ✅ Proyectos llave en mano              |

---

## 2. Propuesta de Integración: "Inmova Services Marketplace"

### 2.1 Concepto

Crear un **Marketplace de Servicios Profesionales** dentro de Inmova que:

1. **Para Gestores/Propietarios (Demandantes)**:
   - Encontrar profesionales cualificados para mantenimiento
   - Solicitar presupuestos rápidamente
   - Contratar servicios con garantía
   - Valorar y crear reputación

2. **Para Profesionales/Empresas (Oferentes)**:
   - Registrarse con perfil verificado
   - Ofrecer servicios con disponibilidad en tiempo real
   - Recibir solicitudes de trabajo
   - Gestionar su reputación

3. **Modelo Bidireccional** (innovación ewoorker):
   - Empresas de mantenimiento pueden ofrecer SUS trabajadores cuando tienen baja carga
   - Pueden también contratar de otras empresas cuando tienen exceso de trabajo

### 2.2 Propuesta de Valor Diferenciada

| Característica                       | ETT | Portales Empleo | ewoorker | **Inmova Marketplace**     |
| ------------------------------------ | --- | --------------- | -------- | -------------------------- |
| Profesionales verificados            | ❌  | ❌              | ⚠️       | ✅ Verificación documental |
| Especializados en inmobiliario       | ❌  | ❌              | ⚠️       | ✅ 100% PropTech           |
| Sin intermediarios                   | ❌  | ✅              | ✅       | ✅                         |
| Inmediatez                           | ⚠️  | ❌              | ✅       | ✅                         |
| Integrado con gestión de propiedades | ❌  | ❌              | ❌       | ✅ **Único**               |
| Histórico de intervenciones          | ❌  | ❌              | ❌       | ✅ **Único**               |
| Facturación integrada                | ❌  | ❌              | ❌       | ✅ **Único**               |

---

## 3. Modelo de Datos Propuesto

### 3.1 Nuevos Modelos Prisma

```prisma
// ===========================================
// EXTENSIÓN: Marketplace de Servicios B2B
// Inspirado en modelo ewoorker
// ===========================================

// Enum de especialidades profesionales
enum ProfessionalSpecialty {
  // Construcción e Instalaciones
  electricidad
  fontaneria
  pintura
  albanileria
  carpinteria
  soldadura
  climatizacion
  cerrajeria
  cristaleria

  // Servicios PropTech específicos
  limpieza_profesional
  limpieza_fin_obra
  jardineria
  mudanzas
  reformas_integrales
  impermeabilizacion
  fumigacion

  // Técnicos especializados
  ascensores
  piscinas
  domótica
  telecomunicaciones
  seguridad_sistemas

  // Otros
  otros
}

// Enum de tipo de profesional
enum ProfessionalType {
  autonomo           // Trabajador independiente
  empresa_micro      // < 10 trabajadores
  empresa_pequena    // 10-50 trabajadores
  empresa_mediana    // 50-250 trabajadores
  empresa_grande     // > 250 trabajadores
}

// Perfil extendido de proveedor de servicios
model ServiceProfessional {
  id        String @id @default(cuid())

  // Vinculación opcional con Provider existente
  providerId String? @unique
  provider   Provider? @relation(fields: [providerId], references: [id])

  // Datos de empresa/profesional
  nombreComercial     String
  razonSocial         String?
  cif                 String @unique
  tipoEmpresa         ProfessionalType

  // Contacto
  email               String @unique
  telefono            String
  telefonoSecundario  String?
  direccion           String
  ciudad              String
  provincia           String
  codigoPostal        String

  // Geolocalización para búsquedas
  latitud             Float?
  longitud            Float?
  radioServicio       Int @default(50) // km que está dispuesto a desplazarse

  // Especialidades (múltiples)
  especialidades      ProfessionalSpecialty[]
  descripcion         String @db.Text

  // Autenticación
  passwordHash        String
  activo              Boolean @default(true)
  verificado          Boolean @default(false)
  fechaVerificacion   DateTime?

  // Documentación y certificaciones
  certificaciones     ServiceCertification[]
  documentos          ServiceProfessionalDocument[]

  // Trabajadores (modelo ewoorker)
  trabajadores        ServiceWorker[]

  // Marketplace
  serviciosOfrecidos  ProfessionalService[]
  anunciosTrabajo     JobPosting[]
  solicitudesRecibidas ServiceRequest[]
  solicitudesEnviadas  ServiceRequest[] @relation("RequestedBy")

  // Métricas y reputación
  rating              Float @default(0)
  totalReviews        Int @default(0)
  totalTrabajos       Int @default(0)
  tiempoRespuesta     Int? // Minutos promedio
  tasaCancelacion     Float @default(0)

  // Financiero
  tarifaHora          Float?
  tarifaMinima        Float?
  formaPago           String[] @default(["transferencia"])
  iban                String?

  // Auditoría
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  ultimoAcceso        DateTime?

  @@index([ciudad, provincia])
  @@index([especialidades])
  @@index([verificado, activo])
}

// Trabajadores de una empresa (modelo ewoorker)
model ServiceWorker {
  id              String @id @default(cuid())
  professionalId  String
  professional    ServiceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  nombre          String
  especialidad    ProfessionalSpecialty
  experiencia     Int? // Años
  descripcion     String?

  // Disponibilidad (core de ewoorker)
  disponible      Boolean @default(true)
  disponibleDesde DateTime?
  disponibleHasta DateTime?

  // Tarifa específica del trabajador
  tarifaHora      Float?

  // Métricas individuales
  rating          Float @default(0)
  totalTrabajos   Int @default(0)

  activo          Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Trabajos asignados
  trabajosAsignados ServiceJobAssignment[]

  @@index([professionalId, disponible])
  @@index([especialidad, disponible])
}

// Certificaciones y acreditaciones
model ServiceCertification {
  id              String @id @default(cuid())
  professionalId  String
  professional    ServiceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  tipo            String // ISO, PRL, Carnet instalador, etc.
  nombre          String
  entidadEmisora  String?
  numero          String?
  fechaEmision    DateTime?
  fechaCaducidad  DateTime?
  documentoUrl    String?
  verificado      Boolean @default(false)

  createdAt       DateTime @default(now())

  @@index([professionalId])
}

// Documentos del profesional
model ServiceProfessionalDocument {
  id              String @id @default(cuid())
  professionalId  String
  professional    ServiceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  tipo            String // seguro_rc, autonomo, modelo_036, etc.
  nombre          String
  url             String
  fechaCaducidad  DateTime?
  verificado      Boolean @default(false)

  createdAt       DateTime @default(now())

  @@index([professionalId, tipo])
}

// Servicios ofrecidos por profesional
model ProfessionalService {
  id              String @id @default(cuid())
  professionalId  String
  professional    ServiceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  nombre          String
  descripcion     String @db.Text
  especialidad    ProfessionalSpecialty

  // Precios
  tipoPrecio      String // hora, proyecto, m2, unidad
  precioDesde     Float
  precioHasta     Float?

  // Características
  duracionEstimada String?
  incluye         String[] @default([])
  noIncluye       String[] @default([])
  requisitos      String?

  // Estado
  activo          Boolean @default(true)
  destacado       Boolean @default(false)

  // Métricas
  vecesContratado Int @default(0)
  rating          Float @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([especialidad, activo])
}

// Anuncios de trabajo (modelo ewoorker - bidireccional)
model JobPosting {
  id              String @id @default(cuid())

  // Quién publica
  companyId       String?
  company         Company? @relation(fields: [companyId], references: [id])
  professionalId  String?
  professional    ServiceProfessional? @relation(fields: [professionalId], references: [id])

  // Tipo de anuncio (bidireccional como ewoorker)
  tipo            JobPostingType

  titulo          String
  descripcion     String @db.Text
  especialidad    ProfessionalSpecialty

  // Ubicación
  ciudad          String
  provincia       String
  direccion       String?

  // Fechas
  fechaInicio     DateTime?
  fechaFin        DateTime?
  urgente         Boolean @default(false)

  // Presupuesto
  presupuestoMin  Float?
  presupuestoMax  Float?
  tipoPago        String? // hora, proyecto, etc.

  // Requisitos
  experienciaMinima Int?
  certificaciones   String[]

  // Estado
  estado          JobPostingStatus @default(activo)

  // Respuestas recibidas
  respuestas      JobPostingResponse[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  expiresAt       DateTime?

  @@index([estado, especialidad])
  @@index([ciudad, provincia])
}

enum JobPostingType {
  busco_profesional    // Empresa/propietario busca profesional
  ofrezco_trabajadores // Empresa ofrece sus trabajadores (modelo ewoorker)
  ofrezco_servicios    // Profesional ofrece sus servicios
}

enum JobPostingStatus {
  borrador
  activo
  pausado
  cerrado
  expirado
}

// Respuestas a anuncios de trabajo
model JobPostingResponse {
  id              String @id @default(cuid())
  jobPostingId    String
  jobPosting      JobPosting @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)

  // Quién responde
  professionalId  String?
  professional    ServiceProfessional? @relation(fields: [professionalId], references: [id])
  companyId       String?
  company         Company? @relation(fields: [companyId], references: [id])

  mensaje         String @db.Text
  presupuesto     Float?
  disponibilidad  String?

  estado          String @default("pendiente") // pendiente, aceptado, rechazado

  createdAt       DateTime @default(now())

  @@index([jobPostingId])
}

// Solicitudes de servicio
model ServiceRequest {
  id              String @id @default(cuid())

  // Quién solicita
  companyId       String?
  company         Company? @relation(fields: [companyId], references: [id])
  requestedById   String?
  requestedBy     ServiceProfessional? @relation("RequestedBy", fields: [requestedById], references: [id])

  // A quién se solicita
  professionalId  String
  professional    ServiceProfessional @relation(fields: [professionalId], references: [id])

  // Detalles
  titulo          String
  descripcion     String @db.Text
  especialidad    ProfessionalSpecialty

  // Vinculación con propiedad (ventaja Inmova)
  unitId          String?
  unit            Unit? @relation(fields: [unitId], references: [id])
  buildingId      String?
  building        Building? @relation(fields: [buildingId], references: [id])

  // Ubicación alternativa
  direccion       String?
  ciudad          String
  provincia       String

  // Fechas
  fechaDeseada    DateTime?
  urgente         Boolean @default(false)
  flexibilidad    String? // mañana, tarde, cualquiera

  // Presupuesto
  presupuestoMax  Float?

  // Estado
  estado          ServiceRequestStatus @default(pendiente)

  // Respuesta del profesional
  presupuestoOfrecido Float?
  fechaPropuesta  DateTime?
  notasProveedor  String?

  // Ejecución
  fechaInicio     DateTime?
  fechaFin        DateTime?
  costoFinal      Float?

  // Valoración
  valoracion      Int? // 1-5
  comentarioValoracion String?

  // Chat
  conversacion    ServiceRequestMessage[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([professionalId, estado])
  @@index([companyId])
}

enum ServiceRequestStatus {
  pendiente         // Esperando respuesta del profesional
  presupuestado     // Profesional envió presupuesto
  aceptado          // Cliente aceptó
  rechazado         // Cliente o profesional rechazó
  en_progreso       // Trabajo en curso
  completado        // Trabajo terminado
  cancelado         // Cancelado por alguna parte
  disputa           // Hay una disputa
}

// Mensajes en solicitud de servicio
model ServiceRequestMessage {
  id              String @id @default(cuid())
  requestId       String
  request         ServiceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  emisor          String // "cliente" | "profesional"
  mensaje         String @db.Text
  adjuntos        String[] @default([])

  leido           Boolean @default(false)
  createdAt       DateTime @default(now())

  @@index([requestId])
}

// Asignación de trabajadores a trabajos
model ServiceJobAssignment {
  id              String @id @default(cuid())

  workerId        String
  worker          ServiceWorker @relation(fields: [workerId], references: [id])

  requestId       String?
  // ... vincular con ServiceRequest

  fechaInicio     DateTime
  fechaFin        DateTime?
  horasTrabajadas Float?

  estado          String @default("asignado")
  notas           String?

  createdAt       DateTime @default(now())

  @@index([workerId])
}
```

---

## 4. Funcionalidades a Implementar

### 4.1 Fase 1: Core (MVP) - 2 meses

#### 4.1.1 Registro y Perfil de Profesionales

- [ ] Formulario de registro para profesionales/empresas
- [ ] Verificación de email + teléfono
- [ ] Carga de documentación básica (CIF, seguro RC)
- [ ] Selección de especialidades
- [ ] Configuración de área de servicio (geolocalización)

#### 4.1.2 Búsqueda de Profesionales

- [ ] Buscador por especialidad
- [ ] Filtro por ubicación/radio
- [ ] Filtro por disponibilidad
- [ ] Filtro por valoración
- [ ] Ordenación por relevancia/cercanía/precio

#### 4.1.3 Solicitud de Servicios

- [ ] Creación de solicitud desde incidencia de mantenimiento
- [ ] Creación de solicitud directa
- [ ] Notificación a profesionales cercanos
- [ ] Sistema de presupuestos
- [ ] Aceptación/rechazo

#### 4.1.4 Chat y Comunicación

- [ ] Chat en tiempo real (ya existe base)
- [ ] Notificaciones push
- [ ] Historial de conversaciones

### 4.2 Fase 2: Modelo Bidireccional (ewoorker) - 1 mes

#### 4.2.1 Sistema de Trabajadores por Empresa

- [ ] Alta de trabajadores por empresa
- [ ] Gestión de disponibilidad individual
- [ ] Perfil y especialidades por trabajador

#### 4.2.2 Anuncios de Trabajo

- [ ] Publicar "Busco profesional"
- [ ] Publicar "Ofrezco trabajadores" (innovación ewoorker)
- [ ] Respuestas a anuncios
- [ ] Matching automático

#### 4.2.3 Subcontratación entre Empresas

- [ ] Flujo de subcontratación
- [ ] Contratos marco
- [ ] Facturación entre empresas

### 4.3 Fase 3: Monetización - 1 mes

#### 4.3.1 Modelo Freemium

- **Gratis**:
  - 3 solicitudes/mes
  - Perfil básico
  - Búsqueda limitada
- **Premium Profesional** (29€/mes):
  - Solicitudes ilimitadas
  - Perfil destacado
  - Badge "Verificado"
  - Estadísticas avanzadas
- **Premium Empresa** (99€/mes):
  - Todo lo anterior
  - Múltiples usuarios
  - API acceso
  - Gestión de trabajadores
  - Prioridad en búsquedas

#### 4.3.2 Comisiones por Transacción

- 5% sobre trabajos cerrados a través de la plataforma
- Pago seguro integrado (Stripe)
- Liberación de fondos tras valoración

### 4.4 Fase 4: Verificación y Confianza - 1 mes

#### 4.4.1 Sistema de Verificación

- [ ] Verificación de identidad (CIF/NIF)
- [ ] Verificación de documentación:
  - Seguro de Responsabilidad Civil
  - Alta en autónomos / Modelo 036
  - Certificado corriente de pago SS
  - Reconocimiento médico
  - Formación PRL
- [ ] Carnets profesionales (instalador electricista, etc.)
- [ ] Certificaciones ISO

#### 4.4.2 Sistema de Reputación

- [ ] Valoraciones tras cada trabajo (1-5 estrellas)
- [ ] Comentarios verificados
- [ ] Métricas de rendimiento:
  - Tiempo de respuesta
  - Tasa de aceptación
  - Tasa de cancelación
  - Puntualidad
- [ ] Niveles de vendedor (como ewoorker menciona de Fiverr):
  - Nivel 1: 10 trabajos completados
  - Nivel 2: 50 trabajos + 4.5 rating
  - Nivel 3: 100 trabajos + 4.8 rating

---

## 5. Integración con Módulos Existentes de Inmova

### 5.1 Mantenimiento → Marketplace

```typescript
// Cuando se crea una incidencia de mantenimiento,
// ofrecer buscar profesionales automáticamente

// app/api/maintenance/route.ts (modificación)
export async function POST(request: NextRequest) {
  // ... crear incidencia

  // Buscar profesionales recomendados
  const especialidad = mapCategoriaToEspecialidad(body.categoria);
  const profesionales = await findProfessionalsNearby({
    especialidad,
    ciudad: unit.building.ciudad,
    radio: 30, // km
    limit: 5,
  });

  // Notificar a profesionales cercanos si es urgente
  if (body.urgente) {
    await notifyProfessionals(profesionales, incidencia);
  }

  return NextResponse.json({
    incidencia,
    profesionalesRecomendados: profesionales,
  });
}
```

### 5.2 Contratos → Servicios de Entrada/Salida

```typescript
// Al finalizar un contrato, sugerir servicios de limpieza/reparación
// Al iniciar un contrato, sugerir servicios de mudanza

// Trigger automático
async function onContractStatusChange(contract, newStatus) {
  if (newStatus === 'finalizado') {
    // Sugerir limpieza fin de contrato
    await suggestService(contract.unitId, 'limpieza_profesional');
    // Revisar estado del inmueble
    await createMaintenanceCheckList(contract.unitId);
  }

  if (newStatus === 'activo') {
    // Ofrecer servicios de mudanza al inquilino
    await notifyTenantServices(contract.tenantId, ['mudanzas']);
  }
}
```

### 5.3 Comunidades → Servicios Recurrentes

```typescript
// Servicios de mantenimiento para comunidades
// Jardinería, limpieza zonas comunes, mantenimiento piscinas

model CommunityServiceContract {
  id              String @id @default(cuid())
  communityId     String
  professionalId  String

  servicio        String
  frecuencia      String // semanal, quincenal, mensual
  precio          Float

  fechaInicio     DateTime
  fechaFin        DateTime?

  // Calendario de visitas
  visitas         CommunityServiceVisit[]
}
```

---

## 6. APIs a Implementar

### 6.1 Profesionales

```
POST   /api/professionals/register     - Registro de profesional
GET    /api/professionals/search       - Búsqueda con filtros
GET    /api/professionals/[id]         - Perfil público
PUT    /api/professionals/[id]         - Actualizar perfil
GET    /api/professionals/[id]/reviews - Valoraciones
POST   /api/professionals/[id]/verify  - Solicitar verificación
```

### 6.2 Trabajadores (ewoorker)

```
GET    /api/professionals/[id]/workers     - Listar trabajadores
POST   /api/professionals/[id]/workers     - Añadir trabajador
PUT    /api/professionals/[id]/workers/[wid] - Actualizar
DELETE /api/professionals/[id]/workers/[wid] - Eliminar
PATCH  /api/professionals/[id]/workers/[wid]/availability - Cambiar disponibilidad
```

### 6.3 Anuncios de Trabajo

```
GET    /api/job-postings              - Listar anuncios
POST   /api/job-postings              - Crear anuncio
GET    /api/job-postings/[id]         - Ver anuncio
PUT    /api/job-postings/[id]         - Actualizar
DELETE /api/job-postings/[id]         - Eliminar
POST   /api/job-postings/[id]/respond - Responder a anuncio
GET    /api/job-postings/[id]/responses - Ver respuestas
```

### 6.4 Solicitudes de Servicio

```
POST   /api/service-requests              - Crear solicitud
GET    /api/service-requests              - Mis solicitudes
GET    /api/service-requests/[id]         - Detalle
PUT    /api/service-requests/[id]/quote   - Enviar presupuesto
PUT    /api/service-requests/[id]/accept  - Aceptar
PUT    /api/service-requests/[id]/reject  - Rechazar
PUT    /api/service-requests/[id]/complete - Marcar completado
POST   /api/service-requests/[id]/review  - Valorar
GET    /api/service-requests/[id]/messages - Chat
POST   /api/service-requests/[id]/messages - Enviar mensaje
```

---

## 7. Componentes UI a Crear

### 7.1 Páginas Nuevas

```
/marketplace                    - Home del marketplace
/marketplace/professionals      - Buscador de profesionales
/marketplace/professionals/[id] - Perfil de profesional
/marketplace/jobs               - Anuncios de trabajo
/marketplace/jobs/new           - Crear anuncio
/marketplace/jobs/[id]          - Detalle de anuncio
/marketplace/requests           - Mis solicitudes
/marketplace/requests/[id]      - Detalle de solicitud

/portal-profesional             - Dashboard del profesional
/portal-profesional/perfil      - Mi perfil
/portal-profesional/trabajadores - Gestión de trabajadores
/portal-profesional/servicios   - Mis servicios
/portal-profesional/solicitudes - Solicitudes recibidas
/portal-profesional/anuncios    - Mis anuncios
/portal-profesional/facturacion - Facturación
```

### 7.2 Componentes Reutilizables

```typescript
// components/marketplace/
ProfessionalCard.tsx; // Tarjeta de profesional en listado
ProfessionalProfile.tsx; // Perfil completo
WorkerCard.tsx; // Tarjeta de trabajador
AvailabilityToggle.tsx; // Toggle de disponibilidad
ServiceRequestForm.tsx; // Formulario de solicitud
QuoteForm.tsx; // Formulario de presupuesto
ReviewForm.tsx; // Formulario de valoración
ReviewList.tsx; // Lista de valoraciones
SpecialtyBadge.tsx; // Badge de especialidad
VerificationBadge.tsx; // Badge de verificación
JobPostingCard.tsx; // Tarjeta de anuncio
ProfessionalSearch.tsx; // Buscador con filtros
MapView.tsx; // Vista de mapa con profesionales
```

---

## 8. Modelo de Monetización Detallado

### 8.1 Estructura de Precios

| Plan             | Precio  | Características                                   |
| ---------------- | ------- | ------------------------------------------------- |
| **Free**         | 0€      | 3 solicitudes/mes, perfil básico, sin destacados  |
| **Starter**      | 19€/mes | 15 solicitudes, badge verificado, estadísticas    |
| **Professional** | 49€/mes | Ilimitado, perfil destacado, prioridad búsqueda   |
| **Business**     | 99€/mes | Multi-usuario, gestión trabajadores, API, soporte |

### 8.2 Comisiones

| Tipo                | Comisión | Notas                      |
| ------------------- | -------- | -------------------------- |
| Trabajos < 500€     | 8%       | Mínimo 5€                  |
| Trabajos 500€-2000€ | 6%       | -                          |
| Trabajos > 2000€    | 4%       | -                          |
| Pago seguro         | 2%       | Adicional si usan pasarela |

### 8.3 Servicios Adicionales

| Servicio                   | Precio  |
| -------------------------- | ------- |
| Destacar perfil 7 días     | 15€     |
| Destacar anuncio 7 días    | 10€     |
| Verificación express (24h) | 29€     |
| Badge "Top Professional"   | 49€/mes |

---

## 9. Cronograma de Implementación

### Mes 1: Fundamentos

- Semana 1-2: Modelos Prisma + Migraciones
- Semana 3-4: APIs básicas (CRUD profesionales, búsqueda)

### Mes 2: Core Features

- Semana 1-2: Solicitudes de servicio + Chat
- Semana 3-4: Sistema de valoraciones

### Mes 3: Modelo ewoorker

- Semana 1-2: Gestión de trabajadores
- Semana 3-4: Anuncios bidireccionales

### Mes 4: Monetización + Polish

- Semana 1-2: Planes de suscripción + Stripe
- Semana 3-4: Verificaciones + Testing

---

## 10. KPIs de Éxito

### 10.1 Métricas de Adopción

- Profesionales registrados: Target 500 en 6 meses
- Empresas activas: Target 200 en 6 meses
- Solicitudes mensuales: Target 1000 en 6 meses

### 10.2 Métricas de Engagement

- Tasa de conversión solicitud → trabajo: > 30%
- Tiempo promedio de respuesta: < 4 horas
- NPS profesionales: > 40
- NPS clientes: > 50

### 10.3 Métricas Financieras

- MRR objetivo mes 6: 5.000€
- ARR objetivo año 1: 100.000€
- Comisiones transacciones/mes: 3.000€

---

## 11. Conclusiones

La integración del modelo ewoorker en Inmova representa una **oportunidad única** de:

1. **Diferenciación**: Ningún competidor PropTech tiene un marketplace de servicios integrado
2. **Valor añadido**: Los gestores pueden resolver incidencias sin salir de la plataforma
3. **Nuevo revenue stream**: Suscripciones + comisiones
4. **Efecto red**: Más profesionales → más valor para gestores → más gestores → más profesionales

El modelo bidireccional de ewoorker (ofrecer/contratar) es especialmente valioso para el sector de mantenimiento inmobiliario, donde la carga de trabajo es muy variable.

---

**Documento creado**: 5 de enero de 2026
**Versión**: 1.0
**Autor**: Equipo Inmova
