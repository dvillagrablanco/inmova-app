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

// ============================================================================
// HELPERS: Market data & portfolio comparables (run in parallel)
// ============================================================================

async function getMarketDataSafe(address: string): Promise<any> {
  try {
    const { getMarketDataByAddress } = await import('@/lib/market-data-service');
    return getMarketDataByAddress(address);
  } catch { return null; }
}

async function getPlatformDataSafe(city: string, postalCode?: string, address?: string): Promise<any> {
  try {
    const { getAggregatedMarketData, formatPlatformDataForPrompt } = await import('@/lib/external-platform-data-service');
    const data = await getAggregatedMarketData({ city, postalCode, address });
    return { raw: data, promptText: formatPlatformDataForPrompt(data) };
  } catch { return null; }
}

async function getPortfolioComparables(companyId: string, tipoActivo?: string, superficieRef?: number): Promise<any[]> {
  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const where: any = {
      building: { companyId, isDemo: false },
      estado: 'ocupada',
      rentaMensual: { gt: 0 },
    };
    if (tipoActivo) where.tipo = tipoActivo;
    if (superficieRef && superficieRef > 0) {
      where.superficie = { gte: superficieRef * 0.5, lte: superficieRef * 2 };
    }
    const units = await prisma.unit.findMany({
      where,
      select: {
        numero: true, tipo: true, superficie: true, rentaMensual: true, precioCompra: true,
        building: { select: { nombre: true, direccion: true } },
      },
      take: 20,
      orderBy: { rentaMensual: 'desc' },
    });
    return units.map((u: any) => ({
      edificio: u.building?.nombre || '',
      direccion: u.building?.direccion || '',
      tipo: u.tipo,
      numero: u.numero,
      superficie: u.superficie,
      renta: u.rentaMensual,
      precioCompra: u.precioCompra,
      yieldBruto: u.precioCompra && u.precioCompra > 0
        ? Number(((u.rentaMensual * 12 / u.precioCompra) * 100).toFixed(2))
        : null,
      eurM2: u.superficie > 0 ? Number((u.rentaMensual / u.superficie).toFixed(2)) : null,
    }));
  } catch { return []; }
}

function buildMarketContextPrompt(marketData: any, platformData: any, portfolioComps: any[]): string {
  const parts: string[] = [];

  parts.push('\n\n## DATOS DE MERCADO INDEPENDIENTES (CONTRASTA con la propuesta del broker)');

  if (marketData) {
    parts.push(`\n### Precios reales escriturados (Notariado)
- Zona: ${marketData.zona}
- Precio venta REAL escriturado: ${marketData.precioRealVentaM2}€/m²
- Alquiler REAL: ${marketData.precioRealAlquilerM2}€/m²/mes
- Asking price portales: ${marketData.askingPriceVentaM2}€/m² (Idealista/Fotocasa, ~12% sobre real)
- Alquiler portales: ${marketData.askingPriceAlquilerM2}€/m²/mes
- Garaje venta: ${marketData.precioGarajeVenta}€ | Garaje alquiler: ${marketData.precioGarajeAlquiler}€/mes
- Tendencia: ${marketData.tendencia} | Demanda: ${marketData.demanda}`);
  }

  if (platformData?.promptText) {
    parts.push(`\n### Datos de plataformas (Idealista, Fotocasa, INE, Notariado)\n${platformData.promptText}`);
  }

  if (portfolioComps.length > 0) {
    const avgYield = portfolioComps.filter(c => c.yieldBruto).reduce((s, c) => s + c.yieldBruto, 0)
      / (portfolioComps.filter(c => c.yieldBruto).length || 1);
    const avgEurM2 = portfolioComps.filter(c => c.eurM2).reduce((s, c) => s + c.eurM2, 0)
      / (portfolioComps.filter(c => c.eurM2).length || 1);
    parts.push(`\n### Portfolio del inversor (comparables propios)
- ${portfolioComps.length} unidades similares en cartera
- Yield medio propio: ${avgYield.toFixed(2)}%
- €/m²/mes medio: ${avgEurM2.toFixed(2)}€
- Detalle:`);
    for (const c of portfolioComps.slice(0, 10)) {
      parts.push(`  - ${c.edificio} ${c.numero} (${c.tipo}): ${c.superficie}m², ${c.renta}€/mes${c.yieldBruto ? `, yield ${c.yieldBruto}%` : ''}`);
    }
  }

  if (parts.length <= 1) {
    parts.push('\nNo se encontraron datos de mercado independientes para esta zona.');
  }

  parts.push('\n\nIMPORTANTE: Compara los precios/yields del broker con estos datos de mercado. Señala discrepancias claras.');
  return parts.join('\n');
}

