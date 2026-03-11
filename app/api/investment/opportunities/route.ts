import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/investment/opportunities
 * Genera oportunidades de inversión basadas en:
 * 1. Análisis de la cartera actual (yields, ocupación, rentas)
 * 2. Datos de mercado por zona (market-data-service)
 * 3. IA (Claude) para argumentar y recomendar
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // 1. Get portfolio KPIs
    const buildings = await prisma.building.findMany({
      where: { companyId },
      include: {
        units: {
          select: { id: true, tipo: true, estado: true, superficie: true, rentaMensual: true },
        },
      },
    });

    const portfolioStats = {
      totalUnits: 0,
      occupiedUnits: 0,
      totalRent: 0,
      totalSurface: 0,
      byType: {} as Record<
        string,
        { count: number; rent: number; surface: number; avgRentPerM2: number }
      >,
    };

    for (const b of buildings) {
      for (const u of b.units) {
        portfolioStats.totalUnits++;
        if (u.estado === 'ocupada') portfolioStats.occupiedUnits++;
        portfolioStats.totalRent += u.rentaMensual || 0;
        portfolioStats.totalSurface += u.superficie || 0;
        const tipo = u.tipo || 'otro';
        if (!portfolioStats.byType[tipo]) {
          portfolioStats.byType[tipo] = { count: 0, rent: 0, surface: 0, avgRentPerM2: 0 };
        }
        portfolioStats.byType[tipo].count++;
        portfolioStats.byType[tipo].rent += u.rentaMensual || 0;
        portfolioStats.byType[tipo].surface += u.superficie || 0;
      }
    }

    // Calculate avg rent/m² by type
    for (const [tipo, data] of Object.entries(portfolioStats.byType)) {
      data.avgRentPerM2 = data.surface > 0 ? data.rent / data.surface : 0;
    }

    const avgYield =
      portfolioStats.totalSurface > 0
        ? ((portfolioStats.totalRent * 12) / (portfolioStats.totalSurface * 4500)) * 100
        : 0;

    // 2. Get market data from multiple sources
    let marketData: any[] = [];
    try {
      const { getAllMarketData } = await import('@/lib/market-data-service');
      marketData = getAllMarketData();
    } catch {
      // Market data not available
    }

    // 3. Get public API data (INE IPV, mortgage rates)
    let publicMarketData: any = null;
    try {
      const { getMarketContext, IPV_STATIC, DATA_SOURCES_INFO } =
        await import('@/lib/public-market-apis');
      // Get data for main cities where Vidaro operates
      const contexts = await Promise.all(
        ['Madrid', 'Marbella', 'Valladolid', 'Palencia'].map((city) => getMarketContext(city))
      );
      publicMarketData = {
        regions: contexts,
        ipvNacional: IPV_STATIC,
        availableSources: Object.values(DATA_SOURCES_INFO).map((s) => ({
          name: s.name,
          tipo: s.tipo,
          coste: s.coste,
          estado: s.estado,
        })),
      };
    } catch (err) {
      logger.warn('[Opportunities] Error fetching public market data:', err);
    }

    // 4. Generate opportunities with AI + enriched data
    const opportunities = await generateOpportunities(
      portfolioStats,
      avgYield,
      marketData,
      companyId,
      publicMarketData
    );

    // Also include market opportunities from all sources
    let marketOpps = null;
    try {
      const { getAllMarketOpportunities } = await import('@/lib/market-opportunities');
      marketOpps = await getAllMarketOpportunities();
    } catch (err) {
      logger.warn('[Opportunities] Market opportunities error:', err);
    }

    // Merge into response
    const finalResponse = {
      portfolioStats: {
        totalUnits: portfolioStats.totalUnits,
        occupancy:
          portfolioStats.totalUnits > 0
            ? ((portfolioStats.occupiedUnits / portfolioStats.totalUnits) * 100).toFixed(1)
            : '0',
        monthlyRent: Math.round(portfolioStats.totalRent),
        avgYield: avgYield.toFixed(2),
        byType: portfolioStats.byType,
      },
      opportunities,
      marketOpportunities: marketOpps || undefined,
      marketSources: publicMarketData?.availableSources || [],
      marketIndicators:
        publicMarketData?.regions?.map((r: any) => ({
          ccaa: r.ccaa,
          variacionAnual: r.staticData?.variacionAnual || r.ipv?.variacionAnual || 0,
          precioMedioM2: r.staticData?.precioMedioM2 || 0,
          tendencia: r.staticData?.tendencia || 'sin datos',
          hipotecaMedia: r.hipotecaMedia,
        })) || [],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(finalResponse);
  } catch (error: any) {
    logger.error('[Opportunities Error]:', error);
    return NextResponse.json({ error: 'Error generando oportunidades' }, { status: 500 });
  }
}

