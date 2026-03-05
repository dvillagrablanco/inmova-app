/**
 * API: Chat IA contextual sobre una oportunidad de inversión
 * POST /api/ai/opportunity-chat
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { message, opportunity, history } = await req.json();

    if (!message || !opportunity) {
      return NextResponse.json({ error: 'Mensaje y oportunidad requeridos' }, { status: 400 });
    }

    // Try Anthropic
    let reply = '';
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const systemPrompt = `Eres un analista de inversiones inmobiliarias senior con 20 años de experiencia en el mercado español.

CONTEXTO DE LA OPORTUNIDAD:
- Título: ${opportunity.title}
- Fuente: ${opportunity.source} (${opportunity.category})
- Ubicación: ${opportunity.location}
- Precio: ${opportunity.price?.toLocaleString('es-ES')}€
- Valor mercado: ${opportunity.marketValue?.toLocaleString('es-ES')}€
- Descuento: ${opportunity.discount}%
- Yield estimado: ${opportunity.estimatedYield}%
- Superficie: ${opportunity.surface || '?'}m²
- Riesgo: ${opportunity.riskLevel}
- Descripción: ${opportunity.description}

Responde de forma concisa y profesional. Usa datos concretos. Si no tienes certeza, indícalo.
Formato: Usa markdown ligero (negritas, listas). Máximo 300 palabras.`;

      const messages = [
        ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
        { role: 'user' as const, content: message },
      ];

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: systemPrompt,
        messages,
      });

      reply = response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (aiErr) {
      logger.warn('[OpportunityChat] AI not available, using fallback');
      reply = generateFallbackReply(message, opportunity);
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    logger.error('[OpportunityChat Error]:', error);
    return NextResponse.json({ error: 'Error en chat' }, { status: 500 });
  }
}

function generateFallbackReply(message: string, opp: any): string {
  const msg = message.toLowerCase();
  if (msg.includes('riesgo')) {
    return `**Análisis de riesgo para ${opp.title}:**\n\nNivel: ${opp.riskLevel}\n- ${opp.category === 'subasta' ? 'Las subastas conllevan riesgo de cargas ocultas y estado de conservación desconocido.' : opp.category === 'banca' ? 'Los inmuebles de banca suelen estar libres de cargas pero pueden necesitar reforma.' : 'Riesgo moderado típico del mercado.'}\n\nRecomendación: Realizar due diligence completa antes de ofertar.`;
  }
  if (msg.includes('hipoteca') || msg.includes('financ')) {
    const cuota = opp.price ? Math.round((opp.price * 0.8 * 0.004)) : 0;
    return `**Financiación estimada:**\n- Precio: ${opp.price?.toLocaleString('es-ES')}€\n- Entrada (20%): ${(opp.price * 0.2)?.toLocaleString('es-ES')}€\n- Hipoteca (80%): ${(opp.price * 0.8)?.toLocaleString('es-ES')}€\n- Cuota estimada (25a, 3.5%): ~${cuota?.toLocaleString('es-ES')}€/mes`;
  }
  return `**${opp.title}** en ${opp.location}\n\nPrecio: ${opp.price?.toLocaleString('es-ES')}€ (${opp.discount}% por debajo de mercado)\nYield: ${opp.estimatedYield}%\n\nPara un análisis más detallado, configura ANTHROPIC_API_KEY.`;
}
