# 🔗 ANÁLISIS DE INTERACCIONES ENTRE PÁGINAS - INMOVA APP

## 📊 ANÁLISIS COMPLETO DE FLUJOS DE TRABAJO

### Total de páginas: **384 páginas**

### Páginas analizadas en profundidad: **50+ páginas principales**

---

## 🎯 FLUJOS DE TRABAJO PRINCIPALES

### 1. FLUJO: GESTIÓN DE PROPIEDADES (Alquiler Tradicional)

```
Dashboard → Propiedades → Detalles Propiedad → [Múltiples acciones]
                ↓                ↓
            Edificios        Inquilinos
                ↓                ↓
            Unidades        Contratos
                ↓                ↓
            Crear/Editar    Pagos
```

**Interacciones detectadas**:

#### A. Dashboard (`/dashboard`)
**Botones actuales**:
- ✅ "Ver todos" → `/pagos` (Pagos Pendientes)
- ✅ "Ver todos" → `/contratos` (Contratos)
- ✅ "Ver todos" → `/mantenimiento` (Mantenimiento)
- ✅ "Ver todas" → `/unidades` (Unidades)

**Botones FALTANTES** (críticos):
- ❌ **Acción rápida**: "Nueva Propiedad" → `/propiedades/crear`
- ❌ **Acción rápida**: "Nuevo Inquilino" → `/inquilinos/nuevo`
- ❌ **Acción rápida**: "Nuevo Contrato" → `/contratos/nuevo`
- ❌ **Ver KPI clickeable**: Click en "Total Propiedades" → `/propiedades`
- ❌ **Ver KPI clickeable**: Click en "Tasa Ocupación" → `/unidades?estado=disponible`
- ❌ **Ver KPI clickeable**: Click en "Morosidad" → `/pagos?estado=pendiente`

**Shortcuts sugeridos**:
- `Ctrl/Cmd + K`: Comando rápido (buscar global)
- `Ctrl/Cmd + N`: Nueva propiedad
- `Ctrl/Cmd + T`: Nuevo inquilino
- `Ctrl/Cmd + P`: Ver pagos
- `Ctrl/Cmd + /`: Buscar

---

#### B. Propiedades (`/propiedades`)
**Botones actuales**:
- ✅ Volver → `/dashboard`
- ✅ "Nueva Propiedad" → `/propiedades/crear`
- ✅ "Ver" → `/propiedades/[id]`
- ✅ "Editar" → `/propiedades/[id]/editar`

**Botones FALTANTES** (críticos):
- ❌ **Desde card propiedad OCUPADA**: "Ver Inquilino" → `/inquilinos/[tenantId]`
- ❌ **Desde card propiedad OCUPADA**: "Ver Contrato" → `/contratos/[contractId]`
- ❌ **Desde card propiedad OCUPADA**: "Registrar Pago" → `/pagos/nuevo?propertyId=[id]`
- ❌ **Desde card propiedad DISPONIBLE**: "Buscar Inquilino" → `/candidatos`
- ❌ **Desde card propiedad DISPONIBLE**: "Crear Contrato" → `/contratos/nuevo?propertyId=[id]`
- ❌ **Acción masiva**: "Exportar selección" → Exportar CSV/PDF
- ❌ **Acción masiva**: "Cambiar estado" → Modal cambio estado

**Contexto adicional** (mostrar en tooltip):
- Días desde última inspección
- Días hasta próxima revisión
- Histórico de inquilinos (cantidad)

**Shortcuts sugeridos**:
- `N`: Nueva propiedad
- `F`: Focus en búsqueda
- `G`: Cambiar a Grid view
- `L`: Cambiar a List view
- `Shift + Click`: Selección múltiple

---

#### C. Detalles de Propiedad (`/propiedades/[id]`)

**Botones actuales** (limitados):
- ✅ Volver → `/propiedades`
- ✅ Editar → `/propiedades/[id]/editar`

**Botones FALTANTES** (muy críticos):

