/**
 * API: Consulta Catastro Público
 *
 * GET /api/catastro/consulta?rc=XXXXXXXXXXXX - Por referencia catastral
 * GET /api/catastro/consulta?q=Calle+Nombre+123+Madrid - Por dirección libre (IA asistida)
 * GET /api/catastro/consulta?provincia=X&municipio=X&via=X&numero=X - Por campos
 *
 * Flujo de búsqueda por dirección libre (q):
 * 1. Parser local intenta extraer provincia/municipio/via/numero
 * 2. Si falla o el Catastro no encuentra, Claude normaliza la dirección
 * 3. Se reintenta con la dirección normalizada por IA
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

function normalizeReferenciaCatastral(value: string): string {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function consultaPorRC(rc: string): Promise<CatastroResult | null> {
  const normalizedRc = normalizeReferenciaCatastral(rc);

  if (normalizedRc.length < 14) {
    return null;
  }

  const baseRc = normalizedRc.substring(0, 14);
  const rc1 = baseRc.substring(0, 7);
  const rc2 = baseRc.substring(7, 14);

  const url = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc1}${rc2}`;

  const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!resp.ok) return null;

  const text = await resp.text();

  // Check for error in response
  if (text.includes('<err>') || text.includes('<lerr>')) {
    const errMsg = text.match(/<des>([^<]+)<\/des>/)?.[1] || 'Error del Catastro';
    logger.warn('[Catastro] API error:', errMsg);
    return null;
  }

  // Format A: Single property response (RC 20 chars) — has <bico><bi> with <ldt>, <luso>, <sfc>, <ant>
  const direccionLdt = text.match(/<ldt>([^<]+)<\/ldt>/)?.[1] || '';
  const usoGlobal = text.match(/<luso>([^<]+)<\/luso>/)?.[1] || '';
  const supGlobal = parseInt(text.match(/<sfc>(\d+)<\/sfc>/)?.[1] || '0');
  const ano = parseInt(text.match(/<ant>(\d+)<\/ant>/)?.[1] || '0');

  // Format B: Multi-property response (RC 14 chars) — has <lrcdnp> with <rcdnp> blocks
  // Address is in <tv> (tipo vía) + <nv> (nombre vía) + <pnp> (número)
  const tv = text.match(/<tv>([^<]+)<\/tv>/)?.[1] || '';
  const nv = text.match(/<nv>([^<]+)<\/nv>/)?.[1] || '';
  const pnp = text.match(/<pnp>([^<]+)<\/pnp>/)?.[1] || '';
  const direccionFromParts = tv && nv ? `${tv} ${nv}${pnp ? ' ' + pnp : ''}` : '';

  const direccion = direccionLdt || direccionFromParts;
  const cp = text.match(/<dp>(\d+)<\/dp>/)?.[1] || '';
  const municipio = text.match(/<nm>([^<]+)<\/nm>/)?.[1] || '';
  const provincia = text.match(/<np>([^<]+)<\/np>/)?.[1] || '';

  // Parse individual units from <cons> blocks (Format A)
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

  // Parse individual properties from <rcdnp> blocks (Format B — multi-property)
  if (inmuebles.length === 0) {
    const rcdnpBlocks = text.match(/<rcdnp>[\s\S]*?<\/rcdnp>/g) || [];
    for (const block of rcdnpBlocks) {
      const car = block.match(/<car>([^<]+)<\/car>/)?.[1] || '';
      const pt = block.match(/<pt>([^<]*)<\/pt>/)?.[1] || '';
      const pu = block.match(/<pu>([^<]*)<\/pu>/)?.[1] || '';
      if (car) {
        inmuebles.push({ uso: '', planta: pt, puerta: pu, superficie: 0 });
      }
    }
  }

  return {
    referenciaCatastral: normalizedRc,
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

async function consultaPorDireccion(
  provincia: string,
  municipio: string,
  tipoVia: string,
  via: string,
  numero: string
): Promise<any> {
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

function parseDireccionLibre(
  q: string
): { provincia: string; municipio: string; tipoVia: string; via: string; numero: string } | null {
  const ciudades: Record<string, { provincia: string; municipio: string }> = {
    madrid: { provincia: 'MADRID', municipio: 'MADRID' },
    barcelona: { provincia: 'BARCELONA', municipio: 'BARCELONA' },
    valencia: { provincia: 'VALENCIA', municipio: 'VALENCIA' },
    sevilla: { provincia: 'SEVILLA', municipio: 'SEVILLA' },
    malaga: { provincia: 'MALAGA', municipio: 'MALAGA' },
    marbella: { provincia: 'MALAGA', municipio: 'MARBELLA' },
    bilbao: { provincia: 'VIZCAYA', municipio: 'BILBAO' },
    alicante: { provincia: 'ALICANTE', municipio: 'ALICANTE' },
    benidorm: { provincia: 'ALICANTE', municipio: 'BENIDORM' },
    palencia: { provincia: 'PALENCIA', municipio: 'PALENCIA' },
    valladolid: { provincia: 'VALLADOLID', municipio: 'VALLADOLID' },
    zaragoza: { provincia: 'ZARAGOZA', municipio: 'ZARAGOZA' },
    'san sebastian': { provincia: 'GUIPUZCOA', municipio: 'SAN SEBASTIAN' },
    donostia: { provincia: 'GUIPUZCOA', municipio: 'SAN SEBASTIAN' },
  };

  const normalized = q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  let provincia = '';
  let municipio = '';

  for (const [city, data] of Object.entries(ciudades)) {
    if (normalized.includes(city)) {
      provincia = data.provincia;
      municipio = data.municipio;
      break;
    }
  }
  if (!provincia) return null;

  let tipoVia = 'CL';
  const tipoViaMap: Record<string, string> = {
    calle: 'CL',
    'c/': 'CL',
    cl: 'CL',
    avenida: 'AV',
    avda: 'AV',
    av: 'AV',
    plaza: 'PZ',
    pl: 'PZ',
    pz: 'PZ',
    paseo: 'PS',
    pg: 'PS',
    ronda: 'RD',
    travesia: 'TR',
    camino: 'CM',
  };

  for (const [prefix, code] of Object.entries(tipoViaMap)) {
    const re = new RegExp(`\\b${prefix}\\.?\\s+`, 'i');
    if (re.test(q)) {
      tipoVia = code;
      break;
    }
  }

  const calleMatch =
    q.match(
      /(?:C\/|Calle|Avda?\.?|Avenida|Paseo|Plaza|Ronda|Trav[eé]s[ií]a|Camino)\s+([^,\d]+)/i
    ) || q.match(/^([^,\d]+)/i);
  const numMatch = q.match(/[\s,]+(\d+)/);

  if (!calleMatch) return null;

  let via = calleMatch[1]
    .trim()
    .replace(/,\s*$/, '')
    .replace(new RegExp(`\\b(${Object.keys(ciudades).join('|')})\\b`, 'gi'), '')
    .trim();

  if (!via) return null;

  const numero = numMatch?.[1] || '1';

  return { provincia, municipio, tipoVia, via: via.toUpperCase(), numero };
}

async function normalizarDireccionConIA(
  direccionOriginal: string
): Promise<{
  provincia: string;
  municipio: string;
  tipoVia: string;
  via: string;
  numero: string;
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Eres un experto en el Catastro español. Necesito normalizar esta dirección para buscar en la API del Catastro (OVCCallejero ConsultaNumero).

Dirección del usuario: "${direccionOriginal}"

Devuelve SOLO un JSON con estos campos exactos (nombres oficiales del Catastro, todo en MAYÚSCULAS sin acentos):
{
  "provincia": "NOMBRE_PROVINCIA",
  "municipio": "NOMBRE_MUNICIPIO",
  "tipoVia": "CL|AV|PZ|PS|RD|TR|CM",
  "via": "NOMBRE_OFICIAL_VIA_SIN_TIPO",
  "numero": "NUMERO"
}

Reglas:
- via debe ser el NOMBRE OFICIAL COMPLETO (ej: "Silvela" → "MANUEL SILVELA", "Castellana" → "PASEO DE LA CASTELLANA" pero tipoVia sería PS)
- Si hay varios números (3, 5, 7) usa el primero
- Si no hay número, pon "1"
- Sin acentos (MALAGA no MÁLAGA)
- Solo el JSON, sin explicaciones`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.provincia || !parsed.municipio || !parsed.via) return null;

    return {
      provincia: String(parsed.provincia).toUpperCase(),
      municipio: String(parsed.municipio).toUpperCase(),
      tipoVia: String(parsed.tipoVia || 'CL').toUpperCase(),
      via: String(parsed.via).toUpperCase(),
      numero: String(parsed.numero || '1'),
    };
  } catch (error: any) {
    logger.warn('[Catastro] IA normalization failed:', error.message);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rc = searchParams.get('rc');
    const q = searchParams.get('q');
    const provincia = searchParams.get('provincia');
    const municipio = searchParams.get('municipio');
    const via = searchParams.get('via');
    const numero = searchParams.get('numero');
    const tipoVia = searchParams.get('tipoVia') || 'CL';

    let result: CatastroResult | null = null;

    const normalizedRc = rc ? normalizeReferenciaCatastral(rc) : null;

    if (normalizedRc && normalizedRc.length >= 14) {
      result = await consultaPorRC(normalizedRc);
    } else if (q && q.trim().length >= 5) {
      // Paso 1: Parser local
      const parsed = parseDireccionLibre(q);
      if (parsed) {
        result = await consultaPorDireccion(
          parsed.provincia,
          parsed.municipio,
          parsed.tipoVia,
          parsed.via,
          parsed.numero
        );
      }

      // Paso 2: Si parser local falla o Catastro no encuentra → IA normaliza
      if (!result) {
        logger.info('[Catastro] Parser local no encontró resultado, intentando con IA...');
        const iaParsed = await normalizarDireccionConIA(q);
        if (iaParsed) {
          logger.info(
            `[Catastro] IA normalizó: ${iaParsed.tipoVia} ${iaParsed.via} ${iaParsed.numero}, ${iaParsed.municipio}`
          );
          result = await consultaPorDireccion(
            iaParsed.provincia,
            iaParsed.municipio,
            iaParsed.tipoVia,
            iaParsed.via,
            iaParsed.numero
          );
        }
      }

      if (!result) {
        const hint = parsed ? `"${parsed.via} ${parsed.numero}" en ${parsed.municipio}` : q;
        return NextResponse.json(
          {
            error: `No se encontró ${hint} en el Catastro. Prueba con el nombre oficial completo de la vía o la referencia catastral.`,
          },
          { status: 404 }
        );
      }
    } else if (provincia && municipio && via && numero) {
      result = await consultaPorDireccion(
        provincia.toUpperCase(),
        municipio.toUpperCase(),
        tipoVia,
        via.toUpperCase(),
        numero
      );
    } else {
      return NextResponse.json(
        {
          error:
            'Proporciona referencia catastral (rc), dirección libre (q) o campos (provincia, municipio, via, numero)',
        },
        { status: 400 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'No se encontraron datos catastrales para la referencia proporcionada' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[Catastro API]', error);
    return NextResponse.json(
      { error: 'Error consultando el catastro', message: error.message },
      { status: 500 }
    );
  }
}
