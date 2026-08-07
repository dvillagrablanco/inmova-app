# INMOSEARCH

**Búsqueda y análisis de oportunidades inmobiliarias para flip y alquiler** — desarrollado para la sociedad **Enxames**.

INMOSEARCH capta oportunidades de varias fuentes, las **analiza automáticamente** (underwriting completo para flip y alquiler), **estima el CapEx de reforma** —incluso a partir de las fotos del activo con IA— y **puntúa y ordena** las mejores oportunidades según tus umbrales de inversión.

> ⚠️ **Aviso**: todas las estimaciones (impuestos, CapEx, comparables, rentabilidades) son **orientativas** y sirven como punto de partida. Verifica cada dato antes de tomar decisiones de inversión.

---

## ¿Qué hace?

- **Barridos automáticos por perfil de activos** (`src/lib/sweep` + `src/lib/profiles`): defines un **buy-box** (tipo, precio, m², €/m², rentabilidad/margen/descuento mínimos, palabras clave) y **zonas**; el sistema barre las fuentes en la frecuencia elegida (p.ej. **semanal**), **deduplica**, **enriquece**, **analiza** y marca las que **encajan**.
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

## Barridos automáticos y perfiles de búsqueda

1. **Perfil de activos (buy-box)** — en `/profiles` defines qué buscas: tipo, precio min/max, m² mín, €/m² máx, habitaciones, estado, **rent. neta mín.**, **margen flip mín.**, **descuento mín. vs mercado**, palabras clave — y las **zonas** (provincias/municipios/CP) y **fuentes**.
2. **Barrido** — por cada zona×fuente: busca → normaliza → **deduplica** (clave estable) → **enriquece** (Catastro) → **analiza** → **comprueba el encaje** con el buy-box → guarda con `matched`/`matchScore`. Cada ejecución queda registrada (`SweepRun`).
3. **Programación** — cada perfil tiene su frecuencia (`weekly`/`daily`/`6h`/`manual`). Un cron externo llama a `POST /api/sweep/run` (protegido) y ejecuta los perfiles que toquen. También puedes lanzar un barrido a mano con «Barrer ahora».

### Fuentes integradas

| Fuente | Estado | Notas |
| --- | --- | --- |
| **Subastas BOE** (`boe`) | Activa (beta) | Datos **públicos** de `subastas.boe.es`. Las mayores oportunidades. Verifica el formato del portal en producción. |
| **Catastro** (valoración) | Opcional (`CATASTRO_ENABLED=true`) | Enriquecimiento oficial: m² construidos reales, año, uso → mejora €/m², CapEx y ARV. |
| **Idealista API** (`idealista`) | Requiere credenciales | API oficial OAuth2 (`IDEALISTA_API_KEY/SECRET`), aprobada por Idealista. |
| **Banca/REO** (`reo-banks`) | Stub documentado | Haya, Aliseda, Servihabitat, Solvia… vía feed/canal colaborador autorizado. |
| **Fuente autorizada** (`http`) | Opcional (`HTTP_SOURCE_FEED_URL`) | Adaptador de **feed JSON** para fuentes que estés **autorizado** a consumir. Respeta `robots.txt`. |
| **Demo** (`mock`) | Activa | Datos de ejemplo para probar el flujo. |

## Nota legal sobre las fuentes

El *scraping* directo de portales como Idealista o Fotocasa **viola sus Términos de Uso** y cuentan con protección anti-bot. INMOSEARCH **no** incluye un crawler contra esos portales. Se integra con **fuentes legales**: datos públicos (BOE, Catastro), APIs oficiales (Idealista), feeds de partner e importación/alta manual. El adaptador `http` es para fuentes que **tú** estés autorizado a consumir y respeta `robots.txt`; no lo apuntes a portales que prohíban el acceso automatizado.

## Programación del barrido (cron)

El endpoint `POST /api/sweep/run` ejecuta los barridos pendientes. Protégelo con `SWEEP_SECRET` (o `CRON_SECRET` en Vercel). Dos formas de programarlo semanalmente:

- **Vercel Cron** — `vercel.json` ya incluye un cron semanal (lunes 06:00). Define `CRON_SECRET` en el proyecto.
- **GitHub Actions** — `.github/workflows/sweep.yml` llama al endpoint cada semana. Configura los secrets `SWEEP_URL` y `SWEEP_SECRET`.

```bash
# Lanzar un barrido manualmente (todos los perfiles que toquen):
curl -X POST https://TU-DOMINIO/api/sweep/run -H "Authorization: Bearer $SWEEP_SECRET"
```

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
│   ├── profiles/                   # Perfiles de activos (buy-box) + matching
│   ├── sweep/                      # Motor de barridos (fuentes → dedup → análisis → match)
│   ├── enrichment/                 # Enriquecimiento (Catastro)
│   ├── connectors/                 # Fuentes (BOE, Idealista, REO, feed autorizado, mock)
│   ├── data/                       # ITP por CCAA, bandas de reforma y mercado por provincia
│   ├── opportunity.ts              # Capa de servicio (persistencia + análisis + ingesta)
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
- [x] Barridos automáticos por perfil (buy-box) + zonas + fuentes + dedup + programación.
- [x] Conector Subastas BOE + enriquecimiento Catastro + adaptador de feed autorizado.
- [ ] Comparables a nivel de barrio / código postal (mayor precisión que provincia).
- [ ] Verificación en producción del formato de BOE y del emparejamiento por dirección en Catastro.
- [ ] Alertas por email de las nuevas oportunidades que encajan (resumen del barrido).
- [ ] Parser de anuncios reforzado con IA (extracción de campos con Claude).
- [ ] Importación CSV con mapeo de columnas por proveedor REO.
- [ ] Conector del Portal de Subastas del BOE.
- [ ] Impuesto de Sociedades y análisis post-impuestos a nivel de sociedad (Enxames).
- [ ] Multiusuario y comité de inversión (workflow de aprobación).
- [ ] Geolocalización y mapa de oportunidades.

---

_Proyecto privado de Enxames. Uso interno._