**Si propiedad está OCUPADA**:
- ❌ **Tab "Inquilino"**: Ver perfil completo → `/inquilinos/[tenantId]`
- ❌ **Tab "Contrato"**: Ver/Editar contrato → `/contratos/[contractId]`
- ❌ **Tab "Pagos"**: Historial pagos → `/pagos?propertyId=[id]`
- ❌ **Tab "Mantenimiento"**: Historial → `/mantenimiento?propertyId=[id]`
- ❌ **Acción rápida**: "Reportar Incidencia" → `/incidencias/nueva?propertyId=[id]`
- ❌ **Acción rápida**: "Registrar Pago" → `/pagos/nuevo?propertyId=[id]`
- ❌ **Acción rápida**: "Chatear con Inquilino" → `/chat?tenantId=[tenantId]`

**Si propiedad está DISPONIBLE**:
- ❌ **Acción destacada**: "Publicar Anuncio" → `/anuncios/nuevo?propertyId=[id]`
- ❌ **Acción destacada**: "Buscar Inquilino" → `/candidatos?propertyId=[id]`
- ❌ **Acción destacada**: "Ver Candidatos" → `/candidatos?propertyId=[id]`
- ❌ **Sugerencia IA**: "Precio recomendado" → Modal con valoración

**Siempre disponibles**:
- ❌ **Navegación**: "Ver Edificio" → `/edificios/[buildingId]`
- ❌ **Navegación**: "Ver otras unidades del edificio" → `/unidades?buildingId=[buildingId]`
- ❌ **Documentos**: "Ver documentos" → `/documentos?propertyId=[id]`
- ❌ **Documentos**: "Subir documento" → Modal upload
- ❌ **Calendario**: "Programar visita" → `/visitas/nueva?propertyId=[id]`
- ❌ **Historial**: "Ver historial completo" → Tab con timeline

**Estructura propuesta**:

```tsx
// Tabs horizontales
<Tabs>
  <Tab name="Información">
    - Características
    - Fotos
    - Ubicación
    [Botón: Ver Edificio]
    [Botón: Ver otras unidades]
  </Tab>
  
  <Tab name="Inquilino" {ocupada ? visible : hidden}>
    - Datos inquilino actual
    - Contrato activo
    - Pagos recientes
    [Botón: Ver perfil completo]
    [Botón: Chatear]
    [Botón: Registrar pago]
  </Tab>
  
  <Tab name="Finanzas">
    - Renta mensual
    - Historial de pagos
    - Gastos asociados
    [Botón: Ver todos los pagos]
    [Botón: Registrar pago]
    [Botón: Ver gastos]
  </Tab>
  
  <Tab name="Mantenimiento">
    - Incidencias abiertas
    - Historial de mantenimiento
    - Próximas inspecciones
    [Botón: Reportar incidencia]
    [Botón: Ver historial]
    [Botón: Programar inspección]
  </Tab>
  
  <Tab name="Documentos">
    - Contratos
    - Certificados
    - Facturas
    [Botón: Subir documento]
    [Botón: Ver todos]
  </Tab>
  
  <Tab name="Historial">
    - Timeline de eventos
    - Cambios de inquilino
    - Modificaciones
  </Tab>
</Tabs>

// Quick Actions (siempre visible en header)
<QuickActions>
  {estado === 'ocupada' && (
    <>
      <Button>Ver Inquilino</Button>
      <Button>Registrar Pago</Button>
      <Button>Reportar Incidencia</Button>
    </>
  )}
  {estado === 'disponible' && (
    <>
      <Button>Publicar Anuncio</Button>
      <Button>Buscar Inquilino</Button>
      <Button>Ver Candidatos</Button>
    </>
  )}
  <Button>Editar</Button>
  <Button>Ver Edificio</Button>
</QuickActions>
```

---

### 2. FLUJO: GESTIÓN DE INQUILINOS

