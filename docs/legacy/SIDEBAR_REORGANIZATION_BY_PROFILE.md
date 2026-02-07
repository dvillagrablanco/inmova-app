# 🎯 REORGANIZACIÓN DEL SIDEBAR POR PERFIL DE USUARIO

## 📊 ANÁLISIS DE PERFILES Y PRIORIDADES

### 1. SUPER_ADMIN (Gestor de Plataforma B2B)

**Objetivo**: Gestionar múltiples clientes, monitorear salud de la plataforma, facturación B2B.

**Prioridad de funcionalidades**:
1. **Dashboard Super Admin** (métricas de clientes, uso, facturación)
2. **Gestión de Clientes B2B** (agregar empresas, configurar planes)
3. **Facturación B2B** (cobros, planes, subscripciones)
4. **Salud del Sistema** (uptime, performance, errores)
5. **Métricas de Uso** (adoption, features más usados)
6. **Seguridad y Logs** (auditoría, compliance)
7. **Integraciones** (configurar APIs, webhooks)
8. **Portales Externos** (conexiones Idealista, Fotocasa)
9. **Planes y Módulos** (activar/desactivar features por cliente)
10. **Partners y Aliados** (gestión de partners)
11. **API Documentation** (para integraciones)

**Funcionalidades SECUNDARIAS** (usar menos):
- Edificios, Inquilinos, Contratos (son datos de clientes específicos)
- Operaciones diarias (no es su trabajo)

---

### 2. ADMINISTRADOR (Dueño/Director de Empresa Inmobiliaria)

**Objetivo**: Maximizar ROI, supervisar operaciones, tomar decisiones estratégicas.

**Prioridad de funcionalidades**:
1. **Dashboard Principal** (KPIs: ocupación, ingresos, pagos pendientes)
2. **Analytics e IA** (reportes ejecutivos, tendencias, predicciones)
3. **Finanzas** (pagos, gastos, presupuestos, facturación)
4. **Propiedades** (edificios, unidades, garajes - activo principal)
5. **Inquilinos** (fuente de ingresos)
6. **Contratos** (legal, compliance)
7. **Reportes** (P&L, ocupación, morosidad)
8. **CRM** (leads, pipeline de ventas)
9. **Configuración Empresa** (usuarios, permisos, branding)
10. **Operaciones** (mantenimiento, tareas - supervisión)
11. **Comunicaciones** (chat, notificaciones, redes sociales)
12. **Documentos y Legal** (contratos, firma digital, compliance)

**Funcionalidades SECUNDARIAS**:
- Innovación (ESG, IoT, Blockchain - nice to have)
- Automatización (no es usuario técnico)
- Órdenes del día operador (delega a Gestor)

**Diferenciación por VERTICAL** (se adapta según negocio):
- **Alquiler Tradicional**: Edificios, Inquilinos, Contratos, Pagos, Candidatos
- **STR/Airbnb**: Anuncios, Reservas, Channel Manager, Pricing Dinámico, Reviews
- **Co-Living**: Room Rental, Comunidad Social, Eventos, Reservas Espacios
- **Flipping**: Proyectos, ROI Calculator, Timeline, Comparador
- **Construcción**: Proyectos, Gantt, Control Calidad, Proveedores
- **Admin Fincas**: Comunidades, Votaciones, Reuniones, Cuotas, Fondos

---

### 3. GESTOR (Property Manager / Account Manager)

**Objetivo**: Gestionar cartera de propiedades asignadas, atender inquilinos, coordinar mantenimiento.

**Prioridad de funcionalidades**:
1. **Dashboard Operativo** (propiedades asignadas, tareas del día, alertas)
2. **Propiedades Asignadas** (edificios, unidades bajo su gestión)
3. **Inquilinos** (contacto frecuente, resolver incidencias)
4. **Incidencias y Mantenimiento** (coordinar técnicos, seguimiento)
5. **Tareas** (checklist diario)
6. **Calendario** (visitas, inspecciones, entregas llaves)
7. **Chat y Comunicaciones** (inquilinos, proveedores, equipo)
8. **Pagos Pendientes** (seguimiento de morosidad)
9. **Contratos** (renovaciones, avisos de vencimiento)
10. **Documentos** (subir facturas, certificados, fotos)
11. **Reportes** (generar informes para propietarios)
12. **Candidatos** (screening, visitas)

