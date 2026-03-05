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
 * POST /api/ai/investment-analysis
 * 
 * Análisis IA profundo de una oportunidad de inversión desde todos los ángulos:
 * 1. Análisis financiero (yield, cash-flow, ROI, TIR, payback)
 * 2. Análisis de mercado (tendencia zona, oferta/demanda, previsión precios)
 * 3. Análisis de riesgo (morosidad zona, vacancia, regulación, liquidez)
 * 4. Comparativa con cartera actual del inversor
 * 5. Análisis fiscal (ITP, IRPF, plusvalía, amortización)
 * 6. Escenarios (optimista, base, pesimista) a 5 y 10 años
 * 7. Recomendación final con argumentación
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { property } = body;

    if (!property || !property.price || !property.city) {
      return NextResponse.json({ error: 'Datos de propiedad incompletos (precio y ciudad requeridos)' }, { status: 400 });
    }

    // Get portfolio context for comparison
    const companyId = session.user.companyId;
    const contracts = await prisma.contract.findMany({
      where: { unit: { building: { companyId } }, estado: 'activo' },
      select: { rentaMensual: true, unit: { select: { superficie: true, tipo: true } } },
    });

    const portfolioYield = contracts.length > 0
      ? contracts.reduce((s, c) => s + (Number(c.rentaMensual) || 0), 0) * 12 /
        (contracts.reduce((s, c) => s + ((c.unit?.superficie || 60) * 4500), 0)) * 100
      : 0;
    const avgRentPerM2 = contracts.length > 0
      ? contracts.reduce((s, c) => s + (Number(c.rentaMensual) || 0), 0) /
        contracts.reduce((s, c) => s + (c.unit?.superficie || 60), 0)
      : 0;

    // Get market data
    let marketContext = '';
    try {
      const { getMarketContext, IPV_STATIC } = await import('@/lib/public-market-apis');
      const ctx = await getMarketContext(property.city);
      const ipv = ctx.staticData;
      marketContext = ipv
        ? `Mercado ${ctx.ccaa}: precio medio ${ipv.precioMedioM2}€/m², variación anual ${ipv.variacionAnual}%, tendencia ${ipv.tendencia}. Hipoteca media: ${ctx.hipotecaMedia.tipoInteres}% a ${ctx.hipotecaMedia.plazoMedio} años, LTV ${ctx.hipotecaMedia.ltv}%.`
        : '';
    } catch {}

    // Call Claude for deep analysis
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Eres un analista de inversiones inmobiliarias senior especializado en el mercado español. Realiza un ANÁLISIS EXHAUSTIVO de esta oportunidad de inversión.

PROPIEDAD A ANALIZAR:
- Ciudad: ${property.city}
- Tipo: ${property.propertyType || 'vivienda'}
- Precio: €${property.price?.toLocaleString('es-ES') || 0}
- Superficie: ${property.surface || '?'} m²
- Precio/m²: €${property.pricePerM2 || Math.round(property.price / (property.surface || 80))}
- Habitaciones: ${property.rooms || '?'}
- Dirección: ${property.address || 'No especificada'}
${property.estimatedRent ? `- Renta estimada: €${property.estimatedRent}/mes` : ''}
${property.estimatedYield ? `- Yield estimado: ${property.estimatedYield.toFixed(2)}%` : ''}

CONTEXTO DEL INVERSOR:
- Yield medio de su cartera actual: ${portfolioYield.toFixed(2)}%
- Renta media por m²: €${avgRentPerM2.toFixed(2)}/m²/mes
- Contratos activos: ${contracts.length}
- Perfil: Inversor con cartera diversificada en alquiler residencial y comercial

DATOS DE MERCADO:
${marketContext || 'Sin datos específicos de mercado disponibles para esta zona.'}

Proporciona el análisis en formato JSON EXACTO:
{
  "resumenEjecutivo": "2-3 frases resumiendo la oportunidad y veredicto",
  
  "analisisFinanciero": {
    "yieldBrutoEstimado": número,
    "yieldNetoEstimado": número,
    "cashFlowMensual": número,
    "cashFlowAnual": número,
    "roi5anos": número,
    "roi10anos": número,
    "tirEstimada": número,
    "paybackAnos": número,
    "gastosEstimados": {
      "ibiAnual": número,
      "comunidadMensual": número,
      "seguroAnual": número,
      "mantenimientoAnual": número,
      "gestionAnual": número
    },
    "hipoteca": {
      "importeFinanciado": número,
      "cuotaMensual": número,
      "totalIntereses": número
    }
  },
  
  "analisisMercado": {
    "tendenciaPrecios": "alcista|estable|bajista",
    "previsionRevalorizacion5anos": número,
    "demandaAlquiler": "alta|media|baja",
    "ofertaCompetitiva": "alta|media|baja",
    "precioVsMercado": "por_debajo|en_linea|por_encima",
    "diferenciaVsMercado": número,
    "comentario": "texto explicando el contexto de mercado"
  },
  
  "analisisRiesgo": {
    "nivelGlobal": "bajo|medio|alto",
    "puntuacion": número_de_1_a_10,
    "riesgos": [
      { "tipo": "nombre", "nivel": "bajo|medio|alto", "descripcion": "texto", "mitigacion": "texto" }
    ]
  },
  
  "comparativaCartera": {
    "yieldVsCartera": "superior|similar|inferior",
    "diferenciaYield": número,
    "complementaCartera": true_o_false,
    "razon": "por qué complementa o no la cartera actual"
  },
  
  "analisisFiscal": {
    "itpEstimado": número,
    "irpfAlquiler": número,
    "amortizacionAnual": número,
    "beneficioFiscalAnual": número,
    "comentario": "resumen del impacto fiscal"
  },
  
  "escenarios": {
    "optimista": { "valorFuturo5a": número, "rentaFutura": número, "roi": número },
    "base": { "valorFuturo5a": número, "rentaFutura": número, "roi": número },
    "pesimista": { "valorFuturo5a": número, "rentaFutura": número, "roi": número }
  },
  
  "recomendacion": {
    "veredicto": "COMPRAR|NEGOCIAR|ESPERAR|NO_COMPRAR",
    "confianza": número_0_100,
    "precioMaximoRecomendado": número,
    "argumentos": ["argumento1", "argumento2", "argumento3"],
    "condiciones": ["condición para que sea buena compra1", "condición2"],
    "proximosPasos": ["paso1", "paso2", "paso3"]
  }
}

IMPORTANTE: Usa datos REALES del mercado español 2025-2026. Sé preciso con los números. Responde SOLO con el JSON.`;

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Error procesando análisis IA', raw: text.substring(0, 200) }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    logger.info('[AI Investment Analysis] Completed', {
      city: property.city,
      price: property.price,
      veredicto: analysis.recomendacion?.veredicto,
    });

    return NextResponse.json({
      analysis,
      property,
      portfolioContext: { yield: portfolioYield.toFixed(2), avgRentPerM2: avgRentPerM2.toFixed(2), contracts: contracts.length },
      marketContext,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[AI Investment Analysis Error]:', error);
    return NextResponse.json({ error: 'Error en el análisis' }, { status: 500 });
  }
}
