# Análisis de Verticales y Horizontales PropTech - Inmova App

**Fecha:** 12 Enero 2026  
**Objetivo:** Evaluar si la organización actual es intuitiva para usuarios PropTech

---

## 📊 ESTRUCTURA ACTUAL

### EXPLOTACIÓN DE ACTIVOS (Inversión/Rendimiento)

#### 1. 🏠 Living Residencial (28 páginas)
| Módulo | Páginas | Observación |
|--------|---------|-------------|
| Alquiler Tradicional | Dashboard, Propiedades, Inquilinos, Contratos, Candidatos, Valoraciones IA, Inspecciones, Certificaciones | ✅ Bien estructurado |
| Coliving | Room Rental, Comunidad Social, Reservas Espacios | ⚠️ Podría fusionar con Living |
| Student Housing | Dashboard, Residentes, Habitaciones, Aplicaciones, Actividades, Pagos, Mantenimiento | ⚠️ 7 páginas - muchas |
| Workspace | Dashboard, Coworking, Reservas, Miembros | ❌ **No debería estar aquí** - es más Comercial |

#### 2. 🏖️ Alquiler Turístico - STR (6 páginas)
| Página | Observación |
|--------|-------------|
| Dashboard STR | ✅ OK |
| Propiedades STR | ⚠️ ¿Por qué separar de Propiedades general? |
| Reservas | ✅ OK |
| Revenue Management | ✅ OK - clave para STR |
| Reviews | ✅ OK |
| Housekeeping | ✅ OK |

#### 3. 🏢 Comercial - Oficinas/Locales (10 páginas)
| Página | Observación |
|--------|-------------|
| Dashboard Comercial | ✅ OK |
| Oficinas | ✅ OK |
| Locales | ✅ OK |
| Naves Industriales | ❌ **Mover a Logística Industrial** |
| Coworking | ⚠️ Duplicado con Workspace |
| Contratos Comerciales | ⚠️ ¿Por qué separar de Contratos general? |
| Leads Comerciales | ⚠️ ¿Por qué separar de CRM? |
| Servicios Profesionales | ❓ Confuso - ¿qué es? |
| Clientes Comerciales | ⚠️ Duplicado con CRM |
| Facturación Comercial | ⚠️ Duplicado con Facturación general |

#### 4. 🏭 Logística Industrial (4 páginas)
| Página | Observación |
|--------|-------------|
| Dashboard | ✅ OK |
| Inventario | ⚠️ No es PropTech puro |
| Ubicaciones | ✅ OK |
| Movimientos | ⚠️ No es PropTech puro |

**Problema:** Solo 4 páginas es muy poco para un vertical. Debería incluir Naves de Comercial.

#### 5. 🏗️ Construcción/Promoción (35+ páginas)
| Módulo | Páginas | Observación |
|--------|---------|-------------|
| Construcción | Dashboard, Proyectos, Órdenes Trabajo, Control Calidad | ✅ OK |
| Build-to-Rent | Proyectos, Control Calidad, Órdenes Trabajo, eWoorker | ⚠️ **Duplicados** con Construcción |
| Flipping | Dashboard, Proyectos, Calculadora ROI, Análisis Mercado | ✅ OK |
| Real Estate Dev | Dashboard, Proyectos, Ventas, Marketing, Comercial | ⚠️ Marketing/Ventas debería estar en CRM |
| eWoorker | 12 páginas completas | ❌ **Demasiado grande** para submódulo |

**Problema crítico:** Este vertical tiene demasiadas páginas fusionadas. Usuario se pierde.

#### 6. 🏛️ Vivienda Social/Residencias (5 páginas)
| Página | Observación |
|--------|-------------|
| Dashboard | ✅ OK |
| Solicitudes | ✅ OK |
| Elegibilidad | ✅ OK |
| Compliance | ✅ OK |
| Reportes | ✅ OK |

**Bien estructurado** - 5 páginas es manejable.

### SERVICIOS DE ADMINISTRACIÓN (B2C/Servicio)

#### 7. 🏘️ Comunidades de Propietarios (5 páginas)
| Página | Observación |
|--------|-------------|
| Comunidades | ✅ OK |
| Anuncios | ✅ OK |
| Votaciones | ✅ OK |
| Reuniones | ✅ OK |
| Finanzas | ✅ OK |

**Bien estructurado.**

---

## 🛠️ HERRAMIENTAS HORIZONTALES

### Análisis por Herramienta

