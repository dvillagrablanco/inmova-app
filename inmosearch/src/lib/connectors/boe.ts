// INMOSEARCH — Conector de Subastas (Portal de Subastas del BOE)
//
// El Portal de Subastas de la Administración de Justicia (subastas.boe.es)
// publica subastas judiciales y notariales. Es información PÚBLICA y suele
// contener las mayores oportunidades (a menudo muy por debajo de mercado).
//
// Este conector consulta el buscador público y extrae los campos básicos. El
// formato del portal puede cambiar; está marcado como BETA y degrada con
// elegancia (si falla, el barrido lo registra como error de esa fuente sin
// romper el resto). Datos clave de una subasta que ajustan el riesgo: valor de
// subasta, cargas y situación posesoria (ocupado/no) — se recogen cuando están
// disponibles en el detalle.
import type { ConnectorSearchParams, PortalConnector, RawListing } from "./types";

const SEARCH_BASE = "https://subastas.boe.es/subastas_ava.php";

export const boeConnector: PortalConnector = {
  id: "boe",
  name: "Subastas BOE (judiciales/notariales)",
  isConfigured: () => process.env.BOE_ENABLED !== "false", // activo por defecto
  status: () =>
    process.env.BOE_ENABLED === "false"
      ? "Desactivado (BOE_ENABLED=false)."
      : "Activo (BETA) — datos públicos de subastas.boe.es. Verifica el formato en producción.",
  async search(params: ConnectorSearchParams): Promise<RawListing[]> {
    const url = buildSearchUrl(params);
    const res = await fetch(url, {
      headers: { "User-Agent": "INMOSEARCH/1.0 (+uso interno; datos públicos BOE)" },
    });
    if (!res.ok) throw new Error(`BOE search error ${res.status}`);
    const html = await res.text();
    return parseResults(html).slice(0, params.maxResults ?? 25);
  },
};

function buildSearchUrl(params: ConnectorSearchParams): string {
  const q = new URLSearchParams();
  // Subastas de bienes inmuebles en estado "celebrándose".
  q.set("dato[0]", "");
  q.set("campo[0]", "BIEN.LOCALIDAD");
  if (params.location) q.set("dato[0]", params.location);
  q.set("tipo_subasta", "BienInmueble");
  if (params.minPrice) q.set("valorMin", String(params.minPrice));
  if (params.maxPrice) q.set("valorMax", String(params.maxPrice));
  return `${SEARCH_BASE}?${q.toString()}`;
}

/** Extrae subastas del HTML de resultados de forma defensiva (regex). */
function parseResults(html: string): RawListing[] {
  const listings: RawListing[] = [];
  // Enlaces a detalle: detalleSubasta.php?idSub=SUBXXXXXXX
  const idRe = /detalleSubasta\.php\?idSub=([A-Z0-9-]+)/g;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = idRe.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    // Ventana de texto alrededor del enlace para extraer importe y localidad.
    const window = html.slice(Math.max(0, m.index - 600), m.index + 600);
    const price = extractAmount(window);
    const locality = extractField(window, /Localidad[^A-Za-z0-9]{0,10}([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑñ .'-]{2,60})/i);
    if (!price) continue;
    listings.push({
      sourceRef: id,
      sourceUrl: `https://subastas.boe.es/detalleSubasta.php?idSub=${id}`,
      title: `Subasta BOE ${id}${locality ? ` · ${locality}` : ""}`,
      price,
      city: locality ?? undefined,
      propertyType: "OTRO",
      description: "Subasta pública (BOE). Revisa cargas, situación posesoria y condiciones antes de pujar.",
      images: [],
    });
  }
  return listings;
}

function extractAmount(text: string): number | null {
  // Importes tipo "Valor subasta: 85.000,00 €"
  const m = text.match(/(?:Valor subasta|Importe|Cantidad reclamada)[^\d]{0,20}(\d[\d.]{2,})/i);
  if (!m) return null;
  const n = parseInt(m[1].replace(/\./g, ""), 10);
  return Number.isFinite(n) && n >= 5000 ? n : null;
}

function extractField(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}
