# INMOVA — Plataforma de Gestión Inmobiliaria Integral

## Documento de Capacidades para el Grupo Vidaro

**Versión**: Febrero 2026  
**Preparado para**: Equipo de Gestión del Grupo Vidaro (Rovida S.L. + Viroda Inversiones S.L.U.)  
**Audiencia**: Director Financiero, Gestores de Cartera, Operador de Campo

---

## 1. ¿Qué es INMOVA?

INMOVA es una **plataforma PropTech multi-vertical** diseñada específicamente para sociedades patrimoniales como las del Grupo Vidaro. Centraliza la gestión de **viviendas, garajes, locales, oficinas y naves industriales** en una sola herramienta, eliminando el uso de Excel, WhatsApp y múltiples programas desconectados.

### Datos de la plataforma

| Métrica | Valor |
|---------|-------|
| Páginas funcionales | 575 |
| Endpoints API | 992 |
| Módulos disponibles | 34 secciones |
| Verticales de negocio | 7 |
| Integraciones | 15+ (Stripe, GoCardless, Bankinter, Signaturit, Claude IA, etc.) |

---

## 2. Experiencia Adaptada por Perfil

INMOVA muestra una interfaz **diferente según quién accede**. Cada perfil ve solo lo que necesita:

### 👔 Para el Director Financiero / Administrador

El perfil de administrador está diseñado para la **toma de decisiones estratégicas**:

- **Dashboard Consolidado** — KPIs del grupo completo en un vistazo: ingresos, gastos, ocupación, morosidad, cash-flow
- **Comparativa de Sociedades** — Rovida vs Viroda lado a lado: rentabilidad neta, ocupación, LTV, patrimonio
- **P&L Consolidado** — Cuenta de resultados del grupo: ingresos brutos, NOI, amortizaciones, resultado neto
- **Fiscal Grupo** — Simulador de Impuesto de Sociedades por sociedad con pagos fraccionados
- **Mapa de Cartera** — Vista geográfica de todos los inmuebles en Madrid, Palencia, Valladolid, Benidorm, Marbella
- **Hipotecas** — Control de deuda hipotecaria: capital pendiente, cuotas, vencimientos, LTV
- **Contabilidad** — Importación directa desde Zucchetti/Altai con 6 fuentes (Rovida/Vidaro/Viroda × 2025/2026)
- **Conciliación Bancaria** — Cruce automático de movimientos Bankinter con pagos SEPA (GoCardless)
- **BI / Business Intelligence** — Cuadros de mando avanzados con métricas personalizables
- **Export Gestoría** — Generación de datos para Modelo 303 (IVA trimestral) y 347 (operaciones >3.005€)
- **Facturación Intragrupo** — Facturas entre Rovida↔Viroda↔Vidaro con asientos contables duales
- **Activos del Grupo** — Ficha detallada por inmueble: precio compra, valor mercado, amortización, plusvalía

**Acceso exclusivo adicional**: Open Banking, Presupuestos, Automatización, Workflows, Innovación (ESG, IoT, Blockchain).

---

### 📋 Para el Gestor de Cartera

El perfil de gestor está optimizado para la **operación diaria**:

#### Gestión de Inmuebles
- **Edificios** — Ficha completa de cada edificio: dirección, año, unidades, IBI, estado, documentos
- **Unidades** — Viviendas, garajes, locales, trasteros con referencia catastral, superficie, renta, estado
- **Garajes y Trasteros** — Dashboard específico con:
  - KPIs: plazas totales, ocupadas, disponibles, renta media por plaza
  - **Mapa visual de plazas**: grid coloreado por planta y edificio (verde=ocupada, gris=libre)
  - Desglose por edificio: Espronceda (115), Tejada (56), M.Pelayo (21)...
- **Naves Industriales** — Fichas con altura libre, carga de suelo, muelles de carga, potencia eléctrica

