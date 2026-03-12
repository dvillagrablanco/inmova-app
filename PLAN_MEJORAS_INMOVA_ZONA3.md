# Plan de Mejoras para Inmova — Basado en Análisis ZONA3

## Fuente del análisis

Scraping profundo de `campus.zona3.club` (Club Privado de +3500 Inversores Inmobiliarios):
- 121 páginas, 174 videos de masterclasses, 38 recursos descargables
- 4 itinerarios de inversión (Alquiler Tradicional, Habitaciones, Turístico, Flipping)
- Cada itinerario cubre 9-10 fases: Mentalidad → Análisis → Búsqueda → Negociación → Financiación → Compra → Reforma → Gestión

Lo que sigue son mejoras concretas a funcionalidades **existentes** de Inmova, extraídas del conocimiento práctico de los materiales de ZONA3.

---

## MEJORA 1 — Calculadoras de rentabilidad especializadas por modalidad

### Problema actual
Inmova tiene calculadora de hipoteca, sensibilidad y fiscal genérica. ZONA3 ofrece **4 calculadoras Excel distintas** adaptadas a cada modalidad, con variables específicas que Inmova no contempla.

### Mejoras concretas

#### 1a. Calculadora Alquiler Tradicional (nueva)
Variables que faltan en Inmova:
- **IBI anual** (ya existe en Unit pero no se usa en cálculo de rentabilidad)
- **Seguro hogar** (anual)
- **Seguro de impago** (% sobre renta, típicamente 3-5% renta anual)
- **Derrama estimada** (anual)
- **Gastos de comunidad** (ya existe en Building/Unit pero no se integra)
- **Vacío estimado** (meses/año sin inquilino, típico 0.5-1 mes)
- **Gastos de gestión** (si usa gestor externo: 8-12% sobre renta)
- **Gastos de mantenimiento** (regla: 1-2% del valor del inmueble/año)
- **Incremento IPC anual** sobre la renta
- Resultado: **Rentabilidad bruta, neta y cashflow real mensual/anual**

#### 1b. Calculadora Alquiler por Habitaciones (nueva)
Variables adicionales a la anterior:
- **Número de habitaciones alquilables**
- **Renta por habitación** (individual)
- **Ocupación media** (%, por rotación mayor que en alquiler tradicional)
- **Suministros incluidos** (electricidad, agua, internet — los paga el propietario)
- **Limpieza zonas comunes** (coste mensual)
- **Amueblamiento** (inversión inicial por habitación)
- **Rotación anual estimada** (alquiler habitaciones tiene más turnover)
- Resultado: **Rentabilidad bruta, neta, cashflow por habitación y total**

#### 1c. Calculadora Alquiler Turístico (nueva)
Variables adicionales:
- **Tarifa noche temporada alta/media/baja**
- **Ocupación por temporada** (% noches ocupadas)
- **Comisión plataforma** (Airbnb 3%, Booking 15%, directo 0%)
- **Limpieza por estancia** (coste por check-out)
- **Amenities y reposición** (sábanas, toallas, consumibles)
- **Licencia turística** (coste obtención + renovación)
- **Gestor/channel manager** (mensual)
- **Fotografía profesional** (inversión única)
- **Temporalidad**: distribución de ingresos mes a mes
- Resultado: **Ingreso bruto anual, neto, RevPAR, cashflow mensual estacionalizado**

#### 1d. Calculadora CRV — Comprar, Reformar, Vender (nueva)
Variables:
- **Precio compra**
- **Gastos compra** (ITP/IVA, notaría, registro, gestoría — ya los calcula Inmova en fiscal)
- **Coste reforma** (4 niveles ya existen en RenovationCalculator pero no se integran)
- **Tiempo reforma** (meses)
- **Coste financiación durante reforma** (intereses del préstamo durante meses sin ingresos)
- **Costes de tenencia** (IBI, comunidad, suministros mínimos durante obra)
- **Precio venta estimado** (conectar con valoración IA existente)
- **Gastos venta** (plusvalía municipal, IRPF sobre ganancia, comisión inmobiliaria 3-5%)
- **Tiempo estimado de venta** (meses)
- Resultado: **Beneficio neto, ROI sobre capital invertido, rentabilidad anualizada, punto de equilibrio**

### Ubicación en app
`/dashboard/herramientas/calculadoras` — Página con las 4 calculadoras + las existentes (hipoteca, sensibilidad, fiscal).

### Integración clave
Todas las calculadoras deben poder **prellenarse automáticamente** con datos de una propiedad seleccionada del portfolio de Inmova (Unit → precioCompra, superficie, gastosComunidad, ibiAnual, rentaMensual, etc.).