**Funcionalidades SECUNDARIAS**:
- Analytics avanzados (no toma decisiones estratégicas)
- Configuración (no tiene permisos admin)
- Finanzas complejas (solo ve pagos de su cartera)

---

### 4. OPERADOR (Técnico de Campo / Mantenimiento)

**Objetivo**: Completar órdenes de trabajo eficientemente, reportar estado.

**Prioridad de funcionalidades**:
1. **Órdenes del Día** (tareas asignadas HOY - crítico)
2. **Tareas Pendientes** (backlog)
3. **Incidencias Asignadas** (prioridad alta)
4. **Mantenimiento** (preventivo, correctivo)
5. **Check-in/Check-out** (registrar hora entrada/salida)
6. **Subir Fotos** (antes/después trabajos)
7. **Historial de Trabajos** (ver completados)
8. **Chat** (coordinación con gestor)
9. **Notificaciones** (nuevas asignaciones)
10. **Calendario** (agenda del día/semana)

**Funcionalidades NO ACCESIBLES**:
- Finanzas (no ve pagos)
- Contratos (no legal)
- Configuración (no admin)
- Analytics (no toma decisiones)
- Inquilinos (solo datos de contacto para acceso)

**UI Especial**:
- Botones GRANDES (uso en móvil en campo)
- Mapa de ubicaciones (optimizar rutas)
- Modo offline (seguir trabajando sin internet)

---

### 5. COMMUNITY_MANAGER (Gestor de Comunidad Co-Living)

**Objetivo**: Fomentar comunidad, organizar eventos, comunicación activa.

**Prioridad de funcionalidades**:
1. **Dashboard Comunidad** (actividad, engagement, próximos eventos)
2. **Residentes** (perfil, intereses, matching)
3. **Anuncios** (publicar novedades, recordatorios)
4. **Eventos** (crear, gestionar asistencia)
5. **Reservas Espacios Comunes** (sala reuniones, gym, terraza)
6. **Chat Comunitario** (moderación, engagement)
7. **Redes Sociales** (publicar contenido, viralizar)
8. **Votaciones** (decisiones comunitarias)
9. **Calendario** (agenda de actividades)
10. **Galerías** (fotos de eventos, vida comunitaria)

**Funcionalidades SECUNDARIAS**:
- Finanzas (no gestiona pagos)
- Contratos (no legal)
- Mantenimiento (solo reporta)

---

### 6. SOPORTE (Agente de Atención al Cliente)

**Objetivo**: Resolver tickets, responder consultas, escalación.

**Prioridad de funcionalidades**:
1. **Dashboard Soporte** (tickets pendientes, prioridad)
2. **Chat** (atención en vivo)
3. **Notificaciones** (alertas de nuevos tickets)
4. **Base de Conocimientos** (buscar soluciones)
5. **Historial de Tickets** (seguimiento)
6. **Usuarios** (ver datos de cliente para ayudar)
7. **Documentación** (manuales, FAQs)

**Funcionalidades NO ACCESIBLES**:
- Finanzas (datos sensibles)
- Configuración (no admin)
- Contratos (no editar)

---

## 🎨 NUEVA ORGANIZACIÓN PROPUESTA

### Principios de Diseño:
1. **Lo más usado ARRIBA, siempre visible**
2. **Agrupación lógica por flujo de trabajo**
3. **Colapsar lo secundario por defecto**
4. **Verticales solo visibles si activas en empresa**
5. **Herramientas horizontales agrupadas pero colapsadas**
6. **Favoritos al tope (user-customizable)**

---

## 📋 ESTRUCTURA POR PERFIL

### A. SUPER_ADMIN