#### Gestión de Inquilinos
- **Base de Inquilinos** — 344 inquilinos activos (243 Rovida + 101 Viroda) con datos completos
- **Matching IA** — Algoritmo que sugiere el mejor inquilino para cada unidad disponible
- **Candidatos** — Pipeline de candidatos con scoring de solvencia
- **Portal de Inquilinos** — Los inquilinos acceden a su portal propio para:
  - Ver y pagar recibos pendientes
  - Reportar incidencias con fotos
  - Descargar contratos y documentos
  - Comunicarse con el gestor

#### Contratos y Pagos
- **Contratos** — CRUD completo con tipos: residencial, temporada, garaje, local comercial
- **Renovaciones en Lote** — Seleccionar contratos por edificio y renovar todos con IPC en un clic
- **Actualización IPC** — Cálculo automático del nuevo importe según IPC publicado, con preview antes de aplicar
- **Pagos** — Seguimiento de cobros con estados: pendiente, pagado, atrasado
- **Cobros SEPA** — Integración GoCardless para domiciliación bancaria automática
- **Gastos** — Registro de gastos por edificio/unidad con categorización

#### Operaciones Diarias
- **Mantenimiento** — Gestión de solicitudes con prioridad y asignación a proveedor
- **Mantenimiento Preventivo** — Calendario unificado: ITEs, revisiones caldera, ascensor, seguros
- **Incidencias** — Tracking con clasificación IA automática (fontanería, electricidad, HVAC...)
- **Tareas** — Lista de tareas con asignación y seguimiento
- **Calendario** — Vista mensual/semanal de vencimientos, visitas, mantenimientos
- **Proveedores** — Base de proveedores con valoración y histórico

#### Documentación
- **Documentos** — Repositorio centralizado por edificio/inquilino/contrato
- **Firma Digital** — Contratos firmados electrónicamente via Signaturit
- **Plantillas** — Contratos LAU pre-configurados
- **Seguros** — Pólizas, cotizaciones, proveedores de seguros, análisis comparativo
- **IA Documental** — Subir un contrato PDF y la IA extrae automáticamente: inquilino, renta, fechas, unidad

#### Comunicación
- **Chat** — Mensajería interna con inquilinos y proveedores
- **Notificaciones** — Alertas de vencimientos, impagos, incidencias
- **CRM** — Pipeline de leads y actividades comerciales

#### Analítica
- **Estadísticas** — Métricas operativas: ocupación por edificio, evolución de renta, morosidad
- **Reportes Operacionales** — Informes generados automáticamente
- **Asistente IA** — Pregunta en lenguaje natural: "¿Cuántos garajes libres tiene Espronceda?" y obtén respuesta inmediata

---

### 👷 Para el Operador de Campo

El perfil de operador muestra **solo lo necesario para el trabajo diario**:

- **Órdenes de Trabajo** — Lista de trabajos asignados con prioridad, dirección, contacto
- **Incidencias** — Incidencias pendientes asignadas con fotos e historial
- **Tareas** — Checklist diario de tareas pendientes
- **Calendario** — Agenda de visitas y trabajos programados
- **Comunicación** — Chat directo con el gestor para consultas rápidas

---

## 3. Inteligencia Artificial Integrada

INMOVA incorpora IA (Claude de Anthropic) en múltiples puntos:

### Asistente IA Conversacional
- **30+ herramientas** integradas: buscar edificios, inquilinos, contratos, pagos, crear mantenimiento, calcular ROI...
- Pregunta en español: *"¿Cuántos pagos pendientes tiene Rovida este mes?"*
- Ejecuta acciones: *"Crea una solicitud de mantenimiento para la plaza 45 de Espronceda"*

### IA Documental
- **Procesamiento de Contratos** — Sube un PDF y la IA extrae: inquilino, DNI, renta, fechas, edificio, unidad
- **Procesamiento de Escrituras** — Extrae datos de escrituras notariales
- **Análisis de Propuestas** — Evalúa propuestas de brokers con análisis independiente
- **Clasificación Automática** — Identifica tipo de documento, valida propiedad (CIF), sugiere acciones