```
Dashboard → Inquilinos → Detalles Inquilino → [Acciones contextuales]
                ↓              ↓
            Candidatos    Contratos
                ↓              ↓
            Screening     Pagos
                ↓              ↓
            Contratar     Incidencias
```

#### A. Inquilinos (`/inquilinos`)

**Botones actuales**:
- ✅ Volver → `/dashboard`
- ✅ "Nuevo Inquilino" → `/inquilinos/nuevo`
- ✅ "Ver Detalles" → `/inquilinos/[id]`
- ✅ Eliminar (con confirmación)

**Botones FALTANTES**:
- ❌ **Desde card inquilino**: "Ver Propiedad" → `/propiedades/[propertyId]`
- ❌ **Desde card inquilino**: "Ver Contrato" → `/contratos/[contractId]`
- ❌ **Desde card inquilino**: "Enviar Mensaje" → `/chat?tenantId=[id]`
- ❌ **Desde card inquilino**: "Historial Pagos" → `/pagos?tenantId=[id]`
- ❌ **Filtro avanzado**: "Morosos" → Filtrar por estado pago
- ❌ **Filtro avanzado**: "Contratos por vencer" → Filtrar por fecha
- ❌ **Acción masiva**: "Enviar recordatorio" → Email masivo

**Shortcuts sugeridos**:
- `N`: Nuevo inquilino
- `F`: Focus búsqueda
- `M`: Filtrar morosos
- `A`: Todos los inquilinos

---

#### B. Detalles Inquilino (`/inquilinos/[id]`)

**Botones FALTANTES** (muy críticos):

```tsx
<Tabs>
  <Tab name="Información Personal">
    - Datos básicos
    - Documentos identidad
    [Botón: Editar información]
    [Botón: Ver documentos]
  </Tab>
  
  <Tab name="Propiedad Actual">
    - Unidad ocupada
    - Edificio
    - Contrato activo
    [Botón: Ver propiedad completa]
    [Botón: Ver contrato]
    [Botón: Ver edificio]
  </Tab>
  
  <Tab name="Finanzas">
    - Estado de cuenta
    - Pagos recientes
    - Deuda pendiente
    - Historial completo
    [Botón: Registrar pago]
    [Botón: Ver historial completo]
    [Botón: Generar estado cuenta]
    [Botón: Enviar recordatorio]
  </Tab>
  
  <Tab name="Incidencias">
    - Incidencias reportadas
    - En progreso
    - Resueltas
    [Botón: Ver detalle]
    [Botón: Nueva incidencia]
  </Tab>
  
  <Tab name="Comunicación">
    - Mensajes recientes
    - Notificaciones enviadas
    - Documentos compartidos
    [Botón: Enviar mensaje]
    [Botón: Enviar email]
    [Botón: Llamar (tel:)]
    [Botón: WhatsApp (wa.me/)]
  </Tab>
  
  <Tab name="Historial">
    - Timeline de eventos
    - Propiedades anteriores
    - Contratos históricos
    - Incidencias pasadas
  </Tab>
</Tabs>

<QuickActions>
  {estado === 'activo' && (
    <>
      <Button>Registrar Pago</Button>
      <Button>Enviar Mensaje</Button>
      <Button>Ver Propiedad</Button>
      <Button>Ver Contrato</Button>
    </>
  )}
  {hasMorosidad && (
    <>
      <Button variant="destructive">Enviar Recordatorio</Button>
      <Button>Plan de Pagos</Button>
    </>
  )}
  <Button>Editar</Button>
  <Button>Renovar Contrato</Button>
</QuickActions>
```

---

### 3. FLUJO: GESTIÓN DE CONTRATOS

```
Dashboard → Contratos → Detalles Contrato → [Firma, Pagos, Renovación]
    ↓           ↓              ↓
Inquilinos  Propiedades   Firma Digital
    ↓           ↓              ↓
Candidatos  Unidades      Documentos
```

#### A. Contratos (`/contratos`)

**Botones actuales**:
- ✅ "Nuevo Contrato" → `/contratos/nuevo`

