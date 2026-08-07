# Investigación de mercado — Webs de detección de oportunidades inmobiliarias

Análisis de las principales plataformas de *deal-sourcing* y analítica inmobiliaria (España e internacional) y **qué funcionalidad se ha traído (o se propone traer) a INMOSEARCH**.

> Objetivo: que INMOSEARCH reúna, de forma legal, lo mejor de cada herramienta para detectar oportunidades de flip y alquiler para Enxames.

---

## 1. Portales y fuentes (España)

| Plataforma | Qué es | Uso en INMOSEARCH |
| --- | --- | --- |
| **Idealista** | Portal líder. Tiene **API oficial** (OAuth2, con aprobación) e **informes de precios** por zona. | Conector API oficial + ingestión de **alertas por email**. Índices de precio como comparables (roadmap barrio/CP). |
| **Fotocasa / Habitaclia / Pisos.com / Milanuncios** | Portales de anuncios. Sin API abierta amplia. | **Alertas por email** (parser multi-anuncio) + alta rápida pegando. |
| **Subastas BOE** | Subastas judiciales/notariales. **Datos públicos**. | Conector `boe` (integrado). Fuente de mayores descuentos. |
| **Catastro** | Sede Electrónica. Servicios web oficiales (m², año, uso). | Enriquecimiento `catastro` (integrado, opt-in). |
| **Registradores / Estadística registral** | Precios de **transacciones reales**. | Roadmap: comparables por transacción real. |
| **INE / Tinsa / Sociedad de Tasación** | Índices y **AVM/tasación**. | Roadmap: AVM y tendencia de precios. |
| **Banca/REO** (Haya, Aliseda, Servihabitat, Solvia/Intrum, Diglo) | Carteras de adjudicados. | Conector `reo-banks` (feed autorizado) + adaptador `http`. |

## 2. Plataformas profesionales (España)

- **Casafari** — Agregador que **deduplica** el mismo inmueble entre decenas de portales y avisa de **cambios de precio** y **nuevos listados**. *Modelo de referencia para la agregación.*
  - → Traído: **deduplicación** por clave estable; **barridos** periódicos. Roadmap: dedup cross-portal por dirección + alertas de bajada de precio.
- **Brainsre (Brains RE)** — Big data inmobiliario para profesionales (oferta, absorción, precios). → Roadmap: métricas de mercado por zona.
- **urbanData Analytics (uDA)** — Analítica de mercado y **AVM** por zona. → Roadmap: AVM hedónico y comparables por barrio.
- **Tinsa Digital / pricing** — Valoración automática. → Roadmap: integrar AVM como fuente de valoración.

## 3. Plataformas internacionales (modelos a imitar)

| Plataforma | Idea clave | Traído / Roadmap |
| --- | --- | --- |
| **PropStream** (US) | *Gold standard* de detección: filtros de **distress** (preejecución, embargos, absentee owner, alta equity, vacío), **comps**, **ARV**, **rehab estimate**, list building. | **Motivación del vendedor** (señales de urgencia en el texto) ✅. Comps/ARV ✅. Rehab/CapEx ✅. Roadmap: más señales (vacío, absentee). |
| **BiggerPockets calculators** | Calculadoras **BRRRR / flip / alquiler** y **MAO** (Maximum Allowable Offer). | **MAO — precio máximo de compra recomendado** ✅. Escenarios flip/alquiler ✅. |
| **Mashvisor** (US) | Analítica de alquiler, **cap rate / cash-on-cash**, **mapa de rentabilidad**, larga estancia vs **Airbnb**. | Rent. neta / cash-on-cash ✅. Roadmap: **escenario alquiler de temporada/turístico** y **heatmap** por zona. |
| **AirDNA** | Datos de **alquiler turístico** (ADR, ocupación). | Roadmap: escenario STR con ADR/ocupación por zona. |
| **PropertyRadar / DealMachine** | Datos de propietario, *driving for dollars*, listas. | Roadmap (España): propietario vía Catastro/Registro donde sea legal. |
| **Zillow / Redfin** | **Zestimate (AVM)**, filtros de **bajada de precio** y **días en mercado (DOM)**. | Roadmap: campos **DOM** y **histórico de precio** + señal de bajada. |
| **Roofstock** | Marketplace SFR con **underwriting** estandarizado y scoring de barrio. | Scoring y veredicto ✅. Roadmap: score de barrio. |

## 4. Funcionalidades priorizadas (extraídas del análisis)

### Implementadas en esta iteración
- ✅ **MAO — Máximo precio de compra recomendado** (BiggerPockets/PropStream): cuánto ofrecer como máximo para cumplir tu margen flip / rentabilidad objetivo, y su comparación con el precio pedido.
- ✅ **Motivación del vendedor** (PropStream distress): detección en el texto de urgencia, herencia, divorcio, embargo, precio rebajado/negociable, ocupado… → puntuación 0-100 y señal.
- ✅ **Ingestión de alertas por email** (modelo Casafari, legal): parser multi-anuncio de emails de Idealista/Fotocasa/Habitaclia + endpoint para webhook de email.

### Roadmap prioritario
1. **Comparables por barrio / código postal** (uDA/Casafari) — mayor precisión que la media provincial.
2. **Días en mercado (DOM) + histórico de precio** y **alerta de bajada** (Zillow/Casafari).
3. **Escenario alquiler de temporada / turístico** con ADR y ocupación (Mashvisor/AirDNA).
4. **Alertas por email/push** de nuevas oportunidades que encajan (resumen del barrido).
5. **Mapa/heatmap** de rentabilidad y descuento por zona (Mashvisor).
6. **AVM hedónico** (m², habitaciones, año, planta, ascensor, estado) como valoración fina (Tinsa/uDA/Zestimate).
7. **Score de barrio** (transporte, servicios, demanda de alquiler, demografía INE) (Roofstock/Mashvisor).

## 5. Principio rector: legalidad de las fuentes

INMOSEARCH **no raspa** portales protegidos (Idealista/Fotocasa): sus Términos lo prohíben, tienen anti-bot comercial y hay jurisprudencia en España. Se prioriza:
1. **Datos públicos** (BOE, Catastro, Registradores, INE).
2. **APIs oficiales** (Idealista).
3. **Alertas por email** del propio usuario (parser).
4. **Feeds autorizados** (partners REO) vía adaptador `http` que respeta `robots.txt`.

Esto da *deal flow* comparable al de las herramientas del mercado, sin el riesgo legal/técnico del scraping.