### Sugerencias Proactivas
- La IA analiza datos reales de la empresa y genera sugerencias accionables:
  - *"5 contratos de garaje en Espronceda vencen en marzo. ¿Renovar en lote con IPC 2.8%?"*
  - *"3 pagos atrasados suman €4.500. ¿Enviar recordatorio?"*
  - *"La unidad 4ºA de Silvela lleva 45 días vacía. ¿Publicar anuncio?"*

### Conciliación Inteligente
- Matching automático de movimientos bancarios con pagos por:
  - Importe exacto (±0.01€) — ideal para garajes con renta fija
  - Nombre del inquilino en concepto bancario
  - Niveles de confianza: alta, media, baja

### Valoración IA
- Estimación del valor de mercado de cualquier propiedad
- Comparables automáticos basados en zona, superficie, tipología

---

## 4. Funcionalidades Específicas para el Grupo Vidaro

### Para Rovida S.L. (243 inquilinos, 17 inmuebles)

| Funcionalidad | Beneficio directo |
|---------------|-------------------|
| **Mapa visual de garajes** | Ver las 115 plazas de Espronceda, 56 de Tejada de un vistazo — verde ocupada, gris libre |
| **Renovación en lote** | Renovar todos los garajes de un edificio con IPC en 1 minuto (antes: 1 hora) |
| **Cobros SEPA** | Domiciliación bancaria automática vía GoCardless — los 243 inquilinos pagan solos |
| **Conciliación Bankinter** | Cruce automático de movimientos con pagos SEPA — 0 conciliación manual |
| **Naves industriales** | Fichas detalladas de Cuba 48-52 (Palencia) y Metal 4 (Valladolid) con specs técnicos |
| **IPC automático** | Cálculo y aplicación del incremento anual en 1 clic con preview |

### Para Viroda Inversiones (101 inquilinos, 5 edificios)

| Funcionalidad | Beneficio directo |
|---------------|-------------------|
| **Portal de inquilinos** | 101 inquilinos gestionan pagos, incidencias y documentos sin llamar |
| **Contratos LAU** | Generación y firma digital de contratos actualizados a normativa |
| **Mantenimiento preventivo** | Calendario de ITEs, calderas, ascensores con alertas automáticas |
| **Seguros** | Gestión de pólizas, cotizaciones comparativas, alertas de vencimiento |
| **Scoring inquilinos** | Verificación de solvencia antes de firmar contrato |

### Para Vidaro Inversiones (Holding)

| Funcionalidad | Beneficio directo |
|---------------|-------------------|
| **Dashboard consolidado** | KPIs de Rovida + Viroda + Vidaro en una sola pantalla |
| **Comparativa** | Tabla lado a lado: ¿qué sociedad rinde más? |
| **P&L consolidado** | Cuenta de resultados del grupo completo |
| **Fiscal** | Simulador IS por sociedad con amortizaciones, intereses deducibles, pagos fraccionados |
| **Facturación intragrupo** | Facturas entre sociedades con asientos contables automáticos |
| **Mapa de cartera** | Vista geográfica de 17+ inmuebles en 5 ciudades |
| **Export gestoría** | Datos para Modelo 303 y 347 listos para descargar |

---

## 5. Seguridad y Cumplimiento

| Aspecto | Implementación |
|---------|----------------|
| **Autenticación** | NextAuth.js con CSRF, 2FA disponible, session JWT |
| **Autorización** | 6 roles diferenciados, cada uno ve solo lo que necesita |
| **Multi-empresa** | Selector de sociedad con aislamiento total de datos entre Rovida, Viroda y Vidaro |
| **Encriptación** | Passwords bcrypt, HTTPS forzado, secrets en variables de entorno |
| **Auditoría** | Log de acciones, Sentry para errores, rate limiting en APIs |
| **GDPR** | Consent banner, gestión de datos personales, derecho al olvido |
| **Headers seguridad** | CSP, X-Frame-Options, X-Content-Type-Options, HSTS |
| **Backups** | PostgreSQL con backups programados |

