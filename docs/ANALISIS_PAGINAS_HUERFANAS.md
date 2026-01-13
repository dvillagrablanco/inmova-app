# Análisis de Páginas Huérfanas - Inmova App

**Fecha:** 12 Enero 2026
**Total páginas en código:** 495
**Páginas con acceso en sidebar:** 191
**Páginas sin acceso directo:** 326

---

## 📋 CLASIFICACIÓN DE PÁGINAS HUÉRFANAS

### 1️⃣ PÁGINAS QUE NO REQUIEREN SIDEBAR (Correctamente sin acceso)

#### Autenticación y Acceso
- `/login` - Página de login principal
- `/register` - Registro de usuarios
- `/forgot-password` - Recuperación de contraseña
- `/unauthorized` - Página de acceso no autorizado
- `/test-auth` - Testing interno

#### Landing Pages (Marketing Público)
- `/landing/*` - 25+ páginas de marketing, blog, precios, contacto, etc.
- `/pricing` - Página de precios (redirección a landing)

#### Portales Externos (Tienen sus propios layouts)
- `/portal-inquilino/*` - 18 páginas del portal de inquilinos
- `/portal-propietario/*` - 3 páginas del portal de propietarios
- `/portal-proveedor/*` - 12 páginas del portal de proveedores
- `/partners/*` - 20+ páginas del portal de partners
- `/ewoorker/login`, `/ewoorker/registro`, `/ewoorker/onboarding`, `/ewoorker/perfil/*` - Flujos externos

#### Rutas Dinámicas (Accesibles desde listados)
- `/propiedades/[id]`, `/propiedades/[id]/editar` - Detalle/edición de propiedad
- `/propiedades/nuevo`, `/propiedades/crear` - Crear propiedad (desde botón en listado)
- `/inquilinos/[id]`, `/inquilinos/nuevo` - Detalle/nuevo inquilino
- `/contratos/nuevo`, `/contratos/importar` - Crear/importar contrato
- `/seguros/[id]`, `/seguros/nuevo`, `/seguros/analisis` - Gestión de seguros
- `/edificios/nuevo`, `/edificios/nuevo-wizard` - Crear edificio
- `/mantenimiento/nuevo` - Nueva solicitud de mantenimiento
- `/pagos/nuevo` - Nuevo pago
- `/unidades/nueva`, `/unidades/nuevo` - Nueva unidad
- `/usuarios/nuevo` - Nuevo usuario
- `/iot/nuevo-dispositivo` - Nuevo dispositivo IoT
- `/esg/nuevo-plan` - Nuevo plan ESG
- `/garajes-trasteros/nuevo` - Nuevo garaje/trastero
- `/tours-virtuales/nuevo` - Nuevo tour virtual
- `/str/bookings/nueva`, `/str/listings/nuevo` - Crear booking/listing STR
- `/candidatos/nuevo` - Nuevo candidato

#### Páginas Legacy/Duplicadas
- `/(dashboard)/*` - 25+ rutas con route groups legacy
- `/(protected)/*` - Rutas protegidas duplicadas
- `/dashboard/adaptive`, `/dashboard-adaptive` - Dashboard adaptativo (experimental)
- `/p/[slug]` - Páginas dinámicas públicas

#### Documentación y Utilidades
- `/docs` - Documentación interna
- `/ejemplo-ux`, `/guia-ux` - Guías de UX internas
- `/offline` - Página offline
- `/qa/checklist` - Checklist de QA

---

### 2️⃣ PÁGINAS QUE SÍ NECESITAN VISIBILIDAD EN SIDEBAR

#### 🏠 LIVING RESIDENCIAL - Agregar a Alquileres
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/alquiler-tradicional/warranties` | Gestión de garantías | Living > Alquileres > Garantías |
| `/verificacion-inquilinos` | Screening de inquilinos | Living > Alquileres > Verificación |
| `/screening` | Análisis crediticio | Living > Alquileres > Screening |
| `/renovaciones-contratos` | Renovación de contratos | Living > Alquileres > Renovaciones |
| `/warranty-management` | Gestión de garantías | Living > Alquileres > Garantías |

#### 🛏️ COLIVING - Agregar al módulo Coliving
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/coliving/comunidad` | Gestión de comunidad | Living > Coliving > Comunidad |
| `/coliving/emparejamiento` | Matching de residentes | Living > Coliving > Matching |
| `/coliving/eventos` | Eventos del coliving | Living > Coliving > Eventos |
| `/coliving/paquetes` | Paquetes de servicios | Living > Coliving > Paquetes |
| `/coliving/propiedades` | Propiedades coliving | Living > Coliving > Propiedades |
| `/coliving/reservas` | Reservas | Living > Coliving > Reservas |

