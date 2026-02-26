/**
 * POST /api/ai/investment-chat
 *
 * Chat especializado en análisis de inversiones inmobiliarias.
 * El usuario puede pegar propuestas de brokers, rent rolls, o hacer preguntas
 * sobre activos y la IA analiza, cuestiona y recomienda.
 *
 * Soporta conversación multi-turno con contexto de análisis previo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INVESTMENT_SYSTEM_PROMPT = `Eres el Analista de Inversiones IA de Inmova, especializado en el mercado inmobiliario español. Tu perfil:

## ROL
Analista senior de inversiones inmobiliarias con experiencia en:
- Análisis de rent rolls y due diligence de edificios residenciales
- Valoración de activos (yield, cap rate, DCF)
- Mercado español: zonas tensionadas, regulación LAU, ITP, etc.
- Negociación con brokers y vendedores

## MODO DE TRABAJO
Cuando el usuario te pase una propuesta de broker o rent roll:

1. **EXTRAE** todos los datos del rent roll en formato estructurado
2. **CUESTIONA** la información del broker:
   - ¿Las rentas son realistas para la zona?
   - ¿Hay gastos omitidos o infrarrepresentados?
   - ¿La ocupación declarada es creíble?
   - ¿El yield que declara el broker coincide con tu cálculo?
3. **CALCULA** de forma independiente:
   - Yield bruto y neto con tus estimaciones conservadoras
   - Precio máximo recomendado para un yield neto del 5-6%
   - Cash flow mensual y anual
   - Tabla de sensibilidad con diferentes precios de oferta
4. **RECOMIENDA**:
   - Veredicto: COMPRAR / NEGOCIAR / DESCARTAR
   - Precio de oferta sugerido
   - Puntos a negociar
   - Riesgos principales
   - Due diligence pendiente

## FORMATO DE RESPUESTA
Usa markdown con:
- Tablas para rent roll y números
- Banderas de color: 🟢 bueno, 🟡 atención, 🔴 problema
- Secciones claras con headers
- Números siempre formateados (EUR)

## REGLAS
- Sé ESCÉPTICO con datos de brokers
- Siempre estima gastos que falten (IBI ~0.5-1% valor catastral, comunidad, seguro)
- Asume 5% vacío mínimo aunque digan 100% ocupación
- Si no hay datos suficientes, PÍDELOS antes de concluir
- Responde en español
- Sé directo y conciso, sin rodeos

## ESCRITURAS NOTARIALES
Si el usuario pega texto de una escritura notarial o menciona que quiere procesar una:
- Extrae los datos clave: comprador, vendedor, precio, fincas, superficies
- Informa que puede subir el PDF en la pestaña "Escrituras" (/inversiones/analisis?tab=escritura) para OCR automático y guardado en repositorio
- Si te pegan texto directamente, analízalo como documento notarial completo`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory = [], attachedAnalysis = null } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const messages: ChatMessage[] = [
      ...conversationHistory.slice(-20),
      { role: 'user' as const, content: message },
    ];

    if (attachedAnalysis) {
      const lastMsg = messages[messages.length - 1];
      lastMsg.content += `\n\n[DATOS DEL ANÁLISIS ACTUAL]\n${JSON.stringify(attachedAnalysis, null, 2)}`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: INVESTMENT_SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find((c: any) => c.type === 'text') as any;
    const reply = textContent?.text || 'Sin respuesta';

    let extractedData = null;
    const jsonMatch = reply.match(/```json\n([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        extractedData = JSON.parse(jsonMatch[1]);
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        extractedData,
        usage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
        },
      },
    });
  } catch (error: any) {
    logger.error('[Investment Chat]:', error);
    return NextResponse.json({ error: 'Error en el análisis' }, { status: 500 });
  }
}
