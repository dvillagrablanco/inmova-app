# EVALUACIÓN INTUITIVIDAD Y EXPERIENCIA DE USUARIO - INMOVA
## Análisis Exhaustivo por Modelo de Negocio

**Fecha:** 3 de Diciembre 2025  
**Evaluador:** Perspectiva Multi-Cliente  
**Objetivo:** Identificar puntos de fricción y mejorar la autogestión

---

## 📊 RESUMEN EJECUTIVO

### ✅ Fortalezas Actuales
- **Onboarding Tour básico**: Implementado con 5 pasos claros
- **Dashboard centralizado**: KPIs visibles inmediatamente
- **Arquitectura modular**: 88 módulos permiten personalización
- **Responsive design**: Compatible con móviles y tablets
- **Ayuda contextual**: Componente `ContextualHelp` disponible

### ⚠️ Áreas Críticas de Mejora
1. **Onboarding genérico**: No se personaliza según modelo de negocio
2. **Falta de wizards guiados**: Procesos complejos sin asistentes paso a paso
3. **Sobrecarga de opciones**: 88 módulos pueden abrumar a usuarios nuevos
4. **Falta de datos de ejemplo**: Usuarios ven pantallas vacías al inicio
5. **Ausencia de tutoriales in-app**: No hay guías interactivas por funcionalidad
6. **Configuración inicial compleja**: Demasiados pasos manuales

---

## 1️⃣ ALQUILER TRADICIONAL (Modelo Base)

### 👤 Perfil de Usuario
- **Rol:** Gestor inmobiliario tradicional
- **Nivel técnico:** Medio-bajo
- **Expectativa:** Digitalizar gestión de alquileres de forma sencilla
- **Pain points:** Excel, emails desorganizados, cobros manuales

### 🎯 Flujo de Onboarding Actual

#### ✅ Lo que funciona bien:
```
1. Registro → Login automático → Dashboard
2. Tour de 5 pasos con navegación clara
3. Botones CTA destacados ("Crear Edificio", "Ver Unidades")
4. Progreso visual con barra de progreso
```

#### ❌ Puntos de fricción identificados:

**PROBLEMA 1: Tour Genérico No Personalizado**
```typescript
// Actual: Mismo tour para todos
const ONBOARDING_STEPS = [
  { id: 'welcome', title: '¡Bienvenido a INMOVA!' },
  { id: 'buildings', title: 'Crea tu primer edificio' },
  { id: 'units', title: 'Añade unidades' },
  { id: 'tenants', title: 'Gestiona inquilinos' },
  { id: 'dashboard', title: 'Tu Dashboard está listo' }
];
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Personalizado según modelo de negocio seleccionado en registro
const ONBOARDING_ALQUILER_TRADICIONAL = [
  { id: 'welcome', title: '¡Bienvenido! Vamos a configurar tu gestión de alquileres' },
  { id: 'import', title: 'Paso 1: ¿Tienes datos existentes?', 
    options: ['Importar desde Excel', 'Empezar desde cero'] },
  { id: 'buildings', title: 'Paso 2: Crea tu primera propiedad',
    wizard: true, // Wizard paso a paso
    demo: true // Mostrar datos de ejemplo
  },
  { id: 'contracts', title: 'Paso 3: Crea tu primer contrato',
    template: 'Usa plantilla predefinida' },
  { id: 'payments', title: 'Paso 4: Configura cobros automáticos',
    integrations: ['Stripe', 'Transferencia', 'Efectivo'] },
  { id: 'dashboard', title: '¡Listo! Tu panel ya está funcionando',
    nextSteps: ['Invitar inquilinos', 'Configurar recordatorios'] }
];
```

**PROBLEMA 2: Primera Experiencia con Pantallas Vacías**
```
Usuario completa tour → Llega al Dashboard → Ve 0 propiedades, 0 inquilinos
❌ Sensación de "¿Y ahora qué hago?"
```

**SOLUCIÓN PROPUESTA:**
- **Modo demo automático**: Crear propiedad de ejemplo al completar registro
- **Empty states con CTAs claros**:
```typescript
<EmptyState
  icon={Building2}
  title="Aún no tienes propiedades"
  description="Crea tu primera propiedad en menos de 2 minutos"
  actions={[
    { label: 'Crear propiedad', variant: 'primary', wizard: true },
    { label: 'Importar desde Excel', variant: 'secondary' },
    { label: 'Ver tutorial (1 min)', variant: 'ghost', video: true }
  ]}
/>
```

**PROBLEMA 3: Formularios Largos Sin Ayuda Contextual**
```
Formulario "Crear Edificio" tiene 15+ campos
❌ Usuario no sabe cuáles son obligatorios
❌ No hay tooltips explicativos
❌ No se puede guardar como borrador
```

**SOLUCIÓN PROPUESTA:**
- **Formulario progresivo** (mostrar campos avanzados solo si se necesitan)
- **Validación en tiempo real** con mensajes claros
- **Autoguardado** como borrador cada 30 segundos
- **Tooltips en todos los campos no evidentes**

---

## 2️⃣ ALQUILER POR HABITACIONES (Coliving / Room Rental)

