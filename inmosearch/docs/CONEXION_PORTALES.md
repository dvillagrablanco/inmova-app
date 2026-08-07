# Conectar INMOSEARCH con Idealista y Fotocasa — todas las vías

**Principio:** INMOSEARCH **no raspa** los portales. El scraping de Idealista/Fotocasa viola sus Términos de Uso, tienen anti-bot comercial y hay jurisprudencia en España. Todas las vías de abajo son **legales**: usan **tu propia navegación** o **tus búsquedas guardadas**, no un bot del servidor.

Página en la app: **`/tools`** ("Conectar").

---

## Resumen (de más a menos práctico)

| Vía | Portales | Automatización | Requisitos | Estado |
| --- | --- | --- | --- | --- |
| **1. Bookmarklet** ("Enviar a INMOSEARCH") | Idealista + Fotocasa | Semi (1 clic mientras navegas) | Ninguno | ✅ Implementado |
| **2. Alertas por email → IMAP** | Idealista + Fotocasa | **Total** (cron) | Un buzón + variables IMAP | ✅ Implementado |
| **3. Alertas por email → webhook** | Idealista + Fotocasa | Total | Zapier/Make/n8n | ✅ Endpoint listo |
| **4. Alertas por email → pegar** | Idealista + Fotocasa | Manual | Ninguno | ✅ Implementado |
| **5. Idealista API oficial** | Idealista | Total | Credenciales aprobadas | ✅ Conector listo |
| **6. Feed de datos autorizado** | Agregado | Total | Contrato (Casafari/uDA…) | ✅ Adaptador listo |
| **7. Datos de mercado (Idealista Data)** | Valoración | Total | API/contrato de datos | ✅ Adaptador listo |

> **Fotocasa** no ofrece API pública de búsqueda (solo API para que las agencias *publiquen*). Su vía práctica es el **bookmarklet** y las **alertas por email**.

---

## 1. Bookmarklet — "Enviar a INMOSEARCH" (recomendado para empezar)

Un botón en tu navegador. Mientras ves una **ficha** o un **listado** en Idealista/Fotocasa, lo pulsas y el anuncio (o todos los del listado) se envían a INMOSEARCH, se valoran y se analizan. Es tu navegación, no un bot.

**Instalación:** en `/tools`, arrastra el botón azul a la barra de marcadores (o copia su código y crea un marcador con él como URL).

**Uso:** entra en un anuncio → pulsa el marcador → se abre INMOSEARCH con el análisis (veredicto, MAO, descuento, escenarios).

---

## 2. Alertas por email leídas por IMAP (automático, recomendado para dejarlo solo)

1. En **Idealista** y **Fotocasa**, crea **búsquedas guardadas / alertas** con tus criterios (zona: Sanxenxo, Vigo, Pontevedra…; precio; tipo). Los portales te enviarán emails con los anuncios nuevos.
2. Haz que esos emails lleguen a un buzón (idealmente uno dedicado, o una etiqueta/carpeta).
3. Configura en INMOSEARCH las variables IMAP y programa el cron:

```
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=tu-correo@gmail.com
IMAP_PASSWORD=xxxx-contraseña-de-aplicación
IMAP_MAILBOX=INBOX
```

> **Gmail:** activa la verificación en 2 pasos y crea una **contraseña de aplicación** (no uses la contraseña normal). Consejo: crea un filtro que archive las alertas en una carpeta y apunta `IMAP_MAILBOX` a ella.

El endpoint **`POST /api/ingest/email/poll`** (protegido con `SWEEP_SECRET`/`CRON_SECRET`) revisa el buzón, importa los anuncios de portales y marca los emails como leídos. Prográmalo (Vercel Cron / GitHub Actions), p.ej. cada hora:

```bash
curl -X POST https://TU-DOMINIO/api/ingest/email/poll -H "Authorization: Bearer $SWEEP_SECRET"
```

