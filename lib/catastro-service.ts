/**
 * Servicio de consulta al Catastro Público español.
 *
 * Usa la API pública OVCCallejero + Consulta_DNPRC para:
 * 1. Obtener la ref catastral del edificio por dirección
 * 2. Obtener todas las subunidades (fincas individuales) de un edificio
 * 3. Mapear cada finca catastral a las unidades de la app
 */

import logger from './logger';

const CATASTRO_BASE = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx';

export interface CatastroFinca {
  referenciaCatastral: string; // 20 chars: PC1(7)+PC2(7)+CAR(4)+CC1(1)+CC2(1)
  planta: string;
  puerta: string;
  uso: string;             // VIVIENDA, LOCAL, GARAJE, ALMACEN, etc.
  superficie: number;
  coefParticipacion: number;
}

export interface CatastroEdificio {
  referenciaCatastralEdificio: string; // 14 chars
  direccion: string;
  municipio: string;
  provincia: string;
  codigoPostal: string;
  anoConstruccion: number;
  superficieTotal: number;
  fincas: CatastroFinca[];
}

/**
 * Consulta el catastro por referencia catastral del edificio (14 chars)
 * y devuelve todas las fincas individuales con sus refs de 20 chars.
 */
export async function consultarEdificioPorRC(rc14: string): Promise<CatastroEdificio | null> {
  try {
    const rc1 = rc14.substring(0, 7);
    const rc2 = rc14.substring(7, 14);

    // Paso 1: Consultar el edificio para obtener datos generales + lista de inmuebles
    const url = `${CATASTRO_BASE}/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc1}${rc2}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return null;

    const xml = await resp.text();

    const direccion = xml.match(/<ldt>([^<]+)<\/ldt>/)?.[1] || '';
    const cp = xml.match(/<dp>(\d+)<\/dp>/)?.[1] || '';
    const municipio = xml.match(/<nm>([^<]+)<\/nm>/)?.[1] || '';
    const provincia = xml.match(/<np>([^<]+)<\/np>/)?.[1] || '';
    const ano = parseInt(xml.match(/<ant>(\d+)<\/ant>/)?.[1] || '0');

    // Paso 2: Extraer inmuebles individuales del bloque <lrcdnp>
    const fincas: CatastroFinca[] = [];

    // Cada inmueble individual tiene un bloque <rcdnp> con <rc><pc1><pc2><car><cc1><cc2>
    const rcdnpBlocks = xml.match(/<rcdnp>[\s\S]*?<\/rcdnp>/g) || [];

    for (const block of rcdnpBlocks) {
      const pc1 = block.match(/<pc1>([^<]+)<\/pc1>/)?.[1] || '';
      const pc2 = block.match(/<pc2>([^<]+)<\/pc2>/)?.[1] || '';
      const car = block.match(/<car>([^<]+)<\/car>/)?.[1] || '';
      const cc1 = block.match(/<cc1>([^<]*)<\/cc1>/)?.[1] || '';
      const cc2 = block.match(/<cc2>([^<]*)<\/cc2>/)?.[1] || '';

      if (!pc1 || !pc2) continue;

      const refCompleta = `${pc1}${pc2}${car}${cc1}${cc2}`.trim();
      if (refCompleta.length < 18) continue;

      const planta = block.match(/<pt>([^<]*)<\/pt>/)?.[1] || '';
      const puerta = block.match(/<pu>([^<]*)<\/pu>/)?.[1] || '';

      // Consultar detalle de cada finca individual para superficie y uso
      const detalle = await consultarFincaIndividual(refCompleta);

      fincas.push({
        referenciaCatastral: refCompleta,
        planta: planta || detalle?.planta || '',
        puerta: puerta || detalle?.puerta || '',
        uso: detalle?.uso || '',
        superficie: detalle?.superficie || 0,
        coefParticipacion: detalle?.coefParticipacion || 0,
      });
    }

    // Si no hay bloques rcdnp, intentar con el bloque <cons>
    if (fincas.length === 0) {
      const consBlocks = xml.match(/<cons>[\s\S]*?<\/cons>/g) || [];
      for (const block of consBlocks) {
        const uso = block.match(/<lcd>([^<]+)<\/lcd>/)?.[1] || '';
        const planta = block.match(/<pt>([^<]+)<\/pt>/)?.[1] || '';
        const puerta = block.match(/<pu>([^<]+)<\/pu>/)?.[1] || '';
        const superficie = parseInt(block.match(/<stl>(\d+)<\/stl>/)?.[1] || '0');

        if (superficie > 0) {
          fincas.push({
            referenciaCatastral: rc14,
            planta,
            puerta,
            uso,
            superficie,
            coefParticipacion: 0,
          });
        }
      }
    }

    const superficieTotal = fincas.reduce((s, f) => s + f.superficie, 0);

    return {
      referenciaCatastralEdificio: rc14,
      direccion,
      municipio,
      provincia,
      codigoPostal: cp,
      anoConstruccion: ano,
      superficieTotal,
      fincas,
    };
  } catch (error: any) {
    logger.error('[Catastro] Error consultando RC:', error.message);
    return null;
  }
}

async function consultarFincaIndividual(rc20: string): Promise<{
  uso: string; planta: string; puerta: string; superficie: number; coefParticipacion: number;
} | null> {
  try {
    const rc1 = rc20.substring(0, 7);
    const rc2 = rc20.substring(7, 14);

    const url = `${CATASTRO_BASE}/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc1}${rc2}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return null;

    const xml = await resp.text();

    // Find the specific unit matching our full ref
    const rcdnpBlocks = xml.match(/<rcdnp>[\s\S]*?<\/rcdnp>/g) || [];
    for (const block of rcdnpBlocks) {
      const car = block.match(/<car>([^<]+)<\/car>/)?.[1] || '';
      const cc1 = block.match(/<cc1>([^<]*)<\/cc1>/)?.[1] || '';
      const cc2 = block.match(/<cc2>([^<]*)<\/cc2>/)?.[1] || '';
      const blockRef = `${rc1}${rc2}${car}${cc1}${cc2}`.trim();

      if (blockRef === rc20) {
        const planta = block.match(/<pt>([^<]*)<\/pt>/)?.[1] || '';
        const puerta = block.match(/<pu>([^<]*)<\/pu>/)?.[1] || '';
        const uso = block.match(/<luso>([^<]*)<\/luso>/)?.[1] || '';
        const sup = parseInt(block.match(/<sfc>(\d+)<\/sfc>/)?.[1] || '0');

        return { uso, planta, puerta, superficie: sup, coefParticipacion: 0 };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Consulta el catastro por dirección y obtiene la referencia catastral.
 */
export async function consultarPorDireccion(
  provincia: string,
  municipio: string,
  via: string,
  numero: string,
  tipoVia = 'CL'
): Promise<string | null> {
  try {
    const url = `${CATASTRO_BASE}/ConsultaNumero?Provincia=${encodeURIComponent(provincia)}&Municipio=${encodeURIComponent(municipio)}&TipoVia=${encodeURIComponent(tipoVia)}&NomVia=${encodeURIComponent(via)}&Numero=${encodeURIComponent(numero)}`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return null;

    const xml = await resp.text();
    const pc1 = xml.match(/<pc1>([^<]+)<\/pc1>/)?.[1] || '';
    const pc2 = xml.match(/<pc2>([^<]+)<\/pc2>/)?.[1] || '';

    if (pc1 && pc2) return `${pc1}${pc2}`;
    return null;
  } catch {
    return null;
  }
}

/**
 * Intenta obtener la ref catastral de un edificio por su dirección.
 * Parsea la dirección para extraer provincia, municipio, calle y número.
 */
export async function obtenerRefPorDireccion(direccion: string): Promise<string | null> {
  const ciudades: Record<string, string> = {
    'madrid': 'MADRID',
    'barcelona': 'BARCELONA',
    'valencia': 'VALENCIA',
    'palencia': 'PALENCIA',
    'valladolid': 'VALLADOLID',
    'marbella': 'MARBELLA',
    'benidorm': 'BENIDORM',
    'alicante': 'ALICANTE',
  };

  const dirLower = direccion.toLowerCase();
  let municipio = '';
  let provincia = '';

  for (const [city, formal] of Object.entries(ciudades)) {
    if (dirLower.includes(city)) {
      municipio = formal;
      provincia = formal === 'MARBELLA' ? 'MALAGA' : formal === 'BENIDORM' ? 'ALICANTE' : formal;
      break;
    }
  }

  if (!municipio) return null;

  // Extract street name and number
  const calleMatch = direccion.match(/(?:C\/|Calle|Avda?\.?|Avenida|Paseo)\s+([^,\d]+)/i);
  const numMatch = direccion.match(/(?:,?\s*(?:n[ºª°]?\s*)?|número\s+)(\d+)/i);

  if (!calleMatch || !numMatch) return null;

  const via = calleMatch[1].trim();
  const numero = numMatch[1];

  return consultarPorDireccion(provincia, municipio, via, numero);
}
