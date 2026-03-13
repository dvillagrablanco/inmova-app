/**
 * POST /api/investment/analysis/ai-analyze-proposal
 *
 * Recibe una propuesta de broker (texto, PDF o datos estructurados) con rent roll
 * y genera un análisis completo cuestionando la información facilitada,
 * contrastando con datos propios y generando valoración independiente.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ANALYSIS_SYSTEM_PROMPT = `Eres un analista de inversiones inmobiliarias senior con 20 años de experiencia en el mercado español. Analizas propuestas de CUALQUIER tipo de activo inmobiliario.

Tu MENTALIDAD debe ser ESCÉPTICA y CONSERVADORA.

## PASO 0: DETECTAR TIPO DE ACTIVO
PRIMERO identifica qué tipo de activo es y adapta TODO el análisis:
- **Edificio residencial**: yields objetivo 5-7% bruto. Gastos: IBI ~0.5-1%, comunidad, seguro ~0.15%, mantenimiento 2-4% renta, gestión 5-8%. Vacío 5-8%. Riesgos: zona tensionada, LAU, rotación.
- **Local comercial**: yields objetivo 6-9% bruto. IBI más alto ~1-2%. Vacío 8-15%. Riesgos: ubicación, licencia actividad, plazo vacío largo. Analizar: fachada, escaparate, actividad permitida.
- **Garaje/parking**: yields 4-6% bruto. Gastos muy bajos. Vacío 3-5%. Riesgos: ZBE, movilidad urbana, vehículo eléctrico. Analizar: €/plaza, accesibilidad, tipo plaza.
- **Trastero**: yields 7-10% bruto. Gastos mínimos. Riesgos: baja liquidez, mercado limitado. Analizar: €/m2/mes vs self-storage.
- **Oficina**: yields 5-7% bruto. Vacío 10-20%. Riesgos: teletrabajo, obsolescencia, eficiencia energética. Analizar: tenant quality, carencias, break options.
- **Nave industrial/logística**: yields 6-9% bruto. Gastos bajos. Riesgos: contaminación suelo, licencias. Analizar: altura, muelles, acceso autopista.
- **Edificio mixto**: desglosar CADA uso con sus propios yields y gastos. Yield ponderado.
- **Solar/terreno**: no rent roll. Análisis de edificabilidad, uso permitido, valoración residual.

## FASE 1: EXTRACCIÓN Y VERIFICACIÓN
- Extraer TODAS las unidades con tipo correcto (vivienda/garaje/local/trastero/oficina/nave/otro)
- Para cada unidad: tipo, referencia, superficie, renta mensual, estado
- SEÑALAR inconsistencias según el tipo de activo

## FASE 2: ANÁLISIS CRÍTICO (ADAPTADO AL TIPO)
Para cada punto genera un "flag" (verde ✅, amarillo ⚠️, rojo 🔴):
- Yield declarado vs calculado
- Rentas €/m2 vs mercado de la zona PARA ESE TIPO DE ACTIVO
- Ocupación: ¿creíble para este tipo? (garaje 95%, oficina 80%, local 85%, vivienda 93%)
- Estado: ¿CAPEX necesario? (adaptado: local=acondicionamiento, nave=cubierta, oficina=HVAC)
- Gastos: ¿están TODOS para este tipo? (cada tipo tiene gastos diferentes)
- Riesgos regulatorios específicos del tipo
- Riesgos de mercado específicos (ZBE para garajes, teletrabajo para oficinas, etc.)

## FASE 3: ANÁLISIS INDEPENDIENTE
- Yield objetivo ADAPTADO al tipo de activo (no usar 5-6% para todo)
- Precio máximo con yield objetivo del tipo correspondiente
- 3 escenarios (conservador/base/optimista)
- Conclusión: COMPRAR / NEGOCIAR / DESCARTAR

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "rentRoll": [{
    "tipo": "vivienda|garaje|local|trastero|oficina|otro",
    "referencia": "1A",
    "superficie": 75,
    "habitaciones": 2,
    "banos": 1,
    "rentaMensual": 900,
    "rentaMercado": 1050,
    "estado": "alquilado|vacio|reforma",
    "contratoVencimiento": "2026-12",
    "inquilino": "nombre o ref"
  }],
  "datosActivo": {
    "nombre": "Edificio X",
    "direccion": "Calle Y nº Z, Madrid",
    "ciudad": "Madrid",
    "askingPrice": 2000000,
    "ibiAnual": 8000,
    "comunidadMensual": 350,
    "seguroAnual": 2500,
    "mantenimientoAnual": 3000,
    "superficieTotal": 500,
    "anoConstruccion": 1975,
    "estadoConservacion": "bueno|reformado|necesita reforma"
  },
  "datosQueFaltan": [
    {
      "dato": "campo_faltante",
      "importancia": "critica|importante|deseable",
      "porQue": "por qué este dato cambia la decisión"
    }
  ],
  "preguntasParaBroker": ["pregunta 1", "pregunta 2"],
  "analisisCritico": {
    "flags": [{ "categoria": "string", "nivel": "verde|amarillo|rojo", "detalle": "string" }],
    "rentasInfladas": false,
    "gastosOmitidos": ["seguro ~2.500€/año", "mantenimiento ~3.000€/año"],
    "riesgos": ["Zona tensionada - tope de renta en renovaciones", "2 contratos vencen en 6 meses"],
    "oportunidades": ["Gap de renta +15% en 3 unidades", "Local comercial infrautilizado"],
    "contratosMasProximosAVencer": ["1A vence dic 2026", "2B vence mar 2027"],
    "gastosEstimadosOmitidos": {
      "ibiEstimado": 8000,
      "comunidadEstimada": 4200,
      "seguroEstimado": 2500,
      "mantenimientoEstimado": 3000,
      "gestionEstimada": 3600
    }
  },
  "analisisIndependiente": {
    "yieldBrutoReal": 5.8,
    "yieldNetoEstimado": 4.2,
    "rentaBrutaAnual": 120000,
    "opexEstimadoAnual": 25000,
    "noiEstimado": 95000,
    "rentaMercadoEstimadaMensual": 11000,
    "precioMaximoRecomendado": 1800000,
    "descuentoSugerido": 15,
    "precioM2Compra": 4000,
    "precioM2Zona": 4500,
    "tirEstimada10anos": 7.5,
    "escenarios": {
      "conservador": { "precio": 1600000, "yield": 5.5, "cashFlowMensual": 2500 },
      "base": { "precio": 1800000, "yield": 4.8, "cashFlowMensual": 1800 },
      "optimista": { "precio": 1950000, "yield": 4.3, "cashFlowMensual": 1200 }
    },
    "conclusion": "COMPRAR|NEGOCIAR|DESCARTAR",
    "resumenEjecutivo": "string con resumen de 3-5 líneas"
  }
}`;

export function buildUserDataContext(
  userData: Record<string, string> | null,
  additionalNotes?: string | null
) {
  const entries = Object.entries(userData || {}).filter(([, value]) => String(value || '').trim());
  const notes = String(additionalNotes || '').trim();

  if (entries.length === 0 && !notes) {
    return '';
  }

  const lines = [
    '',
    '## DATOS ADICIONALES APORTADOS POR EL USUARIO (TRATAR COMO FIABLES)',
    'El usuario conoce estos datos y debes incorporarlos al análisis para completar la propuesta del broker.',
    'Si contradicen al broker, prioriza el dato del usuario y explica cómo cambia el veredicto.',
  ];

  for (const [key, value] of entries) {
    lines.push(`- ${key}: ${value}`);
  }

  if (notes) {
    lines.push(`- Notas adicionales del usuario: ${notes}`);
  }

  return lines.join('\n');
}

// ============================================================================
// HELPERS: Market data (metodología profesional de tasación)
// ============================================================================

async function getMarketDataSafe(address: string): Promise<any> {
  try {
    const { getMarketDataByAddress } = await import('@/lib/market-data-service');
    return getMarketDataByAddress(address);
  } catch {
    return null;
  }
}

async function getPlatformDataSafe(
  city: string,
  postalCode?: string,
  address?: string
): Promise<any> {
  try {
    const { getAggregatedMarketData, formatPlatformDataForPrompt } =
      await import('@/lib/external-platform-data-service');
    const data = await getAggregatedMarketData({ city, postalCode, address });
    return { raw: data, promptText: formatPlatformDataForPrompt(data) };
  } catch {
    return null;
  }
}

async function getIdealistaDataSafe(city: string): Promise<any> {
  try {
    const { getIdealistaDataReport } = await import('@/lib/idealista-data-service');
    return await getIdealistaDataReport(city);
  } catch {
    return null;
  }
}

function extractCityFromText(text: string): string {
  const cities = [
    'Madrid',
    'Barcelona',
    'Valencia',
    'Sevilla',
    'Málaga',
    'Malaga',
    'Bilbao',
    'Zaragoza',
    'Palencia',
    'Valladolid',
    'Alicante',
    'Marbella',
    'Benidorm',
    'Palma',
    'Córdoba',
    'Cordoba',
    'Granada',
    'Murcia',
    'Vigo',
    'Gijón',
    'Gijon',
    'Santander',
    'San Sebastián',
    'San Sebastian',
    'Toledo',
    'Burgos',
    'Salamanca',
    'León',
    'Leon',
    'Cádiz',
    'Cadiz',
    'Huelva',
    'Tarragona',
    'Girona',
    'Lleida',
  ];
  const textLower = text.toLowerCase();
  for (const city of cities) {
    if (textLower.includes(city.toLowerCase())) return city;
  }
  return 'Madrid';
}

/**
 * Construye el contexto de mercado para inyectar en el prompt de Claude.
 * Usa EXCLUSIVAMENTE datos de mercado público (Notariado, portales, INE).
 * NO usa portfolio del inversor como comparable (cada activo tiene sus circunstancias).
 */
