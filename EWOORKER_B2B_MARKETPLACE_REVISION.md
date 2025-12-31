# 🏗️ EWOORKER - PLATAFORMA B2B MARKETPLACE PARA CONSTRUCCIÓN

**Fecha:** 26 Diciembre 2025  
**URL Objetivo:** https://inmova.app/ewoorker  
**Descripción:** Marketplace B2B que conecta constructores y promotoras con profesionales del sector para subcontratación

---

## 📊 RESUMEN EJECUTIVO

### Estado Actual
- ❌ **Módulo dedicado `/ewoorker` NO existe** en el código actual
- ✅ **Infraestructura base SÍ existe** distribuida en múltiples módulos
- ⚠️ **Integración necesaria** para consolidar en un marketplace B2B unificado

### Componentes Existentes que Forman la Base:

#### 1. Módulo de Construcción (`/construction`)
- ✅ Gestión de proyectos de construcción
- ✅ Work orders para subcontratistas
- ✅ Control de presupuesto y timeline
- ✅ Inspecciones y certificaciones

#### 2. Marketplace de Servicios (`/marketplace`)
- ✅ Cotizaciones y trabajos
- ✅ Sistema de ratings y reviews
- ✅ Gestión de proveedores
- ✅ Tracking de jobs

#### 3. Portal de Proveedores (`/portal-proveedor`)
- ✅ Login independiente para proveedores
- ✅ Dashboard de trabajos asignados
- ✅ Presupuestos y facturas
- ✅ Chat con administradores

#### 4. Servicios Profesionales (`/professional`)
- ✅ Gestión de proyectos profesionales
- ✅ Tracking de horas y honorarios
- ✅ Equipos y colaboradores

---

## 🎯 VISIÓN DEL PRODUCTO: EWOORKER B2B

### Concepto
**Upwork/Freelancer pero específico para construcción inmobiliaria**

Plataforma que conecta:
- **DEMANDA:** Constructores, promotoras, arquitectos, property managers
- **OFERTA:** Profesionales independientes y pequeñas empresas especializadas

### Tipos de Profesionales:

#### Oficios de Construcción:
1. 🔨 **Albañiles** - Obra general, tabiquería, enfoscados
2. 🔌 **Electricistas** - Instalaciones eléctricas, domótica
3. 🚰 **Fontaneros** - Fontanería, calefacción, gas
4. 🎨 **Pintores** - Pintura, empapelado, lacados
5. 🪟 **Carpinteros** - Puertas, ventanas, muebles a medida
6. 🌡️ **Climatización** - HVAC, aire acondicionado
7. 🔊 **Aislamiento** - Térmico, acústico
8. 🪨 **Soladores/Alicatadores** - Pavimentos, revestimientos
9. 🔩 **Cerrajeros** - Puertas de seguridad, sistemas de cierre
10. 🏠 **Reformistas Integrales** - Proyectos completos

#### Profesionales Técnicos:
11. 📐 **Arquitectos** - Proyectos, direcciones de obra
12. 🔬 **Aparejadores/Arquitectos Técnicos** - Dirección de ejecución
13. 📋 **Project Managers** - Coordinación de obras
14. 🔍 **Inspectores de calidad** - Control y auditorías
15. 🌍 **Ingenieros** - Estructuras, instalaciones
16. 📊 **Topógrafos** - Levantamientos, replanteos
17. 🏗️ **Jefes de obra** - Supervisión in-situ
18. 🎨 **Interioristas** - Diseño de interiores
19. 📸 **Fotógrafos inmobiliarios** - Home staging photos
20. 🌳 **Paisajistas** - Jardines, espacios exteriores

---

## 🏛️ ARQUITECTURA PROPUESTA

### Actores del Sistema

#### 1. CLIENTE (Constructor/Promotora)
**Acceso:** Login normal de INMOVA con rol específico

**Funcionalidades:**
- Publicar proyectos/trabajos
- Recibir propuestas de profesionales
- Comparar presupuestos
- Contratar profesionales
- Gestionar pagos
- Valorar y dejar reviews
- Chat directo con profesionales

**Dashboard:**
```
┌─────────────────────────────────────────────┐
│  Dashboard - Constructor                    │
├─────────────────────────────────────────────┤
│                                             │
│  Proyectos Activos: 3                       │
│  Profesionales Contratados: 8               │
│  Presupuesto Total: €250,000               │
│                                             │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐│
│  │Publicar    │ │ Ver        │ │Gestionar ││
│  │Proyecto    │ │Propuestas  │ │ Pagos    ││
│  └────────────┘ └────────────┘ └──────────┘│
│                                             │
│  Trabajos Pendientes:                       │
│  • Instalación eléctrica - 3 propuestas     │
│  • Fontanería baños - 5 propuestas          │
│                                             │
└─────────────────────────────────────────────┘
```

---

#### 2. PROFESIONAL (Freelance/Subcontratista)
**Acceso:** Portal independiente `/ewoorker/professional/login`

**Onboarding:**
1. Registro con datos profesionales
2. Verificación de identidad
3. Certificaciones y licencias
4. Portfolio de trabajos previos
5. Referencias
6. Configuración de especialidades
7. Disponibilidad y zonas de trabajo

**Perfil Profesional:**
```typescript
interface ProfessionalProfile {
  // Identificación
  id: string;
  nombre: string;
  dni_nie: string;
  tipo: 'AUTONOMO' | 'EMPRESA';
  
  // Datos fiscales
  razonSocial?: string;
  cif?: string;
  numeroAutonomo?: string;
  
  // Contacto
  email: string;
  telefono: string;
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  
  // Profesional
  especialidades: string[]; // ['electricidad', 'fontaneria']
  subespecialidades: string[]; // ['domótica', 'aerotermia']
  experienciaAnios: number;
  certificaciones: Certificacion[];
  seguros: Seguro[];
  
  // Disponibilidad
  disponible: boolean;
  zonasOperacion: string[]; // ['Madrid', 'Toledo']
  radioKm: number;
  
  // Financiero
  tarifaHora?: number;
  tarifaDia?: number;
  minimoProyecto?: number;
  
  // Portfolio
  proyectosCompletados: number;
  valoracionMedia: number;
  totalReviews: number;
  portfolioFotos: string[];
  
  // Estado
  verificado: boolean;
  destacado: boolean;
  fechaRegistro: Date;
  ultimaActividad: Date;
}
```