| Herramienta | Páginas | Problema |
|-------------|---------|----------|
| **Finanzas** | Pagos, Gastos, Presupuestos, Facturación, Open Banking | ⚠️ "Pagos" también aparece en Student Housing |
| **Analytics** | Analytics, Reportes, Asistente IA | ✅ OK |
| **Operaciones** | Mantenimiento, Incidencias, Calendario, Visitas, Servicios | ⚠️ "Mantenimiento" también en Student Housing |
| **Comunicaciones** | Chat, Notificaciones, SMS, Redes Sociales | ✅ OK |
| **Documentos/Legal** | 6 páginas | ✅ OK |
| **CRM Inmobiliario** | CRM, Portal Comercial, Promociones, Marketplace, Tours | ⚠️ "Leads Comerciales" debería estar aquí |
| **Automatización** | Workflows, Recordatorios | ✅ OK |
| **Innovación** | ESG, IoT, Blockchain, Economía Circular | ⚠️ Muy técnico para PropTech típico |
| **Soporte** | Soporte, KB, Sugerencias | ✅ OK |

---

## ❌ PROBLEMAS DETECTADOS

### 1. Duplicaciones Críticas

```
┌─────────────────────────────────────────────────────────┐
│ ELEMENTO DUPLICADO    │ APARECE EN                      │
├───────────────────────┼─────────────────────────────────┤
│ Propiedades           │ Living + STR                    │
│ Dashboard             │ CADA vertical (8x)              │
│ Pagos                 │ Finanzas + Student Housing      │
│ Mantenimiento         │ Operaciones + Student Housing   │
│ Contratos             │ Living + Comercial              │
│ Coworking             │ Comercial + Workspace           │
│ Órdenes Trabajo       │ Construcción + Build-to-Rent    │
│ Control Calidad       │ Construcción + Build-to-Rent    │
│ Proyectos             │ Construcción + Flipping + Dev   │
│ Leads                 │ CRM + Comercial                 │
│ Clientes              │ CRM + Comercial                 │
└───────────────────────┴─────────────────────────────────┘
```

### 2. Verticales Mal Ubicados

| Elemento | Ubicación Actual | Ubicación Correcta |
|----------|------------------|-------------------|
| Workspace | Living Residencial | Comercial |
| Naves Industriales | Comercial | Logística Industrial |
| Marketing (Real Estate Dev) | Construcción | CRM |
| Ventas (Real Estate Dev) | Construcción | CRM |

### 3. Verticales Desequilibrados

| Vertical | Páginas | Estado |
|----------|---------|--------|
| Construcción/Promoción | 35+ | ❌ Demasiado grande |
| Logística Industrial | 4 | ⚠️ Muy pequeño |
| Living Residencial | 28 | ⚠️ Grande pero OK |

### 4. Confusión de Usuario

**Problema:** Un gestor inmobiliario que busca "Pagos" tiene 3 lugares donde ir:
- Finanzas → Pagos
- Student Housing → Pagos  
- eWoorker → Pagos

---

## ✅ RECOMENDACIONES

### CAMBIO 1: Unificar Propiedades

**Antes:** Propiedades separadas por vertical (Living, STR, Comercial)

**Después:** Una sola página `/propiedades` con filtros:

```
/propiedades
├── Filtro: Tipo (Residencial, Comercial, STR, Industrial)
├── Filtro: Estado (Disponible, Ocupado, Mantenimiento)
└── Vista: Lista/Mapa/Grid
```

### CAMBIO 2: Dashboard Unificado Adaptativo

**Antes:** 8 dashboards separados

**Después:** Un dashboard `/dashboard` que se adapta al vertical activo:

```typescript
// El dashboard detecta el vertical principal del usuario
const vertical = user.primaryVertical; // 'living', 'str', 'comercial', etc.

// Muestra KPIs relevantes
if (vertical === 'str') {
  // Ocupación, RevPAR, Reviews
} else if (vertical === 'living') {
  // Morosidad, Ocupación, Contratos por vencer
}
```

### CAMBIO 3: Reorganizar Construcción/Promoción

**Antes:** 35+ páginas en un solo vertical

**Después:** Dividir en sub-verticales claros:

```
🏗️ Construcción/Promoción
├── 📁 Proyectos (común)
│   ├── Obra Nueva
│   ├── Reformas
│   └── Rehabilitación
├── 🔨 Flipping
│   ├── Calculadora ROI
│   └── Análisis Mercado
├── 👷 eWoorker (Marketplace B2B)
│   └── [Acceso a plataforma separada]
└── 🏢 Promociones Inmobiliarias
    ├── Ventas sobre plano
    └── Marketing promociones
```