### 👤 Perfil de Usuario
- **Rol:** Gestor de pisos compartidos / Coliving
- **Nivel técnico:** Medio
- **Expectativa:** Gestionar múltiples inquilinos en una misma vivienda
- **Pain points:** Prorrateo de suministros, rotación alta, convivencia

### 🎯 Evaluación de Intuitividad

#### ✅ Lo que funciona bien:
```
✓ Página dedicada: /room-rental
✓ KPIs específicos: Tasa ocupación, ingresos por habitación
✓ Vista clara de habitaciones disponibles/ocupadas
```

#### ❌ Puntos de fricción identificados:

**PROBLEMA 1: No hay Wizard de Configuración Inicial**
```
Usuario accede a /room-rental → Ve lista vacía
❌ No hay guía para:
  - Crear vivienda multi-habitación
  - Definir habitaciones
  - Configurar precios por habitación
  - Configurar prorrateo automático de gastos
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Wizard de configuración al acceder por primera vez
const ROOM_RENTAL_WIZARD = [
  {
    step: 1,
    title: 'Crea tu vivienda compartida',
    fields: ['direccion', 'numHabitaciones', 'zonasComunesCompartidas']
  },
  {
    step: 2,
    title: 'Define cada habitación',
    dynamic: true, // Repite por cada habitación
    fields: ['nombreHabitacion', 'precioMensual', 'caracteristicas']
  },
  {
    step: 3,
    title: 'Configura prorrateo de gastos',
    fields: ['tipoReparto', 'gastosIncluidos', 'facturacionIndividual']
  },
  {
    step: 4,
    title: 'Normas de convivencia',
    template: true, // Plantilla predefinida
    fields: ['normasConvivencia', 'documentoDigital']
  }
];
```

**PROBLEMA 2: Prorrateo de Gastos No Es Intuitivo**
```
Actual: Usuario debe calcular manualmente % de cada inquilino
❌ No hay calculadora automática
❌ No se explica cómo funciona el prorrateo
```

**SOLUCIÓN PROPUESTA:**
- **Calculadora visual interactiva**:
```
┌─────────────────────────────────────┐
│ FACTURA ELECTRICIDAD: 150€          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Habitación 1 (Juan): 30€ (20%)  │ │
│ │ Habitación 2 (María): 45€ (30%) │ │
│ │ Habitación 3 (Pedro): 37.5€(25%)│ │
│ │ Habitación 4 (Ana): 37.5€ (25%) │ │
│ │ Total: 150€ ✓                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Repartir por igual] [Por % custom] │
└─────────────────────────────────────┘
```

**PROBLEMA 3: Gestión de Convivencia Poco Visible**
```
Actual: No hay sección clara para:
  - Reportar incidencias entre inquilinos
  - Sistema de votaciones para decisiones comunes
  - Chat grupal de la vivienda
```

**SOLUCIÓN PROPUESTA:**
- **Tab "Convivencia" en cada vivienda compartida**
- **Sistema de votaciones simple** para decisiones comunes
- **Chat grupal integrado** (ya existe /chat, pero debe destacarse)

---

## 3️⃣ ALQUILER VACACIONAL (STR - Short-Term Rentals)

### 👤 Perfil de Usuario
- **Rol:** Anfitrión de Airbnb/Booking
- **Nivel técnico:** Alto (familiarizado con OTAs)
- **Expectativa:** Centralizar gestión multi-canal, automatizar precios
- **Pain points:** Sincronización calendarios, precios dinámicos, reviews

### 🎯 Evaluación de Intuitividad

#### ✅ Lo que funciona bien:
```
✓ Dashboard STR dedicado: /str
✓ Tabs claros: Anuncios / Reservas / Canales
✓ KPIs específicos: RevPAR, ADR, Tasa ocupación
✓ Gráficos de ingresos por mes y canal
```

#### ❌ Puntos de fricción identificados:

**PROBLEMA 1: Onboarding STR No Diferenciado**
```
Usuario con experiencia en Airbnb registra en INMOVA
❌ No se pregunta si ya tiene anuncios activos
❌ No hay opción "Importar desde Airbnb/Booking"
❌ Debe recrear todo manualmente
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Durante registro, detectar si usuario selecciona STR
const STR_ONBOARDING = [
  {
    step: 1,
    title: '¿Ya tienes anuncios en otras plataformas?',
    options: [
      { label: 'Sí, en Airbnb', action: 'import_airbnb' },
      { label: 'Sí, en Booking', action: 'import_booking' },
      { label: 'En varias plataformas', action: 'import_multi' },
      { label: 'No, empiezo desde cero', action: 'wizard_nuevo' }
    ]
  },
  {
    step: 2,
    title: 'Conecta tus cuentas',
    integrations: ['Airbnb API', 'Booking API', 'Expedia', 'VRBO'],
    oauth: true
  },
  {
    step: 3,
    title: 'Importando tus anuncios...',
    loading: true,
    preview: 'Mostrar lista de anuncios detectados'
  },
  {
    step: 4,
    title: 'Activa precios dinámicos',
    features: ['Pricing automático', 'Reglas por temporada', 'Descuentos largo plazo']
  }
];
```