**Botones FALTANTES**:
- ❌ **Desde card contrato**: "Ver Inquilino" → `/inquilinos/[tenantId]`
- ❌ **Desde card contrato**: "Ver Propiedad" → `/propiedades/[propertyId]`
- ❌ **Desde card contrato**: "Historial Pagos" → `/pagos?contractId=[id]`
- ❌ **Desde card contrato**: "Firmar Digitalmente" → `/firma-digital/[contractId]`
- ❌ **Desde card contrato**: "Descargar PDF" → Generar PDF
- ❌ **Desde card contrato**: "Renovar" → `/contratos/nuevo?renovacionDeId=[id]`
- ❌ **Desde card contrato**: "Rescindir" → Modal con flujo
- ❌ **Filtro**: "Por vencer (30 días)" → Badge con contador
- ❌ **Filtro**: "Vencidos" → Badge rojo
- ❌ **Alerta visual**: Badge "⚠️ Vence en X días"

---

#### B. Detalles Contrato (`/contratos/[id]`)

**Botones FALTANTES** (críticos):

```tsx
<Tabs>
  <Tab name="Información">
    - Datos del contrato
    - Fechas
    - Condiciones
    [Botón: Editar]
    [Botón: Descargar PDF]
  </Tab>
  
  <Tab name="Partes">
    - Inquilino (con foto y datos)
    - Propietario (datos empresa)
    - Garantes (si aplica)
    [Botón: Ver inquilino completo]
    [Botón: Ver propiedad completa]
    [Botón: Contactar inquilino]
  </Tab>
  
  <Tab name="Pagos">
    - Calendario de pagos
    - Pagos realizados
    - Pagos pendientes
    - Historial completo
    [Botón: Registrar pago]
    [Botón: Ver historial]
    [Botón: Generar recibo]
  </Tab>
  
  <Tab name="Firma Digital">
    - Estado de firma
    - Firmantes
    - Certificado
    [Botón: Enviar para firma]
    [Botón: Descargar firmado]
    [Botón: Ver certificado]
  </Tab>
  
  <Tab name="Documentos">
    - Contrato firmado
    - Anexos
    - Recibos
    - Comunicaciones
    [Botón: Subir documento]
    [Botón: Ver todos]
  </Tab>
  
  <Tab name="Historial">
    - Modificaciones
    - Renovaciones
    - Comunicaciones
  </Tab>
</Tabs>

<QuickActions>
  {estado === 'borrador' && (
    <>
      <Button>Enviar para Firma</Button>
      <Button>Editar</Button>
    </>
  )}
  {estado === 'activo' && (
    <>
      <Button>Registrar Pago</Button>
      <Button>Ver Inquilino</Button>
      <Button>Ver Propiedad</Button>
      <Button>Renovar</Button>
    </>
  )}
  {diasHastaVencimiento <= 30 && (
    <Button variant="warning">Renovar Contrato</Button>
  )}
  {estado === 'activo' && (
    <Button variant="destructive">Rescindir</Button>
  )}
  <Button>Descargar PDF</Button>
</QuickActions>
```

---

### 4. FLUJO: GESTIÓN FINANCIERA

```
Dashboard → Pagos → Detalles Pago → [Recibo, Recordatorio]
    ↓         ↓          ↓
Gastos   Facturación  Open Banking
    ↓         ↓          ↓
Reportes  Contabilidad Conciliación
```

#### A. Pagos (`/pagos`)

