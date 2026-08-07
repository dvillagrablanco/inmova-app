// INMOSEARCH — Adaptador de datos de mercado externos (Idealista Data / feed autorizado)
// -----------------------------------------------------------------------------
// Cuando dispones de acceso por API a un proveedor de datos de mercado
// (p. ej. Idealista Data / idealista/data, o cualquier feed autorizado), este
// adaptador consulta el precio medio de VENTA (€/m²) y de ALQUILER (€/m²/mes)
// reales de la zona y los inyecta en la valoración con MÁXIMA prioridad, de modo
// que el ARV, la renta estimada y el descuento frente a mercado se calculan con
// datos reales de la zona en lugar de con las tablas orientativas internas.
//
// Se configura por variables de entorno (NUNCA se guardan credenciales en el
// código). Si no está configurado, devuelve null y la app usa sus datos internos.
//
//   MARKET_DATA_API_URL   Endpoint de consulta. Admite plantillas con
//                         {location} {province} {city} {postalCode} que se
//                         sustituyen y se URL-encodean. También se envían como
//                         query params (location, province, city, postalCode).
//   MARKET_DATA_API_KEY   Clave/API token. Se envía como "Authorization: Bearer".
//   MARKET_DATA_AUTH_HEADER  (opcional) Nombre de cabecera alternativo, p. ej.
//                            "X-Api-Key" (entonces se envía sin el prefijo Bearer).
//   MARKET_DATA_SALE_FIELD   (opcional) Ruta al campo de venta €/m² en la
//                            respuesta JSON (por defecto se autodetecta).
//   MARKET_DATA_RENT_FIELD   (opcional) Ruta al campo de renta €/m²/mes.
//
// El nombre "Idealista Data" es orientativo: el adaptador es genérico y sirve
// para cualquier proveedor de datos de mercado con API que devuelva €/m².
import type { PropertyType } from "@/lib/types";

export interface MarketOverride {
  saleEurSqm: number;
  rentEurSqmMonth: number;
  zoneName: string | null;
  provider: string;
}

export interface MarketDataQuery {
  province?: string | null;
  city?: string | null;
  postalCode?: string | null;
  address?: string | null;
  propertyType?: PropertyType | string | null;
}

/** ¿Hay un proveedor de datos de mercado externo configurado? */
export function marketDataConfigured(): boolean {
  return Boolean(process.env.MARKET_DATA_API_URL && process.env.MARKET_DATA_API_KEY);
}

/** Descripción legible del estado del proveedor (para la página Conectar). */
export function marketDataStatus(): { configured: boolean; provider: string; detail: string } {
  const configured = marketDataConfigured();
  const provider = process.env.MARKET_DATA_PROVIDER || "Idealista Data / feed autorizado";
  return {
    configured,
    provider,
    detail: configured
      ? `Configurado — valoraciones con datos reales de ${provider}.`
      : "No configurado — define MARKET_DATA_API_URL y MARKET_DATA_API_KEY (ver docs/CONEXION_PORTALES.md). Sin esto se usan las tablas de referencia internas.",
  };
}

function pickField(obj: unknown, path: string): number | null {
  const val = path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object" && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
  const n = typeof val === "string" ? Number(val) : (val as number);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Busca en un objeto (recursivo) el primer número que encaje con alguna de las
 * claves candidatas. Robusto ante distintas formas de respuesta. */
function findByKeys(obj: unknown, keys: string[], depth = 0): number | null {
  if (!obj || typeof obj !== "object" || depth > 4) return null;
  const rec = obj as Record<string, unknown>;
  for (const [k, v] of Object.entries(rec)) {
    const kl = k.toLowerCase();
    if (keys.some((cand) => kl.includes(cand))) {
      const n = typeof v === "string" ? Number(v) : (v as number);
      if (Number.isFinite(n) && n > 0) return n as number;
    }
  }
  for (const v of Object.values(rec)) {
    const found = findByKeys(v, keys, depth + 1);
    if (found != null) return found;
  }
  return null;
}

function buildUrl(template: string, q: MarketDataQuery): string {
  const location = [q.city, q.province].filter(Boolean).join(", ");
  let url = template
    .replace(/\{location\}/g, encodeURIComponent(location))
    .replace(/\{province\}/g, encodeURIComponent(q.province ?? ""))
    .replace(/\{city\}/g, encodeURIComponent(q.city ?? ""))
    .replace(/\{postalCode\}/g, encodeURIComponent(q.postalCode ?? ""));
  // Añade también como query params si no venían en la plantilla.
  const u = new URL(url);
  if (!u.searchParams.has("location") && location) u.searchParams.set("location", location);
  if (q.province && !u.searchParams.has("province")) u.searchParams.set("province", q.province);
  if (q.city && !u.searchParams.has("city")) u.searchParams.set("city", q.city);
  if (q.postalCode && !u.searchParams.has("postalCode")) u.searchParams.set("postalCode", q.postalCode);
  return u.toString();
}

/** Consulta el proveedor externo. Devuelve null si no está configurado, si la
 * consulta falla, o si la respuesta no trae venta y renta usables. Nunca lanza:
 * la valoración debe poder continuar con los datos internos. */
export async function fetchMarketData(q: MarketDataQuery): Promise<MarketOverride | null> {
  const apiUrl = process.env.MARKET_DATA_API_URL;
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (!apiUrl || !apiKey) return null;
  if (!q.province && !q.city && !q.postalCode) return null;

  const provider = process.env.MARKET_DATA_PROVIDER || "Idealista Data";
  const authHeader = process.env.MARKET_DATA_AUTH_HEADER;

  try {
    const url = buildUrl(apiUrl, q);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (authHeader) headers[authHeader] = apiKey;
    else headers.Authorization = `Bearer ${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      console.error(`[market-data] ${provider} respondió ${res.status}`);
      return null;
    }
    const data = (await res.json()) as unknown;

    const saleField = process.env.MARKET_DATA_SALE_FIELD;
    const rentField = process.env.MARKET_DATA_RENT_FIELD;

    const sale = saleField
      ? pickField(data, saleField)
      : findByKeys(data, ["saleeursqm", "sale_price", "pricesqm", "price_m2", "eursqm", "venta", "sale"]);
    const rent = rentField
      ? pickField(data, rentField)
      : findByKeys(data, ["renteursqm", "rent_price", "rentsqm", "rent_m2", "alquiler", "rent"]);

    if (sale == null || rent == null) {
      console.error(`[market-data] ${provider}: respuesta sin venta/renta usables.`);
      return null;
    }
    return {
      saleEurSqm: Math.round(sale),
      rentEurSqmMonth: Math.round(rent * 10) / 10,
      zoneName: [q.city, q.province].filter(Boolean).join(", ") || null,
      provider,
    };
  } catch (e) {
    console.error("[market-data] error al consultar el proveedor externo:", e);
    return null;
  }
}
