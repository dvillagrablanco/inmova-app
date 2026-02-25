/**
 * API: Consulta Catastro Público
 * 
 * GET /api/catastro/consulta?rc=XXXXXXXXXXXX - Consulta por referencia catastral
 * GET /api/catastro/consulta?provincia=X&municipio=X&via=X&numero=X - Por dirección
 * 
 * Usa la API pública del Catastro (OVCCallejero)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CatastroUnit {
  uso: string;
  planta: string;
  puerta: string;
  superficie: number;
}

interface CatastroResult {
  referenciaCatastral: string;
  direccion: string;
  municipio: string;
  provincia: string;
  codigoPostal: string;
  uso: string;
  superficieTotal: number;
  anoConstruccion: number;
  inmuebles: CatastroUnit[];
}

async function consultaPorRC(rc: string): Promise<CatastroResult | null> {
  const rc1 = rc.substring(0, 7);
  const rc2 = rc.substring(7, 14);
  
  const url = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc1}${rc2}`;
  
  const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) return null;
  
  const text = await resp.text();
  
  // Parse XML response
  const direccion = text.match(/<ldt>([^<]+)<\/ldt>/)?.[1] || '';
  const cp = text.match(/<dp>(\d+)<\/dp>/)?.[1] || '';
  const municipio = text.match(/<nm>([^<]+)<\/nm>/)?.[1] || '';
  const provincia = text.match(/<np>([^<]+)<\/np>/)?.[1] || '';
  const usoGlobal = text.match(/<luso>([^<]+)<\/luso>/)?.[1] || '';
  const supGlobal = parseInt(text.match(/<sfc>(\d+)<\/sfc>/)?.[1] || '0');
  const ano = parseInt(text.match(/<ant>(\d+)<\/ant>/)?.[1] || '0');
  
  // Parse individual units from <cons> blocks
  const inmuebles: CatastroUnit[] = [];
  const consBlocks = text.match(/<cons>[\s\S]*?<\/cons>/g) || [];
  
  for (const block of consBlocks) {
    const uso = block.match(/<lcd>([^<]+)<\/lcd>/)?.[1] || '';
    const planta = block.match(/<pt>([^<]+)<\/pt>/)?.[1] || '';
    const puerta = block.match(/<pu>([^<]+)<\/pu>/)?.[1] || '';
    const superficie = parseInt(block.match(/<stl>(\d+)<\/stl>/)?.[1] || '0');
    
    if (superficie > 0) {
      inmuebles.push({ uso, planta, puerta, superficie });
    }
  }
  
  return {
    referenciaCatastral: rc,
    direccion,
    municipio,
    provincia,
    codigoPostal: cp,
    uso: usoGlobal,
    superficieTotal: supGlobal || inmuebles.reduce((s, i) => s + i.superficie, 0),
    anoConstruccion: ano,
    inmuebles,
  };
}

async function consultaPorDireccion(provincia: string, municipio: string, tipoVia: string, via: string, numero: string): Promise<any> {
  const url = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaNumero?Provincia=${encodeURIComponent(provincia)}&Municipio=${encodeURIComponent(municipio)}&TipoVia=${encodeURIComponent(tipoVia)}&NomVia=${encodeURIComponent(via)}&Numero=${encodeURIComponent(numero)}`;
  
  const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) return null;
  
  const text = await resp.text();
  
  // Extract reference catastral
  const pc1 = text.match(/<pc1>([^<]+)<\/pc1>/)?.[1] || '';
  const pc2 = text.match(/<pc2>([^<]+)<\/pc2>/)?.[1] || '';
  
  if (!pc1 || !pc2) return null;
  
  const rc = `${pc1}${pc2}`;
  
  // Now get full details
  return consultaPorRC(rc);
}

/**
 * Parsea una dirección libre para extraer provincia, municipio, tipo vía, nombre vía y número.
 * Ejemplos:
 *   "Calle Gran Vía 28, Madrid" → { tipoVia: 'CL', via: 'Gran Vía', numero: '28', municipio: 'Madrid', provincia: 'Madrid' }
 *   "Avenida de la Constitución 3, Málaga, Málaga" → { tipoVia: 'AV', via: 'de la Constitución', numero: '3', municipio: 'Málaga', provincia: 'Málaga' }
 */