**PROBLEMA 2: Configuración de Channel Manager Compleja**
```
Actual: Usuario debe:
  1. Ir a /str/channels
  2. Buscar en lista de 20+ canales
  3. Configurar OAuth manualmente
  4. No hay feedback claro si sincronización funciona
```

**SOLUCIÓN PROPUESTA:**
- **Wizard de conexión guiado**:
```typescript
<ChannelConnectionWizard>
  <Step1 title="Selecciona tus canales principales">
    <PopularChannels featured={['Airbnb', 'Booking', 'Expedia']} />
  </Step1>
  <Step2 title="Conecta con OAuth">
    <OAuthFlow channel={selectedChannel} />
  </Step2>
  <Step3 title="Prueba de sincronización">
    <TestSync realTime={true} />
  </Step3>
  <Step4 title="¡Sincronización activa!">
    <LiveStatus calendars={synced} />
  </Step4>
</ChannelConnectionWizard>
```

**PROBLEMA 3: Precios Dinámicos No Son Autoexplicativos**
```
Actual: /str/pricing existe pero:
  ❌ No hay tutorial de cómo funciona
  ❌ No hay templates predefinidos ("Temporada alta +30%")
  ❌ Usuario no entiende diferencia entre RevPAR y ADR
```

**SOLUCIÓN PROPUESTA:**
- **Templates de pricing predefinidos**:
```
┌─────────────────────────────────────┐
│ ESTRATEGIAS DE PRECIO              │
├─────────────────────────────────────┤
│ ○ Conservadora (+10% temporada alta)│
│ ● Moderada (+20-30% picos demanda)  │
│ ○ Agresiva (+50% eventos especiales)│
│                                     │
│ ✓ Descuento largo plazo automático │
│ ✓ Ajuste por ocupación competencia │
│ ✓ Last-minute pricing              │
└─────────────────────────────────────┘
```

**PROBLEMA 4: Gestión de Reviews Dispersa**
```
Actual: Reviews en /reviews pero:
  ❌ No se agrupan por canal
  ❌ No hay alertas de reviews negativas
  ❌ No hay templates de respuesta
```

**SOLUCIÓN PROPUESTA:**
- **Dashboard de reputación unificado**
- **Alertas push para reviews < 4 estrellas**
- **Templates de respuesta por idioma**

---

## 4️⃣ HOUSE FLIPPING

### 👤 Perfil de Usuario
- **Rol:** Inversor inmobiliario
- **Nivel técnico:** Alto (familiarizado con análisis financiero)
- **Expectativa:** ROI claro, seguimiento de costes, timelines
- **Pain points:** Sobrecostes, retrasos, falta visibilidad financiera

### 🎯 Evaluación de Intuitividad

#### ✅ Lo que funciona bien:
```
✓ Módulo dedicado: /flipping
✓ Análisis de deal: ROI, TIR, payback
✓ Seguimiento de costes por categoría
```

#### ❌ Puntos de fricción identificados:

**PROBLEMA 1: Creación de Proyecto No Es Guiada**
```
Actual: Formulario libre con 30+ campos
❌ Usuario no sabe qué datos son críticos
❌ No hay validación de viabilidad financiera en tiempo real
❌ No se sugieren benchmarks de mercado
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Wizard con validación progresiva
const FLIPPING_PROJECT_WIZARD = [
  {
    step: 1,
    title: 'Datos básicos de la propiedad',
    fields: ['direccion', 'precioCompra', 'm2', 'estado'],
    validation: 'Comparar precio/m² con mercado'
  },
  {
    step: 2,
    title: 'Presupuesto de reforma',
    categories: ['Estructura', 'Instalaciones', 'Acabados', 'Licencias'],
    benchmarks: 'Mostrar €/m² típicos por categoría',
    calculator: true
  },
  {
    step: 3,
    title: 'Proyección de venta',
    fields: ['precioVentaObjetivo', 'plazoPrevisto'],
    realTimeROI: true, // Mostrar ROI mientras escribe
    alerts: ['ROI < 15%: ⚠️ Margen bajo', 'Plazo > 12 meses: ⚠️ Alto riesgo']
  },
  {
    step: 4,
    title: 'Financiación',
    options: ['Capital propio', 'Hipoteca', 'Inversores', 'Mixto'],
    calculator: 'Calcular TIR según financiación'
  },
  {
    step: 5,
    title: 'Resumen financiero',
    preview: {
      inversionTotal: 200000,
      roi: 25.5,
      tir: 18.2,
      payback: '8 meses',
      alert: '✓ Proyecto viable'
    }
  }
];
```

**PROBLEMA 2: Seguimiento de Obra No Es Visual**
```
Actual: Lista de tareas/gastos
❌ No hay timeline visual (Gantt)
❌ No hay fotos "antes/durante/después"
❌ No se comparan costes reales vs presupuestados
```

**SOLUCIÓN PROPUESTA:**
- **Vista Gantt con % completado**
- **Galería de fotos con comparativa temporal**
- **Dashboard de desviaciones** (real vs budget)