---

## MEJORA 2 — Checklist de visita y pre-compra de inmueble

### Problema actual
Inmova tiene due diligence checklist genérica (nota simple, cargas, catastro, IBI, etc.) pero le falta la **inspección física** del inmueble, que es donde los inversores de ZONA3 ponen más énfasis.

### Mejora: Checklist de visita completa

Basado en la masterclass "Qué revisar antes de comprar un piso antiguo" (Edu, arquitecto):

#### Estructura del edificio
- [ ] Estado de la fachada (grietas, humedades, desconchones)
- [ ] Bajantes visibles (material, estado, manchas)
- [ ] Cubierta/tejado (filtraciones, estado general)
- [ ] Cimentación (información del ITE)
- [ ] Año de construcción y última reforma comunitaria
- [ ] Estado del portal y zonas comunes
- [ ] Ascensor (año instalación, última revisión)

#### Interior de la vivienda
- [ ] Instalación eléctrica (año, cuadro, tomas de tierra, boletín)
- [ ] Fontanería (material tuberías: cobre/PVC/plomo, presión agua)
- [ ] Humedades (paredes, techos, bajo ventanas, baños)
- [ ] Carpintería exterior (tipo ventanas, aislamiento, estado)
- [ ] Suelos (material, estado, nivelación)
- [ ] Cocina y baños (estado, necesidad de reforma)
- [ ] Caldera/Termo (tipo, año, última revisión)
- [ ] Aislamiento térmico y acústico

#### Documentación
- [ ] Nota simple actualizada (cargas, titularidad, superficie registrada)
- [ ] Referencia catastral (superficie catastral vs registral vs real)
- [ ] IBI (importe, valor catastral)
- [ ] CEE (Certificado Energético)
- [ ] ITE (Inspección Técnica del Edificio)
- [ ] Último acta de comunidad (derramas pendientes/aprobadas)
- [ ] Recibos de comunidad últimos 12 meses
- [ ] Certificado de deuda cero con la comunidad
- [ ] Licencia de primera ocupación / cédula de habitabilidad

#### Entorno
- [ ] Transporte público cercano
- [ ] Servicios (supermercados, colegios, sanidad)
- [ ] Zona y barrio (tendencia de precios, demanda de alquiler)
- [ ] Competencia (inmuebles similares en alquiler en la zona)
- [ ] Regulación local (zonas tensionadas, licencias turísticas, etc.)

### Implementación
- Añadir como pestaña en la ficha de cada Unit/Property
- Checkbox interactivo con notas y fotos por ítem
- Exportable a PDF para llevar a la visita
- Conectar ítems documentales con los que ya tiene Inmova (nota simple, catastro, CEE, ITE)

---

## MEJORA 3 — Nota simple: Parser e interpretación automática

### Problema actual
ZONA3 dedica una masterclass entera a "Interpretación de notas simples" (Andreas Ruigómez, abogado). Inmova no tiene ninguna funcionalidad para interpretar notas simples.

### Mejora: Subida y análisis IA de nota simple

**Input**: Usuario sube PDF de nota simple del Registro de la Propiedad.

**Output (vía Claude/IA)**:
- **Titulares**: Nombres, % propiedad, régimen (gananciales, separación bienes)
- **Descripción finca**: Superficie registrada, planta, linderos
- **Cargas**: Hipotecas (importe pendiente, banco, fecha), embargos, servidumbres, condiciones resolutorias
- **Afecciones fiscales**: ITP/AJD pendiente de prescripción
- **Documentos pendientes de despacho**: Si hay algo en trámite
- **Alertas**: Cargas que impiden la compra, discrepancias de superficie, problemas de titularidad
- **Resumen ejecutivo**: Semáforo verde/amarillo/rojo para la operación

### Integración
- Botón "Subir nota simple" en la ficha de cada propiedad/oportunidad
- Almacenar resultado en BD vinculado a la Unit/Oportunidad
- Alimentar la Due Diligence checklist automáticamente

---

## MEJORA 4 — Negociación: Herramienta de oferta formal

### Problema actual
ZONA3 proporciona plantilla de "Documento de oferta formal" y masterclass completa de negociación con 10 errores a evitar + fases de negociación. Inmova no tiene nada de negociación.

### Mejora: Generador de documento de oferta

**Datos de entrada**:
- Datos del comprador (prellenados del usuario)
- Datos del inmueble (prellenados de la propiedad)
- Precio ofertado
- Condiciones (financiación, plazo, arras, cláusulas)
- Fecha límite de validez de la oferta