function buildMarketContextPrompt(marketData: any, platformData: any): string {
  const parts: string[] = [];

  parts.push(`\n
## DATOS DE MERCADO INDEPENDIENTES — METODOLOGÍA DE TASACIÓN PROFESIONAL

Aplica los 3 métodos de valoración profesional (Orden ECO/805/2003):

### MÉTODO 1: COMPARACIÓN (Método de Mercado)
Usa los datos de transacciones reales y ofertas actuales para determinar €/m² de mercado.
Aplica coeficientes de homogeneización por: superficie, planta, estado, antigüedad, orientación.
El asking price de portales debe ajustarse -10% a -15% para estimar precio de cierre real.`);

  if (marketData) {
    parts.push(`
DATOS DE ZONA — ${marketData.zona}:
- Precio venta REAL escriturado (Notariado): ${marketData.precioRealVentaM2}€/m²
- Asking price portales (Idealista/Fotocasa): ${marketData.askingPriceVentaM2}€/m² (ajustar -12% para cierre)
- Alquiler real zona: ${marketData.precioRealAlquilerM2}€/m²/mes
- Alquiler portales: ${marketData.askingPriceAlquilerM2}€/m²/mes
- Garaje venta medio zona: ${marketData.precioGarajeVenta}€
- Garaje alquiler medio zona: ${marketData.precioGarajeAlquiler}€/mes
- Tendencia: ${marketData.tendencia} | Demanda: ${marketData.demanda}
- Fuentes: ${marketData.fuenteNotarial || 'Notariado'}, ${marketData.fuente || 'Idealista/Fotocasa'}`);
  }

  if (platformData?.promptText) {
    parts.push(`\nDATOS MULTI-FUENTE (scraping + Idealista Data):\n${platformData.promptText}`);
  }

  // Datos enriquecidos de Idealista Data si están en platformData
  if (platformData?.raw?.platformData) {
    const idealistaData = platformData.raw.platformData.find(
      (pd: any) => pd.source === 'idealista_data'
    );
    if (idealistaData?.rawData) {
      const raw = idealistaData.rawData;
      if (raw.grossYield > 0) {
        parts.push(`\nRENTABILIDAD REAL DE MERCADO (Idealista Data):
- Yield bruto residencial en esta ciudad: ${raw.grossYield}%
- USAR ESTE DATO para validar el yield que presenta el broker.
- Si el broker presenta yield superior al del mercado, CUESTIONAR si las rentas son reales.`);
      }
      if (raw.subZones?.length > 0) {
        parts.push(`\nPRECIOS POR SUBZONA/DISTRITO (Idealista Data):`);
        for (const zone of raw.subZones.slice(0, 8)) {
          parts.push(
            `- ${zone.location}: ${zone.pricePerM2}€/m²${zone.annualVariation ? ` (${zone.annualVariation > 0 ? '+' : ''}${zone.annualVariation}% anual)` : ''}`
          );
        }
        parts.push(
          `USA la subzona más cercana al activo para comparar €/m² del broker vs mercado.`
        );
      }
      if (raw.priceEvolution?.length > 0) {
        parts.push(`\nEVOLUCIÓN PRECIOS (Idealista Data, últimos periodos):`);
        for (const p of raw.priceEvolution) {
          parts.push(
            `- ${p.period}: ${p.pricePerM2}€/m²${p.variation ? ` (${p.variation > 0 ? '+' : ''}${p.variation}%)` : ''}`
          );
        }
        parts.push(
          `USA esta evolución para validar si la tendencia declarada por el broker es coherente.`
        );
      }
    }
  }

  parts.push(`
### MÉTODO 2: CAPITALIZACIÓN DE RENTAS (Income Approach)
Valoración = NOI / Cap Rate objetivo
- Cap Rate se determina por tipo de activo y zona (NO por portfolio del comprador)
- Residencial prime: 3.5-4.5% | Residencial zona media: 4.5-6% | Periferia: 5.5-7%
- Local comercial prime: 4-5.5% | Zona secundaria: 5.5-8%
- Garaje centro: 4-5.5% | Garaje periferia: 5-7%
- Oficina prime: 4-5% | Oficina secundaria: 5.5-7.5%
- Logístico: 5-7% | Trastero: 6-9%
- Aplicar prima de riesgo +0.5-1% si: edificio antiguo, zona no consolidada, inquilinos débiles

### MÉTODO 3: COSTE DE REPOSICIÓN (Cost Approach — complementario)
- Valor suelo + Coste construcción - Depreciación
- Solo como referencia cruzada, no como método principal para activos en renta
- Útil para detectar si el precio pedido está muy por encima del valor de reposición

INSTRUCCIONES CRÍTICAS:
- CADA activo tiene sus propias circunstancias. NO uses promedios genéricos.
- Analiza la propuesta del broker contra DATOS DE MERCADO PÚBLICO, no contra otros activos del comprador.
- Señala si el broker infla rentas, omite gastos o maquilla yields.
- Calcula precio justo con CADA método y muestra la horquilla resultante.

PONDERACIÓN DE MÉTODOS PARA PRECIO JUSTO:
- Comparables de mercado (transacciones reales escrituradas): 65% del peso
- Criterio experto y ajuste por características: 20% del peso
- Capitalización de rentas (Income Approach): 15% del peso — SOLO como validación cruzada
- IMPORTANTE: La capitalización de rentas NO debe ser el método principal. El precio de mercado real
  basado en transacciones escrituradas debe ser SIEMPRE la referencia primaria.
  La capitalización tiende a sobrevalorar cuando las rentas están infladas temporalmente.
  Si capitalización difiere >20% de comparables reales, prioriza comparables.
- El veredicto debe basarse en esta ponderación, NO en la intersección igualitaria de los 3 métodos.`);

  return parts.join('\n');
}

