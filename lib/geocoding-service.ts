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

async function nominatimQuery(query: string): Promise<GeocodeResult | null> {
  try {
    const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=es&addressdetails=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es' },
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const top = data[0];
    return {
      lat: parseFloat(top.lat),
      lon: parseFloat(top.lon),
      displayName: top.display_name,
      source: 'nominatim',
    };
  } catch (error) {
    logger.warn(`[geocoding] Error consultando Nominatim para "${query}":`, error as any);
    return null;
  }
}

/**
 * Geocodifica una dirección completa probando múltiples variantes.
 * Devuelve el primer match con suficiente confianza.
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
  const cleanedHasCity = ciudad ? cleaned.toLowerCase().includes(ciudad.toLowerCase()) : true;

  const tries = [
    cleanedHasCity ? cleaned : `${cleaned}, ${ciudad}, ${pais}`,
    `${cleaned}, ${codigoPostal || ''} ${ciudad || ''}, ${pais}`.replace(/\s+/g, ' '),
    `${cleaned}, ${pais}`,
    direccion,
    ...(ciudad ? [`${cleaned.split(',')[0]}, ${ciudad}, ${pais}`] : []),
  ].filter(Boolean);

  for (const q of tries) {
    const result = await nominatimQuery(q.trim());
    if (result) return result;
    // pequeña pausa para respetar rate limit de Nominatim (~1 req/s)
    await new Promise((r) => setTimeout(r, 1100));
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