**Dashboard Profesional:**
```
┌─────────────────────────────────────────────┐
│  ewoorker - Mi Perfil Profesional          │
├─────────────────────────────────────────────┤
│                                             │
│  Juan Martínez - Electricista ⭐ 4.8       │
│  Madrid | 156 trabajos | €45/hora          │
│                                             │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐│
│  │Buscar      │ │ Mis        │ │Mi        ││
│  │Trabajos    │ │Proyectos   │ │Perfil    ││
│  └────────────┘ └────────────┘ └──────────┘│
│                                             │
│  Nuevas Oportunidades (12):                 │
│  ┌─────────────────────────────────────┐  │
│  │ 🔌 Instalación eléctrica completa   │  │
│  │ Edificio 8 viviendas | Madrid       │  │
│  │ Presupuesto: €15,000-€20,000        │  │
│  │ Inicio: 15 Enero                     │  │
│  │ [Ver Detalles] [Enviar Propuesta]   │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  Proyectos Activos (2):                     │
│  • Reforma eléctrica - 60% completado       │
│  • Domótica vivienda - Pendiente inicio     │
│                                             │
│  Ingresos del mes: €4,200                  │
│  Pendiente de cobro: €1,500                │
│                                             │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Buscar proyectos disponibles
- Filtrar por especialidad, ubicación, presupuesto
- Enviar propuestas con presupuesto detallado
- Gestionar proyectos aceptados
- Chat con clientes
- Facturación
- Ver pagos y comisiones
- Actualizar portfolio y certificaciones

---

### Flujo Completo del Marketplace

#### FASE 1: PUBLICACIÓN DE PROYECTO

**Cliente publica proyecto:**
```typescript
interface ProjectPost {
  // Básico
  titulo: string;
  descripcion: string;
  categoria: string; // 'electricidad', 'fontaneria', etc
  subcategorias: string[];
  
  // Ubicación
  provincia: string;
  ciudad: string;
  direccion: string;
  
  // Alcance
  tipoProyecto: 'UNICO' | 'RECURRENTE';
  duracionEstimada: number; // días
  fechaInicioDeseada: Date;
  urgencia: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  
  // Financiero
  presupuestoMin: number;
  presupuestoMax: number;
  formaPago: 'HORAS' | 'PROYECTO' | 'MATERIALES';
  
  // Requerimientos
  certificacionesRequeridas: string[];
  seguroRequerido: boolean;
  experienciaMinima: number; // años
  
  // Adjuntos
  planos: string[];
  fotos: string[];
  documentos: string[];
  
  // Proceso
  modalidadSeleccion: 'MEJOR_PRECIO' | 'MEJOR_VALORACION' | 'MANUAL';
  plazoRespuestas: number; // días
  numeroMaximoPropuestas: number;
}
```

**Ejemplo:**
```
Título: "Instalación eléctrica completa en edificio de 8 viviendas"
Categoría: Electricidad
Ubicación: Madrid, Chamberí
Presupuesto: €15,000 - €20,000
Inicio deseado: 15 Enero 2026
Duración: 30 días
Urgencia: MEDIA

Descripción:
Se necesita instalación eléctrica completa para edificio nuevo de
8 viviendas (3 plantas + bajo). Incluye:
- Cuadros eléctricos (general + viviendas)
- Cableado completo
- Puntos de luz y enchufes
- Telecomunicaciones
- Portero automático
- Videoportero

Requerimientos:
- Certificado instalador autorizado
- Seguro RC mínimo €600,000
- Experiencia mínima 5 años en edificios similares
- Referencias verificables

Adjuntos:
- Planos eléctricos.pdf
- Memoria de calidades.pdf
- 8 fotos del estado actual
```

---

#### FASE 2: MATCHING Y NOTIFICACIONES

**Sistema automático:**
```typescript
async function matchProfessionalsToProject(project: ProjectPost) {
  // Buscar profesionales que coincidan
  const matches = await findMatchingProfessionals({
    especialidad: project.categoria,
    zona: project.ciudad,
    experiencia: project.experienciaMinima,
    disponible: true,
    certificaciones: project.certificacionesRequeridas,
  });
  
  // Notificar a profesionales
  for (const professional of matches) {
    await sendNotification(professional, {
      tipo: 'NUEVO_PROYECTO',
      proyecto: project,
      compatibilidad: calculateCompatibility(professional, project),
    });
  }
  
  // Email + Push + In-app notification
}
```

**Compatibilidad calculada:**
- ✅ Especialidad coincide: 100%
- ✅ En zona de operación: 90%
- ✅ Tiene certificaciones: 80%
- ⚠️ Experiencia suficiente: 75%
- ⚠️ Disponibilidad parcial: 60%

---

#### FASE 3: ENVÍO DE PROPUESTAS

**Profesional envía propuesta:**
```typescript
interface Proposal {
  // Referencia
  projectId: string;
  professionalId: string;
  fechaEnvio: Date;
  
  // Financiero
  presupuestoTotal: number;
  desglose: {
    manodeObra: number;
    materiales: number;
    otros: number;
  };
  formaPago: {
    anticipoPorc: number; // 30%
    entregasPorc: number[]; // [40%, 30%]
  };
  
  // Timing
  diasEjecucion: number;
  fechaInicioDisponible: Date;
  garantiaMeses: number;
  
  // Propuesta
  descripcionDetallada: string;
  metodologia: string;
  equipoTrabajo: string;
  materiales: {
    descripcion: string;
    marca: string;
    modelo: string;
    cantidad: number;
  }[];
  
  // Experiencia relevante
  proyectosSimilares: string[]; // IDs de portfolio
  referencias: {
    nombre: string;
    contacto: string;
    proyecto: string;
  }[];
  
  // Documentos
  certificados: string[];
  seguro: string;
  