**Output**: PDF profesional de oferta formal.

### Mejora adicional: Comparador de ofertas

Basado en la "Plantilla comparativa resumen ofertas" de ZONA3:
- Tabla comparativa de múltiples inmuebles en análisis
- Columnas: Precio, €/m², Rentabilidad bruta/neta, Gastos reforma, Estado, Puntuación
- Ordenable por cualquier columna
- Vista lado a lado para toma de decisiones

### Ubicación
Integrar en el Pipeline Kanban de oportunidades, en la etapa "Negociación/Ofertada".

---

## MEJORA 5 — Financiación: Dossier para el banco

### Problema actual
ZONA3 menciona explícitamente la "Plantilla de resumen de situación financiera para el banco" como recurso. Inmova no genera nada orientado a presentar al banco.

### Mejora: Generador de dossier financiero para el banco

**Datos que recoge** (del usuario + propiedades en Inmova):
- Ingresos mensuales del inversor (nómina/autónomo)
- Patrimonio actual: inmuebles en propiedad (desde el portfolio de Inmova)
- Rentas actuales percibidas (desde contratos activos)
- Deudas/hipotecas actuales (si las registra)
- Ratio de endeudamiento actual
- Operación propuesta: inmueble, precio, financiación solicitada, destino (inversión)
- Proyección de cashflow con la nueva operación

**Output**: PDF profesional para presentar al broker/banco, con:
- Resumen patrimonial
- Flujo de caja actual y proyectado
- Ratio endeudamiento actual y post-compra
- Rentabilidad esperada de la operación

### Integración
- Botón "Generar dossier para banco" en la ficha de cada oportunidad de inversión
- Prellenar con datos del portfolio actual del usuario

---

## MEJORA 6 — Reforma: Estimador detallado con Gantt

### Problema actual
Inmova tiene `RenovationCalculator` con 4 niveles (básica/media/integral/premium) y coste por m². Es útil pero muy genérico. ZONA3 ofrece una "Plantilla de estimación de reforma y plan de proyecto (diagrama de Gantt)".

### Mejoras al RenovationCalculator

#### 6a. Desglose por partidas
En lugar de solo 4 niveles genéricos, permitir desglose:

| Partida | Coste est. | Incluir |
|---------|-----------|---------|
| Demolición y retirada | X €/m² | ☑ |
| Albañilería | X €/m² | ☑ |
| Fontanería | X € | ☑ |
| Electricidad | X € | ☑ |
| Suelos | X €/m² | ☑ |
| Pintura | X €/m² | ☑ |
| Cocina (muebles + electrodomésticos) | X € | ☑ |
| Baño completo | X € por baño | ☑ |
| Carpintería (puertas) | X € por puerta | ☑ |
| Ventanas | X € por ventana | ☐ |
| Aire acondicionado | X € | ☐ |
| Caldera | X € | ☐ |

Con precios orientativos editables (basados en datos de ZONA3: "precios, criterios y trucos" de El Excel de Álex).

#### 6b. Timeline / Gantt simplificado
- Duración estimada por partida
- Dependencias (fontanería antes que suelos, etc.)
- Vista de timeline visual
- Fecha inicio → Fecha fin estimada
- Coste financiero durante la reforma (intereses hipoteca sin ingresos)

#### 6c. Kit de Home Staging
Basado en recurso ZONA3 "Kit de mobiliario y home staging":
- Lista de muebles/decoración esenciales por tipo de vivienda
- Presupuesto estimado de home staging (diferenciando alquiler vs venta)
- ROI del home staging (incremento esperado de renta o precio de venta)

---

## MEJORA 7 — Gestión: Plantilla de ingresos y gastos de inmuebles

### Problema actual
Inmova gestiona propiedades, contratos e inquilinos pero no tiene un **dashboard financiero por inmueble** que consolide ingresos vs gastos reales.

### Mejora: P&L (Cuenta de resultados) por inmueble

Basado en la "Plantilla de ingresos y gastos de inmuebles" de ZONA3 y la masterclass de Toni Fernández (30+ viviendas):

**Ingresos**:
- Renta mensual cobrada (desde contratos)
- Meses vacíos
- Ingresos extras (garaje, trastero)

**Gastos fijos**:
- Hipoteca (capital + intereses)
- Comunidad
- IBI
- Seguro hogar
- Seguro impago

**Gastos variables**:
- Reparaciones/mantenimiento
- Gestión (si la hay)
- Suministros (si los paga propietario, ej: habitaciones)
- Derramas

