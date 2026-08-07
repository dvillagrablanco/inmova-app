// INMOSEARCH — Enriquecimiento con Catastro (Sede Electrónica del Catastro)
//
// El Catastro ofrece servicios web OFICIALES y gratuitos (OVC) para consultar
// datos de un inmueble: superficie construida, año de construcción y uso. Estos
// datos mejoran la valoración (€/m² sobre superficie real), el CapEx (edad del
// edificio) y el ARV.
//
// Servicio usado: OVCCallejero JSON (Consulta_DNPLOC por localización, o
// Consulta_DNPRC por referencia catastral). El emparejamiento por dirección es
// sensible al formato; está marcado como BETA y desactivado por defecto
// (CATASTRO_ENABLED=true para activarlo). Degrada devolviendo null.
const OVC_BASE = "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json";

export interface CatastroData {
  refCatastral?: string;
  builtArea?: number; // m² construidos
  yearBuilt?: number;
  use?: string;
}

export interface CatastroQuery {
  province?: string | null;
  city?: string | null;
  address?: string | null;
  refCatastral?: string | null;
}

export function catastroEnabled(): boolean {
  return process.env.CATASTRO_ENABLED === "true";
}

/** Consulta Catastro (best-effort). Devuelve null si no está activo o no hay
 * una coincidencia fiable. */
export async function enrichFromCatastro(q: CatastroQuery): Promise<CatastroData | null> {
  if (!catastroEnabled()) return null;
  try {
    if (q.refCatastral) return await byRefCatastral(q.refCatastral);
    if (q.province && q.city && q.address) return await byLocation(q.province, q.city, q.address);
    return null;
  } catch (err) {
    console.error("[catastro] error:", err);
    return null;
  }
}

async function byRefCatastral(rc: string): Promise<CatastroData | null> {
  const url = `${OVC_BASE}/Consulta_DNPRC?RefCat=${encodeURIComponent(rc)}`;
  const json = await getJson(url);
  return parseDnp(json, rc);
}

async function byLocation(province: string, city: string, address: string): Promise<CatastroData | null> {
  const { sigla, via, numero } = splitAddress(address);
  if (!via || !numero) return null;
  const url =
    `${OVC_BASE}/Consulta_DNPLOC?Provincia=${encodeURIComponent(province)}` +
    `&Municipio=${encodeURIComponent(city)}&Sigla=${encodeURIComponent(sigla)}` +
    `&Calle=${encodeURIComponent(via)}&Numero=${encodeURIComponent(numero)}`;
  const json = await getJson(url);
  return parseDnp(json);
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "INMOSEARCH/1.0" } });
  if (!res.ok) throw new Error(`Catastro HTTP ${res.status}`);
  return res.json();
}

/** Extrae superficie/año/uso de la respuesta (estructura anidada del OVC). */
function parseDnp(json: any, rc?: string): CatastroData | null {
  const bico = json?.consulta_dnp?.bico ?? json?.consulta_dnprcResult?.bico;
  const bi = bico?.bi ?? json?.consulta_dnp?.lrcdnp?.rcdnp?.[0];
  if (!bi) return null;
  const debi = bi?.debi ?? bi;
  const builtAreaRaw = debi?.sfc ?? debi?.superficie ?? null; // superficie construida
  const yearRaw = debi?.ant ?? null; // antigüedad (año)
  const use = debi?.luso ?? undefined;
  const builtArea = builtAreaRaw ? Number(builtAreaRaw) : undefined;
  const yearBuilt = yearRaw ? Number(yearRaw) : undefined;

  if (!builtArea && !yearBuilt) return null;
  return {
    refCatastral: rc,
    builtArea: builtArea && builtArea > 0 ? builtArea : undefined,
    yearBuilt: yearBuilt && yearBuilt > 1700 ? yearBuilt : undefined,
    use,
  };
}

/** Divide una dirección en sigla (tipo de vía), nombre y número. */
function splitAddress(address: string): { sigla: string; via: string; numero: string } {
  const numMatch = address.match(/(\d{1,4})/);
  const numero = numMatch ? numMatch[1] : "";
  const siglaMatch = address.match(/\b(calle|c\/|avenida|avda|av|plaza|pza|paseo|camino|carrer|rúa|rua|travesía)\b/i);
  const siglaMap: Record<string, string> = { "c/": "CL", calle: "CL", avenida: "AV", avda: "AV", av: "AV", plaza: "PZ", pza: "PZ", paseo: "PS", camino: "CM", carrer: "CL", rúa: "CL", rua: "CL", "travesía": "TR" };
  const sigla = siglaMatch ? siglaMap[siglaMatch[1].toLowerCase()] ?? "CL" : "CL";
  const via = address
    .replace(/\b(calle|c\/|avenida|avda|av|plaza|pza|paseo|camino|carrer|rúa|rua|travesía)\b/i, "")
    .replace(/\d.*$/, "")
    .replace(/[,.]/g, "")
    .trim();
  return { sigla, via, numero };
}