**PROBLEMA 3: No Hay Alertas Proactivas**
```
Actual: Usuario debe revisar manualmente
❌ No se alerta si proyecto va retrasado
❌ No se alerta si costes superan presupuesto
❌ No se sugieren acciones correctivas
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Sistema de alertas inteligente
const FLIPPING_ALERTS = [
  {
    type: 'budget_overrun',
    trigger: 'costes_reales > presupuesto * 1.1',
    severity: 'high',
    action: 'Revisar proveedores alternativos',
    notification: 'push + email'
  },
  {
    type: 'timeline_delay',
    trigger: 'dias_transcurridos > plazo_previsto * 0.8 && %_completado < 60',
    severity: 'medium',
    action: 'Acelerar obra crítica',
    notification: 'push'
  },
  {
    type: 'market_change',
    trigger: 'precio_venta_estimado < precio_objetivo * 0.95',
    severity: 'high',
    action: 'Reevaluar estrategia venta',
    notification: 'email semanal'
  }
];
```

---

## 5️⃣ CONSTRUCCIÓN Y DESARROLLO

### 👤 Perfil de Usuario
- **Rol:** Promotor inmobiliario
- **Nivel técnico:** Alto
- **Expectativa:** Gestión completa de obra nueva
- **Pain points:** Coordinación múltiples actores, licencias, viabilidad

### 🎯 Evaluación de Intuitividad

#### ✅ Lo que funciona bien:
```
✓ Módulo robusto: /construction
✓ Gestión de permisos y licencias
✓ Seguimiento de fases de obra
```

#### ❌ Puntos de fricción identificados:

**PROBLEMA 1: Gestión de Permisos Compleja**
```
Actual: Usuario debe saber qué licencias necesita
❌ No hay checklist automático según tipo obra
❌ No hay recordatorios de plazos de licencias
❌ No se integra con registro de gestorías
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Asistente de permisos inteligente
const PERMITS_ASSISTANT = {
  detectProjectType: (data) => {
    // Analiza: tipo obra, m², ubicación
    return 'obra_nueva_residencial';
  },
  generateChecklist: (projectType) => [
    { permit: 'Licencia urbanística', plazo: '3 meses', estado: 'pendiente' },
    { permit: 'Estudio geotécnico', plazo: '1 mes', estado: 'pendiente' },
    { permit: 'Proyecto básico visado', plazo: '2 meses', estado: 'pendiente' },
    { permit: 'Licencia obras', plazo: '2 meses', estado: 'pendiente' },
    { permit: 'Seguro decenal', plazo: '1 mes', estado: 'pendiente' }
  ],
  alerts: {
    expiring: 'Licencia X caduca en 30 días',
    blocking: 'No puedes avanzar sin Permiso Y'
  }
};
```

**PROBLEMA 2: Coordinación de Agentes No Centralizada**
```
Actual: Listado de contactos disperso
❌ No hay vista Kanban de tareas por agente
❌ No hay chat directo con arquitecto/aparejador
❌ No se registran hitos críticos
```

**SOLUCIÓN PROPUESTA:**
- **Vista "War Room" del proyecto**:
```
┌───────────────────────────────────────────────────────────┐
│ PROYECTO: Residencial Los Olivos                         │
├───────────────────────────────────────────────────────────┤
│ AGENTES:                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │Arquitecto│ │Aparejador│ │Constructor│ │Gestoría │   │
│ │  🟢 5    │ │  🟡 2    │ │  🔴 1     │ │  🟢 0   │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│ HITOS CRÍTICOS:                                         │
│ ✓ Licencia urbanística aprobada (15/11)                │
│ ⏳ Finalizar proyecto ejecutivo (⏰ en 5 días)          │
│ ⏱️ Inicio obra previsto: 01/01/2026                     │
└───────────────────────────────────────────────────────────┘
```

**PROBLEMA 3: Viabilidad Financiera No Se Recalcula**
```
Actual: Análisis de viabilidad inicial
❌ No se actualiza automáticamente si costes cambian
❌ No se compara con mercado en tiempo real
❌ No hay simulación de escenarios
```

**SOLUCIÓN PROPUESTA:**
- **Dashboard de viabilidad dinámica**
- **Integración con APIs de precios de mercado**
- **Simulador de escenarios** (optimista/realista/pesimista)

---

## 6️⃣ SERVICIOS PROFESIONALES

### 👤 Perfil de Usuario
- **Rol:** Arquitecto / Ingeniero / Asesor
- **Nivel técnico:** Alto
- **Expectativa:** Facturación por horas, gestión de proyectos cliente
- **Pain points:** Time tracking, facturación recurrente, portafolio

### 🎯 Evaluación de Intuitividad

#### ✅ Lo que funciona bien:
```
✓ Módulo dedicado: /professional
✓ Facturación por horas
✓ Gestión de proyectos cliente
```

#### ❌ Puntos de fricción identificados:

**PROBLEMA 1: Time Tracking No Integrado**
```
Actual: Registro manual de horas
❌ No hay timer integrado
❌ No se sugieren horas según tipo tarea
❌ No hay app móvil para registrar sobre la marcha
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Timer integrado en cada tarea
<TaskCard>
  <Timer 
    project="Reforma Vivienda Cliente X"
    task="Revisión planos"
    onStart={() => trackTime()}
    onStop={(duration) => saveTimeEntry(duration)}
    suggestions={[
      'Reunión cliente: ~1h',
      'Diseño inicial: ~4h',
      'Revisión normativa: ~2h'
    ]}
  />
</TaskCard>
```

**PROBLEMA 2: Facturación Recurrente No Automatizada**
```
Actual: Usuario crea factura manualmente cada mes
❌ No hay plantillas de facturación recurrente
❌ No se envía automáticamente al cliente
❌ No hay recordatorios de pago
```

**SOLUCIÓN PROPUESTA:**
- **Configurar "Facturación automática mensual"**
- **Templates personalizables por cliente**
- **Envío automático + recordatorios programados**

**PROBLEMA 3: Portfolio de Proyectos No Visible**
```
Actual: Lista interna de proyectos
❌ No hay portfolio público compartible
❌ No se pueden añadir fotos/renders
❌ No hay testimonios de clientes
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Generador de portfolio público
<PortfolioBuilder>
  <PublicURL slug="arquitecto-juan-perez" />
  <Projects selectable={completedProjects}>
    <ProjectCard 
      title="Reforma integral Barcelona"
      images={[before, after, render]}
      client="Cliente X" // Opcional anonimizar
      testimonial="Excelente trabajo, superó expectativas"
    />
  </Projects>
  <ContactForm embedded={true} />
  <SEO optimized={true} />
</PortfolioBuilder>
```

---

## 7️⃣ GESTIÓN DE COMUNIDADES

### 👤 Perfil de Usuario
- **Rol:** Administrador de fincas
- **Nivel técnico:** Medio
- **Expectativa:** Gestión de copropietarios, juntas, derramas
- **Pain points:** Convocatorias, votaciones, morosidad comunidad

### 🎯 Evaluación de Intuitividad

#### ✅ Lo que funciona bien:
```
✓ Gestión de votaciones: /votaciones
✓ Reserva de espacios comunes: /reservas
✓ Sistema de reuniones: /reuniones
```

#### ❌ Puntos de fricción identificados:

**PROBLEMA 1: Convocatorias de Junta No Automatizadas**
```
Actual: Usuario debe:
  1. Crear reunión manualmente
  2. Redactar orden del día
  3. Enviar emails manualmente
❌ No hay plantilla legal automática
❌ No se calcula quórum automáticamente
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Asistente de convocatoria de junta
const JUNTA_WIZARD = [
  {
    step: 1,
    title: 'Tipo de junta',
    options: ['Ordinaria', 'Extraordinaria', 'Universal'],
    autoFill: {
      ordinaria: { plazo: '15 días', plantilla: 'Orden día estándar' },
      extraordinaria: { plazo: '5 días', asunto: 'requerido' }
    }
  },
  {
    step: 2,
    title: 'Orden del día',
    template: [
      '1. Lectura y aprobación acta anterior',
      '2. Estado de cuentas',
      '3. Aprobación presupuesto',
      '4. Ruegos y preguntas'
    ],
    editable: true
  },
  {
    step: 3,
    title: 'Confirmación legal',
    preview: 'Vista previa convocatoria',
    legalCheck: '✓ Cumple Ley Propiedad Horizontal',
    actions: [
      'Enviar por email certificado',
      'Imprimir para buzones',
      'Publicar en tablón anuncios'
    ]
  }
];
```

**PROBLEMA 2: Sistema de Votaciones Poco Intuitivo**
```
Actual: /votaciones existe pero:
  ❌ No hay votación electrónica
  ❌ No se calcula mayorías automáticamente
  ❌ No se guarda como acta oficial
```

**SOLUCIÓN PROPUESTA:**
- **Votación en tiempo real durante junta**
- **App móvil para votar remotamente**
- **Cálculo automático mayorías** (simple/cualificada/unanimidad)
- **Generación automática de acta** con resultados

**PROBLEMA 3: Gestión de Derramas Compleja**
```
Actual: Usuario debe calcular % de cada propietario
❌ No se integra con coeficientes de propiedad
❌ No hay recordatorios de pago de derrama
❌ No se marca quién pagó y quién no
```

**SOLUCIÓN PROPUESTA:**
```typescript
// Calculadora automática de derramas
<DerramaCalculator>
  <Input label="Gasto total" value={15000} />
  <Input label="Concepto" value="Reparación fachada" />
  
  <AutoDistribution>
    {copropietarios.map(c => (
      <CopropietarioCard
        nombre={c.nombre}
        coeficiente={c.coeficiente}
        cuotaDerrama={15000 * (c.coeficiente / 100)}
        estado={c.pagado ? 'Pagado' : 'Pendiente'}
        recordatorio={!c.pagado && 'Enviar recordatorio'}
      />
    ))}
  </AutoDistribution>
  
  <Actions>
    <Button>Generar recibos individuales</Button>
    <Button>Enviar por email a todos</Button>
    <Button>Marcar pagos recibidos</Button>
  </Actions>
</DerramaCalculator>
```

---