**Resultado**:
- Cashflow mensual real
- Cashflow anual
- Rentabilidad neta sobre inversión total
- Comparativa mes a mes (gráfico)
- Acumulado anual

### Implementación
- Nueva pestaña "Finanzas" en la ficha de cada propiedad
- Alimentar automáticamente desde pagos de inquilinos, contratos, gastos registrados
- Dashboard de portfolio: P&L consolidado de todos los inmuebles

---

## MEJORA 8 — Oportunidades: Búsqueda de inmuebles con okupas

### Problema actual
Inmova tiene fuentes de mercado (BOE subastas, banca, divergencia IA, tendencias, crowdfunding) pero no tiene la vertical de "inmuebles con ocupas/inquiocupas" que ZONA3 cubre ampliamente.

### Mejora
- Nueva fuente en `lib/market-opportunities.ts`: **Inmuebles con incidencias** (ocupas, inquilinos morosos)
- Scoring ajustado: mayor descuento pero mayor riesgo legal
- Due diligence específica:
  - [ ] Verificar si hay ocupantes (registro, visita, vecinos)
  - [ ] Tipo: okupa ilegal vs inquilino moroso (proceso legal diferente)
  - [ ] Estado del procedimiento judicial (si existe)
  - [ ] Tiempo estimado de desahucio por provincia
  - [ ] Coste legal estimado del desahucio
  - [ ] Descuento necesario para que la operación sea rentable

---

## MEJORA 9 — Valoración IA: Integrar datos de zona de inversión

### Problema actual
La valoración de Inmova (`lib/valoracion-service.ts`) usa comparables internos con ajustes estáticos. ZONA3 dedica una masterclass entera a "Selecciona una buena zona de inversión como un profesional" (Jaime Gil, CEO PropHero) con métricas de zona.

### Mejoras a la valoración

#### 9a. Métricas de zona
Añadir al análisis de valoración/oportunidad:
- **Precio medio €/m² de la zona** (compra y alquiler)
- **Tendencia de precios** últimos 12/24/36 meses (subiendo/bajando/estable)
- **Rentabilidad bruta media** de la zona
- **Demanda de alquiler** (tiempo medio para alquilar)
- **Stock disponible** (nº inmuebles en venta/alquiler)
- **Ratio precio/alquiler** (nº años de alquiler para pagar compra)
- **Población y tendencia demográfica**
- **Renta per cápita** de la zona
- **Tasa de desempleo** provincial

#### 9b. Comprobación de valores de Hacienda
Basado en el recurso de ZONA3 "Guía de comprobación de valores de bienes inmuebles":
- Cálculo del **valor de referencia catastral** (para ITP)
- Alerta si el precio de compra es inferior al valor de referencia (implicaciones fiscales)
- Enlace directo a la sede electrónica del Catastro para consulta

---

## MEJORA 10 — Contratos: Plantillas especializadas

### Problema actual
Inmova genera contratos con IA (Claude) para vivienda habitual, temporada, local comercial y garaje. ZONA3 ofrece packs de contratos específicos que Inmova no tiene.

### Contratos a añadir
1. **Contrato de alquiler por habitaciones** — No regulado por LAU, régimen de Código Civil. Cláusulas específicas: zonas comunes, suministros incluidos, fianza por habitación, inventario por habitación, normas de convivencia.
2. **Contrato rent-to-rent** — Subarriendo autorizado. Cláusulas: autorización del propietario, plazo mínimo, condiciones de subarriendo, responsabilidad del arrendatario principal.
3. **Contrato de reforma** — Entre propietario y reformista. Cláusulas: presupuesto cerrado, penalización por retrasos, calidades especificadas, garantía post-obra, forma de pago por hitos.
4. **Documento de arras/señal** — Arras confirmatorias, penitenciales o penales. Condiciones, plazos, penalización.
5. **Contrato de alquiler de trastero/garaje** — Cláusulas simplificadas, no LAU.

### Implementación
Extender el generador de contratos IA existente (`/api/ai/generate-contract`) con estos tipos. Añadir template de prompt específico para cada tipo de contrato con las cláusulas pertinentes.

---

## MEJORA 11 — Compra: Guía paso a paso integrada en el pipeline

### Problema actual
El Pipeline Kanban de oportunidades tiene 6 etapas (Descubierta → Adquirida) pero no guía al usuario sobre qué hacer en cada etapa.

### Mejora: Acciones y checklist por etapa

Basado en el itinerario "Paso 7: Compra" de ZONA3 y la masterclass del notario:

