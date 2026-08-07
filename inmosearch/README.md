# INMOSEARCH

**Búsqueda y análisis de oportunidades inmobiliarias para flip y alquiler** — desarrollado para la sociedad **Enxames**.

INMOSEARCH capta oportunidades de varias fuentes, las **analiza automáticamente** (underwriting completo para flip y alquiler), **estima el CapEx de reforma** —incluso a partir de las fotos del activo con IA— y **puntúa y ordena** las mejores oportunidades según tus umbrales de inversión.

> ⚠️ **Aviso**: todas las estimaciones (impuestos, CapEx, comparables, rentabilidades) son **orientativas** y sirven como punto de partida. Verifica cada dato antes de tomar decisiones de inversión.

---

## ¿Qué hace?

- **Alta ultrarrápida** (`src/lib/intake`): pega el **texto o la URL de un anuncio** y extrae precio, m², habitaciones, baños, estado y ubicación automáticamente. Un paso: pegar → veredicto.
- **Valoración automática de mercado** (`src/lib/valuation` + `data/market.ts`): con solo **precio + m² + ubicación**, estima el **ARV** (venta objetivo) y la **renta de mercado** a partir de datos por provincia, y calcula el **descuento frente a mercado** — la señal clave de una oportunidad. No necesitas meter comparables a mano.
- **Veredicto claro y señales** (`src/lib/underwriting/signals.ts`): cada oportunidad recibe un veredicto **INVERTIR / VIGILAR / DESCARTAR** y banderas de un vistazo ("bajo mercado", "flip rentable", "cashflow positivo"…).
- **Ingesta multi-fuente** mediante conectores enchufables:
  - **Idealista** (API oficial OAuth2 — requiere credenciales aprobadas).
  - **Banca / REO** (Haya, Aliseda, Servihabitat, Solvia, subastas BOE…) — punto de extensión para feeds autorizados / CSV.
  - **Alta manual** y **fuente de demostración** con datos de ejemplo.
- **Motor de underwriting** (`src/lib/underwriting`): costes de adquisición con **ITP por Comunidad Autónoma**, notaría, registro, gestoría; escenarios **Flip** (beneficio, margen, ROI, ROI anualizado) y **Alquiler** (rentabilidad bruta/neta, NOI, cashflow, cash-on-cash, con hipoteca).
- **Estimación de CapEx** (`src/lib/capex`): modelo por reglas (€/m² por nivel de reforma) **+ análisis de imágenes con Claude Vision** para evaluar el estado real de cocina, baños, suelos e instalaciones.
- **Scoring y criba** (`src/lib/underwriting/score.ts`): puntuación 0-100 y rating A/B/C/D según la mejor estrategia y el descuento vs mercado, con explicación legible.
- **Dashboard "Radar"**: destaca arriba las mejores oportunidades (veredicto INVERTIR), con filtros por veredicto y ficha de detalle con todo el desglose y la valoración de mercado.

## Nota legal sobre las fuentes

El *scraping* directo de portales como Idealista o Fotocasa **viola sus Términos de Uso** y cuentan con protección anti-bot. INMOSEARCH está diseñado para integrarse con **fuentes legales**: APIs oficiales, feeds de partner, exportaciones que los propios tenedores facilitan e importación manual/CSV. Cada conector declara si está operativo o es un *stub* documentado.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma** (SQLite en desarrollo, Postgres en producción)
- **@anthropic-ai/sdk** (análisis de imágenes con Claude)
- **Zod** (validación) · **Vitest** (tests del motor financiero)

## Puesta en marcha

```bash
cd inmosearch
npm install
cp .env.example .env        # revisa las variables (funciona sin claves)

npm run db:push             # crea la base de datos SQLite
npm run db:seed             # carga oportunidades de ejemplo (opcional)

npm run dev                 # http://localhost:3000
```

Para activar el **análisis de CapEx con IA**, añade tu `ANTHROPIC_API_KEY` al `.env`. Sin ella, el CapEx se calcula con el modelo por reglas.

### Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`prisma generate` + `next build`) |
| `npm run db:push` | Aplica el esquema a la base de datos |
| `npm run db:seed` | Carga datos de ejemplo |
| `npm run db:studio` | Prisma Studio (explorar la BD) |
| `npm run test` | Tests del motor de underwriting |
| `npm run typecheck` | Comprobación de tipos |

## Estructura

```
src/
├── app/
│   ├── page.tsx                    # Dashboard / ranking
│   ├── opportunities/new           # Alta manual
│   ├── opportunities/[id]          # Ficha de detalle con análisis
│   └── api/                        # Rutas API (opportunities, analyze, connectors)
├── lib/
│   ├── underwriting/               # Motor financiero (flip, alquiler, scoring, señales)
│   ├── valuation/                  # Valoración automática de mercado (ARV, renta, descuento)
│   ├── capex/                      # Estimación de reforma (reglas + IA de imágenes)
│   ├── intake/                     # Parser de anuncios (alta rápida por texto/URL)
│   ├── connectors/                 # Fuentes de oportunidades (Idealista, REO, mock)
│   ├── data/                       # ITP por CCAA, bandas de reforma y mercado por provincia
│   ├── opportunity.ts              # Capa de servicio (persistencia + análisis)
│   └── types.ts                    # Tipos de dominio + validación
└── components/                     # UI (tarjetas, desgloses, formularios)
```

## Modelo de análisis (resumen)

**Flip**: `Beneficio = ARV − (Compra + Costes adquisición + CapEx + Holding + Costes venta)`.
El *holding* incluye intereses de financiación, IBI, comunidad, seguro y suministros durante la duración del proyecto. Se reporta margen sobre coste, ROI sobre capital propio y ROI anualizado.

**Alquiler**: `NOI = Renta efectiva − Gastos de explotación` (IBI, comunidad, seguros, gestión, mantenimiento, reserva por impago, vacancia). Rentabilidad neta = NOI / inversión total. Con hipoteca (cuota francesa) se calcula el cashflow y el cash-on-cash.

Los parámetros (LTV, tipo de interés, comisiones, umbrales…) están en `src/lib/underwriting/assumptions.ts` y son sobrescribibles por oportunidad.

## Roadmap

- [x] Valoración automática (€/m² venta y renta) por provincia + descuento vs mercado.
- [x] Alta rápida por texto/URL pegada.
- [x] Veredicto INVERTIR/VIGILAR/DESCARTAR y señales de oportunidad.
- [ ] Comparables a nivel de barrio / código postal (mayor precisión que provincia).
- [ ] Parser de anuncios reforzado con IA (extracción de campos con Claude).
- [ ] Importación CSV con mapeo de columnas por proveedor REO.
- [ ] Conector del Portal de Subastas del BOE.
- [ ] Impuesto de Sociedades y análisis post-impuestos a nivel de sociedad (Enxames).
- [ ] Multiusuario y comité de inversión (workflow de aprobación).
- [ ] Geolocalización y mapa de oportunidades.

---

_Proyecto privado de Enxames. Uso interno._