## 🎯 RECOMENDACIONES GENERALES DE UX

### 1. Sistema de Onboarding Adaptativo

**IMPLEMENTAR:**
```typescript
// Durante registro, preguntar modelo de negocio
interface UserOnboarding {
  modeloNegocio: 'alquiler_tradicional' | 'room_rental' | 'str' | 'flipping' | 'construccion' | 'profesional' | 'comunidades';
  nivelExperiencia: 'principiante' | 'intermedio' | 'experto';
  objetivoPrincipal: string;
  tienesDatosExistentes: boolean;
}

// Generar tour personalizado
function generateOnboarding(user: UserOnboarding) {
  const steps = [];
  
  // Paso 1: Bienvenida personalizada
  steps.push({
    title: `¡Bienvenido! Vamos a configurar tu sistema de ${user.modeloNegocio}`,
    icon: getIconByModel(user.modeloNegocio)
  });
  
  // Paso 2: Importar datos o empezar desde cero
  if (user.tienesDatosExistentes) {
    steps.push({
      title: 'Importa tus datos existentes',
      actions: ['Excel', 'CSV', 'API externa']
    });
  } else {
    steps.push({
      title: '¿Quieres empezar con datos de ejemplo?',
      demo: true
    });
  }
  
  // Pasos 3-N: Específicos por modelo
  steps.push(...getModelSpecificSteps(user.modeloNegocio));
  
  // Último paso: Activar módulos recomendados
  steps.push({
    title: 'Activa módulos recomendados para ti',
    modules: getRecommendedModules(user)
  });
  
  return steps;
}
```

### 2. Wizards Guiados para Procesos Complejos

**CREAR WIZARDS PARA:**
- ✅ Crear primera propiedad
- ✅ Configurar prorrateo de gastos (room rental)
- ✅ Conectar Channel Manager (STR)
- ✅ Crear proyecto flipping con análisis ROI
- ✅ Gestionar permisos de obra (construcción)
- ✅ Configurar facturación recurrente (profesional)
- ✅ Convocar junta de propietarios (comunidades)

**CARACTERÍSTICAS DE WIZARDS:**
```typescript
interface WizardComponent {
  steps: WizardStep[];
  validation: 'progressive'; // Validar cada paso antes de continuar
  autoSave: true; // Guardar como borrador cada 30s
  progress: 'visual'; // Barra de progreso
  navigation: 'flexible'; // Permitir volver atrás
  help: {
    contextual: true, // Tooltips en cada campo
    video: string, // Tutorial en video opcional
    chat: true // Soporte chat integrado
  };
}
```

### 3. Empty States con CTAs Claros

**ANTES:**
```tsx
// ❌ No intuitivo
<div>No tienes propiedades</div>
```

**DESPUÉS:**
```tsx
// ✅ Intuitivo y accionable
<EmptyState
  icon={Building2}
  title="Aún no tienes propiedades"
  description="Crea tu primera propiedad en menos de 2 minutos"
  illustration={<PropertyIllustration />}
  actions={[
    { 
      label: 'Crear propiedad',
      variant: 'primary',
      icon: Plus,
      wizard: true,
      onClick: () => openWizard('crear-propiedad')
    },
    { 
      label: 'Importar desde Excel',
      variant: 'secondary',
      icon: Upload,
      onClick: () => openImportDialog()
    },
    { 
      label: 'Ver tutorial (1 min)',
      variant: 'ghost',
      icon: Play,
      onClick: () => openVideo('tutorial-propiedades')
    }
  ]}
  helpText="¿Necesitas ayuda? Chatea con nosotros"
  chatSupport={true}
/>
```

### 4. Modo Demo / Datos de Ejemplo

**IMPLEMENTAR:**
```typescript
// Al completar onboarding, ofrecer modo demo
const DEMO_DATA = {
  alquiler_tradicional: {
    edificios: 2,
    unidades: 5,
    inquilinos: 4,
    contratos: 4,
    pagos: 12 // últimos 12 meses
  },
  str: {
    anuncios: 3,
    reservas: 25,
    canales: ['Airbnb', 'Booking'],
    reviews: 15
  }
  // ... otros modelos
};

function seedDemoData(userId: string, modelo: string) {
  const data = DEMO_DATA[modelo];
  // Crear datos de ejemplo en BD con flag isDemoData: true
  // Mostrar banner: "Estás viendo datos de ejemplo. Bórralos cuando añadas los tuyos"
}
```

### 5. Tutoriales In-App Contextuales

**IMPLEMENTAR:**
```typescript
// Componente ContextualHelp mejorado
<ContextualHelp
  topic="prorrateo-gastos"
  trigger="hover" // o 'click', 'auto'
  content={{
    title: '¿Cómo funciona el prorrateo de gastos?',
    description: 'Explicación breve en 2-3 líneas',
    video: 'https://youtu.be/tutorial-prorrateo',
    article: '/docs/prorrateo-gastos',
    examples: [
      'Factura luz 150€ → Reparto por igual: 37.5€/habitación',
      'Factura agua → Reparto por % personalizado'
    ]
  }}
  position="right"
  persistent={false} // No mostrar si usuario ya lo vio 3 veces
/>
```