**Botones FALTANTES**:
- ❌ **Desde card pago PENDIENTE**: "Registrar Pago" → Modal quick
- ❌ **Desde card pago PENDIENTE**: "Enviar Recordatorio" → Email/SMS
- ❌ **Desde card pago PENDIENTE**: "Plan de Pagos" → Modal
- ❌ **Desde card pago PAGADO**: "Generar Recibo" → PDF
- ❌ **Desde card pago PAGADO**: "Enviar Recibo" → Email
- ❌ **Desde card**: "Ver Inquilino" → `/inquilinos/[tenantId]`
- ❌ **Desde card**: "Ver Contrato" → `/contratos/[contractId]`
- ❌ **Desde card**: "Ver Propiedad" → `/propiedades/[propertyId]`
- ❌ **Filtro**: "Morosos" → Badge rojo con contador
- ❌ **Filtro**: "Vencidos hoy" → Badge urgente
- ❌ **Acción masiva**: "Enviar recordatorios masivos"
- ❌ **Acción masiva**: "Generar reporte"
- ❌ **Exportar**: "Excel/PDF"

**Indicadores visuales** (agregar):
- 🔴 Pago vencido (rojo)
- 🟡 Pago vence hoy (amarillo)
- 🟢 Pago próximos 7 días (verde)
- ✅ Pago realizado (verde check)

---

### 5. FLUJO: MANTENIMIENTO E INCIDENCIAS

```
Dashboard → Mantenimiento → Detalles Incidencia → [Asignar, Resolver]
    ↓            ↓              ↓
Incidencias  Órdenes Trabajo  Proveedores
    ↓            ↓              ↓
Tareas      Calendario       Gastos
```

#### A. Mantenimiento (`/mantenimiento`)

**Botones FALTANTES**:
- ❌ **Desde card incidencia**: "Ver Propiedad" → `/propiedades/[propertyId]`
- ❌ **Desde card incidencia**: "Ver Inquilino" → `/inquilinos/[tenantId]`
- ❌ **Desde card incidencia**: "Asignar a" → Modal selección operador
- ❌ **Desde card incidencia**: "Crear Orden Trabajo" → `/ordenes-trabajo/nueva?incidenciaId=[id]`
- ❌ **Desde card incidencia**: "Cambiar prioridad" → Dropdown rápido
- ❌ **Desde card incidencia**: "Agregar fotos" → Upload modal
- ❌ **Desde card incidencia**: "Marcar resuelta" → Modal confirmación
- ❌ **Filtro**: "Urgentes" → Badge rojo
- ❌ **Filtro**: "Sin asignar" → Badge
- ❌ **Filtro**: "Por propiedad" → Select
- ❌ **Vista**: "Mapa" → Ver ubicaciones geográficas

---

### 6. FLUJO: CANDIDATOS Y SCREENING

```
Propiedades Disponibles → Candidatos → Screening → Contrato
         ↓                    ↓            ↓            ↓
    Anuncios             Validación    Aprobación   Firma
         ↓                    ↓            ↓            ↓
    Portales              Score      Documentos   Activación
```

#### A. Candidatos (`/candidatos`)

**Botones FALTANTES**:
- ❌ **Desde card candidato**: "Iniciar Screening" → `/screening/nuevo?candidatoId=[id]`
- ❌ **Desde card candidato**: "Ver propiedad de interés" → `/propiedades/[propertyId]`
- ❌ **Desde card candidato**: "Programar visita" → `/visitas/nueva?candidatoId=[id]`
- ❌ **Desde card candidato**: "Aprobar" → Modal → Crear contrato
- ❌ **Desde card candidato**: "Rechazar" → Modal con razón
- ❌ **Desde card candidato**: "Solicitar documentos" → Email template
- ❌ **Score visual**: Badge con color (verde/amarillo/rojo)
- ❌ **Filtro**: "Por propiedad" → Select
- ❌ **Filtro**: "Por estado" → Nuevo/En proceso/Aprobado/Rechazado

---

## 🎨 COMPONENTES DE NAVEGACIÓN UNIVERSAL

### 1. Quick Actions Bar (Header Global)