async function generateOpportunities(
  portfolio: any,
  avgYield: number,
  marketData: any[],
  companyId: string,
  publicMarketData?: any
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Build market context
  const marketContext = marketData
    .map(
      (z) =>
        `${z.zona}: Venta ${z.precioRealVentaM2}€/m², Alquiler ${z.precioRealAlquilerM2}€/m²/mes, Tendencia ${z.tendencia}, Demanda ${z.demanda}`
    )
    .join('\n');

  // Build portfolio context
  const portfolioContext = Object.entries(portfolio.byType)
    .map(
      ([tipo, data]: [string, any]) =>
        `${tipo}: ${data.count} uds, renta media ${data.avgRentPerM2.toFixed(2)}€/m²/mes`
    )
    .join(', ');

  if (!apiKey) {
    // Return rule-based opportunities
    return generateLocalOpportunities(portfolio, avgYield, marketData);
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Eres un analista de inversiones inmobiliarias experto en el mercado español. Genera oportunidades de inversión basándote en estos datos:

CARTERA ACTUAL DEL CLIENTE:
- ${portfolio.totalUnits} unidades, ${portfolio.occupiedUnits} ocupadas
- Renta mensual total: €${Math.round(portfolio.totalRent)}
- Yield medio: ${avgYield.toFixed(2)}%
- Por tipo: ${portfolioContext}

DATOS DE MERCADO POR ZONA (fuente: Notariado + Idealista):
${marketContext}

INDICADORES MACROECONÓMICOS (fuente: INE + Banco de España):
${
  publicMarketData?.regions
    ?.map(
      (r: any) =>
        `${r.ccaa}: Precio medio ${r.staticData?.precioMedioM2 || '?'}€/m², Variación anual ${r.staticData?.variacionAnual || '?'}%, Tendencia: ${r.staticData?.tendencia || '?'}`
    )
    .join('\n') || 'Sin datos INE disponibles'
}

Tipo interés hipotecario medio: ${publicMarketData?.regions?.[0]?.hipotecaMedia?.tipoInteres || 3.45}%
LTV medio financiación: ${publicMarketData?.regions?.[0]?.hipotecaMedia?.ltv || 70}%
Plazo medio hipoteca: ${publicMarketData?.regions?.[0]?.hipotecaMedia?.plazoMedio || 24} años

Genera exactamente 6 oportunidades de inversión diversificadas:
1. Edificio residencial completo (para alquiler larga estancia)
2. Local comercial (alta rentabilidad)
3. Vivienda para alquiler temporal/media estancia
4. Oficina/coworking
5. Garajes (inversión conservadora)
6. Edificio para reforma y revalorización

Para cada oportunidad devuelve JSON:
{
  "opportunities": [
    {
      "id": "opp-1",
      "tipo": "edificio_residencial|local|vivienda|oficina|garaje|reforma",
      "titulo": "Título descriptivo de la oportunidad",
      "ubicacion": "Ciudad y zona específica",
      "precioEstimado": número,
      "superficieM2": número,
      "precioM2": número,
      "rentaMensualEstimada": número,
      "yieldBruto": número (porcentaje),
      "yieldNeto": número (porcentaje),
      "capRate": número (porcentaje),
      "roi5anos": número (porcentaje),
      "paybackAnos": número,
      "riesgo": "bajo|medio|alto",
      "argumentacion": "3-4 frases explicando por qué es buena inversión con datos concretos",
      "kpis": {
        "cashFlowMensual": número,
        "cashFlowAnual": número,
        "gastosEstimados": número (anual),
        "hipotecaMensual": número (si aplica, asumiendo 70% financiación a 3.5%)
      },
      "factoresPositivos": ["factor1", "factor2", "factor3"],
      "factoresRiesgo": ["riesgo1", "riesgo2"],
      "recomendacion": "Comprar|Analizar|Esperar"
    }
  ]
}

Usa precios REALES del mercado español 2025-2026. Sé específico con ubicaciones y argumenta con datos.
Responde SOLO con el JSON, sin texto adicional.`,
        },
      ],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.opportunities || [];
    }
  } catch (err) {
    logger.error('[Opportunities AI Error]:', err);
  }

  return generateLocalOpportunities(portfolio, avgYield, marketData);
}

function generateLocalOpportunities(portfolio: any, avgYield: number, marketData: any[]) {
  const madrid = marketData.find((z) => z.zona?.includes('Chamberí')) || marketData[0];
  const marbella = marketData.find((z) => z.zona?.includes('Marbella'));
  const valladolid = marketData.find((z) => z.zona?.includes('Valladolid'));

  return [
    {
      id: 'opp-1',
      tipo: 'edificio_residencial',
      titulo: 'Edificio residencial 8-12 viviendas en Madrid zona norte',
      ubicacion: 'Madrid — Chamberí / Tetuán',
      precioEstimado: 2500000,
      superficieM2: 600,
      precioM2: madrid?.precioRealVentaM2 || 4200,
      rentaMensualEstimada: 12000,
      yieldBruto: 5.76,
      yieldNeto: 4.2,
      capRate: 4.5,
      roi5anos: 45,
      paybackAnos: 17,
      riesgo: 'medio',
      argumentacion: `Edificio completo en zona consolidada con alta demanda de alquiler. Yield bruto estimado del 5.76% con renta media de €20/m²/mes. La zona tiene tendencia alcista y baja vacancia (<3%). Posibilidad de optimizar rentas en renovaciones.`,
      kpis: {
        cashFlowMensual: 8500,
        cashFlowAnual: 102000,
        gastosEstimados: 42000,
        hipotecaMensual: 7500,
      },
      factoresPositivos: [
        'Zona consolidada con alta demanda',
        'Diversificación de inquilinos',
        'Revalorización anual 3-5%',
      ],
      factoresRiesgo: ['Inversión inicial alta', 'Posible regulación de alquileres'],
      recomendacion: 'Analizar',
    },
    {
      id: 'opp-2',
      tipo: 'local',
      titulo: 'Local comercial en zona prime para hostelería',
      ubicacion: 'Madrid — Centro / Barrio de las Letras',
      precioEstimado: 450000,
      superficieM2: 120,
      precioM2: 3750,
      rentaMensualEstimada: 3500,
      yieldBruto: 9.33,
      yieldNeto: 7.5,
      capRate: 7.0,
      roi5anos: 65,
      paybackAnos: 11,
      riesgo: 'medio',
      argumentacion: `Local en zona turística con flujo peatonal alto. Yield bruto del 9.33%, muy superior a la media residencial. Contratos comerciales son más largos (5-10 años) y con IPC. Demanda creciente post-COVID en hostelería premium.`,
      kpis: {
        cashFlowMensual: 2800,
        cashFlowAnual: 33600,
        gastosEstimados: 8400,
        hipotecaMensual: 1400,
      },
      factoresPositivos: [
        'Yield alto (>9%)',
        'Contratos largos con IPC',
        'Zona turística consolidada',
      ],
      factoresRiesgo: ['Dependencia del sector hostelería', 'Rotación si cierra el negocio'],
      recomendacion: 'Comprar',
    },
    {
      id: 'opp-3',
      tipo: 'vivienda',
      titulo: 'Piso 2-3 hab. para media estancia en Madrid centro',
      ubicacion: 'Madrid — Malasaña / Chueca',
      precioEstimado: 350000,
      superficieM2: 75,
      precioM2: 4667,
      rentaMensualEstimada: 2200,
      yieldBruto: 7.54,
      yieldNeto: 5.8,
      capRate: 5.5,
      roi5anos: 52,
      paybackAnos: 13,
      riesgo: 'bajo',
      argumentacion: `Vivienda en zona con altísima demanda de media estancia (profesionales, estudiantes, expatriados). Renta 30-40% superior a larga estancia. Ocupación estimada >90% anual. Zona con la mayor demanda de alquiler temporal de Madrid.`,
      kpis: {
        cashFlowMensual: 1600,
        cashFlowAnual: 19200,
        gastosEstimados: 7200,
        hipotecaMensual: 1100,
      },
      factoresPositivos: [
        'Demanda altísima de media estancia',
        'Premium 30-40% vs larga estancia',
        'Zona trendy con revalorización',
      ],
      factoresRiesgo: ['Mayor gestión operativa', 'Regulación alquiler temporal'],
      recomendacion: 'Comprar',
    },
    {
      id: 'opp-4',
      tipo: 'oficina',
      titulo: 'Oficina/coworking en edificio rehabilitado',
      ubicacion: 'Madrid — Azca / Nuevos Ministerios',
      precioEstimado: 600000,
      superficieM2: 200,
      precioM2: 3000,
      rentaMensualEstimada: 4000,
      yieldBruto: 8.0,
      yieldNeto: 6.2,
      capRate: 6.0,
      roi5anos: 55,
      paybackAnos: 13,
      riesgo: 'medio',
      argumentacion: `Oficina en zona empresarial prime. Posibilidad de modelo coworking (€350-500/puesto) multiplica la rentabilidad x2-3. Demanda creciente de oficinas flexibles. Contratos corporativos con garantías.`,
      kpis: {
        cashFlowMensual: 2800,
        cashFlowAnual: 33600,
        gastosEstimados: 14400,
        hipotecaMensual: 1800,
      },
      factoresPositivos: [
        'Modelo coworking multiplica renta',
        'Zona empresarial AAA',
        'Contratos corporativos estables',
      ],
      factoresRiesgo: ['Teletrabajo reduce demanda', 'Inversión en acondicionamiento'],
      recomendacion: 'Analizar',
    },
    {
      id: 'opp-5',
      tipo: 'garaje',
      titulo: 'Lote de 10-15 plazas de garaje en zona residencial',
      ubicacion: 'Madrid — Chamberí / Salamanca',
      precioEstimado: 350000,
      superficieM2: 200,
      precioM2: 1750,
      rentaMensualEstimada: 2250,
      yieldBruto: 7.71,
      yieldNeto: 7.0,
      capRate: 6.8,
      roi5anos: 55,
      paybackAnos: 13,
      riesgo: 'bajo',
      argumentacion: `Garajes en zona con restricciones Madrid Central/ZBE. Inversión defensiva con gestión mínima. Sin impagos relevantes (el propietario necesita el garaje). Revalorización por restricciones de tráfico crecientes.`,
      kpis: {
        cashFlowMensual: 2050,
        cashFlowAnual: 24600,
        gastosEstimados: 3000,
        hipotecaMensual: 0,
      },
      factoresPositivos: [
        'Inversión defensiva, bajo riesgo',
        'Gestión mínima',
        'ZBE Madrid incrementa demanda',
      ],
      factoresRiesgo: ['Liquidez limitada', 'Yield estable pero sin crecimiento rápido'],
      recomendacion: 'Comprar',
    },
    {
      id: 'opp-6',
      tipo: 'reforma',
      titulo: 'Edificio a reformar para reconversión a apartamentos premium',
      ubicacion: 'Madrid — Lavapiés / Embajadores',
      precioEstimado: 1200000,
      superficieM2: 500,
      precioM2: 2400,
      rentaMensualEstimada: 10000,
      yieldBruto: 10.0,
      yieldNeto: 7.5,
      capRate: 7.0,
      roi5anos: 80,
      paybackAnos: 10,
      riesgo: 'alto',
      argumentacion: `Edificio en zona emergente a precio por debajo de mercado (€2.400/m² vs €3.500+ reformado). Inversión en reforma de €300-400K → valor post-reforma €2.5-3M. Yield del 10% post-reforma en alquiler premium. Zona con gentrificación acelerada.`,
      kpis: {
        cashFlowMensual: 7000,
        cashFlowAnual: 84000,
        gastosEstimados: 36000,
        hipotecaMensual: 4500,
      },
      factoresPositivos: [
        'Margen de revalorización >100%',
        'Zona en gentrificación',
        'Yield post-reforma >10%',
      ],
      factoresRiesgo: [
        'Riesgo de obra (plazos, costes)',
        'Inversión adicional en reforma',
        'Zona con incertidumbre social',
      ],
      recomendacion: 'Analizar',
    },
  ];
}
