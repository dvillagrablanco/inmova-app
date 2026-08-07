// INMOSEARCH — Conector Idealista (API oficial de búsqueda)
//
// Idealista ofrece una API oficial de búsqueda (https://developers.idealista.com/)
// con autenticación OAuth2 (client_credentials). Requiere solicitar acceso
// (developers.idealista.com/access-request) y tener IDEALISTA_API_KEY /
// IDEALISTA_API_SECRET. La API tiene cuota limitada (por defecto muy baja en el
// nivel de desarrollador — históricamente ~100 peticiones/mes y ~1 req/s) y un
// máximo de 50 resultados por página.
//
// IMPORTANTE — parámetros de zona: la API NO busca por texto libre. Exige, o
// bien `center` (lat,lon) + `distance` (radio en metros), o bien un `locationId`
// (código interno de Idealista). Este conector admite ambos y también acepta un
// `location` con formato de coordenadas ("42.40,-8.81" o "42.40,-8.81 r=8000")
// para poder configurar zonas desde el perfil.
//
// NOTA: NO se implementa scraping del sitio web (violaría sus Términos de Uso).
import type { ConnectorSearchParams, PortalConnector, RawListing } from "./types";

const TOKEN_URL = "https://api.idealista.com/oauth/token";
const SEARCH_BASE = "https://api.idealista.com/3.5"; // + /{country}/search
const DEFAULT_DISTANCE_M = 15000;

async function getToken(key: string, secret: string): Promise<string> {
  const basic = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=read",
  });
  if (!res.ok) throw new Error(`Idealista OAuth error ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Extrae center + distance de un texto tipo "42.40,-8.81" o "42.40,-8.81 r=8000". */
function parseCoordLocation(loc?: string): { center?: { lat: number; lng: number }; distance?: number } {
  if (!loc) return {};
  const m = loc.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return {};
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  const r = loc.match(/r\s*=\s*(\d+)/i);
  return { center: { lat, lng }, distance: r ? Number(r[1]) : undefined };
}

export const idealistaConnector: PortalConnector = {
  id: "idealista",
  name: "Idealista (API oficial)",
  isConfigured: () => Boolean(process.env.IDEALISTA_API_KEY && process.env.IDEALISTA_API_SECRET),
  status: () =>
    idealistaConnector.isConfigured()
      ? "Configurado — API oficial de Idealista (OAuth2). Búsqueda por coordenadas o locationId."
      : "No configurado — define IDEALISTA_API_KEY e IDEALISTA_API_SECRET. Requiere acceso aprobado en developers.idealista.com.",
  async search(params: ConnectorSearchParams): Promise<RawListing[]> {
    const key = process.env.IDEALISTA_API_KEY;
    const secret = process.env.IDEALISTA_API_SECRET;
    if (!key || !secret) {
      throw new Error("Conector Idealista no configurado (faltan credenciales).");
    }

    // Resuelve la zona: coordenadas explícitas > coords en el texto > locationId.
    const parsed = parseCoordLocation(params.location);
    const center = params.center ?? parsed.center;
    const distance = params.distance ?? parsed.distance ?? DEFAULT_DISTANCE_M;
    const locationId = params.locationId;
    if (!center && !locationId) {
      throw new Error(
        "Idealista requiere zona geográfica: aporta coordenadas (center lat,lng) o un locationId. " +
          "El texto libre no es válido para la API."
      );
    }

    const country = (params.country ?? process.env.IDEALISTA_COUNTRY ?? "es").toLowerCase();
    const maxItems = Math.min(params.maxResults ?? 50, 50); // tope de la API

    const body = new URLSearchParams({
      operation: "sale",
      propertyType: mapPropertyType(params.propertyType),
      maxItems: String(maxItems),
      numPage: "1",
      order: "priceDown",
      sort: "desc",
      ...(center ? { center: `${center.lat},${center.lng}`, distance: String(distance) } : {}),
      ...(locationId ? { locationId } : {}),
      ...(params.minPrice ? { minPrice: String(params.minPrice) } : {}),
      ...(params.maxPrice ? { maxPrice: String(params.maxPrice) } : {}),
    });

    const token = await getToken(key, secret);
    const res = await fetch(`${SEARCH_BASE}/${country}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Idealista search error ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ""}`);
    }
    const data = (await res.json()) as { elementList?: IdealistaElement[] };
    return (data.elementList ?? []).map(mapElement);
  },
};

interface IdealistaElement {
  propertyCode: string;
  url?: string;
  price: number;
  address?: string;
  municipality?: string;
  province?: string;
  size?: number;
  rooms?: number;
  bathrooms?: number;
  propertyType?: string;
  status?: string;
  description?: string;
  thumbnail?: string;
  latitude?: number;
  longitude?: number;
}

function mapElement(e: IdealistaElement): RawListing {
  return {
    sourceRef: e.propertyCode,
    sourceUrl: e.url,
    title: e.address ? `${e.propertyType ?? "Vivienda"} en ${e.address}` : "Anuncio Idealista",
    price: e.price,
    address: e.address,
    city: e.municipality,
    province: e.province,
    propertyType: mapPropertyTypeBack(e.propertyType),
    builtArea: e.size,
    rooms: e.rooms,
    baths: e.bathrooms,
    condition: e.status === "good" ? "BUEN_ESTADO" : e.status === "renew" ? "A_REFORMAR" : undefined,
    description: e.description,
    images: e.thumbnail ? [e.thumbnail] : [],
    lat: e.latitude,
    lng: e.longitude,
  };
}

function mapPropertyType(t?: string): string {
  switch (t) {
    case "CASA":
    case "CHALET":
      return "homes";
    case "LOCAL":
      return "premises";
    case "GARAJE":
      return "garages";
    case "OFICINA":
      return "offices";
    default:
      return "homes";
  }
}

function mapPropertyTypeBack(t?: string): string {
  switch (t) {
    case "flat":
      return "PISO";
    case "penthouse":
      return "ATICO";
    case "duplex":
      return "DUPLEX";
    case "studio":
      return "ESTUDIO";
    case "chalet":
    case "countryHouse":
      return "CASA";
    default:
      return "PISO";
  }
}
