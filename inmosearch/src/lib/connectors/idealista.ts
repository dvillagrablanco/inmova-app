// INMOSEARCH — Conector Idealista (API oficial)
//
// Idealista ofrece una API oficial de búsqueda (https://developers.idealista.com/)
// con autenticación OAuth2 (client_credentials). Requiere solicitar acceso y
// tener IDEALISTA_API_KEY / IDEALISTA_API_SECRET. La API tiene límites de
// llamadas y de resultados. Este conector implementa el flujo real de token +
// búsqueda; si no hay credenciales, se declara no configurado.
//
// NOTA: NO se implementa scraping del sitio web (violaría sus Términos de Uso).
import type { ConnectorSearchParams, PortalConnector, RawListing } from "./types";

const TOKEN_URL = "https://api.idealista.com/oauth/token";
const SEARCH_URL = "https://api.idealista.com/3.5/es/search";

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

export const idealistaConnector: PortalConnector = {
  id: "idealista",
  name: "Idealista (API oficial)",
  isConfigured: () => Boolean(process.env.IDEALISTA_API_KEY && process.env.IDEALISTA_API_SECRET),
  status: () =>
    idealistaConnector.isConfigured()
      ? "Configurado — API oficial de Idealista (OAuth2)."
      : "No configurado — define IDEALISTA_API_KEY e IDEALISTA_API_SECRET. Requiere acceso aprobado por Idealista.",
  async search(params: ConnectorSearchParams): Promise<RawListing[]> {
    const key = process.env.IDEALISTA_API_KEY;
    const secret = process.env.IDEALISTA_API_SECRET;
    if (!key || !secret) {
      throw new Error("Conector Idealista no configurado (faltan credenciales).");
    }
    const token = await getToken(key, secret);

    const body = new URLSearchParams({
      operation: "sale",
      propertyType: mapPropertyType(params.propertyType),
      locationName: params.location ?? "",
      maxItems: String(params.maxResults ?? 20),
      ...(params.minPrice ? { minPrice: String(params.minPrice) } : {}),
      ...(params.maxPrice ? { maxPrice: String(params.maxPrice) } : {}),
    });

    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) throw new Error(`Idealista search error ${res.status}`);
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
      return "homes";
    case "LOCAL":
      return "premises";
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