| Etapa Pipeline | Acciones | Documentos | Herramientas Inmova |
|----------------|----------|------------|---------------------|
| **Descubierta** | Análisis inicial rápido | — | Scoring IA, calculadora rápida |
| **Analizada** | Due diligence completa, visita física | Nota simple, catastro, IBI, CEE | Checklist visita (MEJORA 2), Parser nota simple (MEJORA 3) |
| **Negociación** | Preparar oferta, negociar precio | Comparador ofertas | Generador oferta (MEJORA 4), Comparador (MEJORA 4) |
| **Ofertada** | Firmar arras, solicitar hipoteca | Arras, dossier banco | Contrato arras (MEJORA 10), Dossier banco (MEJORA 5) |
| **Adquirida** | Escritura, registro, alta suministros | Escritura, registro | Ficha propiedad, contratos alquiler |
| **Descartada** | Documentar motivo | — | — |

### Implementación
- En cada tarjeta del Kanban, mostrar sidebar con acciones recomendadas para esa etapa
- Checklist específico por etapa
- Botones directos a las herramientas relevantes

---

## MEJORA 12 — Fiscalidad: IRPF detallado para inversores

### Problema actual
Inmova calcula ITP/IVA de compra e IRPF básico. ZONA3 dedica masterclass a "Cómo declarar los alquileres en el IRPF" con detalle de casillas, gastos deducibles y errores frecuentes.

### Mejoras al cálculo fiscal

#### Gastos deducibles del alquiler (actualmente no calculados):
- Intereses hipoteca (deducible al 100% si inmueble en alquiler)
- Amortización del inmueble (3% sobre valor construcción, no suelo)
- Amortización muebles (10% anual)
- IBI
- Comunidad
- Seguro hogar
- Seguro impago
- Gastos reparación y conservación
- Gastos gestión y administración
- Gastos jurídicos
- Suministros (si los paga propietario)

#### Reducción por vivienda habitual:
- 50% reducción (nueva ley) si renta ≤ límite zona tensionada
- 60% reducción (antigua ley, contratos antes 2024)
- 70% si jóvenes menores de 35 años
- 90% si zona tensionada con bajada de renta ≥5%

#### Output mejorado:
- Base imponible del alquiler (ingresos - gastos deducibles)
- Reducción aplicable
- Base tras reducción
- IRPF a pagar (con tramos progresivos reales)
- **Ahorro fiscal** si se constituye SL (comparativa persona física vs sociedad)

---

## PRIORIZACIÓN

| # | Mejora | Impacto | Esfuerzo | Prioridad |
|---|--------|---------|----------|-----------|
| 1 | Calculadoras especializadas (4 modalidades) | 🔴 Muy alto | 20h | P0 |
| 7 | P&L por inmueble (ingresos/gastos) | 🔴 Muy alto | 16h | P0 |
| 2 | Checklist de visita pre-compra | 🟡 Alto | 8h | P1 |
| 3 | Parser nota simple con IA | 🟡 Alto | 12h | P1 |
| 12 | Fiscalidad IRPF detallada | 🟡 Alto | 12h | P1 |
| 11 | Guía por etapa en pipeline Kanban | 🟡 Alto | 8h | P1 |
| 6 | Estimador reforma desglosado + Gantt | 🟡 Alto | 16h | P1 |
| 5 | Dossier financiero para banco | 🟢 Medio | 10h | P2 |
| 4 | Generador oferta formal + comparador | 🟢 Medio | 10h | P2 |
| 10 | Contratos especializados (5 nuevos tipos) | 🟢 Medio | 8h | P2 |
| 9 | Valoración con métricas de zona | 🟢 Medio | 16h | P2 |
| 8 | Oportunidades con okupas | 🔵 Bajo | 8h | P3 |

### Timeline sugerido

**Sprint 1 (Sem 1-2)**: Calculadoras especializadas + P&L por inmueble
**Sprint 2 (Sem 3-4)**: Checklist visita + Parser nota simple + Fiscalidad IRPF
**Sprint 3 (Sem 5-6)**: Pipeline guiado + Reforma desglosada
**Sprint 4 (Sem 7-8)**: Dossier banco + Oferta formal + Contratos nuevos
**Sprint 5 (Sem 9-10)**: Valoración con zona + Okupas

**Total estimado: ~144h de desarrollo**

---

*Generado el 12 de marzo de 2026*
*Basado en scraping de campus.zona3.club: 121 páginas, 174 videos, 38 descargas, 136K chars de contenido*