```
⭐ Favoritos (si hay)

🏠 INICIO
├─ Dashboard Super Admin

🏢 GESTIÓN DE PLATAFORMA (expandido por defecto)
├─ Gestión de Clientes B2B
├─ Facturación B2B
├─ Planes y Módulos
├─ Métricas de Uso
├─ Salud del Sistema
├─ Seguridad y Logs
├─ Actividad de Sistema
├─ Alertas de Sistema

🔌 CONFIGURACIÓN AVANZADA (colapsado)
├─ Integraciones
├─ Portales Externos
├─ Partners y Aliados
├─ API Documentation
├─ Backup y Restauración
├─ Plantillas SMS
├─ Firma Digital Config
├─ OCR Import Config
├─ Marketplace Admin
├─ Integraciones Contables

⚙️ CONFIGURACIÓN EMPRESA (colapsado)
└─ [Mismos items que Administrador]
```

**Estado de secciones**:
- Gestión de Plataforma: **EXPANDIDO**
- Configuración Avanzada: COLAPSADO
- Resto: COLAPSADO

---

### B. ADMINISTRADOR

```
⭐ Favoritos (si hay)

🏠 INICIO
├─ Dashboard Principal
├─ Dashboard Adaptativo (IA personalizado)

📊 ANALYTICS E INTELIGENCIA (expandido por defecto)
├─ Business Intelligence
├─ Analytics
├─ Reportes
├─ Asistente IA

💰 FINANZAS (expandido por defecto)
├─ Pagos
├─ Gastos
├─ Facturación
├─ Presupuestos
├─ Contabilidad
├─ Open Banking

🏘️ VERTICAL: [ALQUILER TRADICIONAL] (expandido si activo)
├─ Propiedades / Edificios
├─ Unidades
├─ Garajes y Trasteros
├─ Inquilinos
├─ Contratos
├─ Candidatos
├─ Screening Inquilinos
├─ Valoraciones
├─ Inspecciones
├─ Certificaciones
├─ Seguros

🏖️ VERTICAL: [STR/AIRBNB] (colapsado, solo si activo)
├─ Dashboard STR
├─ Anuncios y Listados
├─ Reservas
├─ Channel Manager
├─ Pricing Dinámico
├─ Gestión de Reviews
├─ Housekeeping

🏘️ VERTICAL: [CO-LIVING] (colapsado, solo si activo)
├─ Room Rental
├─ Comunidad Social
├─ Reservas Espacios Comunes

🔨 VERTICAL: [FLIPPING] (colapsado, solo si activo)
├─ Dashboard Flipping
├─ Proyectos
├─ Calculadora ROI
├─ Comparador
├─ Timeline

🏗️ VERTICAL: [CONSTRUCCIÓN] (colapsado, solo si activo)
├─ Proyectos Construcción
├─ Gantt y Cronograma
├─ Control de Calidad
├─ Proveedores
├─ Órdenes de Trabajo

🏢 VERTICAL: [ADMIN FINCAS] (colapsado, solo si activo)
├─ Portal Admin Fincas
├─ Anuncios Comunidad
├─ Votaciones
├─ Reuniones y Actas
├─ Cuotas y Derramas
├─ Fondos de Reserva
├─ Finanzas Comunidad

⚙️ OPERACIONES (colapsado por defecto)
├─ Mantenimiento
├─ Tareas
├─ Incidencias
├─ Calendario
├─ Visitas y Showings

💬 COMUNICACIONES (colapsado)
├─ Chat
├─ Notificaciones
├─ SMS
├─ Redes Sociales

👥 CRM Y MARKETING (colapsado)
├─ CRM
├─ Portal Comercial
├─ Programa de Referidos
├─ Cupones
├─ Marketplace
├─ Galerías
├─ Tours Virtuales

📄 DOCUMENTOS Y LEGAL (colapsado)
├─ Documentos
├─ OCR Documentos
├─ Firma Digital
├─ Legal y Compliance
├─ Plantillas

⚡ AUTOMATIZACIÓN (colapsado)
├─ Automatización
├─ Workflows
├─ Recordatorios

🚀 INNOVACIÓN (colapsado)
├─ ESG & Sostenibilidad
├─ IoT & Smart Homes
├─ Blockchain
├─ Economía Circular

🎧 SOPORTE (colapsado)
├─ Soporte
├─ Base de Conocimientos
├─ Sugerencias

⚙️ CONFIGURACIÓN EMPRESA (colapsado)
├─ Configuración Empresa
├─ Usuarios y Permisos
├─ Módulos Activos
├─ Personalización (Branding)
├─ Aprobaciones
├─ Reportes Programados
├─ Importar Datos
├─ Legal y Cumplimiento
```

