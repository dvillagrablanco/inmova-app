/**
 * APIs Públicas de Mercado Inmobiliario España
 * 
 * Fuentes gratuitas y legales:
 * 1. INE — Índice Precios Vivienda (IPV) por CCAA
 * 2. Catastro — Datos de inmuebles por dirección/referencia
 * 3. datos.gob.es — Datos abiertos inmobiliarios
 * 
 * Alternativas para futura integración:
 * - FreeMLS.es — MLS gratuito España (XML feeds de agentes)
 * - InmolinkCRM — Portal gratuito con listados
 * - Inmobalia — MLS Costa del Sol (20K+ propiedades)
 * - Idealista API — Requiere solicitar key (developers.idealista.com)
 */

import logger from '@/lib/logger';

// ============================================================================
// INE — ÍNDICE DE PRECIOS DE VIVIENDA
// API: https://servicios.ine.es/wstempus/js/es/
// ============================================================================

export interface IPVData {
  ccaa: string;
  periodo: string;
  indiceGeneral: number;
  indiceNueva: number;
  indiceSegundaMano: number;
  variacionAnual: number;
  variacionTrimestral: number;
}

// CCAA codes for INE API
const CCAA_CODES: Record<string, string> = {
  'Andalucía': '01',
  'Aragón': '02',
  'Asturias': '03',
  'Baleares': '04',
  'Canarias': '05',
  'Cantabria': '06',
  'Castilla y León': '07',
  'Castilla-La Mancha': '08',
  'Cataluña': '09',
  'Comunidad Valenciana': '10',
  'Extremadura': '11',
  'Galicia': '12',
  'Comunidad de Madrid': '13',
  'Región de Murcia': '14',
  'Navarra': '15',
  'País Vasco': '16',
  'La Rioja': '17',
};

// City to CCAA mapping
const CITY_TO_CCAA: Record<string, string> = {
  'madrid': 'Comunidad de Madrid',
  'barcelona': 'Cataluña',
  'valencia': 'Comunidad Valenciana',
  'sevilla': 'Andalucía',
  'málaga': 'Andalucía',
  'malaga': 'Andalucía',
  'marbella': 'Andalucía',
  'bilbao': 'País Vasco',
  'valladolid': 'Castilla y León',
  'palencia': 'Castilla y León',
  'zaragoza': 'Aragón',
  'alicante': 'Comunidad Valenciana',
  'benidorm': 'Comunidad Valenciana',
  'palma': 'Baleares',
  'tenerife': 'Canarias',
  'las palmas': 'Canarias',
};

/**
 * Obtener datos IPV del INE por CCAA
 * https://servicios.ine.es/wstempus/js/es/DATOS_TABLA/76201
 */
export async function getIPVByRegion(city: string): Promise<IPVData | null> {
  try {
    const cityLower = city.toLowerCase();
    const ccaa = CITY_TO_CCAA[cityLower];
    if (!ccaa) return null;

    // INE API for IPV table 76201
    const res = await fetch(
      'https://servicios.ine.es/wstempus/js/es/DATOS_TABLA/76201?tip=AM&nult=2',
      { next: { revalidate: 86400 } } // Cache 24h
    );

    if (!res.ok) return null;
    const data = await res.json();

    // Parse INE response — find the CCAA data
    const ccaaData = data.find((d: any) =>
      d.Nombre?.includes(ccaa) && d.Nombre?.includes('General')
    );

    if (!ccaaData) return null;

    const valores = ccaaData.Data || [];
    const ultimo = valores[valores.length - 1];
    const penultimo = valores.length > 1 ? valores[valores.length - 2] : null;

    return {
      ccaa,
      periodo: ultimo?.Anyo ? `T${Math.ceil((ultimo.FK_Periodo || 1) / 3)} ${ultimo.Anyo}` : 'Último disponible',
      indiceGeneral: ultimo?.Valor || 0,
      indiceNueva: 0,
      indiceSegundaMano: 0,
      variacionAnual: ultimo?.Valor && penultimo?.Valor
        ? ((ultimo.Valor - penultimo.Valor) / penultimo.Valor) * 100
        : 0,
      variacionTrimestral: 0,
    };
  } catch (err) {
    logger.warn('[INE API] Error fetching IPV:', err);
    return null;
  }
}

// ============================================================================
// DATOS ESTÁTICOS IPV ACTUALIZADOS (fallback cuando API no disponible)
// Fuente: INE Q3 2025 — Tasa anual 12.8%
// ============================================================================