---

## 6. Integraciones Activas

| Servicio | Uso | Estado |
|----------|-----|--------|
| **GoCardless** | Cobros SEPA Direct Debit | ✅ Activo |
| **Bankinter (Nordigen)** | Lectura movimientos bancarios | ✅ Activo |
| **Stripe** | Pagos con tarjeta, suscripciones | ✅ Activo |
| **Signaturit** | Firma digital de contratos | ✅ Configurado |
| **Claude (Anthropic)** | Asistente IA, procesamiento documentos | ✅ Activo |
| **Gmail SMTP** | Emails transaccionales | ✅ Activo |
| **Google Analytics** | Métricas de uso | ✅ Activo |
| **Zucchetti/Altai** | Importación contabilidad | ✅ 6 fuentes |
| **OpenStreetMap** | Mapas y geocoding | ✅ Activo |
| **Sentry** | Monitorización de errores | ✅ Activo |
| **Cloudflare** | CDN, SSL, DDoS protection | ✅ Activo |
| **Crisp** | Chat de soporte en vivo | ✅ Activo |

---

## 7. Tecnología

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 14 + React 18 + TypeScript |
| UI | Tailwind CSS + Shadcn/ui (148 componentes) |
| Backend | API Routes (992 endpoints) |
| Base de datos | PostgreSQL + Prisma ORM |
| Cache | Redis (rate limiting, cache) |
| Hosting | Servidor propio (Hetzner) + PM2 cluster |
| SSL | Cloudflare (gestión automática) |
| CI/CD | GitHub + deploy SSH automatizado |

---

## 8. Acceso Móvil

INMOVA es **100% responsive** (mobile-first):

- **Navegación inferior** en móvil con acceso rápido a Dashboard, Propiedades, Inquilinos, Pagos
- **Sidebar colapsable** con gestos táctiles
- **Formularios optimizados** (font-size 16px para evitar zoom en iOS)
- **PWA** — Instalable como app en el móvil
- **Touch targets** de 44x44px mínimo (estándar Apple)

El operador de campo puede gestionar incidencias, ver órdenes de trabajo y comunicarse desde su teléfono.

---

## 9. Números que Importan

### Antes de INMOVA (Excel + WhatsApp + Programas separados)

| Tarea | Tiempo estimado |
|-------|----------------|
| Generar recibos de 344 inquilinos | 8-10 horas/mes |
| Conciliar movimientos bancarios | 4-6 horas/mes |
| Renovar 115 contratos de garaje | 2-3 días |
| Buscar un dato de un inquilino | 5-10 minutos |
| Preparar datos para gestoría (303/347) | 1-2 días/trimestre |
| Comparar rendimiento Rovida vs Viroda | Horas (manual) |

### Con INMOVA

| Tarea | Tiempo con INMOVA |
|-------|-------------------|
| Generar recibos de 344 inquilinos | Automático (SEPA) |
| Conciliar movimientos bancarios | 1 clic (IA match) |
| Renovar 115 contratos de garaje | 2 minutos (lote + IPC) |
| Buscar un dato de un inquilino | 3 segundos (buscador global) |
| Preparar datos para gestoría | 1 clic (export API) |
| Comparar rendimiento Rovida vs Viroda | Siempre visible (dashboard) |

**Ahorro estimado: 40-60 horas/mes** en tareas administrativas.

---

## 10. URLs de Acceso

| Recurso | URL |
|---------|-----|
| Plataforma | https://inmovaapp.com |
| Login | https://inmovaapp.com/login |
| Dashboard | https://inmovaapp.com/dashboard |
| Health Check | https://inmovaapp.com/api/health |

---

*Documento generado el 27 de febrero de 2026.*  
*INMOVA — Plataforma PropTech Multi-Vertical para Gestión Inmobiliaria Integral.*