  // Estado
  estado: 'ENVIADA' | 'VISTA' | 'RECHAZADA' | 'ACEPTADA' | 'RETIRADA';
  validezDias: number; // Validez de la propuesta
}
```

**Vista del Cliente - Comparador de Propuestas:**
```
┌────────────────────────────────────────────────────────┐
│  Propuestas Recibidas: Instalación eléctrica          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [Tabla Comparativa]                                   │
│                                                        │
│  Profesional      Precio     Plazo   Rating  Acción  │
│  ────────────────────────────────────────────────────│
│  Juan Electricidad €17,500    30d     ⭐4.9  [Ver]  │
│  ElectroPro SL     €16,200    35d     ⭐4.7  [Ver]  │
│  García Hermanos   €18,900    28d     ⭐4.8  [Ver]  │
│  TechElectric      €19,500    25d     ⭐5.0  [Ver]  │
│  Instalaciones M.  €16,800    32d     ⭐4.6  [Ver]  │
│                                                        │
│  [Ordenar por: Precio ▼]  [Filtrar por zona]         │
│                                                        │
└────────────────────────────────────────────────────────┘

[DETALLE PROPUESTA: Juan Electricidad]
┌────────────────────────────────────────────────────────┐
│  Juan Martínez - Electricista                         │
│  ⭐ 4.9 (127 reviews) | 15 años experiencia          │
│  Madrid | Instalador autorizado #12345                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  PRESUPUESTO: €17,500                                 │
│  ├─ Mano de obra: €9,500                             │
│  ├─ Materiales: €7,000                               │
│  └─ Otros: €1,000                                    │
│                                                        │
│  PLAZO: 30 días laborables                            │
│  INICIO: 15 Enero 2026                                │
│  GARANTÍA: 24 meses                                   │
│                                                        │
│  FORMA DE PAGO:                                       │
│  ├─ 30% anticipo: €5,250                             │
│  ├─ 40% a mitad obra: €7,000                         │
│  └─ 30% a finalizar: €5,250                          │
│                                                        │
│  DESCRIPCIÓN:                                         │
│  Instalación completa según normativa vigente         │
│  (REBT 2002 y modificaciones). Incluye cuadros       │
│  Schneider Electric, cableado H07V-K, mecanismos     │
│  Simon 82. Certificación final incluida.             │
│                                                        │
│  PROYECTOS SIMILARES:                                 │
│  • Edificio 10 viviendas - Getafe (2024)            │
│  • Rehabilitación eléctrica - Centro (2024)          │
│  • Obra nueva 6 viviendas - Pozuelo (2023)          │
│                                                        │
│  CERTIFICACIONES:                                     │
│  ✅ Instalador autorizado Comunidad Madrid           │
│  ✅ Seguro RC €1,000,000                             │
│  ✅ PRL - Prevención riesgos laborales               │
│                                                        │
│  [Aceptar Propuesta]  [Hacer Pregunta]  [Rechazar]  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### FASE 4: CONTRATACIÓN Y PAGO

**Cliente acepta propuesta:**
1. Sistema crea contrato automático
2. Genera hitos de pago
3. Activa chat privado
4. Notifica al profesional

**Contrato Digital:**
```typescript
interface Contract {
  id: string;
  projectId: string;
  clientId: string;
  professionalId: string;
  proposalId: string;
  
  // Términos
  presupuestoTotal: number;
  plazoEjecucion: number;
  fechaInicio: Date;
  fechaFinEstimada: Date;
  garantiaMeses: number;
  
  // Pagos
  pagos: {
    id: string;
    concepto: string;
    monto: number;
    porcentaje: number;
    fechaVencimiento: Date;
    condiciones: string;
    estado: 'PENDIENTE' | 'RETENIDO' | 'LIBERADO' | 'PAGADO';
  }[];
  
  // Protección
  escrow: boolean; // Dinero retenido por plataforma
  comisionPlataforma: number; // % sobre total
  
  // Documentación
  firmaCliente: string;
  firmaProfesional: string;
  fechaFirma: Date;
  
  // Estado
  estado: 'ACTIVO' | 'EN_PROGRESO' | 'COMPLETADO' | 'CANCELADO' | 'DISPUTA';
}
```

**Sistema de Escrow (Retención de Fondos):**
```
Cliente paga → Plataforma retiene → Hito completado → Plataforma libera → Profesional cobra

Ventajas:
- Seguridad para el cliente (paga cuando está satisfecho)
- Seguridad para el profesional (dinero garantizado)
- Plataforma actúa como garante
- Disputa resolution integrada
```

---

#### FASE 5: EJECUCIÓN DEL PROYECTO

**Tracking del Proyecto:**
```typescript
interface ProjectExecution {
  contractId: string;
  
  // Timeline
  hitos: {
    id: string;
    nombre: string;
    descripcion: string;
    fechaPrevista: Date;
    fechaReal?: Date;
    estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'ATRASADO';
    evidencias: string[]; // Fotos
    aprobadoCliente: boolean;
  }[];
  
  // Asistencia
  checkIns: {
    fecha: Date;
    hora: string;
    ubicacion: { lat: number; lng: number };
    tipo: 'ENTRADA' | 'SALIDA';
  }[];
  
  // Comunicación
  mensajes: Message[];
  notasProgreso: {
    fecha: Date;
    profesional: string;
    texto: string;
    fotos: string[];
  }[];
  
  // Incidencias
  incidencias: {
    id: string;
    tipo: 'RETRASO' | 'MATERIAL' | 'CALIDAD' | 'OTRO';
    descripcion: string;
    solucion: string;
    resuelta: boolean;
  }[];
  
  // Cambios
  changeOrders: {
    id: string;
    descripcion: string;
    impactoPresupuesto: number;
    impactoPlazo: number;
    aprobado: boolean;
  }[];
}
```