```tsx
// Ubicación: Header global, siempre visible
<QuickActionsBar>
  // Cambia según página actual
  {currentPage === '/propiedades/[id]' && property.estado === 'ocupada' && (
    <>
      <QuickAction icon={User} onClick={() => router.push(`/inquilinos/${tenantId}`)}>
        Ver Inquilino
      </QuickAction>
      <QuickAction icon={DollarSign} onClick={() => router.push(`/pagos/nuevo?propertyId=${id}`)}>
        Registrar Pago
      </QuickAction>
      <QuickAction icon={MessageSquare} onClick={() => router.push(`/chat?tenantId=${tenantId}`)}>
        Chatear
      </QuickAction>
    </>
  )}
  
  {currentPage === '/inquilinos/[id]' && (
    <>
      <QuickAction icon={Home} onClick={() => router.push(`/propiedades/${propertyId}`)}>
        Ver Propiedad
      </QuickAction>
      <QuickAction icon={FileText} onClick={() => router.push(`/contratos/${contractId}`)}>
        Ver Contrato
      </QuickAction>
      <QuickAction icon={DollarSign} onClick={() => router.push(`/pagos/nuevo?tenantId=${id}`)}>
        Registrar Pago
      </QuickAction>
    </>
  )}
</QuickActionsBar>
```

---

### 2. Breadcrumbs Inteligentes con Contexto

```tsx
// Ejemplo: /propiedades/[id]
<Breadcrumb>
  <BreadcrumbItem>
    <Link href="/dashboard">
      <Home size={16} />
    </Link>
  </BreadcrumbItem>
  
  <BreadcrumbSeparator />
  
  <BreadcrumbItem>
    <Link href="/propiedades">
      Propiedades <Badge>{totalProperties}</Badge>
    </Link>
  </BreadcrumbItem>
  
  <BreadcrumbSeparator />
  
  <BreadcrumbItem>
    <Link href={`/edificios/${buildingId}`}>
      {buildingName}
    </Link>
  </BreadcrumbItem>
  
  <BreadcrumbSeparator />
  
  <BreadcrumbCurrent>
    {propertyNumber}
    <Badge variant={statusVariant}>{status}</Badge>
  </BreadcrumbCurrent>
</Breadcrumb>
```

---

### 3. Sidebar Contextual (Drawer Derecho)

```tsx
// Se abre con botón "🔗 Enlaces Rápidos" en header
<ContextualSidebar>
  <Section title="Navegación Rápida">
    {currentEntity === 'property' && (
      <>
        <Link href={`/inquilinos/${tenantId}`}>
          <User /> Ver Inquilino
        </Link>
        <Link href={`/contratos/${contractId}`}>
          <FileText /> Ver Contrato
        </Link>
        <Link href={`/edificios/${buildingId}`}>
          <Building2 /> Ver Edificio
        </Link>
        <Link href={`/pagos?propertyId=${id}`}>
          <DollarSign /> Historial Pagos
        </Link>
        <Link href={`/mantenimiento?propertyId=${id}`}>
          <Wrench /> Historial Mantenimiento
        </Link>
      </>
    )}
  </Section>
  
  <Section title="Acciones Rápidas">
    <Button onClick={() => openModal('registerPayment')}>
      Registrar Pago
    </Button>
    <Button onClick={() => openModal('reportIncident')}>
      Reportar Incidencia
    </Button>
    <Button onClick={() => openModal('sendMessage')}>
      Enviar Mensaje
    </Button>
  </Section>
  
  <Section title="Historial Reciente">
    <Timeline>
      {recentEvents.map(event => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </Timeline>
  </Section>
</ContextualSidebar>
```

---

### 4. Command Palette (Cmd+K / Ctrl+K)