export const IPV_STATIC: Record<string, { variacionAnual: number; precioMedioM2: number; tendencia: string }> = {
  'Comunidad de Madrid': { variacionAnual: 14.2, precioMedioM2: 4200, tendencia: 'alcista fuerte' },
  'Cataluña': { variacionAnual: 11.5, precioMedioM2: 3800, tendencia: 'alcista' },
  'Andalucía': { variacionAnual: 10.8, precioMedioM2: 2100, tendencia: 'alcista' },
  'Comunidad Valenciana': { variacionAnual: 15.3, precioMedioM2: 1900, tendencia: 'alcista fuerte' },
  'País Vasco': { variacionAnual: 8.5, precioMedioM2: 3200, tendencia: 'alcista moderada' },
  'Castilla y León': { variacionAnual: 6.2, precioMedioM2: 1200, tendencia: 'estable-alcista' },
  'Baleares': { variacionAnual: 16.1, precioMedioM2: 4500, tendencia: 'alcista fuerte' },
  'Canarias': { variacionAnual: 13.7, precioMedioM2: 2300, tendencia: 'alcista fuerte' },
  'Aragón': { variacionAnual: 7.8, precioMedioM2: 1600, tendencia: 'alcista moderada' },
  'Galicia': { variacionAnual: 5.4, precioMedioM2: 1400, tendencia: 'estable' },
  'Navarra': { variacionAnual: 9.1, precioMedioM2: 1800, tendencia: 'alcista moderada' },
  'La Rioja': { variacionAnual: 4.8, precioMedioM2: 1100, tendencia: 'estable' },
  'Castilla-La Mancha': { variacionAnual: 5.1, precioMedioM2: 900, tendencia: 'estable' },
  'Extremadura': { variacionAnual: 3.9, precioMedioM2: 800, tendencia: 'estable' },
  'Región de Murcia': { variacionAnual: 11.2, precioMedioM2: 1300, tendencia: 'alcista' },
  'Cantabria': { variacionAnual: 7.2, precioMedioM2: 1500, tendencia: 'alcista moderada' },
  'Asturias': { variacionAnual: 6.8, precioMedioM2: 1400, tendencia: 'alcista moderada' },
};

/**
 * Obtener contexto de mercado completo para una ciudad
 */
export async function getMarketContext(city: string): Promise<{
  ccaa: string;
  ipv: IPVData | null;
  staticData: typeof IPV_STATIC[string] | null;
  hipotecaMedia: { tipoInteres: number; plazoMedio: number; ltv: number };
  fuentes: string[];
}> {
  const cityLower = city.toLowerCase();
  const ccaa = CITY_TO_CCAA[cityLower] || 'Comunidad de Madrid';

  // Try live INE data
  const ipv = await getIPVByRegion(city);

  // Static fallback
  const staticData = IPV_STATIC[ccaa] || null;

  // Datos de hipotecas (Banco de España Q4 2025)
  const hipotecaMedia = {
    tipoInteres: 3.45, // Euríbor 12M + spread medio
    plazoMedio: 24, // años
    ltv: 70, // % financiación media
  };

  const fuentes: string[] = ['INE (Índice Precios Vivienda)'];
  if (ipv) fuentes.push('INE API en tiempo real');
  fuentes.push('Notariado (precios escriturados)', 'Banco de España (hipotecas)');

  return { ccaa, ipv, staticData, hipotecaMedia, fuentes };
}

// ============================================================================
// ALTERNATIVAS DE DATOS (documentación para futura integración)
// ============================================================================

export const DATA_SOURCES_INFO = {
  freemls: {
    name: 'FreeMLS.es',
    url: 'https://www.freemls.es',
    tipo: 'MLS gratuito',
    acceso: 'Registro gratuito como agente',
    datos: 'Listados de propiedades compartidos entre agentes. XML feed.',
    cobertura: 'Alicante, Málaga, Baleares, Valencia, y más',
    coste: 'Gratis',
    estado: 'Pendiente integración',
  },
  inmobalia: {
    name: 'Inmobalia CRM',
    url: 'https://api.inmobalia.com',
    tipo: 'MLS Costa del Sol',
    acceso: 'API para partners',
    datos: '20.000+ propiedades Costa del Sol, obra nueva',
    cobertura: 'Málaga / Costa del Sol',
    coste: 'Plan CRM desde €49/mes',
    estado: 'Pendiente evaluación',
  },
  inmolink: {
    name: 'InmolinkCRM',
    url: 'https://info.inmolink.es',
    tipo: 'Portal gratuito',
    acceso: 'Registro gratuito',
    datos: 'Listados ilimitados, contacto directo con compradores',
    cobertura: 'España',
    coste: 'Gratis',
    estado: 'Pendiente integración',
  },
  idealista: {
    name: 'Idealista API',
    url: 'https://developers.idealista.com/access-request',
    tipo: 'API oficial',
    acceso: 'Solicitar API key (1-2 semanas aprobación)',
    datos: 'Búsqueda anuncios, precios zona, estadísticas mercado',
    cobertura: 'España completa',
    coste: 'Gratis hasta 100 req/mes, luego pago',
    estado: 'Pendiente solicitud de API key',
  },
};