**Dashboard de Ejecución (Cliente):**
```
┌────────────────────────────────────────────────────────┐
│  Proyecto en Curso: Instalación Eléctrica            │
│  Juan Martínez - Electricista ⭐ 4.9                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  PROGRESO GENERAL: 65% ████████████░░░░░             │
│                                                        │
│  Inicio: 15 Ene  |  Fin estimado: 14 Feb  |  Días: 30│
│  Días transcurridos: 19  |  Días restantes: 11       │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  HITOS                                       │   │
│  ├──────────────────────────────────────────────┤   │
│  │  ✅ Replanteo y preparación     100%        │   │
│  │  ✅ Cuadros eléctricos          100%        │   │
│  │  🔵 Cableado viviendas           75%        │   │
│  │  ⏳ Mecanismos y acabados         0%        │   │
│  │  ⏳ Pruebas y certificación       0%        │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
│  ÚLTIMAS ACTUALIZACIONES:                             │
│  📸 Hace 2 horas - Juan subió 5 fotos                │
│     "Cableado planta 2 completado"                   │
│                                                        │
│  💬 Hace 4 horas - Nuevo mensaje de Juan             │
│     "Pequeño retraso en materiales, recuperable"     │
│                                                        │
│  PAGOS:                                               │
│  ✅ Anticipo 30%: €5,250 - Pagado                    │
│  🔒 Pago intermedio 40%: €7,000 - Retenido          │
│  ⏳ Pago final 30%: €5,250 - Pendiente              │
│                                                        │
│  [Ver Fotos] [Chat] [Aprobar Hito] [Reportar Issue] │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### FASE 6: FINALIZACIÓN Y REVIEW

**Cierre del Proyecto:**
1. Profesional marca como completado
2. Sube fotos finales y documentación
3. Cliente inspecciona trabajo
4. Cliente aprueba o solicita correcciones
5. Liberación del pago final
6. Ambas partes dejan review

**Sistema de Reviews:**
```typescript
interface Review {
  // Quién evalúa a quién
  reviewerId: string;
  reviewedId: string;
  reviewerType: 'CLIENT' | 'PROFESSIONAL';
  projectId: string;
  contractId: string;
  
  // Calificaciones (1-5 estrellas)
  calificacionGeneral: number;
  puntualidad: number;
  calidad: number;
  comunicacion: number;
  profesionalismo: number;
  cumplimientoPresupuesto: number;
  
  // Cliente evalúa
  cumplimientoPlazos?: number;
  limpiezaObra?: number;
  
  // Profesional evalúa
  claridadRequerimientos?: number;
  puntualidadPagos?: number;
  
  // Texto
  comentario: string;
  aspectosPositivos: string[];
  aspectosMejorables: string[];
  recomendaria: boolean;
  
  // Evidencia
  fotos: string[];
  
  // Metadata
  verificado: boolean; // Plataforma verifica que el trabajo se realizó
  respuesta?: string; // El evaluado puede responder
  fechaPublicacion: Date;
}
```

**Review del Cliente:**
```
┌────────────────────────────────────────────────────────┐
│  Valora a: Juan Martínez - Electricista              │
│  Proyecto: Instalación eléctrica 8 viviendas         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Calificación General: ⭐⭐⭐⭐⭐ (5.0)              │
│                                                        │
│  Puntualidad:              ⭐⭐⭐⭐⭐ 5.0            │
│  Calidad del trabajo:      ⭐⭐⭐⭐⭐ 5.0            │
│  Comunicación:             ⭐⭐⭐⭐⭐ 5.0            │
│  Cumplimiento presupuesto: ⭐⭐⭐⭐⭐ 5.0            │
│  Limpieza de la obra:      ⭐⭐⭐⭐⭐ 5.0            │
│                                                        │
│  Comentario:                                          │
│  "Excelente profesional. Trabajo impecable, muy      │
│  atento a los detalles. Cumplió plazos incluso       │
│  con un pequeño contratiempo de materiales. El       │
│  equipo dejó todo limpio cada día. Muy               │
│  recomendable."                                       │
│                                                        │
│  ✅ Recomendarías a Juan: SÍ                         │
│                                                        │
│  [Publicar Review]                                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Review del Profesional (al Cliente):**
```
Calificación General: ⭐⭐⭐⭐⭐ 5.0

"Cliente muy profesional. Requerimientos claros desde
el inicio. Pagos puntuales. Acceso a la obra sin
problemas. Repetiría sin dudarlo."

✅ Recomendarías trabajar con este cliente: SÍ
```

---

## 💰 MODELO DE NEGOCIO

### Comisiones de la Plataforma

#### Para el Cliente (Constructor/Promotor):
- **Publicar proyecto:** GRATIS
- **Recibir propuestas:** GRATIS
- **Contratar:** GRATIS
- **Comisión por transacción:** 3-5% sobre el monto total

#### Para el Profesional:
- **Registro en plataforma:** GRATIS
- **Perfil básico:** GRATIS
- **Ver proyectos:** GRATIS
- **Enviar propuestas:** 
  - Plan Free: 5 propuestas/mes
  - Plan Pro: Ilimitadas (€29/mes)
- **Comisión por trabajo conseguido:** 
  - Sin plan: 10% del proyecto
  - Con Plan Pro: 7% del proyecto

#### Planes de Suscripción para Profesionales:

**FREE:**
- 5 propuestas/mes
- Perfil básico
- Comisión 10%
- €0/mes

**PRO (€29/mes):**
- Propuestas ilimitadas
- Perfil destacado
- Badge "Profesional Verificado"
- Comisión reducida 7%
- Soporte prioritario
- Analytics avanzados

**PREMIUM (€99/mes):**
- Todo lo de PRO
- Perfil TOP en búsquedas
- Lead generation automático
- Comisión mínima 5%
- Manager dedicado
- Formación y webinars

---

### Servicios Adicionales (Revenue Streams):

1. **Verificación Exprés:** €49
   - Fast-track verification en 24h
   
2. **Destacar Perfil:** €19/semana
   - Aparece primero en búsquedas
   
3. **Boost Propuesta:** €9/propuesta
   - Tu propuesta aparece destacada
   
4. **Background Check Profesional:** €39
   - Verificación exhaustiva de antecedentes
   
5. **Seguros y Bonding:**
   - Seguro de garantía de proyecto
   - Performance bonds
   - Comisión por venta

6. **Financiación de Proyectos:**
   - Adelanto de pagos al profesional (factoring)
   - Financiación al cliente
   - Comisión sobre intereses

7. **Marketplace de Materiales:**
   - Compra de materiales con descuento
   - Comisión por venta

---

## 🗄️ MODELOS DE BASE DE DATOS

### Tablas Nuevas Necesarias:

```prisma
// Perfil del profesional en el marketplace
model MarketplaceProfessional {
  id        String   @id @default(cuid())
  
  // Autenticación
  email     String   @unique
  password  String   // Hasheado
  
  // Identificación
  nombre    String
  apellidos String?
  nombreCompleto String
  dni_nie   String   @unique
  tipo      ProfessionalType @default(AUTONOMO) // AUTONOMO, EMPRESA
  
  // Empresa (si aplica)
  razonSocial String?
  cif         String?  @unique
  
  // Fiscal
  numeroAutonomo String?
  iban           String?
  
  // Contacto
  telefono       String
  direccion      String
  codigoPostal   String
  ciudad         String
  provincia      String
  pais           String @default("España")
  
  // Profesional
  especialidades      String[] // ['electricidad', 'fontaneria']
  subespecialidades   String[] // ['domótica', 'instalaciones especiales']
  experienciaAnios    Int
  descripcionPerfil   String   @db.Text
  
  // Tarifas
  tarifaHora      Float?
  tarifaDia       Float?
  minimoProyecto  Float?
  
  // Disponibilidad
  disponible      Boolean  @default(true)
  zonasOperacion  String[] // ['Madrid', 'Toledo', 'Guadalajara']
  radioKm         Int      @default(50)
  
  // Verificación
  verificado      Boolean  @default(false)
  fechaVerificacion DateTime?
  documentosVerificacion String[] @default([])
  
  // Portfolio
  portfolioFotos  String[] @default([])
  proyectosCompletados Int @default(0)
  
  // Ratings
  valoracionMedia Float    @default(0)
  totalReviews    Int      @default(0)
  
  // Plan
  planSuscripcion SubscriptionPlan @default(FREE)
  fechaExpiracionPlan DateTime?
  
  // Estado
  destacado       Boolean  @default(false)
  activo          Boolean  @default(true)
  motivoSuspension String?
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  ultimaActividad DateTime @default(now())
  
  // Relaciones
  certificaciones  ProfessionalCertification[]
  seguros          ProfessionalInsurance[]
  referencias      ProfessionalReference[]
  propuestas       MarketplaceProposal[]
  proyectos        MarketplaceProject[] @relation("assigned")
  reviews          MarketplaceReview[]  @relation("reviewed")
  reviewsCreadas   MarketplaceReview[]  @relation("reviewer")
  pagos            ProfessionalPayment[]
  
  @@index([especialidades])
  @@index([ciudad])
  @@index([provincia])
  @@index([verificado])
  @@index([disponible])
  @@index([valoracionMedia])
}

enum ProfessionalType {
  AUTONOMO
  EMPRESA
  COOPERATIVA
}

enum SubscriptionPlan {
  FREE
  PRO
  PREMIUM
}

// Certificaciones del profesional
model ProfessionalCertification {
  id             String   @id @default(cuid())
  professionalId String
  professional   MarketplaceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  tipo           String // 'instalador_autorizado', 'prl', 'carnet_profesional'
  numero         String
  entidadEmisora String
  fechaEmision   DateTime
  fechaExpiracion DateTime?
  documentoUrl   String
  verificado     Boolean  @default(false)
  
  createdAt      DateTime @default(now())
  
  @@index([professionalId])
}

// Seguros del profesional
model ProfessionalInsurance {
  id             String   @id @default(cuid())
  professionalId String
  professional   MarketplaceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  tipo           InsuranceType // RC, DECENAL, TODO_RIESGO
  compania       String
  numeroPoliza   String
  cobertura      Float // Monto de cobertura
  fechaInicio    DateTime
  fechaExpiracion DateTime
  documentoUrl   String
  vigente        Boolean  @default(true)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([professionalId])
  @@index([vigente])
}

enum InsuranceType {
  RC              // Responsabilidad Civil
  DECENAL         // Seguro decenal
  TODO_RIESGO     // Todo riesgo construcción
  CAUCIÓN         // Seguro de caución
}

// Referencias profesionales
model ProfessionalReference {
  id             String   @id @default(cuid())
  professionalId String
  professional   MarketplaceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  nombreContacto String
  empresa        String?
  telefono       String
  email          String?
  proyectoDescripcion String @db.Text
  verificado     Boolean  @default(false)
  
  createdAt      DateTime @default(now())
  
  @@index([professionalId])
}

// Proyecto publicado en el marketplace
model MarketplaceProject {
  id        String   @id @default(cuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Básico
  titulo         String
  descripcion    String   @db.Text
  categoria      String   // 'electricidad', 'fontaneria', etc
  subcategorias  String[] @default([])
  
  // Ubicación
  provincia      String
  ciudad         String
  direccion      String?
  codigoPostal   String?
  
  // Alcance
  tipoProyecto   ProjectMarketplaceType @default(UNICO)
  duracionEstimada Int // días
  fechaInicioDeseada DateTime
  urgencia       ProjectUrgency @default(MEDIA)
  
  // Financiero
  presupuestoMin Float
  presupuestoMax Float
  formaPago      PaymentType
  
  // Requerimientos
  certificacionesRequeridas String[] @default([])
  seguroRequerido Boolean @default(true)
  experienciaMinima Int @default(0)
  
  // Adjuntos
  planos         String[] @default([])
  fotos          String[] @default([])
  documentos     String[] @default([])
  
  // Proceso selección
  modalidadSeleccion SelectionMode @default(MANUAL)
  plazoRespuestas Int @default(7) // días
  numeroMaximoPropuestas Int @default(20)
  
  // Estado
  estado         ProjectMarketplaceStatus @default(PUBLICADO)
  fechaPublicacion DateTime @default(now())
  fechaCierre    DateTime?
  
  // Asignación
  propuestaAceptadaId String?  @unique
  professionalAsignado MarketplaceProfessional? @relation("assigned", fields: [professionalAsignadoId], references: [id])
  professionalAsignadoId String?
  
  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relaciones
  propuestas     MarketplaceProposal[]
  contrato       MarketplaceContract?
  
  @@index([companyId])
  @@index([categoria])
  @@index([provincia])
  @@index([ciudad])
  @@index([estado])
  @@index([fechaPublicacion])
}

enum ProjectMarketplaceType {
  UNICO
  RECURRENTE
}

enum ProjectUrgency {
  BAJA
  MEDIA
  ALTA
  URGENTE
}

enum PaymentType {
  HORAS
  PROYECTO
  MATERIALES
}

enum SelectionMode {
  MEJOR_PRECIO
  MEJOR_VALORACION
  MANUAL
}

enum ProjectMarketplaceStatus {
  BORRADOR
  PUBLICADO
  EN_SELECCION
  ASIGNADO
  EN_CURSO
  COMPLETADO
  CANCELADO
}

// Propuesta de un profesional a un proyecto
model MarketplaceProposal {
  id             String   @id @default(cuid())
  projectId      String
  project        MarketplaceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  professionalId String
  professional   MarketplaceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  // Financiero
  presupuestoTotal Float
  manodeObra     Float
  materiales     Float
  otros          Float
  
  // Forma de pago propuesta
  anticipoPorc   Float    @default(30)
  entregasPorc   Float[]  @default([40, 30])
  
  // Timing
  diasEjecucion  Int
  fechaInicioDisponible DateTime
  garantiaMeses  Int      @default(12)
  
  // Propuesta detallada
  descripcionDetallada String @db.Text
  metodologia    String?  @db.Text
  equipoTrabajo  String?  @db.Text
  materialesJSON Json?    // Array de materiales detallados
  
  // Referencias
  proyectosSimilares String[] @default([])
  referenciasJSON    Json?    // Array de referencias
  
  // Documentos
  certificados   String[] @default([])
  seguro         String?
  otrosDocumentos String[] @default([])
  
  // Estado
  estado         ProposalStatus @default(ENVIADA)
  validezDias    Int      @default(30)
  fechaEnvio     DateTime @default(now())
  fechaVista     DateTime?
  fechaRespuesta DateTime?
  motivoRechazo  String?
  
  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relaciones
  contrato       MarketplaceContract?
  
  @@unique([projectId, professionalId]) // Un profesional solo puede enviar una propuesta por proyecto
  @@index([projectId])
  @@index([professionalId])
  @@index([estado])
}

enum ProposalStatus {
  ENVIADA
  VISTA
  EN_REVISION
  RECHAZADA
  ACEPTADA
  RETIRADA
  EXPIRADA
}

// Contrato resultante de aceptar una propuesta
model MarketplaceContract {
  id             String   @id @default(cuid())
  projectId      String   @unique
  project        MarketplaceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  proposalId     String   @unique
  proposal       MarketplaceProposal @relation(fields: [proposalId], references: [id])
  companyId      String
  professionalId String
  
  // Términos
  presupuestoTotal Float
  plazoEjecucion Int // días
  fechaInicio    DateTime
  fechaFinEstimada DateTime
  garantiaMeses  Int
  
  // Pagos
  pagosJSON      Json // Array de hitos de pago
  
  // Escrow
  escrowActivo   Boolean  @default(true)
  comisionPlataforma Float @default(5.0) // %
  
  // Firmas digitales
  firmaCliente   String?
  firmaProfesional String?
  fechaFirma     DateTime?
  
  // Estado
  estado         ContractStatus @default(ACTIVO)
  
  // Ejecución
  progreso       Int      @default(0) // %
  fechaInicioReal DateTime?
  fechaFinReal   DateTime?
  
  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relaciones
  hitos          ContractMilestone[]
  checkIns       ContractCheckIn[]
  incidencias    ContractIssue[]
  changeOrders   ContractChangeOrder[]
  pagos          ContractPayment[]
  reviews        MarketplaceReview[]
  
  @@index([companyId])
  @@index([professionalId])
  @@index([estado])
}

enum ContractStatus {
  BORRADOR
  ACTIVO
  EN_PROGRESO
  COMPLETADO
  CANCELADO
  DISPUTA
  RESUELTO
}

// Hitos del contrato
model ContractMilestone {
  id         String   @id @default(cuid())
  contractId String
  contract   MarketplaceContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  nombre         String
  descripcion    String   @db.Text
  fechaPrevista  DateTime
  fechaReal      DateTime?
  estado         MilestoneStatus @default(PENDIENTE)
  evidencias     String[] @default([]) // URLs de fotos
  aprobadoCliente Boolean @default(false)
  notasCliente   String?  @db.Text
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([contractId])
  @@index([estado])
}

enum MilestoneStatus {
  PENDIENTE
  EN_PROGRESO
  COMPLETADO
  ATRASADO
  BLOQUEADO
}

// Check-ins del profesional en obra
model ContractCheckIn {
  id         String   @id @default(cuid())
  contractId String
  contract   MarketplaceContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  fecha      DateTime @default(now())
  hora       String
  tipo       CheckInType
  latitud    Float?
  longitud   Float?
  nota       String?  @db.Text
  fotos      String[] @default([])
  
  @@index([contractId])
  @@index([fecha])
}

enum CheckInType {
  ENTRADA
  SALIDA
  INTERMEDIO
}

// Incidencias durante el proyecto
model ContractIssue {
  id         String   @id @default(cuid())
  contractId String
  contract   MarketplaceContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  tipo           IssueType
  descripcion    String   @db.Text
  gravedad       IssueSeverity
  reportadoPor   String   // 'cliente' o 'profesional'
  
  solucion       String?  @db.Text
  resuelta       Boolean  @default(false)
  fechaResolucion DateTime?
  
  fotos          String[] @default([])
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([contractId])
  @@index([resuelta])
}

enum IssueType {
  RETRASO
  MATERIAL
  CALIDAD
  SEGURIDAD
  CLIMA
  OTRO
}

enum IssueSeverity {
  BAJA
  MEDIA
  ALTA
  CRITICA
}

// Órdenes de cambio (scope changes)
model ContractChangeOrder {
  id         String   @id @default(cuid())
  contractId String
  contract   MarketplaceContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  descripcion        String   @db.Text
  justificacion      String   @db.Text
  impactoPresupuesto Float
  impactoPlazo       Int      // días
  solicitadoPor      String   // 'cliente' o 'profesional'
  
  aprobado           Boolean  @default(false)
  fechaSolicitud     DateTime @default(now())
  fechaRespuesta     DateTime?
  motivoRechazo      String?  @db.Text
  
  @@index([contractId])
  @@index([aprobado])
}

// Pagos del contrato
model ContractPayment {
  id         String   @id @default(cuid())
  contractId String
  contract   MarketplaceContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  concepto       String
  monto          Float
  porcentaje     Float
  fechaVencimiento DateTime
  condiciones    String?  @db.Text
  
  estado         PaymentStatus @default(PENDIENTE)
  fechaPago      DateTime?
  metodoPago     String?
  referenciaTransaccion String?
  
  retenidoEscrow Boolean  @default(true)
  fechaLiberacion DateTime?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([contractId])
  @@index([estado])
}

enum PaymentStatus {
  PENDIENTE
  RETENIDO
  LIBERADO
  PAGADO
  CANCELADO
}

// Pagos a profesionales (desde escrow)
model ProfessionalPayment {
  id             String   @id @default(cuid())
  professionalId String
  professional   MarketplaceProfessional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  contractPaymentId String?
  monto          Float
  comisionPlataforma Float
  montoNeto      Float
  
  concepto       String
  estado         ProfessionalPaymentStatus @default(PENDIENTE)
  fechaSolicitud DateTime @default(now())
  fechaPago      DateTime?
  metodoPago     String? // 'transferencia', 'stripe'
  referencia     String?
  
  @@index([professionalId])
  @@index([estado])
}

enum ProfessionalPaymentStatus {
  PENDIENTE
  PROCESANDO
  PAGADO
  RECHAZADO
}

// Reviews bidireccionales
model MarketplaceReview {
  id         String   @id @default(cuid())
  contractId String
  contract   MarketplaceContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  // Quién a quién
  reviewerId     String
  reviewedId     String
  reviewerType   ReviewerType
  
  reviewerProfessional  MarketplaceProfessional? @relation("reviewer", fields: [reviewerId], references: [id])
  reviewedProfessional  MarketplaceProfessional? @relation("reviewed", fields: [reviewedId], references: [id])
  
  // Calificaciones (1-5)
  calificacionGeneral       Float
  puntualidad               Float
  calidad                   Float
  comunicacion              Float
  profesionalismo           Float
  cumplimientoPresupuesto   Float
  
  // Si cliente evalúa profesional
  cumplimientoPlazos        Float?
  limpiezaObra              Float?
  
  // Si profesional evalúa cliente
  claridadRequerimientos    Float?
  puntualidadPagos          Float?
  
  // Texto
  comentario          String   @db.Text
  aspectosPositivos   String[] @default([])
  aspectosMejorables  String[] @default([])
  recomendaria        Boolean
  
  // Evidencia
  fotos               String[] @default([])
  
  // Metadata
  verificado          Boolean  @default(false)
  respuesta           String?  @db.Text
  fechaPublicacion    DateTime @default(now())
  
  @@index([reviewedId])
  @@index([reviewerType])
  @@index([calificacionGeneral])
}

enum ReviewerType {
  CLIENT
  PROFESSIONAL
}
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### FASE 1: FUNDAMENTOS (Semana 1-2)

#### 1.1 Setup del Módulo
- [  ] Crear carpeta `/app/ewoorker/`
- [  ] Implementar routing y layouts
- [  ] Crear modelos de BD (Prisma)
- [  ] Migración de base de datos
- [  ] Seed data para testing

#### 1.2 Autenticación Profesional
- [  ] Sistema de registro para profesionales
- [  ] Login/logout independiente
- [  ] JWT tokens
- [  ] Password reset
- [  ] Email verification

#### 1.3 Perfil Profesional
- [  ] Formulario de registro completo
- [  ] Upload de documentos (DNI, certificados, seguros)
- [  ] Gestión de especialidades
- [  ] Configuración de tarifas
- [  ] Zonas de operación

---

### FASE 2: MARKETPLACE CORE (Semana 3-4)

#### 2.1 Publicación de Proyectos (Cliente)
- [  ] Formulario de nuevo proyecto
- [  ] Upload de planos y fotos
- [  ] Sistema de categorización
- [  ] Requisitos de certificaciones
- [  ] Publicar/Borrador/Editar

#### 2.2 Búsqueda y Matching
- [  ] Algoritmo de matching automático
- [  ] Filtros avanzados
- [  ] Búsqueda por ubicación (radius search)
- [  ] Notificaciones push a profesionales
- [  ] Email notifications

#### 2.3 Sistema de Propuestas
- [  ] Formulario de propuesta
- [  ] Calculadora de presupuesto
- [  ] Upload de documentos
- [  ] Vista de propuestas (cliente)
- [  ] Comparador de propuestas
- [  ] Aceptar/Rechazar propuestas

---

### FASE 3: CONTRATACIÓN Y EJECUCIÓN (Semana 5-6)

#### 3.1 Contratos
- [  ] Generación automática de contratos
- [  ] Firma digital
- [  ] Términos y condiciones
- [  ] Sistema de hitos
- [  ] Configuración de pagos

#### 3.2 Sistema de Escrow
- [  ] Integración con Stripe Connect
- [  ] Retención de fondos
- [  ] Liberación por hitos
- [  ] Cálculo de comisiones
- [  ] Transferencias a profesionales

#### 3.3 Tracking del Proyecto
- [  ] Dashboard de ejecución
- [  ] Check-in/Check-out (geolocalización)
- [  ] Upload de fotos de progreso
- [  ] Timeline de hitos
- [  ] Aprobación de hitos
- [  ] Change orders
- [  ] Gestión de incidencias

---

### FASE 4: COMUNICACIÓN Y FINALIZACIÓN (Semana 7-8)

#### 4.1 Sistema de Mensajería
- [  ] Chat en tiempo real (Socket.io)
- [  ] Notificaciones de mensajes
- [  ] Upload de archivos en chat
- [  ] Historial de conversaciones

#### 4.2 Sistema de Reviews
- [  ] Review del cliente al profesional
- [  ] Review del profesional al cliente
- [  ] Calificaciones por categorías
- [  ] Upload de fotos en reviews
- [  ] Respuesta a reviews
- [  ] Moderación de reviews

#### 4.3 Analytics y Reporting
- [  ] Dashboard de métricas (cliente)
- [  ] Dashboard de métricas (profesional)
- [  ] Reportes de proyectos
- [  ] Exportación de datos
- [  ] Facturación automática

---

### FASE 5: OPTIMIZACIONES (Semana 9-10)

#### 5.1 Verificación y Confianza
- [  ] Verificación de identidad (KYC)
- [  ] Verificación de certificados
- [  ] Background checks
- [  ] Sistema de badges
- [  ] Profesionales destacados

#### 5.2 Planes de Suscripción
- [  ] Sistema de planes (Free/Pro/Premium)
- [  ] Pasarela de pago (Stripe)
- [  ] Gestión de suscripciones
- [  ] Límites por plan
- [  ] Facturación automática

#### 5.3 Mobile App (Opcional)
- [  ] App React Native
- [  ] Push notifications
- [  ] Cámara para fotos
- [  ] Geolocalización
- [  ] Notificaciones en tiempo real

---

### FASE 6: LANZAMIENTO (Semana 11-12)

#### 6.1 Testing Completo
- [  ] Unit tests
- [  ] Integration tests
- [  ] E2E tests (Playwright)
- [  ] Load testing
- [  ] Security audit

#### 6.2 Documentación
- [  ] Guía de usuario (cliente)
- [  ] Guía de usuario (profesional)
- [  ] API documentation
- [  ] Video tutorials
- [  ] FAQ

#### 6.3 Marketing y Lanzamiento
- [  ] Landing page
- [  ] Campaña email
- [  ] Social media
- [  ] SEO optimization
- [  ] Onboarding de primeros profesionales
- [  ] Onboarding de primeros clientes

---

## 🔗 INTEGRACIÓN CON MÓDULOS EXISTENTES

### Conexión con `/construction`
- Proyectos de construcción pueden generar automáticamente work orders en ewoorker
- Subcontratistas en construcción se sincronizan con profesionales de ewoorker

### Conexión con `/marketplace`
- Compartir sistema de reviews
- Compartir proveedores verificados
- API común para servicios

### Conexión con `/portal-proveedor`
- Migración de proveedores actuales a ewoorker
- Dashboard unificado
- Facturación integrada

---

## 📱 CREDENCIALES Y ACCESOS

### Para Socio - Acceso Demo

#### Opción A: Profesional en ewoorker
```
URL: https://inmova.app/ewoorker/professional/login
Email: profesional@demo.com
Password: Demo123!
Rol: Profesional Electricista