```tsx
<CommandPalette>
  {/* Navegación */}
  <CommandGroup heading="Ir a...">
    <CommandItem onSelect={() => router.push('/dashboard')}>
      <Home /> Dashboard
    </CommandItem>
    <CommandItem onSelect={() => router.push('/propiedades')}>
      <Building2 /> Propiedades
    </CommandItem>
    <CommandItem onSelect={() => router.push('/inquilinos')}>
      <Users /> Inquilinos
    </CommandItem>
    <CommandItem onSelect={() => router.push('/contratos')}>
      <FileText /> Contratos
    </CommandItem>
    <CommandItem onSelect={() => router.push('/pagos')}>
      <DollarSign /> Pagos
    </CommandItem>
  </CommandGroup>
  
  {/* Acciones contextuales */}
  <CommandGroup heading="Acciones Rápidas">
    <CommandItem onSelect={() => router.push('/propiedades/crear')}>
      <Plus /> Nueva Propiedad
    </CommandItem>
    <CommandItem onSelect={() => router.push('/inquilinos/nuevo')}>
      <UserPlus /> Nuevo Inquilino
    </CommandItem>
    <CommandItem onSelect={() => router.push('/contratos/nuevo')}>
      <FileText /> Nuevo Contrato
    </CommandItem>
    <CommandItem onSelect={() => router.push('/pagos/nuevo')}>
      <DollarSign /> Registrar Pago
    </CommandItem>
  </CommandGroup>
  
  {/* Búsqueda */}
  <CommandGroup heading="Buscar">
    <CommandItem onSelect={() => setSearchMode('properties')}>
      <Search /> Buscar Propiedades
    </CommandItem>
    <CommandItem onSelect={() => setSearchMode('tenants')}>
      <Search /> Buscar Inquilinos
    </CommandItem>
  </CommandGroup>
  
  {/* Recientes */}
  <CommandGroup heading="Visitados Recientemente">
    {recentPages.map(page => (
      <CommandItem key={page.url} onSelect={() => router.push(page.url)}>
        <Clock /> {page.title}
      </CommandItem>
    ))}
  </CommandGroup>
</CommandPalette>
```

---

## ⌨️ SHORTCUTS DE TECLADO PROPUESTOS

### Globales (desde cualquier página)

| Shortcut | Acción | Descripción |
|----------|--------|-------------|
| `Cmd/Ctrl + K` | Command Palette | Abrir comando rápido |
| `Cmd/Ctrl + /` | Buscar | Focus en búsqueda global |
| `Cmd/Ctrl + B` | Sidebar Toggle | Mostrar/ocultar sidebar |
| `Cmd/Ctrl + H` | Home | Ir a dashboard |
| `Cmd/Ctrl + P` | Propiedades | Ir a propiedades |
| `Cmd/Ctrl + T` | Inquilinos | Ir a inquilinos (Tenants) |
| `Cmd/Ctrl + C` | Contratos | Ir a contratos (Contracts) |
| `Cmd/Ctrl + $` | Pagos | Ir a pagos |
| `G then D` | Dashboard | Go to Dashboard (estilo Gmail) |
| `G then P` | Propiedades | Go to Properties |
| `G then T` | Inquilinos | Go to Tenants |
| `?` | Ayuda | Mostrar shortcuts |
| `Esc` | Cerrar | Cerrar modales/drawers |

### Por Página

#### Propiedades (`/propiedades`)

| Shortcut | Acción |
|----------|--------|
| `N` | Nueva propiedad |
| `F` | Focus búsqueda |
| `G` | Vista Grid |
| `L` | Vista Lista |
| `M` | Vista Mapa |
| `1-9` | Aplicar filtro rápido |
| `Shift + Click` | Selección múltiple |
| `E` | Exportar |
| `R` | Refrescar datos |

#### Inquilinos (`/inquilinos`)

| Shortcut | Acción |
|----------|--------|
| `N` | Nuevo inquilino |
| `F` | Focus búsqueda |
| `A` | Mostrar todos |
| `M` | Filtrar morosos |
| `V` | Filtrar por vencer contratos |

#### Detalles (cualquier entidad)

| Shortcut | Acción |
|----------|--------|
| `E` | Editar |
| `S` | Guardar |
| `Esc` | Cancelar/Volver |
| `Tab` | Siguiente tab |
| `Shift + Tab` | Tab anterior |
| `Cmd/Ctrl + S` | Guardar rápido |

---

## 📍 CONTEXTO PERSISTENTE (Historial de Navegación)

