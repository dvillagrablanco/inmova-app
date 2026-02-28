import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/ai/tenant-screening
 * Screening de inquilinos con IA.
 * Analiza documentos (nóminas, contrato laboral, DNI) y genera informe de solvencia.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantName,
      rentaMensual,
      documentText, // Texto extraído de nóminas/contratos
      ingresosMensuales,
      tipoContrato, // indefinido, temporal, autónomo
      antiguedadMeses,
    } = body;

    if (!tenantName || !rentaMensual) {
      return NextResponse.json({ error: 'Nombre y renta requeridos' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: screening sin IA basado en ratio
      const ratio = ingresosMensuales ? rentaMensual / ingresosMensuales : 1;
      const score = ratio <= 0.3 ? 90 : ratio <= 0.4 ? 70 : ratio <= 0.5 ? 50 : 30;
      return NextResponse.json({
        success: true,
        screening: {
          candidato: tenantName,
          score,
          riesgo: score >= 70 ? 'bajo' : score >= 50 ? 'medio' : 'alto',
          ratioRentaIngresos: Math.round(ratio * 100),
          recomendacion: score >= 70 ? 'Candidato apto. Proceder con contrato.' : score >= 50 ? 'Candidato con riesgo medio. Solicitar garantía adicional.' : 'Candidato con riesgo alto. No recomendado.',
          detalles: { metodo: 'ratio_basico', iaDisponible: false },
        },
      });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Eres un analista de riesgo inmobiliario. Evalúa este candidato a inquilino.

CANDIDATO: ${tenantName}
RENTA SOLICITADA: ${rentaMensual}€/mes
${ingresosMensuales ? `INGRESOS DECLARADOS: ${ingresosMensuales}€/mes` : ''}
${tipoContrato ? `TIPO CONTRATO LABORAL: ${tipoContrato}` : ''}
${antiguedadMeses ? `ANTIGÜEDAD LABORAL: ${antiguedadMeses} meses` : ''}
${documentText ? `\nDOCUMENTOS APORTADOS:\n${documentText.substring(0, 5000)}` : '\nSin documentos aportados.'}

Analiza y responde en JSON:
{
  "score": 0-100 (100=perfecto),
  "riesgo": "bajo|medio|alto",
  "ratioRentaIngresos": porcentaje,
  "estabilidadLaboral": "alta|media|baja",
  "capacidadPago": "holgada|justa|insuficiente",
  "recomendacion": "texto con recomendación clara",
  "alertas": ["alerta1", "alerta2"],
  "garantiaSugerida": "1 mes|2 meses|aval bancario|no recomendado",
  "resumenEjecutivo": "2-3 líneas resumen"
}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let screening;
    try {
      const jsonText = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      screening = JSON.parse(jsonText);
    } catch {
      screening = {
        score: 50,
        riesgo: 'medio',
        recomendacion: text,
        resumenEjecutivo: 'Análisis no estructurado. Revisar manualmente.',
      };
    }

    return NextResponse.json({
      success: true,
      screening: { candidato: tenantName, ...screening },
    });
  } catch (error: any) {
    logger.error('[Tenant Screening]:', error);
    return NextResponse.json({ error: 'Error en screening' }, { status: 500 });
  }
}
