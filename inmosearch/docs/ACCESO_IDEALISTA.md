# Acceso a Idealista e idealista/data — estudio completo y configuración

Este documento estudia **todas las vías posibles** para acceder a Idealista y a
idealista/data desde INMOSEARCH, con los requisitos, límites, coste, legalidad y
la **configuración exacta** en la app. Hay que distinguir tres cosas que se
confunden a menudo:

| # | Producto | Para qué | Cómo se accede | En la app |
| - | -------- | -------- | -------------- | --------- |
| A | **Idealista API de búsqueda** (developers.idealista.com) | Traer **anuncios/listados** por zona | OAuth2, previa **aprobación** (gratis, cuota baja) | Conector `idealista` |
| B | **idealista/data — API de comparables y métricas** | **Valorar** mejor (€/m² reales, comparables, métricas) | **Contrato B2B** de datos | Adaptador `MARKET_DATA_*` |
| C | Scrapers de terceros (Apify, Oxylabs, Decodo…) | Extraer datos "raspando" | De pago; **raspan** el portal | ❌ No se usa (ilegal según ToS) |

> **Principio de INMOSEARCH:** no se raspan los portales. Las vías A y B son
> oficiales y legales. La vía C se documenta solo para que sepas por qué **no**
> la usamos.

---

## A) Idealista API oficial de búsqueda

Sirve para que la app **traiga anuncios** de Idealista por zona y los analice
(veredicto, MAO, descuento, escenarios). Es la API de `developers.idealista.com`.

### A.1 Cómo conseguir acceso
1. Entra en **https://developers.idealista.com/access-request**.
2. Rellena el formulario: **nombre, email y descripción del proyecto** (uso
   previsto). Conviene describir un uso profesional concreto y no masivo.
3. Idealista **revisa la solicitud manualmente**. Si la aprueban, te envían por
   correo el **`apikey`** y el **`secret`** (credenciales OAuth2) y la
   documentación con endpoints y parámetros.
4. Es **gratis**, pero con **cuota baja** en el nivel de desarrollador
   (históricamente del orden de **~100 peticiones/mes** y **~1 petición/segundo**;
   el límite exacto te lo confirman al aprobarte). Máximo **50 resultados por
   página**.

### A.2 Cómo funciona (lo que ya implementa el conector)
- **Token:** `POST https://api.idealista.com/oauth/token`
  con cabecera `Authorization: Basic base64(apikey:secret)`,
  cuerpo `grant_type=client_credentials&scope=read`.
- **Búsqueda:** `POST https://api.idealista.com/3.5/{es|it|pt}/search`
  con `Authorization: Bearer <token>` y parámetros de formulario.
- **Zona (importante):** la API **no busca por texto libre**. Exige **una** de:
  - `center=lat,lng` + `distance=<metros>` (búsqueda por radio), o
  - `locationId=<código interno de Idealista>`.
- Otros parámetros: `operation=sale`, `propertyType=homes|premises|garages|offices`,
  `maxItems` (≤50), `numPage`, `order`, `sort`, `minPrice`, `maxPrice`.

### A.3 Configuración en la app
En `.env` (local) o en **Vercel → Settings → Environment Variables**:
```
IDEALISTA_API_KEY=tu_apikey
IDEALISTA_API_SECRET=tu_secret
IDEALISTA_COUNTRY=es
```
Con eso, el conector `idealista` pasa a **configurado** y entra en los barridos.

**Definir la zona por coordenadas** (porque la API lo exige): en el perfil de
búsqueda, escribe la zona como coordenadas, opcionalmente con radio:
```
42.4005,-8.8110 r=8000     → Sanxenxo, radio 8 km
42.2406,-8.7207 r=10000    → Vigo, radio 10 km
42.4310,-8.6444 r=8000     → Pontevedra
42.0095,-8.8630 r=6000     → O Grove
42.5130,-8.8140 r=6000     → Cambados
42.0096,-4.5288 r=9000     → Palencia
```
(El conector también acepta `center`/`distance`/`locationId` de forma
programática si más adelante mapeamos zonas a `locationId`.)

### A.4 Límite práctico
Con ~100 peticiones/mes, la API oficial da para **barridos puntuales por zona**,
no para rastreo continuo. Combínala con las **alertas por email** (vía sin
límite, ver más abajo) para cobertura amplia, y reserva la API para consultas
bajo demanda.

---

## B) idealista/data — API de comparables y métricas (mejores valoraciones)