function buildMarketContextResponse(marketData: any, platformData: any, parsedAnalysis: any) {
  // Market context from public sources
  const marketContext = marketData
    ? {
        precioM2ZonaReal: marketData.precioRealVentaM2,
        precioM2ZonaAsking: marketData.askingPriceVentaM2,
        alquilerM2ZonaReal: marketData.precioRealAlquilerM2,
        alquilerM2ZonaAsking: marketData.askingPriceAlquilerM2,
        precioGarajeVenta: marketData.precioGarajeVenta,
        precioGarajeAlquiler: marketData.precioGarajeAlquiler,
        zona: marketData.zona,
        tendenciaZona: marketData.tendencia,
        demandaZona: marketData.demanda,
        fuentePrecioReal: marketData.fuenteNotarial || 'Notariado',
        fuenteAsking: marketData.fuente || 'Idealista/Fotocasa',
      }
    : null;

  // Idealista Data enrichment
  let idealistaDataEnrichment = null;
  if (platformData?.raw?.platformData) {
    const idealistaSource = platformData.raw.platformData.find(
      (pd: any) => pd.source === 'idealista_data'
    );
    if (idealistaSource?.rawData) {
      idealistaDataEnrichment = {
        grossYield: idealistaSource.rawData.grossYield || null,
        subZones: (idealistaSource.rawData.subZones || []).slice(0, 10),
        priceEvolution: (idealistaSource.rawData.priceEvolution || []).slice(-12),
        avgDaysOnMarket: idealistaSource.avgDaysOnMarket || null,
        salePricePerM2: idealistaSource.pricePerM2Sale || null,
        rentPricePerM2: idealistaSource.pricePerM2Rent || null,
        reliability: idealistaSource.reliability || null,
        trend: idealistaSource.trend || null,
        trendPercentage: idealistaSource.trendPercentage || null,
      };
    }
  }

  // Platform data summary
  const platformSummary = platformData?.raw
    ? {
        weightedSalePricePerM2: platformData.raw.weightedSalePricePerM2,
        weightedRentPricePerM2: platformData.raw.weightedRentPricePerM2,
        sourcesUsed: platformData.raw.sourcesUsed,
        overallReliability: platformData.raw.overallReliability,
        comparablesCount: platformData.raw.allComparables?.length || 0,
        trend: platformData.raw.marketTrend,
        trendPercentage: platformData.raw.trendPercentage,
        demandLevel: platformData.raw.demandLevel,
        idealistaData: idealistaDataEnrichment,
      }
    : null;

  // Precio vs broker — basado en datos de mercado público
  const brokerPrecioM2 =
    parsedAnalysis?.analisisIndependiente?.precioM2Compra ||
    (parsedAnalysis?.datosActivo?.askingPrice && parsedAnalysis?.datosActivo?.superficieTotal
      ? parsedAnalysis.datosActivo.askingPrice / parsedAnalysis.datosActivo.superficieTotal
      : null);

  let precioVsBroker = null;
  if (brokerPrecioM2 && marketData?.precioRealVentaM2) {
    const diff =
      ((brokerPrecioM2 - marketData.precioRealVentaM2) / marketData.precioRealVentaM2) * 100;
    precioVsBroker = {
      precioM2Broker: Math.round(brokerPrecioM2),
      precioM2Mercado: marketData.precioRealVentaM2,
      precioM2Asking: marketData.askingPriceVentaM2,
      diferenciaPercent: Number(diff.toFixed(1)),
      estado:
        diff > 15
          ? 'sobrevalorado'
          : diff > 5
            ? 'ligeramente_alto'
            : diff > -5
              ? 'en_linea'
              : 'infravalorado',
    };
  }

  return { marketContext, platformSummary, precioVsBroker };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const additionalContext = formData.get('context') as string | null;
    const additionalNotes = formData.get('additionalNotes') as string | null;
    const userDataRaw = formData.get('userData') as string | null;

    let userData: Record<string, string> | null = null;
    if (userDataRaw) {
      try {
        const parsed = JSON.parse(userDataRaw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          userData = Object.fromEntries(
            Object.entries(parsed).map(([key, value]) => [key, String(value ?? '')])
          );
        }
      } catch {
        userData = null;
      }
    }

    if (!file && !text) {
      return NextResponse.json(
        { error: 'Se requiere un archivo o texto con la propuesta del broker' },
        { status: 400 }
      );
    }

    let documentContent = text || '';
    let fileName = 'propuesta-broker';

    if (file) {
      fileName = file.name;
      if (file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        documentContent = await file.text();
      }
    }

    // ── Extract address/city from text for market data lookup ──
    const fullText = documentContent || additionalContext || '';
    const addressHint = fullText.substring(0, 2000);
    const detectedCity = extractCityFromText(fullText);

    // ── Fetch market data IN PARALLEL (Idealista Data + portales + Notariado) ──
    const marketDataPromise = getMarketDataSafe(addressHint);
    const platformDataPromise = getPlatformDataSafe(detectedCity, undefined, addressHint);

    // ── Handle file-based analysis (PDF/image) ──
    if (file && (file.type.includes('image') || file.type === 'application/pdf')) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');

      // Wait for market data
      const [marketData, platformData] = await Promise.all([
        marketDataPromise,
        platformDataPromise,
      ]);
      const marketPrompt = buildMarketContextPrompt(marketData, platformData);
      const userDataContext = buildUserDataContext(userData, additionalNotes);

      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const mediaType =
        file.type === 'application/pdf'
          ? ('application/pdf' as const)
          : file.type.includes('png')
            ? ('image/png' as const)
            : file.type.includes('gif')
              ? ('image/gif' as const)
              : file.type.includes('webp')
                ? ('image/webp' as const)
                : ('image/jpeg' as const);

      const userContent: any[] = [
        {
          type: 'document',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `Analiza esta propuesta de broker/inmobiliario. ${additionalContext || ''}\n\nEl documento es: ${fileName}\n${marketPrompt}\n${userDataContext}\n\nExtrae el rent roll, cuestiona los datos, CONTRASTA con los datos de mercado independientes y genera tu análisis independiente. Si el usuario aporta datos faltantes, intégralos y vuelve a emitir el veredicto. Responde SOLO con JSON válido.`,
        },
      ];

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      });

      const textContent = response.content.find((c: any) => c.type === 'text') as any;
      const rawAnalysis = textContent?.text || '';

      return parseAndReturnResult(rawAnalysis, marketData, platformData, userData);
    }

    // ── Handle text-based analysis ──
    const [marketData, platformData] = await Promise.all([marketDataPromise, platformDataPromise]);
    const marketPrompt = buildMarketContextPrompt(marketData, platformData);
    const userDataContext = buildUserDataContext(userData, additionalNotes);

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analiza esta propuesta de broker/inmobiliario. ${additionalContext || ''}\n\nContenido:\n${documentContent.substring(0, 20000)}\n${marketPrompt}\n${userDataContext}\n\nExtrae el rent roll, cuestiona los datos, CONTRASTA con los datos de mercado independientes y genera tu análisis independiente. Si el usuario aporta datos faltantes, intégralos y vuelve a emitir el veredicto. Responde SOLO con JSON válido.`,
        },
      ],
    });

    const textContent = response.content.find((c: any) => c.type === 'text') as any;
    const rawAnalysis = textContent?.text || '';

    return parseAndReturnResult(rawAnalysis, marketData, platformData, userData);
  } catch (error: any) {
    logger.error('[AI Analyze Proposal]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error analizando propuesta' }, { status: 500 });
  }
}

function parseAndReturnResult(
  rawAnalysis: string,
  marketData?: any,
  platformData?: any,
  userData?: Record<string, string> | null
) {
  let parsed: any = {};
  try {
    const jsonMatch = rawAnalysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch (parseErr) {
    logger.warn('[AI Analyze Proposal] JSON parse failed, returning raw');
    parsed = { rawAnalysis };
  }

  // Build market context for response
  const contextData = buildMarketContextResponse(marketData || null, platformData || null, parsed);

  return NextResponse.json({
    success: true,
    data: {
      rentRoll: (parsed.rentRoll || []).map((u: any) => ({
        tipo: u.tipo || 'vivienda',
        referencia: u.referencia || '',
        superficie: u.superficie || 0,
        habitaciones: u.habitaciones || 0,
        banos: u.banos || 0,
        rentaMensual: u.rentaMensual || 0,
        rentaMercado: u.rentaMercado || 0,
        estado: u.estado || 'alquilado',
        contratoVencimiento: u.contratoVencimiento || '',
        inquilino: u.inquilino || '',
      })),
      datosActivo: parsed.datosActivo || {},
      datosQueFaltan: parsed.datosQueFaltan || [],
      preguntasParaBroker: parsed.preguntasParaBroker || [],
      datosUsuarioIncorporados: userData || {},
      analisisCritico: parsed.analisisCritico || null,
      analisisIndependiente: parsed.analisisIndependiente || null,
      rawAnalysis,
    },
    // Market context for frontend comparison UI (public market data only)
    marketContext: contextData.marketContext,
    platformSummary: contextData.platformSummary,
    precioVsBroker: contextData.precioVsBroker,
  });
}