**Estado de secciones**:
- Inicio: VISIBLE (siempre)
- Analytics: **EXPANDIDO**
- Finanzas: **EXPANDIDO**
- Vertical principal: **EXPANDIDO** (según negocio)
- Resto verticales: COLAPSADO
- Operaciones: COLAPSADO
- Comunicaciones: COLAPSADO
- CRM: COLAPSADO
- Documentos: COLAPSADO
- Automatización: COLAPSADO
- Innovación: COLAPSADO
- Soporte: COLAPSADO
- Configuración: COLAPSADO

---

### C. GESTOR

```
⭐ Favoritos (si hay)

🏠 INICIO
├─ Dashboard Operativo

🏘️ MIS PROPIEDADES (expandido por defecto)
├─ Edificios Asignados
├─ Unidades Asignadas
├─ Inquilinos

🔧 OPERACIONES (expandido por defecto)
├─ Incidencias HOY
├─ Tareas Pendientes
├─ Mantenimiento
├─ Calendario
├─ Visitas

💬 COMUNICACIONES (expandido)
├─ Chat
├─ Notificaciones
├─ SMS

📄 GESTIÓN (colapsado)
├─ Contratos
├─ Candidatos
├─ Screening
├─ Documentos
├─ Pagos Pendientes

📊 REPORTES (colapsado)
├─ Reportes para Propietarios
├─ Historial de Trabajos

💰 FINANZAS (colapsado - solo lectura)
├─ Ver Pagos
├─ Ver Gastos

⚙️ MI PERFIL (colapsado)
├─ Ver Perfil
├─ Cambiar Contraseña
```

**Estado de secciones**:
- Mis Propiedades: **EXPANDIDO**
- Operaciones: **EXPANDIDO**
- Comunicaciones: **EXPANDIDO**
- Gestión: COLAPSADO
- Reportes: COLAPSADO
- Finanzas: COLAPSADO

---

### D. OPERADOR

```
⭐ Favoritos (si hay)

🏠 INICIO
├─ Dashboard Operador

📋 HOY (expandido por defecto)
├─ Órdenes del Día
├─ Tareas HOY
├─ Incidencias Urgentes
├─ Mi Calendario

🔧 TRABAJOS (expandido)
├─ Todas las Tareas
├─ Mantenimiento Asignado
├─ Historial de Trabajos

💬 COMUNICACIÓN (expandido)
├─ Chat con Gestor
├─ Notificaciones

📍 UBICACIONES (colapsado)
├─ Mapa de Propiedades
├─ Optimizar Rutas

📸 REPORTES (colapsado)
├─ Subir Fotos
├─ Check-in / Check-out
├─ Reporte de Horas

👤 MI PERFIL (colapsado)
├─ Ver Perfil
├─ Historial
```

**Estado de secciones**:
- HOY: **EXPANDIDO**
- Trabajos: **EXPANDIDO**
- Comunicación: **EXPANDIDO**
- Ubicaciones: COLAPSADO
- Reportes: COLAPSADO
- Mi Perfil: COLAPSADO

---

### E. COMMUNITY_MANAGER