### 6. Feedback Visual Inmediato

**IMPLEMENTAR:**
```typescript
// Validación en tiempo real
<Input
  label="Precio de venta objetivo"
  value={precioVenta}
  onChange={(val) => {
    setPrecioVenta(val);
    // Calcular ROI en tiempo real
    const roi = calculateROI(precioCompra, costesReforma, val);
    if (roi < 15) {
      showWarning('⚠️ ROI bajo. Considera aumentar precio venta o reducir costes');
    } else if (roi > 30) {
      showSuccess('✓ Excelente ROI. Proyecto muy rentable');
    }
  }}
  realTimeFeedback={true}
/>
```

### 7. Búsqueda Global Inteligente

**MEJORAR:**
```typescript
// Búsqueda actual es básica, mejorar con:
const SEARCH_ENHANCEMENTS = {
  fuzzyMatch: true, // "inkuilino" → "inquilino"
  suggestions: true, // Sugerir mientras escribe
  scopes: ['Todas', 'Propiedades', 'Inquilinos', 'Contratos', 'Pagos'],
  shortcuts: {
    '@': 'Buscar por nombre',
    '#': 'Buscar por ID',
    '$': 'Buscar por importe',
    '/': 'Ir a página'
  },
  recent: 'Mostrar búsquedas recientes',
  actions: 'Acciones directas desde resultados'
};
```

### 8. Acciones Masivas Simplificadas

**IMPLEMENTAR:**
```typescript
// En listados, permitir selección múltiple
<DataTable
  data={inquilinos}
  selectable={true}
  bulkActions={[
    { label: 'Enviar recordatorio', icon: Mail, action: sendReminder },
    { label: 'Exportar seleccionados', icon: Download, action: exportSelected },
    { label: 'Cambiar estado', icon: Edit, action: bulkChangeStatus }
  ]}
  quickFilters={[
    { label: 'Con pagos pendientes', filter: (i) => i.pagosPendientes > 0 },
    { label: 'Contratos vencen en 30 días', filter: (i) => daysToExpire(i.contrato) <= 30 }
  ]}
/>
```

### 9. Notificaciones Inteligentes y No Invasivas

**IMPLEMENTAR:**
```typescript
// Sistema de notificaciones mejorado
const NOTIFICATION_SETTINGS = {
  channels: ['push', 'email', 'sms', 'in-app'],
  frequency: {
    critical: 'instant', // Pagos fallidos, alertas urgentes
    important: 'daily', // Resumen diario
    info: 'weekly' // Newsletter semanal
  },
  digest: true, // Agrupar notificaciones similares
  mute: {
    hours: [22, 7], // No molestar de 22h a 7h
    weekends: false
  },
  preferences: {
    user: 'Permitir usuario configurar por tipo notificación'
  }
};
```

### 10. Tooltips y Ayuda Contextual Omnipresente

