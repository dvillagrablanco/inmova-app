/**
 * Servicio de geocodificación basado en Nominatim (OpenStreetMap).
 * Sin dependencias externas ni API key necesaria.
 *
 * Uso responsable: respetar política de Nominatim (max 1 req/s) y
 * proporcionar siempre un User-Agent válido.
 */

import logger from '@/lib/logger';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'InmovaApp/1.0 (geocoding@inmovaapp.com)';

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  source: 'nominatim';
}

/**
 * Limpia una dirección para hacerla más fácil de geocodificar.
 * Quita números de planta, "ático", "Dcha", etc.
 */
export function cleanAddressForGeocoding(addr: string): string {
  return addr
    .replace(/,?\s*\d+[ºª°]\s*(Dcha|Izda|Izq|Dch|Ext|Int|[A-Z])?\b/gi, '')
    .replace(
      /,?\s*(bajo|ático|atico|entresuelo|principal|ent|bjo|piso|planta|puerta)\s*\w*/gi,
      ''
    )
    .replace(/,?\s*\d+[ºª°]\b/g, '')
    .replace(/\b(Urb\.?|Urbanización)\s*/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/g, '')
    .trim();
}

interface NominatimAddressDetails {
  road?: string;
  house_number?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  type?: string;
  class?: string;
  address?: NominatimAddressDetails;
}

async function nominatimQuery(query: string, limit = 5): Promise<NominatimResult[]> {
  try {
    const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=${limit}&countrycodes=es&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es' },
    });
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as NominatimResult[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.warn(`[geocoding] Error consultando Nominatim para "${query}":`, error as any);
    return [];
  }
}

function getResultCity(r: NominatimResult): string | undefined {
  return r.address?.city || r.address?.town || r.address?.village || r.address?.municipality;
}

/**
 * Filtra y prioriza resultados:
 *  1) Primero los que coinciden EXACTAMENTE con la ciudad pedida
 *  2) Si hay codigoPostal, prioriza match exacto del postcode
 *  3) Prefiere resultados con house_number (dirección exacta)
 *  4) Penaliza resultados de tipo = "highway"/road sin número
 */
function rankResults(
  results: NominatimResult[],
  expectedCity?: string,
  expectedPostcode?: string
): NominatimResult | null {
  if (results.length === 0) return null;

  const norm = (s?: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  const eCity = norm(expectedCity);
  const ePostcodePrefix = (expectedPostcode || '').slice(0, 3); // 340xx para Palencia capital

  const scored = results.map((r) => {
    let score = r.importance || 0;
    const city = norm(getResultCity(r));

    if (eCity) {
      if (city === eCity) score += 1.0;
      else if (city && (city.includes(eCity) || eCity.includes(city))) score += 0.3;
      else score -= 0.5; // penaliza otra ciudad/pueblo distinta
    }

    if (expectedPostcode && r.address?.postcode) {
      if (r.address.postcode === expectedPostcode) score += 0.8;
      else if (r.address.postcode.startsWith(ePostcodePrefix)) score += 0.4;
    }

    if (r.address?.house_number) score += 0.3;
    if (r.class === 'highway' && !r.address?.house_number) score -= 0.2;
    if (r.class === 'place') score += 0.1;

    return { r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].r;
}

/**
 * Geocodifica una dirección completa probando múltiples variantes.
 * Filtra resultados por ciudad esperada para evitar matches en pueblos
 * homónimos de la misma provincia.
 */
export async function geocodeAddress(opts: {
  direccion: string;
  ciudad?: string;
  codigoPostal?: string;
  pais?: string;
}): Promise<GeocodeResult | null> {
  const { direccion, ciudad, codigoPostal, pais = 'España' } = opts;
  if (!direccion || direccion.trim().length < 3) return null;

  const cleaned = cleanAddressForGeocoding(direccion);

  // Lista ordenada de queries, de más específica a más genérica
  const tries: string[] = [];

  if (codigoPostal && ciudad) {
    tries.push(`${cleaned.split(',')[0]}, ${codigoPostal} ${ciudad}, ${pais}`);
  }
  if (ciudad) {
    tries.push(`${cleaned.split(',')[0]}, ${ciudad}, ${pais}`);
    tries.push(`${cleaned}, ${ciudad}, ${pais}`);
  }
  tries.push(`${cleaned}, ${pais}`);
  tries.push(direccion);

  let bestResult: NominatimResult | null = null;
  let bestQuery = '';

  for (const q of tries) {
    const results = await nominatimQuery(q.trim(), 5);
    const ranked = rankResults(results, ciudad, codigoPostal);
    if (ranked) {
      const cityMatch =
        !ciudad ||
        (() => {
          const norm = (s?: string) =>
            (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          return norm(getResultCity(ranked)) === norm(ciudad);
        })();

      if (cityMatch) {
        // Match perfecto, devolvemos directamente
        return {
          lat: parseFloat(ranked.lat),
          lon: parseFloat(ranked.lon),
          displayName: ranked.display_name,
          source: 'nominatim',
        };
      }

      // Guardar como fallback si no encontramos algo mejor
      if (!bestResult) {
        bestResult = ranked;
        bestQuery = q;
      }
    }
    await new Promise((r) => setTimeout(r, 1100));
  }

  // Si no encontramos ningún resultado que coincida con la ciudad esperada,
  // NO devolvemos un fallback en otra ciudad/pueblo: preferimos null para
  // evitar localizar un edificio en un sitio incorrecto.
  if (bestResult && !ciudad) {
    return {
      lat: parseFloat(bestResult.lat),
      lon: parseFloat(bestResult.lon),
      displayName: bestResult.display_name,
      source: 'nominatim',
    };
  }

  if (bestResult) {
    logger.warn(
      `[geocoding] Sin match exacto para "${ciudad}" en queries (${bestQuery}) → último intento: "${bestResult.display_name}"`
    );
  }

  return null;
}

/**
 * Heurística para detectar coordenadas almacenadas con baja precisión
 * (típicamente con menos de 4 decimales = error potencial > 11m).
 */
export function looksLowPrecisionCoord(value?: number | null): boolean {
  if (typeof value !== 'number' || Number.isNaN(value)) return true;
  const str = String(value);
  const decimals = str.includes('.') ? str.split('.')[1].length : 0;
  return decimals < 4;
}