Perfil:
- Nombre: Juan Electricista
- Especialidad: Electricidad, Domótica
- Ubicación: Madrid
- Rating: 4.9 ⭐ (45 reviews)
- Plan: PRO
```

#### Opción B: Constructor (Cliente)
```
URL: https://inmova.app/login
Email: constructor@demo.com
Password: Demo123!
Rol: Constructor/Promotor

Dashboard:
- 3 proyectos activos
- 12 profesionales trabajando
- €85,000 en trabajos activos
```

### URLs del Sistema

```
Cliente (Constructor/Promotor):
https://inmova.app/ewoorker/projects          - Ver proyectos
https://inmova.app/ewoorker/projects/new      - Publicar proyecto
https://inmova.app/ewoorker/professionals     - Buscar profesionales
https://inmova.app/ewoorker/contracts         - Contratos activos
https://inmova.app/ewoorker/payments          - Pagos

Profesional:
https://inmova.app/ewoorker/professional/register     - Registro
https://inmova.app/ewoorker/professional/login        - Login
https://inmova.app/ewoorker/professional/dashboard    - Dashboard
https://inmova.app/ewoorker/professional/projects     - Proyectos disponibles
https://inmova.app/ewoorker/professional/proposals    - Mis propuestas
https://inmova.app/ewoorker/professional/contracts    - Contratos activos
https://inmova.app/ewoorker/professional/earnings     - Ganancias
https://inmova.app/ewoorker/professional/profile      - Mi perfil