### CAMBIO 4: Mover Elementos Mal Ubicados

| Acción | Elemento | De → A |
|--------|----------|--------|
| MOVER | Workspace | Living → Comercial |
| MOVER | Naves Industriales | Comercial → Logística |
| FUSIONAR | Marketing/Ventas (Real Estate Dev) | → CRM |
| ELIMINAR | Coworking duplicado | Comercial (mantener en Workspace) |

### CAMBIO 5: Eliminar Duplicados en Student Housing

**Antes:** Student Housing tiene Pagos, Mantenimiento propios

**Después:** Student Housing usa las herramientas horizontales:

```
🎓 Student Housing
├── Residentes
├── Habitaciones
├── Aplicaciones
└── Actividades

(Pagos, Mantenimiento → acceso desde Herramientas Horizontales)
```

### CAMBIO 6: Simplificar Logística Industrial

**Propuesta:** Fusionar con Comercial como sub-sección

```
🏢 Inmuebles Comerciales
├── Oficinas
├── Locales
├── Naves y Logística ← (fusionado)
│   ├── Naves Industriales
│   └── Almacenes/Warehouse
└── Coworking/Workspace ← (fusionado)
```

**Resultado:** Eliminar Logística como vertical independiente.

---

## 📋 ESTRUCTURA PROPUESTA FINAL

### EXPLOTACIÓN DE ACTIVOS (6 verticales)

```
1. 🏠 LIVING RESIDENCIAL
   ├── Propiedades (filtro: residencial)
   ├── Inquilinos
   ├── Contratos
   ├── Candidatos
   └── Coliving/Student Housing (submódulo)

2. 🏖️ ALQUILER TURÍSTICO (STR)
   ├── Propiedades (filtro: STR)
   ├── Reservas
   ├── Revenue Management
   ├── Reviews
   └── Housekeeping

3. 🏢 INMUEBLES COMERCIALES (fusionado)
   ├── Propiedades (filtro: comercial)
   ├── Oficinas
   ├── Locales
   ├── Naves/Logística
   ├── Coworking/Workspace
   └── Contratos Comerciales

4. 🏗️ CONSTRUCCIÓN/PROMOCIÓN (simplificado)
   ├── Proyectos de Obra
   ├── Flipping
   ├── Promociones Inmobiliarias
   └── eWoorker (link externo B2B)

5. 🏛️ VIVIENDA SOCIAL
   └── (sin cambios - bien estructurado)

6. 🏘️ COMUNIDADES DE PROPIETARIOS
   └── (sin cambios - bien estructurado)
```

### HERRAMIENTAS HORIZONTALES (8)

```
💰 Finanzas (único punto para pagos/gastos)
📊 Analytics e IA
🔧 Operaciones (único punto para mantenimiento)
💬 Comunicaciones
📄 Documentos/Legal
📇 CRM Inmobiliario (incluye Leads, Marketing, Ventas)
⚡ Automatización
❓ Soporte
```

### ELIMINADOS

- ❌ Innovación (ESG, IoT, Blockchain) → Mover a "Configuración Avanzada"
- ❌ Herramientas Inversión → Fusionar en Analytics
- ❌ Logística Industrial como vertical → Fusionar en Comercial

---

## 📈 IMPACTO ESPERADO

| Métrica | Antes | Después |
|---------|-------|---------|
| Verticales principales | 7 | 6 |
| Páginas totales | ~150 | ~100 |
| Duplicaciones | 15+ | 0 |
| Clicks para llegar a Pagos | 2-3 (depende de vertical) | 1 (siempre igual) |
| Tiempo de aprendizaje usuario | Alto | Medio |

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Quick Wins (1-2 días)
- [ ] Renombrar secciones confusas
- [ ] Mover Workspace a Comercial
- [ ] Mover Naves a Logística

### Fase 2: Unificaciones (3-5 días)
- [ ] Crear página unificada de Propiedades con filtros
- [ ] Eliminar "Pagos" y "Mantenimiento" de Student Housing
- [ ] Fusionar Logística con Comercial

### Fase 3: Refactorización (1 semana)
- [ ] Simplificar Construcción/Promoción
- [ ] Dashboard adaptativo
- [ ] Consolidar CRM

---

*Documento generado según análisis de cursorrules y mejores prácticas PropTech*
