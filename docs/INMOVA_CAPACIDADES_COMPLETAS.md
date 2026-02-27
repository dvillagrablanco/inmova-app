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
| Páginas funcionales | 577 |
| Endpoints API | 999 |
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

#### Nuevas Funcionalidades Financieras (Feb 2026)

- **Calendario de Vencimientos** — Timeline visual de contratos que vencen los próximos 12 meses, agrupados por edificio. Identifica picos (ej: "48 contratos de garaje vencen en marzo en Espronceda") para planificar renovaciones con antelación.
- **Control de Costes por Edificio** — Margen real por edificio: ingresos (rentas) menos gastos (IBI + comunidad + mantenimiento + seguros). Responde: "¿Cuánto cuesta mantener Piamonte?" y "¿Qué edificio tiene mejor margen?".
- **Rentabilidad por m²** — Cálculo €/m²/mes de cada unidad comparado con la media del edificio. Detecta automáticamente unidades infravaloradas (>15% bajo media) con potencial de incremento mensual y anual.
- **Alertas de Morosidad Escaladas** — Flujo automático de escalado por días de retraso:
  - **5 días**: Recordatorio amable (email)
  - **15 días**: Aviso formal (email + SMS)
  - **30 días**: Carta de requerimiento (PDF generado)
  - **60+ días**: Derivación a abogado (flag en sistema)
- **Export Fiscal Modelo 303/347** — Generación automática de datos para:
  - Modelo 303: IVA trimestral (facturas emitidas vs recibidas, distingue locales con IVA vs viviendas exentas)
  - Modelo 347: Operaciones con terceros >3.005,06€ agrupadas por NIF
- **Facturación Intragrupo** — Facturas entre Rovida↔Viroda↔Vidaro con asientos contables duales automáticos

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

#### Nuevas Funcionalidades para Gestores (Feb 2026)

- **Renovación en Lote** — Selecciona todos los contratos de un edificio → preview del incremento IPC → confirma → 115 contratos renovados en 2 minutos
- **Actualización IPC Automática** — Calcula el nuevo importe según IPC para contratos elegibles (>12 meses, tipo IPC). Soporta IPC + diferencial. Preview antes de aplicar.
- **Mapa Visual de Garajes** — Grid coloreado de plazas por planta y edificio: verde=ocupada, gris=libre, naranja=mantenimiento. Hover muestra inquilino y renta.
- **Alertas de Morosidad** — Dashboard de impagos con nivel de escalado (recordatorio → aviso → requerimiento → legal) y acción sugerida por cada caso.
- **OCR Extractos Bancarios** — Sube un PDF de extracto de Bankinter → la IA extrae automáticamente todos los movimientos (fecha, concepto, importe, ordenante). Sin teclear nada.

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

### Predicción de Morosidad (Nuevo)
- **Scoring 0-100** por inquilino basado en historial real de pagos
- Factores: % pagos atrasados (40%), pendientes actuales (30%), retraso medio en días (20%), tendencia reciente (10%)
- Clasifica en riesgo **alto** (≥70), **medio** (40-69), **bajo** (<40)
- Muestra la **renta total en riesgo** (suma de rentas de inquilinos de alto riesgo)
- Acción sugerida: "Contactar inmediatamente. No renovar contrato." / "Monitorizar. Recordatorios anticipados."

### Optimización de Rentas (Nuevo)
- Compara la renta actual de cada unidad con la **media del edificio por tipo** (vivienda, garaje, local)
- Detecta unidades **infravaloradas** (>15% por debajo de la media) con potencial de incremento
- Ejemplo: *"Plaza 45 de Espronceda renta a €85/mes pero la media del edificio es €110 → potencial +€25/mes"*
- Resumen: total de unidades infravaloradas y **potencial de incremento mensual y anual** del grupo

### Valoración IA
- Estimación del valor de mercado de cualquier propiedad
- Comparables automáticos basados en zona, superficie, tipología

### OCR de Extractos Bancarios (Nuevo)
- Sube un **PDF de extracto bancario** (Bankinter, BBVA, Santander, CaixaBank)
- Claude analiza el documento y extrae **todos los movimientos**: fecha, concepto, importe, ordenante/beneficiario
- Resumen automático: total ingresos, total gastos, saldo
- Elimina la necesidad de introducir movimientos manualmente

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
| **Morosidad escalada** | Alertas automáticas en 4 niveles (recordatorio → legal) para 243 inquilinos |
| **Rentabilidad por m²** | Detectar garajes que rentan por debajo de la media de Espronceda o Tejada |
| **Costes por edificio** | Saber exactamente cuánto cuesta mantener cada inmueble vs lo que genera |
| **Vencimientos 12 meses** | Planificar renovaciones: "48 garajes vencen en marzo" |
| **OCR Bankinter** | Subir extracto PDF y extraer movimientos sin teclear |

### Para Viroda Inversiones (101 inquilinos, 5 edificios)

| Funcionalidad | Beneficio directo |
|---------------|-------------------|
| **Portal de inquilinos** | 101 inquilinos gestionan pagos, incidencias y documentos sin llamar |
| **Contratos LAU** | Generación y firma digital de contratos actualizados a normativa |
| **Mantenimiento preventivo** | Calendario de ITEs, calderas, ascensores con alertas automáticas |
| **Seguros** | Gestión de pólizas, cotizaciones comparativas, alertas de vencimiento |
| **Scoring inquilinos** | Verificación de solvencia antes de firmar contrato |
| **Predicción morosidad** | Score 0-100 por inquilino basado en historial real de pagos |
| **Optimización rentas** | Detectar viviendas infravaloradas vs media del edificio |
| **Renovación lote** | Renovar todos los contratos de Silvela o Reina con IPC en 1 clic |

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
| **Vencimientos grupo** | Timeline 12 meses de contratos por vencer en todo el grupo |
| **Costes por edificio** | Margen real de cada inmueble (Piamonte €644K ing. — ¿cuánto coste?) |
| **Morosidad IA** | Renta total en riesgo del grupo + predicción por inquilino |

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
| Detectar inquilinos morosos | Revisar uno a uno (horas) |
| Saber qué garajes rentan bajo | Comparar en Excel (horas) |
| Introducir extracto bancario | Teclear línea a línea (2-3h) |
| Saber coste real por edificio | Cruzar múltiples fuentes (días) |
| Planificar renovaciones del año | Revisar cada contrato (día) |

### Con INMOVA

| Tarea | Tiempo con INMOVA |
|-------|-------------------|
| Generar recibos de 344 inquilinos | Automático (SEPA) |
| Conciliar movimientos bancarios | 1 clic (IA match) |
| Renovar 115 contratos de garaje | 2 minutos (lote + IPC) |
| Buscar un dato de un inquilino | 3 segundos (buscador global) |
| Preparar datos para gestoría | 1 clic (export API) |
| Comparar rendimiento Rovida vs Viroda | Siempre visible (dashboard) |
| Detectar inquilinos morosos | Automático (IA score 0-100 + alertas escaladas) |
| Saber qué garajes rentan bajo | 1 clic (€/m² + detección automática) |
| Introducir extracto bancario | Subir PDF → IA extrae todo (30 seg) |
| Saber coste real por edificio | Siempre visible (margen por edificio) |
| Planificar renovaciones del año | Calendario 12 meses automático |

**Ahorro estimado: 60-80 horas/mes** en tareas administrativas.

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