**IMPLEMENTAR:**
```typescript
// En todos los formularios
<FormField
  label="Coeficiente de propiedad"
  tooltip={{
    content: 'Porcentaje de participación en gastos comunes según escrituras',
    example: 'Ej: Piso 1º = 5.25%, Piso 2º = 4.80%',
    link: '/docs/coeficiente-propiedad'
  }}
  helpIcon={<HelpCircle size={16} />}
  hoverDelay={500}
/>
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN PRIORITARIO

### FASE 1: Quick Wins (1-2 semanas)
1. ✅ **Onboarding personalizado por modelo**
2. ✅ **Empty states con CTAs claros**
3. ✅ **Tooltips en todos los formularios**
4. ✅ **Modo demo con datos de ejemplo**

### FASE 2: Wizards Críticos (2-3 semanas)
5. ✅ **Wizard creación propiedad**
6. ✅ **Wizard configuración STR**
7. ✅ **Wizard proyecto flipping**
8. ✅ **Wizard convocatoria junta**

### FASE 3: Automatizaciones (3-4 semanas)
9. ✅ **Calculadoras automáticas** (prorrateo, ROI, derramas)
10. ✅ **Validación en tiempo real**
11. ✅ **Alertas proactivas**
12. ✅ **Importación de datos externos**

### FASE 4: Experiencia Avanzada (4-6 semanas)
13. ✅ **Tutoriales in-app interactivos**
14. ✅ **Búsqueda global inteligente**
15. ✅ **Acciones masivas**
16. ✅ **Portfolio público (profesionales)**

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs de Intuitividad
```typescript
const UX_METRICS = {
  onboarding: {
    completionRate: '> 80%', // % usuarios que completan onboarding
    timeToFirstValue: '< 10 min', // Tiempo hasta primera propiedad creada
    dropOffPoint: 'Identificar dónde abandonan'
  },
  adoption: {
    activeModules: '> 5', // Promedio módulos usados por usuario
    dailyActiveUsers: '+30%', // Incremento usuarios activos diarios
    featureDiscovery: '> 70%' // % usuarios que descubren funcionalidad clave
  },
  satisfaction: {
    nps: '> 50', // Net Promoter Score
    taskSuccessRate: '> 90%', // % tareas completadas con éxito
    supportTickets: '-40%' // Reducción tickets soporte
  },
  efficiency: {
    timeOnTask: '-30%', // Reducción tiempo para completar tarea
    errorRate: '< 5%', // % errores usuario (validación)
    retentionRate: '> 85%' // Retención a 30 días
  }
};
```

---

## 🎨 PRINCIPIOS DE DISEÑO UX INMOVA

### 1. **Claridad sobre Complejidad**
- Mostrar solo lo esencial, ocultar lo avanzado
- Usar lenguaje claro, evitar jerga técnica
- Iconos + texto siempre

### 2. **Guiado sobre Libre**
- Wizards para procesos complejos
- Templates predefinidos
- Sugerencias inteligentes

### 3. **Visual sobre Textual**
- Gráficos antes que tablas
- Colores para estados (verde=ok, rojo=alerta)
- Iconos reconocibles

### 4. **Anticipar sobre Reaccionar**
- Validación en tiempo real
- Alertas proactivas
- Autocompletado inteligente

### 5. **Flexible sobre Rígido**
- Permitir personalización
- Atajos de teclado
- Vistas múltiples (lista/grid/calendario)

### 6. **Accesible sobre Exclusivo**
- Responsive mobile-first
- Alto contraste
- Teclado-navegable

---

## 📱 CONSIDERACIONES MOBILE

### Flujos Optimizados para Móvil
```typescript
const MOBILE_OPTIMIZATIONS = {
  navigation: {
    bottomNav: true, // Barra inferior en lugar de sidebar
    swipeGestures: true, // Deslizar entre secciones
    hapticFeedback: true // Vibración al completar acción
  },
  forms: {
    stepByStep: true, // Un campo por pantalla
    autoAdvance: true, // Pasar automáticamente al siguiente campo
    voiceInput: true, // Dictado de voz
    smartDefaults: true // Autocompletado basado en ubicación
  },
  actions: {
    quickActions: true, // Botón flotante con acciones frecuentes
    contextMenu: 'long-press', // Menú contextual al mantener pulsado
    camera: true // Escanear documentos con cámara
  }
};
```

---

## 🎓 PROGRAMA DE FORMACIÓN CONTINUA

### Tooltips Educativos
- **Primera vez que accede a módulo**: Tour guiado breve (30 segundos)
- **Primera vez que crea algo**: Wizard completo
- **Después de 10 usos**: Sugerir funcionalidad avanzada

### Biblioteca de Tutoriales
```
/help
  ├── Getting Started
  │   ├── Primeros pasos (video 2 min)
  │   ├── Importar datos existentes
  │   └── Configurar notificaciones
  ├── Por Modelo de Negocio
  │   ├── Alquiler Tradicional
  │   ├── Room Rental / Coliving
  │   ├── STR (Short-Term Rentals)
  │   ├── House Flipping
  │   ├── Construcción
  │   ├── Servicios Profesionales
  │   └── Gestión de Comunidades
  └── Funcionalidades Avanzadas
      ├── Business Intelligence
      ├── Integraciones contables
      └── API & Webhooks
```

### Webinars y Casos de Uso
- **Webinar mensual**: "Cómo sacarle el máximo partido a INMOVA"
- **Casos de éxito**: Historias de usuarios reales
- **Comunidad**: Foro de usuarios para compartir tips

---

## 🔍 TESTING Y VALIDACIÓN

### Testing de Usabilidad
```typescript
const USABILITY_TESTS = [
  {
    scenario: 'Nuevo usuario crea su primera propiedad',
    success_criteria: 'Completado en < 5 minutos sin ayuda',
    participants: 10,
    modelo: 'alquiler_tradicional'
  },
  {
    scenario: 'Gestor STR conecta su cuenta de Airbnb',
    success_criteria: 'Sincronización completa en < 3 minutos',
    participants: 10,
    modelo: 'str'
  },
  {
    scenario: 'Administrador de fincas convoca junta',
    success_criteria: 'Convocatoria enviada en < 5 minutos',
    participants: 10,
    modelo: 'comunidades'
  }
];
```

### A/B Testing
- **Onboarding A vs B**: Con wizard vs sin wizard
- **Dashboard A vs B**: KPIs arriba vs KPIs lateral
- **Formularios A vs B**: Un paso vs multi-paso

---

## 🎯 CONCLUSIÓN

INMOVA tiene una **base sólida** pero necesita **personalización y guías** para ser verdaderamente intuitiva para cada modelo de negocio.

### ✅ Lo más crítico:
1. **Onboarding personalizado** según modelo negocio
2. **Wizards guiados** para procesos complejos
3. **Datos de ejemplo** para no ver pantallas vacías
4. **Tooltips y ayuda contextual** en toda la plataforma
5. **Validación en tiempo real** para evitar errores

### 🚀 Impacto esperado:
- **+50% tasa completación onboarding**
- **-40% tickets soporte**
- **+30% adopción de funcionalidades avanzadas**
- **+25% satisfacción usuario (NPS)**

---

**Documento generado:** 3 Diciembre 2025  
**Próxima revisión:** Post-implementación Fase 1  
**Responsable:** Equipo Producto INMOVA