```tsx
// Store para tracking de navegación
interface NavigationHistoryStore {
  history: Array<{
    url: string;
    title: string;
    entity?: { type: string; id: string; name: string };
    timestamp: number;
  }>;
  recentEntities: {
    properties: Array<{ id: string; name: string; lastVisited: number }>;
    tenants: Array<{ id: string; name: string; lastVisited: number }>;
    contracts: Array<{ id: string; name: string; lastVisited: number }>;
  };
}

// Botón "Atrás" mejorado con historial
<Button variant="ghost" onClick={() => router.back()}>
  <ArrowLeft />
  <span>Volver</span>
  {previousPage && (
    <Tooltip>
      <TooltipContent>
        Volver a {previousPage.title}
      </TooltipContent>
    </Tooltip>
  )}
</Button>

// Dropdown historial
<DropdownMenu>
  <DropdownMenuTrigger>
    <ChevronDown />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {navigationHistory.slice(0, 5).map(page => (
      <DropdownMenuItem onClick={() => router.push(page.url)}>
        {page.title}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 🔗 ENLACES CONTEXTUALES AUTOMÁTICOS

### Reglas de Detección

```tsx
// Auto-detectar relaciones y mostrar enlaces
const relationshipDetector = {
  property: (propertyId) => ({
    tenant: getTenantByProperty(propertyId),
    contract: getActiveContractByProperty(propertyId),
    building: getBuildingByProperty(propertyId),
    payments: getPaymentsByProperty(propertyId),
    maintenance: getMaintenanceByProperty(propertyId),
    documents: getDocumentsByProperty(propertyId),
  }),
  
  tenant: (tenantId) => ({
    property: getPropertyByTenant(tenantId),
    contract: getActiveContractByTenant(tenantId),
    payments: getPaymentsByTenant(tenantId),
    incidents: getIncidentsByTenant(tenantId),
    documents: getDocumentsByTenant(tenantId),
  }),
  
  contract: (contractId) => ({
    property: getPropertyByContract(contractId),
    tenant: getTenantByContract(contractId),
    payments: getPaymentsByContract(contractId),
    documents: getDocumentsByContract(contractId),
  }),
};
```

---

## 📊 PRIORIZACIÓN DE IMPLEMENTACIÓN

### 🔴 CRÍTICAS (Implementar Ya)

1. **Quick Actions en Dashboard**
   - Nueva Propiedad
   - Nuevo Inquilino
   - Registrar Pago

2. **Navegación desde Cards**
   - Propiedad → Inquilino
   - Propiedad → Contrato
   - Inquilino → Propiedad
   - Inquilino → Contrato

3. **Command Palette (Cmd+K)**
   - Navegación rápida
   - Búsqueda global
   - Acciones contextuales

4. **Breadcrumbs Inteligentes**
   - Con contexto
   - Navegables
   - Con badges de estado

### 🟡 IMPORTANTES (Implementar Pronto)

5. **Tabs en Detalles**
   - Propiedad: Inquilino, Finanzas, Mantenimiento
   - Inquilino: Propiedad, Finanzas, Comunicación
   - Contrato: Pagos, Firma, Documentos

6. **Sidebar Contextual**
   - Enlaces relacionados
   - Acciones rápidas
   - Historial reciente

7. **Shortcuts de Teclado**
   - Globales (Cmd+K, etc.)
   - Por página (N, F, etc.)
   - Ayuda (?)

### 🟢 DESEABLES (Futuro)

8. **Historial de Navegación**
   - Tracking de páginas visitadas
   - Botón Atrás mejorado
   - Entidades recientes

9. **Sugerencias IA**
   - "Ver también"
   - "Acción recomendada"
   - "Documentos pendientes"

10. **Vista Mapa**
    - Propiedades geo-localizadas
    - Incidencias en mapa
    - Rutas optimizadas (operadores)

---

**Última actualización**: 4 de enero de 2026
**Total de interacciones analizadas**: 100+
**Botones propuestos**: 200+
**Shortcuts propuestos**: 40+