```
⭐ Favoritos (si hay)

🏠 INICIO
├─ Dashboard Comunidad

👥 COMUNIDAD (expandido por defecto)
├─ Residentes
├─ Anuncios
├─ Eventos
├─ Reservas Espacios

💬 COMUNICACIÓN (expandido)
├─ Chat Comunitario
├─ Redes Sociales
├─ Notificaciones

🗳️ GESTIÓN (colapsado)
├─ Votaciones
├─ Calendario
├─ Galerías

📊 REPORTES (colapsado)
├─ Engagement
├─ Asistencia a Eventos

👤 MI PERFIL (colapsado)
├─ Ver Perfil
```

**Estado de secciones**:
- Comunidad: **EXPANDIDO**
- Comunicación: **EXPANDIDO**
- Gestión: COLAPSADO
- Reportes: COLAPSADO

---

### F. SOPORTE

```
⭐ Favoritos (si hay)

🏠 INICIO
├─ Dashboard Soporte

🎫 TICKETS (expandido por defecto)
├─ Tickets Pendientes
├─ Tickets En Progreso
├─ Tickets Resueltos

💬 COMUNICACIÓN (expandido)
├─ Chat en Vivo
├─ Notificaciones

📚 RECURSOS (expandido)
├─ Base de Conocimientos
├─ Documentación
├─ FAQs

👥 CLIENTES (colapsado - solo lectura)
├─ Ver Usuarios
├─ Historial de Cliente

📊 REPORTES (colapsado)
├─ Mis Estadísticas
├─ Tiempo de Resolución

👤 MI PERFIL (colapsado)
├─ Ver Perfil
```

**Estado de secciones**:
- Tickets: **EXPANDIDO**
- Comunicación: **EXPANDIDO**
- Recursos: **EXPANDIDO**
- Clientes: COLAPSADO
- Reportes: COLAPSADO

---

## 🎯 CAMBIOS CLAVE EN LA IMPLEMENTACIÓN

### 1. Estado Inicial de Secciones por Perfil

```typescript
// En sidebar.tsx, línea ~1108
const DEFAULT_EXPANDED_BY_ROLE = {
  super_admin: {
    superAdminPlatform: true,
    administradorEmpresa: false,
    // ... resto colapsado
  },
  administrador: {
    dashboard: true,
    analytics: true,
    finanzas: true,
    alquilerResidencial: true, // Si es su vertical principal
    operaciones: false,
    comunicaciones: false,
    // ... resto colapsado
  },
  gestor: {
    dashboard: true,
    misProppiedades: true,
    operaciones: true,
    comunicaciones: true,
    gestion: false,
    // ... resto colapsado
  },
  operador: {
    hoy: true,
    trabajos: true,
    comunicacion: true,
    // ... resto colapsado
  },
  community_manager: {
    comunidad: true,
    comunicacion: true,
    gestion: false,
  },
  soporte: {
    tickets: true,
    comunicacion: true,
    recursos: true,
  }
};
```

### 2. Detección de Vertical Principal

```typescript
// Detectar vertical principal de la empresa
const [primaryVertical, setPrimaryVertical] = useState<string | null>(null);

useEffect(() => {
  async function loadCompanyVertical() {
    const res = await fetch('/api/company/vertical');
    if (res.ok) {
      const { vertical } = await res.json();
      setPrimaryVertical(vertical);
    }
  }
  loadCompanyVertical();
}, []);

// Expandir automáticamente la vertical principal
useEffect(() => {
  if (primaryVertical && role === 'administrador') {
    setExpandedSections((prev) => ({
      ...prev,
      [primaryVertical]: true, // Expandir vertical principal
    }));
  }
}, [primaryVertical, role]);
```

### 3. Orden de Renderizado Priorizado

```typescript
// Orden de secciones según rol
const SECTION_ORDER_BY_ROLE = {
  super_admin: [
    'favorites',
    'dashboard',
    'superAdminPlatform',
    'administradorEmpresa',
    // ... resto
  ],
  administrador: [
    'favorites',
    'dashboard',
    'analytics',
    'finanzas',
    'verticalPrimaria', // Se inserta dinámicamente
    'operaciones',
    'comunicaciones',
    'crmMarketing',
    'documentosLegal',
    'automatizacion',
    'innovacion',
    'soporte',
    'administradorEmpresa',
  ],
  gestor: [
    'favorites',
    'dashboard',
    'misPropiedades',
    'operaciones',
    'comunicaciones',
    'gestion',
    'reportes',
    'finanzas',
  ],
  operador: [
    'favorites',
    'hoy',
    'trabajos',
    'comunicacion',
    'ubicaciones',
    'reportes',
    'miPerfil',
  ],
  // ... resto
};
```

