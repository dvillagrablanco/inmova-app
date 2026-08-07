// INMOSEARCH — Conectores de fuentes de oportunidades
//
// AVISO LEGAL: El scraping directo de portales como Idealista o Fotocasa viola
// sus Términos de Uso y cuentan con protección anti-bot. INMOSEARCH está
// diseñado para integrarse con FUENTES LEGALES: APIs oficiales (p.ej. Idealista
// API), feeds de partners, exportaciones de portales de banca/REO e importación
// manual/CSV. Cada conector declara si está operativo o es un stub documentado.
import type { OpportunityInput } from "@/lib/types";

/** Anuncio en bruto tal y como llega de una fuente, antes de normalizar. */
export interface RawListing {
  sourceRef: string;
  sourceUrl?: string;
  title: string;
  price: number;
  address?: string;
  city?: string;
  province?: string;
  ccaa?: string;
  postalCode?: string;
  propertyType?: string;
  builtArea?: number;
  rooms?: number;
  baths?: number;
  yearBuilt?: number;
  condition?: string;
  description?: string;
  images?: string[];
  lat?: number;
  lng?: number;
  /** Renta de mercado si la fuente la aporta (p.ej. comparables). */
  marketRentMonthly?: number;
  /** €/m² objetivo de venta si la fuente lo aporta. */
  arvPricePerSqm?: number;
}

export interface ConnectorSearchParams {
  location?: string; // texto libre o código de zona
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  maxResults?: number;
}

export interface PortalConnector {
  id: string;
  name: string;
  /** ¿Está el conector configurado y listo para usarse? */
  isConfigured(): boolean;
  /** Nota sobre su estado (operativo, requiere claves, stub...). */
  status(): string;
  /** Busca oportunidades. Lanza si no está configurado. */
  search(params: ConnectorSearchParams): Promise<RawListing[]>;
}

/** Mapea el enum de origen a partir del id del conector. */
export function sourceFromConnector(id: string): OpportunityInput["source"] {
  switch (id) {
    case "idealista":
      return "IDEALISTA";
    case "reo-banks":
      return "REO_BANK";
    case "boe":
      return "BOE";
    case "http":
      return "HTTP";
    case "mock":
      return "MOCK";
    default:
      return "MANUAL";
  }
}

/** Normaliza un RawListing al input canónico de oportunidad. */
export function normalizeToInput(raw: RawListing, connectorId: string): OpportunityInput {
  return {
    source: sourceFromConnector(connectorId),
    sourceUrl: raw.sourceUrl || "",
    sourceRef: raw.sourceRef,
    title: raw.title,
    address: raw.address,
    city: raw.city,
    province: raw.province,
    ccaa: raw.ccaa,
    postalCode: raw.postalCode,
    lat: raw.lat,
    lng: raw.lng,
    propertyType: (raw.propertyType as OpportunityInput["propertyType"]) ?? "PISO",
    askingPrice: Math.round(raw.price),
    builtArea: raw.builtArea,
    rooms: raw.rooms,
    baths: raw.baths,
    yearBuilt: raw.yearBuilt,
    condition: raw.condition as OpportunityInput["condition"],
    description: raw.description,
    images: raw.images ?? [],
    arvPricePerSqm: raw.arvPricePerSqm,
    marketRentMonthly: raw.marketRentMonthly,
    hasElevator: false,
  };
}
