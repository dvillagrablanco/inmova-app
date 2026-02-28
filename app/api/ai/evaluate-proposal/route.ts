import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/ai/evaluate-proposal
 * Evaluador IA de propuestas de inversión inmobiliaria.
 * Recibe datos de la propuesta (texto libre, PDF extracto, o datos estructurados)
 * → Calcula yields, compara con cartera, emite veredicto.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { proposalText, structuredData } = body;

    if (!proposalText && !structuredData) {
      return NextResponse.json({ error: 'Se requiere texto de la propuesta o datos estructurados' }, { status: 400 });
    }

    // Obtener KPIs medios de la cartera actual para comparar
    const companyId = session.user.companyId;
    const contracts = await prisma.contract.findMany({
      where: { unit: { building: { companyId } }, estado: 'activo' },
      select: { rentaMensual: true },
    });
    const units = await prisma.unit.findMany({
      where: { building: { companyId, isDemo: false }, estado: 'ocupada', rentaMensual: { gt: 0 } },
      select: { rentaMensual: true, superficie: true, superficieUtil: true },
    });

    const rentaMediaCartera = contracts.length > 0
      ? contracts.reduce((s, c) => s + c.rentaMensual, 0) / contracts.length : 0;
    const eurM2Cartera = units.length > 0
      ? units.reduce((s, u) => s + u.rentaMensual / (u.superficieUtil || u.superficie || 1), 0) / units.length : 0;

    // Si hay datos estructurados, calcular directamente
    if (structuredData) {
      const d = structuredData;
      const inversionTotal = (d.precio || 0) + (d.gastosCompra || d.precio * 0.10);
      const rentaAnual = (d.rentaMensualActual || 0) * 12;
      const gastosAnuales = (d.ibi || 0) + (d.comunidad || 0) * 12 + (d.seguros || 0) + (d.mantenimiento || 0);
      const noiAnual = rentaAnual - gastosAnuales;
      const yieldBruta = inversionTotal > 0 ? (rentaAnual / inversionTotal) * 100 : 0;
      const yieldNeta = inversionTotal > 0 ? (noiAnual / inversionTotal) * 100 : 0;

      const precioMaxRecomendado = d.yieldObjetivo
        ? Math.round(noiAnual / (d.yieldObjetivo / 100))
        : Math.round(noiAnual / 0.055); // 5.5% yield neta objetivo por defecto

      let veredicto: 'COMPRAR' | 'NEGOCIAR' | 'DESCARTAR';
      let motivo: string;

      if (yieldNeta >= 5.5) {
        veredicto = 'COMPRAR';
        motivo = `Yield neta ${yieldNeta.toFixed(1)}% supera el objetivo (5.5%). Buena oportunidad.`;
      } else if (yieldNeta >= 4.0) {
        veredicto = 'NEGOCIAR';
        motivo = `Yield neta ${yieldNeta.toFixed(1)}% aceptable pero mejorable. Negociar precio a ${precioMaxRecomendado.toLocaleString('es-ES')}€ para alcanzar 5.5%.`;
      } else {
        veredicto = 'DESCARTAR';
        motivo = `Yield neta ${yieldNeta.toFixed(1)}% insuficiente. Necesitarías comprar a ${precioMaxRecomendado.toLocaleString('es-ES')}€ para que sea viable.`;
      }

      return NextResponse.json({
        success: true,
        evaluacion: {
          veredicto,
          motivo,
          metricas: {
            precioSolicitado: d.precio,
            inversionTotal: Math.round(inversionTotal),
            rentaMensualActual: d.rentaMensualActual,
            rentaAnual,
            gastosAnuales: Math.round(gastosAnuales),
            noiAnual: Math.round(noiAnual),
            yieldBruta: Math.round(yieldBruta * 100) / 100,
            yieldNeta: Math.round(yieldNeta * 100) / 100,
            precioMaxRecomendado,
          },
          comparativaCartera: {
            yieldNetaCartera: 'Pendiente cálculo completo',
            rentaMediaCartera: Math.round(rentaMediaCartera),
            eurM2Cartera: Math.round(eurM2Cartera * 100) / 100,
            mejoraPortfolio: yieldNeta > 4.5,
          },
        },
      });
    }

    // Análisis con IA para texto libre
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Eres un analista de inversión inmobiliaria senior. Evalúa esta propuesta de inversión.

PROPUESTA DEL BROKER:
${proposalText.substring(0, 10000)}

DATOS DE REFERENCIA DE MI CARTERA:
- Renta media por contrato: ${Math.round(rentaMediaCartera)}€/mes
- €/m² medio: ${eurM2Cartera.toFixed(2)}€/m²/mes
- Yield neta objetivo del grupo: 5.5%

ANÁLISIS REQUERIDO (responde en JSON):
{
  "veredicto": "COMPRAR" | "NEGOCIAR" | "DESCARTAR",
  "puntuacion": 0-100,
  "resumenEjecutivo": "2-3 líneas",
  "datosExtraidos": {
    "ubicacion": "...",
    "tipoActivo": "...",
    "superficie": número_m2,
    "precioSolicitado": número_euros,
    "rentaMensualActual": número_euros,
    "numUnidades": número,
    "ocupacion": porcentaje
  },
  "metricas": {
    "yieldBruta": porcentaje,
    "yieldNeta": porcentaje,
    "precioMaxRecomendado": número_euros,
    "cashFlowMensualEstimado": número_euros
  },
  "riesgos": ["riesgo1", "riesgo2"],
  "oportunidades": ["oportunidad1", "oportunidad2"],
  "contraofertaSugerida": número_euros,
  "motivoContraoferta": "...",
  "comparativaCartera": {
    "mejoraPortfolio": true/false,
    "motivo": "..."
  }
}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let evaluacion;
    try {
      const jsonText = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      evaluacion = JSON.parse(jsonText);
    } catch {
      evaluacion = { veredicto: 'REVISAR_MANUAL', resumenEjecutivo: text };
    }

    return NextResponse.json({ success: true, evaluacion });
  } catch (error: any) {
    logger.error('[Evaluate Proposal]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error evaluando propuesta' }, { status: 500 });
  }
}