### 4. Nomenclatura Optimizada por Rol

```typescript
// Adaptar nombres según rol
const SECTION_NAMES_BY_ROLE = {
  administrador: {
    alquilerResidencial: '🏘️ Mis Propiedades',
    operaciones: '⚙️ Operaciones',
  },
  gestor: {
    alquilerResidencial: '🏠 Mis Propiedades Asignadas',
    operaciones: '🔧 Operaciones del Día',
  },
  operador: {
    operaciones: '📋 Órdenes de Trabajo',
  },
};
```

### 5. Indicadores Visuales de Actividad

```tsx
// Mostrar badges con contadores
<button className="sidebar-section-header">
  <span>🔧 Operaciones</span>
  {pendingTasksCount > 0 && (
    <Badge variant="destructive">{pendingTasksCount}</Badge>
  )}
</button>
```

### 6. Quick Actions por Perfil

```tsx
// Botones de acción rápida según rol
const QUICK_ACTIONS_BY_ROLE = {
  administrador: [
    { label: 'Nueva Propiedad', href: '/propiedades/nueva', icon: Plus },
    { label: 'Nuevo Inquilino', href: '/inquilinos/nuevo', icon: UserPlus },
    { label: 'Ver Reportes', href: '/reportes', icon: FileBarChart },
  ],
  gestor: [
    { label: 'Nueva Tarea', href: '/tareas/nueva', icon: Plus },
    { label: 'Reportar Incidencia', href: '/incidencias/nueva', icon: AlertCircle },
    { label: 'Agendar Visita', href: '/visitas/nueva', icon: Calendar },
  ],
  operador: [
    { label: 'Check-in', href: '/operador/check-in', icon: Clock },
    { label: 'Subir Foto', href: '/operador/upload', icon: Camera },
    { label: 'Reportar Problema', href: '/incidencias/nueva', icon: AlertCircle },
  ],
};
```

---

## 📈 IMPACTO ESPERADO

### Métricas de Éxito:
1. **Time to Action**: Reducción del 40% en tiempo para encontrar funcionalidad
2. **Click Depth**: Reducción de 3-4 clicks a 1-2 clicks para acciones frecuentes
3. **User Satisfaction**: Aumento del 30% en NPS
4. **Feature Discovery**: Aumento del 25% en uso de features secundarias

### Testing:
- A/B test con 10% de usuarios durante 2 semanas
- Heatmaps de clicks en sidebar
- Session recordings para identificar friction points
- Encuesta post-cambio

---

## 🛠️ IMPLEMENTACIÓN

Ver archivo: `components/layout/sidebar-optimized.tsx` (nuevo)

**Pasos**:
1. Crear `sidebar-optimized.tsx` con nueva estructura
2. Migrar lógica de permisos y módulos activos
3. Implementar estado expandido por rol
4. Agregar detección de vertical principal
5. Testing con usuarios reales por perfil
6. Rollout gradual (10% → 50% → 100%)

**Rollback Plan**:
- Feature flag `use_optimized_sidebar` en config
- Si métricas empeoran >10%, rollback automático

---

## 📝 PRÓXIMOS PASOS

1. ✅ Documento de análisis completado
2. ⏳ Implementar `sidebar-optimized.tsx`
3. ⏳ Crear endpoint `/api/company/vertical`
4. ⏳ Testing con usuarios de cada perfil
5. ⏳ Documentar en Storybook
6. ⏳ Deploy a producción con feature flag

---

**Última actualización**: 4 de enero de 2026
**Autor**: Equipo de Producto Inmova
