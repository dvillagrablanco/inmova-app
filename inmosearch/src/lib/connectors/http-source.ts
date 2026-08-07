// INMOSEARCH — Adaptador de fuente autorizada (feed JSON / scraping permitido)
//
// USO RESPONSABLE: este adaptador está pensado para fuentes que TÚ estés
// autorizado a consumir (un feed de un partner REO, una exportación acordada,
// tu propia API, etc.). NO lo apuntes a portales cuyos Términos prohíban el
// acceso automatizado (Idealista, Fotocasa...). Por defecto está desactivado.
//
// Modo por defecto: consume un FEED JSON (HTTP_SOURCE_FEED_URL) que devuelve un
// array de objetos con la forma documentada abajo. Para HTML de una fuente
// autorizada, implementa el parser en `parseHtmlFeed` respetando robots.txt y
// límites de frecuencia.
import type { ConnectorSearchParams, PortalConnector, RawListing } from "./types";

/** Forma esperada de cada elemento del feed JSON autorizado. */
interface FeedItem {
  ref: string;
  url?: string;
  title?: string;
  price: number;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  propertyType?: string;
  area?: number;
  rooms?: number;
  baths?: number;
  yearBuilt?: number;
  condition?: string;
  description?: string;
  images?: string[];
  marketRentMonthly?: number;
  arvPricePerSqm?: number;
}

export const httpSourceConnector: PortalConnector = {
  id: "http",
  name: "Fuente autorizada (feed JSON)",
  isConfigured: () => Boolean(process.env.HTTP_SOURCE_FEED_URL),
  status: () =>
    process.env.HTTP_SOURCE_FEED_URL
      ? `Configurado — feed autorizado en ${maskUrl(process.env.HTTP_SOURCE_FEED_URL!)}.`
      : "No configurado — define HTTP_SOURCE_FEED_URL con un feed que estés autorizado a consumir. No usar con portales que prohíban el acceso automatizado.",
  async search(params: ConnectorSearchParams): Promise<RawListing[]> {
    const feedUrl = process.env.HTTP_SOURCE_FEED_URL;
    if (!feedUrl) throw new Error("Adaptador HTTP no configurado (falta HTTP_SOURCE_FEED_URL).");

    // Respeto básico de robots.txt para el host del feed.
    await assertRobotsAllowed(feedUrl);

    const url = withParams(feedUrl, params);
    const res = await fetch(url, {
      headers: {
        "User-Agent": process.env.HTTP_SOURCE_UA || "INMOSEARCH/1.0 (uso autorizado)",
        Accept: "application/json",
        ...(process.env.HTTP_SOURCE_AUTH ? { Authorization: process.env.HTTP_SOURCE_AUTH } : {}),
      },
    });
    if (!res.ok) throw new Error(`Feed autorizado error ${res.status}`);
    const data = (await res.json()) as FeedItem[] | { items?: FeedItem[] };
    const items = Array.isArray(data) ? data : data.items ?? [];
    return items.map(mapItem).slice(0, params.maxResults ?? 50);
  },
};

function mapItem(it: FeedItem): RawListing {
  return {
    sourceRef: it.ref,
    sourceUrl: it.url,
    title: it.title ?? `Inmueble ${it.ref}`,
    price: it.price,
    address: it.address,
    city: it.city,
    province: it.province,
    postalCode: it.postalCode,
    propertyType: it.propertyType,
    builtArea: it.area,
    rooms: it.rooms,
    baths: it.baths,
    yearBuilt: it.yearBuilt,
    condition: it.condition,
    description: it.description,
    images: it.images ?? [],
    marketRentMonthly: it.marketRentMonthly,
    arvPricePerSqm: it.arvPricePerSqm,
  };
}

function withParams(feedUrl: string, params: ConnectorSearchParams): string {
  try {
    const u = new URL(feedUrl);
    if (params.location) u.searchParams.set("location", params.location);
    if (params.minPrice) u.searchParams.set("minPrice", String(params.minPrice));
    if (params.maxPrice) u.searchParams.set("maxPrice", String(params.maxPrice));
    return u.toString();
  } catch {
    return feedUrl;
  }
}

/** Comprobación básica de robots.txt (Disallow para nuestro path). No sustituye
 * a tener permiso explícito de la fuente. */
async function assertRobotsAllowed(target: string): Promise<void> {
  try {
    const u = new URL(target);
    const robotsUrl = `${u.origin}/robots.txt`;
    const res = await fetch(robotsUrl, { headers: { "User-Agent": "INMOSEARCH/1.0" } });
    if (!res.ok) return; // sin robots.txt accesible, no bloqueamos
    const txt = await res.text();
    if (isDisallowed(txt, u.pathname)) {
      throw new Error(`robots.txt prohíbe el acceso a ${u.pathname}. Aborta por respeto a la fuente.`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("robots.txt prohíbe")) throw e;
    // errores de red al leer robots.txt no bloquean
  }
}

function isDisallowed(robots: string, path: string): boolean {
  const lines = robots.split(/\r?\n/);
  let appliesToAll = false;
  for (const raw of lines) {
    const line = raw.split("#")[0].trim();
    if (/^user-agent:\s*\*/i.test(line)) appliesToAll = true;
    else if (/^user-agent:/i.test(line)) appliesToAll = false;
    else if (appliesToAll && /^disallow:/i.test(line)) {
      const p = line.split(":")[1]?.trim();
      if (p && p !== "" && path.startsWith(p)) return true;
    }
  }
  return false;
}

function maskUrl(u: string): string {
  try {
    return new URL(u).origin + "/…";
  } catch {
    return "(url)";
  }
}
