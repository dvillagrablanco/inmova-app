// INMOSEARCH — Extracción de datos de un anuncio pegado (texto libre / URL)
// Heurísticas robustas para el mercado español. No hace scraping: parsea el
// texto que el usuario pega. Si detecta una URL la guarda como origen.
import { detectProvince } from "@/lib/data/market";
import type { Condition, OpportunityInput, PropertyType } from "@/lib/types";

export interface ParsedListing {
  title: string;
  askingPrice: number | null;
  builtArea: number | null;
  rooms: number | null;
  baths: number | null;
  propertyType: PropertyType;
  condition: Condition | null;
  city: string | null;
  province: string | null;
  sourceUrl: string | null;
  confidence: "alta" | "media" | "baja";
  missing: string[]; // campos que no se pudieron extraer
}

/** Convierte un número en formato español (1.234.567,89) a entero. */
function normNum(raw: string): number {
  const cleaned = raw.replace(/[.\s]/g, "").split(",")[0];
  return parseInt(cleaned, 10);
}

function extractPrice(text: string): number | null {
  const inRange = (n: number) => Number.isFinite(n) && n >= 10000 && n <= 5_000_000;
  // 1) Números pegados a € / euros.
  const euro = [...text.matchAll(/(\d[\d.\s]{2,})\s*(?:€|eur\b|euros)/gi)]
    .map((m) => normNum(m[1]))
    .filter(inRange);
  if (euro.length) return Math.max(...euro);
  // 2) € delante del número.
  const euroPre = [...text.matchAll(/(?:€|eur)\s*(\d[\d.\s]{2,})/gi)]
    .map((m) => normNum(m[1]))
    .filter(inRange);
  if (euroPre.length) return Math.max(...euroPre);
  // 3) Cualquier número plausible (se asume que el precio es el mayor).
  const all = [...text.matchAll(/\b\d[\d.\s]{3,}\d\b/g)].map((m) => normNum(m[0])).filter(inRange);
  return all.length ? Math.max(...all) : null;
}

function extractArea(text: string): number | null {
  const m = text.match(/(\d{2,4}(?:[.,]\d+)?)\s*(?:m²|m2|m\.?\s*c|metros(?:\s*cuadrados)?)/i);
  if (m) {
    const n = Math.round(parseFloat(m[1].replace(",", ".")));
    if (n >= 15 && n <= 2000) return n;
  }
  return null;
}

function extractInt(text: string, re: RegExp, max: number): number | null {
  const m = text.match(re);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 0 && n <= max) return n;
  }
  return null;
}

function extractType(text: string): PropertyType {
  const t = text.toLowerCase();
  if (/[áa]tico/.test(t)) return "ATICO";
  if (/d[úu]plex/.test(t)) return "DUPLEX";
  if (/estudio/.test(t)) return "ESTUDIO";
  if (/chalet|unifamiliar|adosad|paread|\bcasa\b/.test(t)) return "CASA";
  if (/\blocal\b/.test(t)) return "LOCAL";
  return "PISO";
}

function extractCondition(text: string): Condition | null {
  const t = text.toLowerCase();
  if (/obra nueva|a estrenar|de nueva construcci/.test(t)) return "OBRA_NUEVA";
  if (/reforma integral realizada|totalmente reformad|completamente reformad|reformado\b|reformada\b/.test(t))
    return "REFORMADO";
  if (/para reformar|a reformar|necesita reforma|reformar\b|a rehabilitar|para actualizar|a actualizar/.test(t))
    return "A_REFORMAR";
  if (/reforma parcial|para entrar a reformar por partes|actualizar cocina|actualizar baño/.test(t))
    return "REFORMA_PARCIAL";
  if (/buen estado|bien conservad|para entrar a vivir|listo para entrar/.test(t)) return "BUEN_ESTADO";
  return null;
}

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s)]+/i);
  return m ? m[0] : null;
}

function extractCity(text: string): string | null {
  // "en Madrid", "en el centro de Valencia", "Barcelona,"
  const m = text.match(/\ben\s+(?:el\s+|la\s+)?(?:centro de\s+|barrio de\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/);
  return m ? m[1].trim() : null;
}

function buildTitle(text: string, type: PropertyType, city: string | null): string {
  const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0);
  if (firstLine && firstLine.length <= 90 && !/^https?:/i.test(firstLine)) return firstLine;
  const typeLabel = { PISO: "Piso", CASA: "Casa", ATICO: "Ático", DUPLEX: "Dúplex", ESTUDIO: "Estudio", LOCAL: "Local", OTRO: "Inmueble" }[type];
  return city ? `${typeLabel} en ${city}` : `${typeLabel} (anuncio importado)`;
}

/** Extrae los datos de un anuncio pegado como texto libre. */
export function parseListing(text: string): ParsedListing {
  const askingPrice = extractPrice(text);
  const builtArea = extractArea(text);
  const rooms = extractInt(text, /(\d{1,2})\s*(?:hab\b|habitaci|dormitor|dorm\b)/i, 15);
  const baths = extractInt(text, /(\d{1,2})\s*(?:baño|banos|aseo)/i, 10);
  const propertyType = extractType(text);
  const condition = extractCondition(text);
  const city = extractCity(text);
  const provinceKey = detectProvince(text);
  const province = provinceKey ? provinceKey.replace(/_/g, " ") : null;
  const sourceUrl = extractUrl(text);
  const title = buildTitle(text, propertyType, city);

  const missing: string[] = [];
  if (!askingPrice) missing.push("precio");
  if (!builtArea) missing.push("superficie");
  if (!provinceKey && !city) missing.push("ubicación");

  const confidence: ParsedListing["confidence"] =
    askingPrice && builtArea && (provinceKey || city) ? "alta" : askingPrice && builtArea ? "media" : "baja";

  return {
    title,
    askingPrice,
    builtArea,
    rooms,
    baths,
    propertyType,
    condition,
    city,
    province,
    sourceUrl,
    confidence,
    missing,
  };
}

/** Convierte lo parseado en un OpportunityInput (requiere precio). */
export function parsedToInput(p: ParsedListing): OpportunityInput | null {
  if (!p.askingPrice) return null;
  const source: OpportunityInput["source"] = p.sourceUrl && /idealista\./i.test(p.sourceUrl) ? "IDEALISTA" : "MANUAL";
  return {
    source,
    sourceUrl: p.sourceUrl ?? "",
    title: p.title,
    city: p.city ?? undefined,
    province: p.province ?? undefined,
    propertyType: p.propertyType,
    condition: p.condition ?? undefined,
    askingPrice: p.askingPrice,
    builtArea: p.builtArea ?? undefined,
    rooms: p.rooms ?? undefined,
    baths: p.baths ?? undefined,
    images: [],
    hasElevator: false,
  };
}