## 3. Alertas por email reenviadas por webhook (sin tocar código)

Si no quieres IMAP: en tu correo, crea una **regla** que reenvíe cada alerta de Idealista/Fotocasa a un flujo de **Zapier / Make / n8n**, que haga `POST` a **`/api/ingest/email`** con el cuerpo del email (`{ "html": "..." }` o `{ "text": "..." }`). También sirve un buzón de **SendGrid Inbound Parse** / **Mailgun Routes** apuntando a ese endpoint.

## 4. Alertas por email pegadas a mano

En `/tools` → "Importar alerta de email": pega el contenido del email (varios anuncios) y se importan todos. Cero configuración.

## 5. Idealista API oficial

Idealista ofrece una **API de búsqueda** (OAuth2) en <https://developers.idealista.com/>. Requiere **solicitar acceso** (aprueban según el caso de uso) y tiene **cuota limitada**. El conector ya está implementado; solo añade tus credenciales:

```
IDEALISTA_API_KEY=...
IDEALISTA_API_SECRET=...
```

Con eso, los **barridos** por perfil incluyen Idealista como fuente (por zona).

## 6. Feed de datos autorizado (agregadores)

Empresas como **Casafari**, **urbanData Analytics** o proveedores de carteras REO ofrecen **feeds de datos agregados** de forma legal. Si contratas uno, su feed JSON entra por el **adaptador `http`**:

```
HTTP_SOURCE_FEED_URL=https://tu-proveedor/feed.json
HTTP_SOURCE_AUTH=Bearer xxxxx   # si lo requiere
```

## 7. Datos de mercado para MEJORES valoraciones (Idealista Data / feed)

Para que el **ARV**, la **renta estimada** y el **descuento frente a mercado** se calculen con **€/m² reales de la zona** (y no con las tablas de referencia internas), conecta un proveedor de datos de mercado por **API**.

**Idealista Data** (idealista/data) es una **suscripción de datos de mercado**. Su acceso programático es **por API/exportación bajo contrato** — **no** se usa el login web de la cuenta (eso sería raspado y va contra sus términos). Cuando dispongas del endpoint y la clave de tu proveedor, configúralo:

```
MARKET_DATA_API_URL=https://tu-proveedor/valoracion?zona={location}
MARKET_DATA_API_KEY=...
# Opcionales:
MARKET_DATA_PROVIDER=Idealista Data
MARKET_DATA_AUTH_HEADER=X-Api-Key        # si la clave no va como "Bearer"
MARKET_DATA_SALE_FIELD=data.saleEurSqm   # ruta al €/m² de venta en la respuesta
MARKET_DATA_RENT_FIELD=data.rentEurSqm   # ruta al €/m²/mes de alquiler
```

La plantilla de URL admite `{location}`, `{province}`, `{city}` y `{postalCode}` (se sustituyen y se URL-encodean; también se añaden como *query params*). Si no defines `*_FIELD`, el adaptador **autodetecta** los campos de venta y renta en la respuesta JSON. Es **genérico**: sirve para Idealista Data o cualquier feed autorizado que devuelva €/m². Sin configurar, la app sigue funcionando con sus tablas internas.

El análisis usa estos datos con **máxima prioridad** en cuanto están disponibles, y lo indica en las notas de la valoración: _"Datos de mercado reales (Idealista Data, …)"_.

---

## Recomendación para Enxames (Rías Baixas)

1. **Hoy mismo:** instala el **bookmarklet** y crea **alertas** en Idealista y Fotocasa para Sanxenxo, Portonovo, O Grove, Vigo, Pontevedra, Baiona…
2. **Para automatizar:** manda esas alertas a un buzón y activa el **IMAP** con cron horario. A partir de ahí, las oportunidades entran solas, ya valoradas con los comparables de zona y con su veredicto/MAO.
3. **Si te aprueban la API de Idealista**, añádela para búsquedas por zona bajo demanda.