#### 🏖️ STR (Alquiler Turístico) - Agregar a STR
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/str/pricing` | Pricing dinámico | STR > Pricing |
| `/str/setup-wizard` | Wizard de configuración | STR > Setup Wizard |
| `/turismo-alquiler` | Panel de turismo | STR > Panel Principal |
| `/(protected)/str-advanced/*` | Funciones avanzadas STR | STR > Avanzado |

#### 🏢 INMUEBLES COMERCIALES - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/garajes-trasteros` | Garajes y trasteros | Comercial > Garajes/Trasteros |
| `/salas-reuniones` | Reserva de salas | Comercial > Salas de Reuniones |
| `/espacios-coworking` | Gestión coworking | Comercial > Coworking |
| `/retail` | Gestión retail | Comercial > Retail |
| `/hospitality` | Hospitalidad | Comercial > Hospitalidad |

#### 🏗️ CONSTRUCCIÓN - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/construction/gantt` | Diagrama Gantt | Construcción > Gantt |
| `/proyectos-renovacion` | Proyectos de renovación | Construcción > Renovaciones |
| `/obras` | Gestión de obras | Construcción > Obras |
| `/licitaciones` | Licitaciones | Construcción > Licitaciones |
| `/flipping/timeline` | Timeline de flipping | Construcción > Flipping > Timeline |

#### 🏘️ COMUNIDADES - Agregar sub-páginas
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/comunidades/actas` | Actas de reuniones | Comunidades > Actas |
| `/comunidades/cumplimiento` | Cumplimiento normativo | Comunidades > Cumplimiento |
| `/comunidades/cuotas` | Gestión de cuotas | Comunidades > Cuotas |
| `/comunidades/fondos` | Fondos de reserva | Comunidades > Fondos |
| `/comunidades/presidente` | Portal presidente | Comunidades > Presidente |
| `/comunidades/renovaciones` | Renovaciones | Comunidades > Renovaciones |

#### 💰 FINANZAS Y CONTABILIDAD - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/contabilidad` | Contabilidad | Finanzas > Contabilidad |
| `/finanzas` | Panel financiero | Finanzas > Panel |
| `/presupuestos` | Presupuestos | Finanzas > Presupuestos |
| `/bi` | Business Intelligence | Finanzas > BI |
| `/estadisticas` | Estadísticas | Finanzas > Estadísticas |

#### 📊 ANALYTICS Y REPORTES - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/reportes/financieros` | Reportes financieros | Analytics > Reportes Financieros |
| `/reportes/operacionales` | Reportes operacionales | Analytics > Reportes Operacionales |
| `/valoracion-ia` | Valoración con IA | Analytics > Valoración IA |

#### 🔧 OPERACIONES Y MANTENIMIENTO - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/gestion-incidencias` | Gestión de incidencias | Operaciones > Incidencias |
| `/inspeccion-digital` | Inspección digital | Operaciones > Inspección Digital |
| `/servicios-limpieza` | Servicios de limpieza | Operaciones > Limpieza |
| `/servicios-concierge` | Servicios concierge | Operaciones > Concierge |
| `/guardias` | Gestión de guardias | Operaciones > Guardias |
| `/tareas` | Gestión de tareas | Operaciones > Tareas |
| `/planificacion` | Planificación | Operaciones > Planificación |
| `/mantenimiento-pro` | Mantenimiento avanzado | Operaciones > Mantenimiento Pro |

#### ⚡ ENERGÍA Y SOSTENIBILIDAD - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/energia` | Gestión energética | Innovación > Energía |
| `/energia-solar` | Energía solar | Innovación > Solar |
| `/puntos-carga` | Puntos de carga EV | Innovación > Puntos Carga |
| `/economia-circular/huertos` | Huertos urbanos | Innovación > Huertos |
| `/economia-circular/marketplace` | Marketplace circular | Innovación > Marketplace Circular |
| `/economia-circular/residuos` | Gestión de residuos | Innovación > Residuos |
| `/huerto-urbano` | Huerto urbano | Innovación > Huerto |
| `/instalaciones-deportivas` | Instalaciones deportivas | Innovación > Deportivas |

#### 🤖 AUTOMATIZACIÓN - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/automatizacion` | Panel automatización | Automatización > Panel |
| `/automatizacion/resumen` | Resumen | Automatización > Resumen |
| `/automatizacion-resumen` | Resumen (alt) | Automatización > Resumen |
| `/sincronizacion` | Sincronización | Automatización > Sincronización |
| `/sincronizacion-avanzada` | Sync avanzada | Automatización > Sync Avanzada |

#### 📞 COMUNICACIÓN - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/notificaciones/historial` | Historial notificaciones | Comunicación > Historial |
| `/notificaciones/plantillas` | Plantillas | Comunicación > Plantillas |
| `/notificaciones/reglas` | Reglas de notificación | Comunicación > Reglas |
| `/reviews` | Reseñas y valoraciones | Comunicación > Reseñas |

#### 📇 CRM - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/promociones` | Gestión de promociones | CRM > Promociones |
| `/subastas` | Subastas inmobiliarias | CRM > Subastas |
| `/microtransacciones` | Microtransacciones | CRM > Microtransacciones |

#### 🔧 RED DE AGENTES - Agregar sub-páginas
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/red-agentes/agentes` | Lista de agentes | CRM > Red Agentes > Agentes |
| `/red-agentes/dashboard` | Dashboard agentes | CRM > Red Agentes > Dashboard |
| `/red-agentes/formacion` | Formación | CRM > Red Agentes > Formación |
| `/red-agentes/zonas` | Zonas de operación | CRM > Red Agentes > Zonas |

#### 🔐 ADMIN - Agregar integraciones detalladas
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/admin/contasimple` | Integración Contasimple | Admin > Integraciones > Contasimple |
| `/admin/portales-inmobiliarios` | Portales inmobiliarios | Admin > Integraciones > Portales |
| `/admin/portales-externos` | Portales externos | Admin > Integraciones > Externos |
| `/admin/integraciones-banca` | Integraciones bancarias | Admin > Integraciones > Banca |
| `/admin/integraciones-contables` | Integraciones contables | Admin > Integraciones > Contabilidad |
| `/admin/integraciones-pagos` | Integraciones de pagos | Admin > Integraciones > Pagos |

#### 👤 PERFIL Y CONFIGURACIÓN - Agregar
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/perfil` | Perfil de usuario | Header > Perfil |
| `/permisos` | Gestión de permisos | Admin > Permisos |
| `/configuracion/notificaciones` | Config notificaciones | Configuración > Notificaciones |
| `/configuracion/ui-mode` | Modo UI | Configuración > UI |

#### 🧱 OTROS MÓDULOS
| Página | Descripción | Ubicación Propuesta |
|--------|-------------|---------------------|
| `/edificios` | Lista de edificios | Propiedades > Edificios |
| `/unidades` | Lista de unidades | Propiedades > Unidades |
| `/vacaciones` | Gestión de vacaciones | RRHH > Vacaciones |
| `/stock-gestion` | Gestión de stock | Inventario > Stock |
| `/blockchain/tokenizar` | Tokenización | Innovación > Tokenización |
| `/ocr` | Reconocimiento OCR | Herramientas > OCR |
| `/integraciones` | Panel integraciones | Config > Integraciones |

---

## 📈 RESUMEN

| Categoría | Cantidad | Acción |
|-----------|----------|--------|
| Sin acceso pero correcto (auth, landing, portales, rutas dinámicas) | ~180 | Ninguna |
| Legacy/duplicadas | ~40 | Limpiar en futuro |
| **REQUIEREN VISIBILIDAD** | **~106** | **Agregar al sidebar** |

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Prioridad 1 - Funcionalidades Core
1. ✅ Coliving (6 páginas)
2. ✅ Comunidades sub-páginas (6 páginas)
3. ✅ STR avanzado (5 páginas)
4. ✅ Finanzas/Contabilidad (5 páginas)

### Prioridad 2 - Operaciones
1. ✅ Operaciones y mantenimiento (8 páginas)
2. ✅ Automatización (5 páginas)
3. ✅ Construcción extras (5 páginas)

### Prioridad 3 - Innovación
1. ✅ Energía y sostenibilidad (8 páginas)
2. ✅ Comercial extras (5 páginas)

### Prioridad 4 - Admin y CRM
1. ✅ Admin integraciones (6 páginas)
2. ✅ CRM extras (3 páginas)
3. ✅ Red de agentes (4 páginas)

---

**Total a implementar:** ~65 páginas principales (el resto son sub-items o rutas dinámicas)