function parseDireccionLibre(direccion: string): { provincia: string; municipio: string; tipoVia: string; via: string; numero: string } | null {
  const clean = direccion.trim();
  
  // Patrones de tipo de vía
  const tipoViaMap: Record<string, string> = {
    'calle': 'CL', 'cl': 'CL', 'c/': 'CL', 'c.': 'CL',
    'avenida': 'AV', 'av': 'AV', 'av.': 'AV', 'avda': 'AV', 'avda.': 'AV',
    'plaza': 'PZ', 'pz': 'PZ', 'pl': 'PZ', 'pl.': 'PZ',
    'paseo': 'PS', 'ps': 'PS', 'pº': 'PS',
    'carretera': 'CR', 'ctra': 'CR', 'ctra.': 'CR',
    'camino': 'CM', 'cm': 'CM',
    'ronda': 'RD', 'rd': 'RD',
    'urbanización': 'UR', 'urbanizacion': 'UR', 'urb': 'UR', 'urb.': 'UR',
    'pasaje': 'PJ', 'travesía': 'TR', 'travesia': 'TR',
  };

  // Split by commas to get parts
  const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
  
  if (parts.length < 1) return null;
  
  // First part: tipo vía + nombre vía + número
  const streetPart = parts[0];
  
  // Try to extract tipo vía from beginning
  let tipoVia = 'CL'; // default
  let viaPart = streetPart;
  
  const lowerStreet = streetPart.toLowerCase();
  for (const [prefix, code] of Object.entries(tipoViaMap)) {
    if (lowerStreet.startsWith(prefix + ' ') || lowerStreet.startsWith(prefix + '.')) {
      tipoVia = code;
      viaPart = streetPart.substring(prefix.length).replace(/^[\s.]+/, '');
      break;
    }
  }
  
  // Extract number from end of via part
  const numMatch = viaPart.match(/\s+(\d+[A-Za-z]?)\s*$/);
  let numero = '';
  let nombreVia = viaPart;
  
  if (numMatch) {
    numero = numMatch[1];
    nombreVia = viaPart.substring(0, numMatch.index).trim();
  }
  
  // Municipio and provincia from remaining parts
  let municipio = '';
  let provincia = '';
  
  if (parts.length >= 3) {
    municipio = parts[1];
    provincia = parts[2];
  } else if (parts.length === 2) {
    municipio = parts[1];
    provincia = parts[1]; // Assume same as municipio (common for capitals)
  }
  
  if (!nombreVia || !municipio) return null;
  
  return { provincia, municipio, tipoVia, via: nombreVia, numero };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const rc = searchParams.get('rc');
    const provincia = searchParams.get('provincia');
    const municipio = searchParams.get('municipio');
    const via = searchParams.get('via');
    const numero = searchParams.get('numero');
    const tipoVia = searchParams.get('tipoVia') || 'CL';
    const direccionLibre = searchParams.get('direccionLibre');
    
    let result: CatastroResult | null = null;
    
    if (rc && rc.length >= 14) {
      result = await consultaPorRC(rc);
    } else if (direccionLibre) {
      // Parsear dirección libre
      const parsed = parseDireccionLibre(direccionLibre);
      if (!parsed) {
        return NextResponse.json(
          { error: 'No se pudo interpretar la dirección. Usa el formato: "Calle Nombre 12, Ciudad, Provincia"' },
          { status: 400 }
        );
      }
      
      logger.info('[Catastro] Dirección libre parseada:', parsed);
      result = await consultaPorDireccion(parsed.provincia, parsed.municipio, parsed.tipoVia, parsed.via, parsed.numero);
      
      // Si no encuentra, intentar con variaciones comunes
      if (!result && parsed.tipoVia === 'CL') {
        // Intentar sin tipo de vía
        for (const altTipo of ['AV', 'PZ', 'PS']) {
          result = await consultaPorDireccion(parsed.provincia, parsed.municipio, altTipo, parsed.via, parsed.numero);
          if (result) break;
        }
      }
    } else if (provincia && municipio && via && numero) {
      result = await consultaPorDireccion(provincia, municipio, tipoVia, via, numero);
    } else {
      return NextResponse.json(
        { error: 'Proporciona una dirección (ej: "Calle Gran Vía 28, Madrid"), referencia catastral, o los campos separados' },
        { status: 400 }
      );
    }
    
    if (!result) {
      return NextResponse.json(
        { error: 'No se encontraron datos catastrales. Verifica la dirección o prueba con la referencia catastral.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[Catastro API]', error);
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'El Catastro no respondió a tiempo. Inténtalo de nuevo en unos segundos.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error consultando el catastro', message: error.message },
      { status: 500 }
    );
  }
}