function buildMarketContextResponse(marketData: any, platformData: any, portfolioComps: any[], parsedAnalysis: any) {
  // Market context
  const marketContext = marketData ? {
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
  } : null;

  // Platform data summary
  const platformSummary = platformData?.raw ? {
    weightedSalePricePerM2: platformData.raw.weightedSalePricePerM2,
    weightedRentPricePerM2: platformData.raw.weightedRentPricePerM2,
    sourcesUsed: platformData.raw.sourcesUsed,
    overallReliability: platformData.raw.overallReliability,
    comparablesCount: platformData.raw.allComparables?.length || 0,
    trend: platformData.raw.marketTrend,
    trendPercentage: platformData.raw.trendPercentage,
    demandLevel: platformData.raw.demandLevel,
  } : null;

  // Precio vs broker
  const brokerPrecioM2 = parsedAnalysis?.analisisIndependiente?.precioM2Compra
    || parsedAnalysis?.datosActivo?.askingPrice && parsedAnalysis?.datosActivo?.superficieTotal
      ? (parsedAnalysis.datosActivo.askingPrice / parsedAnalysis.datosActivo.superficieTotal)
      : null;

  let precioVsBroker = null;
  if (brokerPrecioM2 && marketData?.precioRealVentaM2) {
    const diff = ((brokerPrecioM2 - marketData.precioRealVentaM2) / marketData.precioRealVentaM2) * 100;
    precioVsBroker = {
      precioM2Broker: Math.round(brokerPrecioM2),
      precioM2Mercado: marketData.precioRealVentaM2,
      precioM2Asking: marketData.askingPriceVentaM2,
      diferenciaPercent: Number(diff.toFixed(1)),
      estado: diff > 15 ? 'sobrevalorado' : diff > 5 ? 'ligeramente_alto' : diff > -5 ? 'en_linea' : 'infravalorado',
    };
  }

  return { marketContext, platformSummary, portfolioComps, precioVsBroker };
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

    const companyId = (session.user as any)?.companyId || '';

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const additionalContext = formData.get('context') as string | null;

    if (!file && !text) {
      return NextResponse.json({ error: 'Se requiere un archivo o texto con la propuesta del broker' }, { status: 400 });
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

    // ── Fetch market data IN PARALLEL while preparing Claude call ──
    const marketDataPromise = getMarketDataSafe(addressHint);
    const platformDataPromise = getPlatformDataSafe('Madrid', undefined, addressHint);
    const portfolioCompsPromise = getPortfolioComparables(companyId);

    // ── Handle file-based analysis (PDF/image) ──
    if (file && (file.type.includes('image') || file.type === 'application/pdf')) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');

      // Wait for market data
      const [marketData, platformData, portfolioComps] = await Promise.all([
        marketDataPromise, platformDataPromise, portfolioCompsPromise,
      ]);
      const marketPrompt = buildMarketContextPrompt(marketData, platformData, portfolioComps);

      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const mediaType = file.type === 'application/pdf' ? 'application/pdf' as const
        : file.type.includes('png') ? 'image/png' as const
        : file.type.includes('gif') ? 'image/gif' as const
        : file.type.includes('webp') ? 'image/webp' as const
        : 'image/jpeg' as const;

      const userContent: any[] = [
        {
          type: 'document',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `Analiza esta propuesta de broker/inmobiliario. ${additionalContext || ''}\n\nEl documento es: ${fileName}\n${marketPrompt}\n\nExtrae el rent roll, cuestiona los datos, CONTRASTA con los datos de mercado independientes y genera tu análisis independiente. Responde SOLO con JSON válido.`,
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

      return parseAndReturnResult(rawAnalysis, marketData, platformData, portfolioComps);
    }

    // ── Handle text-based analysis ──
    const [marketData, platformData, portfolioComps] = await Promise.all([
      marketDataPromise, platformDataPromise, portfolioCompsPromise,
    ]);
    const marketPrompt = buildMarketContextPrompt(marketData, platformData, portfolioComps);

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Analiza esta propuesta de broker/inmobiliario. ${additionalContext || ''}\n\nContenido:\n${documentContent.substring(0, 20000)}\n${marketPrompt}\n\nExtrae el rent roll, cuestiona los datos, CONTRASTA con los datos de mercado independientes y genera tu análisis independiente. Responde SOLO con JSON válido.`,
      }],
    });

    const textContent = response.content.find((c: any) => c.type === 'text') as any;
    const rawAnalysis = textContent?.text || '';

    return parseAndReturnResult(rawAnalysis, marketData, platformData, portfolioComps);
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
  portfolioComps?: any[]
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
  const contextData = buildMarketContextResponse(
    marketData || null,
    platformData || null,
    portfolioComps || [],
    parsed
  );

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
      analisisCritico: parsed.analisisCritico || null,
      analisisIndependiente: parsed.analisisIndependiente || null,
      rawAnalysis,
    },
    // New: market context for frontend comparison UI
    marketContext: contextData.marketContext,
    platformSummary: contextData.platformSummary,
    portfolioComps: contextData.portfolioComps,
    precioVsBroker: contextData.precioVsBroker,
  });
}
