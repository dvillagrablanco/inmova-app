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
  uso: string; // Residencial, Industrial, Almacén, etc.
  superficie: number; // m² útiles del activo principal (sin zonas comunes)
  superficieTotal?: number; // m² construidos totales (incluye comunes)
  anoConstruccion?: number;
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
      // (rate-limit suave para no saturar Catastro: ~250ms entre llamadas)
      await new Promise((r) => setTimeout(r, 250));
      const detalle = await consultarFincaIndividual(refCompleta);

      fincas.push({
        referenciaCatastral: refCompleta,
        planta: planta || detalle?.planta || '',
        puerta: puerta || detalle?.puerta || '',
        uso: detalle?.uso || '',
        superficie: detalle?.superficie || 0,
        superficieTotal: detalle?.superficieTotal || 0,
        anoConstruccion: detalle?.anoConstruccion || 0,
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

    const superficieTotal = fincas.reduce(
      (s, f) => s + (f.superficieTotal || f.superficie),
      0
    );
    // Año de construcción: si en el bico no estaba, intentar de las fincas
    const anoFinal =
      ano > 0
        ? ano
        : fincas
            .map((f) => f.anoConstruccion || 0)
            .filter((a) => a > 0)
            .sort((a, b) => a - b)[0] || 0;

    return {
      referenciaCatastralEdificio: rc14,
      direccion,
      municipio,
      provincia,
      codigoPostal: cp,
      anoConstruccion: anoFinal,
      superficieTotal,
      fincas,
    };
  } catch (error: any) {
    logger.error('[Catastro] Error consultando RC:', error.message);
    return null;
  }
}

/**
 * Consulta los datos completos de UNA finca individual por su RC20.
 * El endpoint Consulta_DNPRC con RC20 devuelve un bloque <bico><bi> con:
 *   <luso>Residencial|Industrial|...</luso>
 *   <sfc>{superficie_total}</sfc>  ← suele incluir comunes
 *   <ant>{año}</ant>
 *   <pt>{planta}</pt> <pu>{puerta}</pu>
 *   Y bloques <cons> con el desglose:
 *     <lcd>VIVIENDA|ELEMENTOS COMUNES|GARAJE|TRASTERO</lcd> <stl>{m²}</stl>
 *
 * Devuelve la superficie ÚTIL real del activo principal (vivienda/local/etc.)
 * y la superficie construida total (incluye comunes).
 */
async function consultarFincaIndividual(rc20: string): Promise<{
  uso: string;
  planta: string;
  puerta: string;
  superficie: number; // útil del activo principal (vivienda/local/etc.)
  superficieTotal: number; // construida total (incluye comunes)
  anoConstruccion: number;
  coefParticipacion: number;
} | null> {
  try {
    const rc1 = rc20.substring(0, 7);
    const rc2 = rc20.substring(7, 14);
    const car = rc20.substring(14, 18);
    const cc1 = rc20.substring(18, 19) || '';
    const cc2 = rc20.substring(19, 20) || '';

    // Endpoint con RC20 completa devuelve bico de UNA finca
    const url = `${CATASTRO_BASE}/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc1}${rc2}${car}${cc1}${cc2}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return null;

    const xml = await resp.text();

    // Datos globales del bico
    const uso = xml.match(/<luso>([^<]*)<\/luso>/)?.[1]?.trim() || '';
    const planta = xml.match(/<pt>([^<]*)<\/pt>/)?.[1]?.trim() || '';
    const puerta = xml.match(/<pu>([^<]*)<\/pu>/)?.[1]?.trim() || '';
    const superficieTotal = parseInt(xml.match(/<sfc>(\d+)<\/sfc>/)?.[1] || '0', 10);
    const anoConstruccion = parseInt(xml.match(/<ant>(\d+)<\/ant>/)?.[1] || '0', 10);

    // Desglose por construcciones <cons>: extraer la superficie útil del
    // activo principal (sin elementos comunes)
    const consBlocks = xml.match(/<cons>[\s\S]*?<\/cons>/g) || [];
    let superficieUtilActivo = 0;
    let usosEncontrados: string[] = [];
    for (const block of consBlocks) {
      const lcd = (block.match(/<lcd>([^<]*)<\/lcd>/)?.[1] || '').toUpperCase().trim();
      const stl = parseInt(block.match(/<stl>(\d+)<\/stl>/)?.[1] || '0', 10);
      if (!lcd || stl === 0) continue;
      usosEncontrados.push(lcd);
      // Sumar todo lo que NO sea zona común
      if (lcd.includes('COMUN')) continue;
      superficieUtilActivo += stl;
    }

    // Si no hay desglose, asumimos que sfc = superficie útil
    const superficie = superficieUtilActivo > 0 ? superficieUtilActivo : superficieTotal;

    return {
      uso,
      planta,
      puerta,
      superficie,
      superficieTotal,
      anoConstruccion,
      coefParticipacion: 0,
    };
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
