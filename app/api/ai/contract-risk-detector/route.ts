import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/ai/contract-risk-detector
 * Analiza contratos de compraventa o arrendamiento y detecta cláusulas problemáticas.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { contractText, contractType = 'arrendamiento' } = await request.json();
    if (!contractText) {
      return NextResponse.json({ error: 'Texto del contrato requerido' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Eres un abogado inmobiliario español experto en contratos LAU y compraventa.

TIPO DE CONTRATO: ${contractType}
TEXTO DEL CONTRATO:
${contractText.substring(0, 12000)}

Analiza el contrato y detecta TODOS los riesgos. Responde en JSON:
{
  "puntuacionSeguridad": 0-100 (100=totalmente seguro),
  "resumen": "3 líneas sobre el contrato",
  "clausulasProblematicas": [
    {
      "clausula": "número o referencia",
      "textoOriginal": "fragmento del texto problemático",
      "riesgo": "descripción del riesgo",
      "severidad": "alta|media|baja",
      "recomendacion": "qué cambiar",
      "fundamentoLegal": "artículo LAU o CC aplicable"
    }
  ],
  "clausulasFaltantes": [
    {
      "clausula": "nombre de la cláusula que falta",
      "porqueImportante": "...",
      "textoSugerido": "redacción recomendada"
    }
  ],
  "cumplimientoLAU": {
    "cumple": true/false,
    "incumplimientos": ["artículo X: motivo"]
  },
  "recomendaciones": ["recomendación 1", "recomendación 2"],
  "veredicto": "FIRMAR" | "MODIFICAR_Y_FIRMAR" | "NO_FIRMAR"
}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let analysis;
    try {
      const jsonText = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch {
      analysis = { resumen: text, veredicto: 'REVISAR_MANUAL' };
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    logger.error('[Contract Risk Detector]:', error);
    return NextResponse.json({ error: 'Error analizando contrato' }, { status: 500 });
  }
}