Admin:
https://inmova.app/admin/ewoorker/professionals      - Gestión profesionales
https://inmova.app/admin/ewoorker/projects           - Gestión proyectos
https://inmova.app/admin/ewoorker/disputes           - Gestión disputas
https://inmova.app/admin/ewoorker/payments           - Gestión pagos
https://inmova.app/admin/ewoorker/verification       - Verificaciones pendientes
```

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### MVP (Producto Mínimo Viable)

**CORE:**
- [ ] Registro y login de profesionales
- [ ] Perfil profesional completo
- [ ] Publicación de proyectos por clientes
- [ ] Búsqueda y filtrado de proyectos
- [ ] Sistema de propuestas
- [ ] Aceptación de propuestas
- [ ] Contrato básico
- [ ] Sistema de pagos (Stripe)
- [ ] Reviews bidireccionales

**NICE TO HAVE (V2):**
- [ ] Chat en tiempo real
- [ ] Sistema de escrow completo
- [ ] Geolocalización y check-ins
- [ ] Upload masivo de fotos
- [ ] Planes de suscripción
- [ ] App móvil
- [ ] Verificación KYC
- [ ] Sistema de disputas
- [ ] Analytics avanzados
- [ ] Marketplace de materiales

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs para ewoorker:

1. **Profesionales Registrados:** Target 1000 en 6 meses
2. **Proyectos Publicados:** Target 500 en 6 meses
3. **Tasa de Matching:** >70% de proyectos reciben propuestas
4. **Tasa de Conversión:** >30% de propuestas se convierten en contratos
5. **GMV (Gross Merchandise Value):** €500,000 en 6 meses
6. **Rating Promedio:** >4.5 estrellas
7. **Tiempo Medio de Matching:** <48 horas
8. **Proyectos Completados:** >200 en 6 meses
9. **Tasa de Repetición:** >40% de clientes repiten
10. **NPS (Net Promoter Score):** >50

---

## 💡 PRÓXIMOS PASOS INMEDIATOS

### ¿Qué hacer ahora?

1. **✅ CONFIRMAR VISIÓN**
   - ¿Es esta la visión correcta del producto ewoorker?
   - ¿Hay funcionalidades que agregar/quitar?

2. **🎯 PRIORIZAR DESARROLLO**
   - ¿Implementar todo ewoorker desde cero?
   - ¿O consolidar módulos existentes primero?

3. **👥 RECURSOS NECESARIOS**
   - Desarrolladores: 2-3 full-stack
   - Diseñador UI/UX: 1
   - Product Manager: 1
   - QA Tester: 1

4. **⏱️ TIMELINE REALISTA**
   - MVP: 3 meses
   - V1 completa: 6 meses
   - V2 con mobile: 9 meses

5. **💰 PRESUPUESTO**
   - Desarrollo: €80,000 - €120,000
   - Infraestructura: €500/mes
   - Marketing inicial: €10,000

---

**¿Quieres que proceda con la implementación del módulo ewoorker?**

---

**Generado el:** 26 Diciembre 2025  
**Estado:** ⚠️ PENDIENTE DE APROBACIÓN Y DESARROLLO  
**Documentos de Referencia:**
- `/app/marketplace/page.tsx`
- `/app/construction/page.tsx`
- `/app/professional/page.tsx`
- `/app/portal-proveedor/`
- `MULTI_VERTICAL_GUIDE.md`
