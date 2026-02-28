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
 * POST /api/ai/negotiation-agent
 * Agente IA de negociación inmobiliaria.
 * Analiza propuesta + mercado + cartera → genera contraoferta fundamentada.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      precioSolicitado,
      rentaMensualActual,
      superficie,
      ubicacion,
      tipoActivo,
      estadoConservacion,
      yieldObjetivo = 5.5,
      contextoAdicional,
    } = body;

    if (!precioSolicitado) {
      return NextResponse.json({ error: 'Precio solicitado requerido' }, { status: 400 });
    }

    // Datos de la cartera para contextualizar
    const contracts = await prisma.contract.findMany({
      where: { unit: { building: { companyId: session.user.companyId } }, estado: 'activo' },
      select: { rentaMensual: true },
    });
    const rentaMediaGrupo = contracts.length > 0
      ? contracts.reduce((s, c) => s + c.rentaMensual, 0) / contracts.length : 0;

    // Cálculos de referencia
    const rentaAnual = (rentaMensualActual || 0) * 12;
    const gastosEstimados = rentaAnual * 0.25; // 25% de la renta para gastos
    const noiEstimado = rentaAnual - gastosEstimados;
    const yieldActual = precioSolicitado > 0 ? (noiEstimado / precioSolicitado) * 100 : 0;
    const precioObjetivo = noiEstimado > 0 ? Math.round(noiEstimado / (yieldObjetivo / 100)) : 0;
    const descuentoNecesario = precioSolicitado > 0
      ? Math.round(((precioSolicitado - precioObjetivo) / precioSolicitado) * 100) : 0;

    // IA para generar estrategia de negociación
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback sin IA
      return NextResponse.json({
        success: true,
        negociacion: {
          precioSolicitado,
          yieldActual: Math.round(yieldActual * 100) / 100,
          precioObjetivo,
          contraoferta: Math.round(precioObjetivo * 1.02), // 2% margen
          descuentoNecesario,
          estrategia: descuentoNecesario > 20
            ? 'Descartar o hacer oferta agresiva. Demasiado caro.'
            : descuentoNecesario > 10
              ? 'Negociar fuerte. Argumentar comparables de mercado.'
              : 'Margen pequeño. Oferta cercana al solicitado puede funcionar.',
        },
      });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Eres un negociador inmobiliario experto del grupo Vidaro. Genera una estrategia de negociación.

PROPUESTA RECIBIDA:
- Precio solicitado: ${precioSolicitado.toLocaleString('es-ES')}€
- Renta mensual actual: ${rentaMensualActual || 'Desconocida'}€
- Superficie: ${superficie || 'N/A'} m²
- Ubicación: ${ubicacion || 'N/A'}
- Tipo: ${tipoActivo || 'N/A'}
- Estado: ${estadoConservacion || 'N/A'}
${contextoAdicional ? `- Contexto: ${contextoAdicional}` : ''}

MIS DATOS:
- Yield neta objetivo: ${yieldObjetivo}%
- Renta media actual de mi cartera: ${Math.round(rentaMediaGrupo)}€/mes
- NOI estimado del activo: ${Math.round(noiEstimado)}€/año
- Yield actual al precio pedido: ${yieldActual.toFixed(1)}%
- Precio objetivo para ${yieldObjetivo}% yield: ${precioObjetivo.toLocaleString('es-ES')}€

Responde en JSON:
{
  "contraofertaRecomendada": número_euros,
  "rangoNegociacion": {"minimo": euros, "maximo": euros},
  "estrategia": "texto 3-5 líneas con enfoque de negociación",
  "argumentos": ["argumento1 para justificar precio menor", "argumento2", "argumento3"],
  "concesionesOfrecer": ["concesión1 que puedo dar", "concesión2"],
  "lineasRojas": ["punto no negociable 1"],
  "probabilidadExito": porcentaje,
  "tiempoEstimadoCierre": "X semanas/meses",
  "alternativas": ["si no se cierra, alternativa 1"]
}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let negociacionIA;
    try {
      const jsonText = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      negociacionIA = JSON.parse(jsonText);
    } catch {
      negociacionIA = { estrategia: text };
    }

    return NextResponse.json({
      success: true,
      negociacion: {
        precioSolicitado,
        yieldActual: Math.round(yieldActual * 100) / 100,
        precioObjetivo,
        descuentoNecesario,
        ...negociacionIA,
      },
    });
  } catch (error: any) {
    logger.error('[Negotiation Agent]:', error);
    return NextResponse.json({ error: 'Error en agente negociador' }, { status: 500 });
  }
}