idealista/data es el **producto de datos de mercado** de Idealista (distinto de
la API de búsqueda). Es lo que mejora las **valoraciones**: da **€/m² reales**
de venta y alquiler de la zona, **comparables** por tipología y operación,
enriquecimiento con **catastro** y eficiencia energética, y **métricas**
(días en mercado, margen de negociación, rating de inversión, ciclo
inmobiliario, datos sociodemográficos).

### B.1 Cómo conseguir acceso
- Es un **servicio B2B bajo contrato**, dirigido a **tasadoras, consultoras,
  bancos, servicers, fondos, promotoras e inversores**. No hay auto-registro.
- Se contrata contactando con **idealista/data**
  (https://www.idealista.com/data/ → sección de empresas / "API de comparables y
  métricas"). El **precio es a medida** según volumen y datos.
- Acceso disponible por **API**, **widget** integrable, o **ficheros de datos**
  en varios formatos. Cobertura: **España, Italia y Portugal**.
- Con tu cuenta `dvillagra@vidaroinversiones.com` de idealista/data, pide a tu
  contacto comercial el **acceso por API** (endpoint + clave). El **login web
  no sirve** para integrar: eso sería raspado y va contra los términos.

### B.2 Configuración en la app (adaptador ya implementado)
El adaptador es **genérico**: en cuanto tengas endpoint + clave, la app usa esos
€/m² reales con **máxima prioridad** en el análisis (ARV, renta y descuento), y
lo indica en las notas: _"Datos de mercado reales (Idealista Data…)"_.
```
MARKET_DATA_API_URL=https://<endpoint-de-idealista-data>?zona={location}
MARKET_DATA_API_KEY=tu_clave
MARKET_DATA_PROVIDER=Idealista Data
# Opcionales según la forma de su respuesta:
MARKET_DATA_AUTH_HEADER=X-Api-Key          # si la clave no va como Bearer
MARKET_DATA_SALE_FIELD=data.saleEurSqm     # ruta al €/m² de venta
MARKET_DATA_RENT_FIELD=data.rentEurSqm     # ruta al €/m²/mes de alquiler
```
- La URL admite `{location}`, `{province}`, `{city}`, `{postalCode}` (se
  sustituyen y se añaden como query params).
- Si no defines `*_FIELD`, el adaptador **autodetecta** los campos de venta y
  renta en la respuesta JSON.
- Sin configurar, la app sigue funcionando con sus **tablas internas** de €/m².

> Cuando me pases un **ejemplo de respuesta** del API de idealista/data, ajusto
> el mapeo exacto de campos (`*_FIELD`) para que encaje al 100 %.

---

## C) Scrapers de terceros (por qué NO)

Existen servicios (Apify, Oxylabs, Decodo, ScrapingBee, etc.) que ofrecen
"APIs de Idealista" pero que en realidad **raspan** el portal. **No se usan**
porque:
- **Violan los Términos de Uso** de Idealista/Fotocasa (prohíben el acceso
  automatizado) y hay **anti-bot** y **jurisprudencia** en España.
- Riesgo legal y de bloqueo para tu sociedad. No compensa.

La alternativa legal equivalente para "traer anuncios" es la **API oficial (A)**
y, sobre todo, las **alertas por email (D)**.

---

## D) Complemento sin límite y sin coste — alertas por email

Independiente de la API: crea **búsquedas guardadas + alertas** en tu cuenta de
Idealista (y Fotocasa) y deja que la app las ingiera. Es **legal** (es tu
correo), **sin cuota** y cubre **ambos portales**. Tres formas (todas ya listas):
- **Pegar** el email de alerta en `/tools` → importa todos los anuncios.
- **Bookmarklet** "Enviar a INMOSEARCH" → 1 clic desde la ficha/listado.
- **IMAP automático** → la app revisa tu buzón por cron (`IMAP_*`).

Detalle y comparativa completa en **`docs/CONEXION_PORTALES.md`**.

---

## Resumen de configuración (variables)

| Objetivo | Variables | Requisito |
| -------- | --------- | --------- |
| Traer anuncios por API (A) | `IDEALISTA_API_KEY`, `IDEALISTA_API_SECRET`, `IDEALISTA_COUNTRY` | Aprobación en developers.idealista.com |
| Mejores valoraciones (B) | `MARKET_DATA_API_URL`, `MARKET_DATA_API_KEY`, `MARKET_DATA_PROVIDER` (+ `*_FIELD`) | Contrato idealista/data |
| Alertas por email (D) | `IMAP_HOST`, `IMAP_USER`, `IMAP_PASSWORD`, `IMAP_MAILBOX` | Un buzón de correo |

Todas se cargan igual: **local** en `.env` (ver `.env.example`) o en **Vercel →
Settings → Environment Variables** (y luego *Redeploy*). Ninguna credencial se
guarda en el código.
