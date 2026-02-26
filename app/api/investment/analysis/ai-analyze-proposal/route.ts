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

const ANALYSIS_SYSTEM_PROMPT = `Eres un analista de inversiones inmobiliarias senior con 20 años de experiencia en el mercado español. Tu trabajo es analizar propuestas de activos que nos envían brokers inmobiliarios.

Tu MENTALIDAD debe ser ESCÉPTICA y CONSERVADORA:
- Los brokers SIEMPRE presentan los números de la forma más favorable posible
- Las rentas indicadas suelen estar infladas o incluyen unidades vacías como si estuvieran alquiladas
- Los gastos suelen estar infrarrepresentados
- El asking price casi nunca es el precio final

Tu trabajo tiene 3 fases:

## FASE 1: EXTRACCIÓN Y VERIFICACIÓN DEL RENT ROLL
- Extraer TODAS las unidades (viviendas, garajes, locales, trasteros, oficinas)
- Para cada unidad: tipo, referencia, superficie, renta mensual, estado (alquilado/vacío/reforma)
- SEÑALAR inconsistencias: rentas irreales para la zona, superficies que no cuadran, unidades sin datos

## FASE 2: ANÁLISIS CRÍTICO (CUESTIONAR AL BROKER)
Para cada punto genera un "flag" (verde ✅, amarillo ⚠️, rojo 🔴):
- Yield bruto declarado vs calculado: ¿coinciden?
- Rentas por m2 vs mercado de la zona: ¿son realistas o están infladas?
- Tasa de ocupación: ¿100% es creíble? ¿hay renovaciones próximas?
- Estado del inmueble: ¿necesita CAPEX? ¿certificado energético?
- Gastos operativos: ¿están todos incluidos? IBI, comunidad, seguro, mantenimiento
- Riesgo regulatorio: zona tensionada, topes de renta, protecciones inquilinos
- Riesgo de rotación: contratos próximos a vencer, inquilinos con derecho a prórroga

## FASE 3: ANÁLISIS INDEPENDIENTE
- Calcular yield bruto y neto REAL (con tus estimaciones conservadoras)
- Estimar precio máximo que deberíamos pagar para un yield neto objetivo del 5-6%
- Generar tabla de oferta recomendada con 3 escenarios (conservador, base, optimista)
- Conclusión: COMPRAR / NEGOCIAR / DESCARTAR

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "rentRoll": [{ "tipo", "referencia", "superficie", "habitaciones", "banos", "rentaMensual", "estado" }],
  "datosActivo": { "nombre", "direccion", "ciudad", "askingPrice", "ibiAnual", "comunidadMensual", "seguroAnual", "superficieTotal", "anoConstruccion" },
  "analisisCritico": {
    "flags": [{ "categoria", "nivel": "verde|amarillo|rojo", "detalle" }],
    "rentasInfladas": boolean,
    "gastosOmitidos": string[],
    "riesgos": string[],
    "oportunidades": string[]
  },
  "analisisIndependiente": {
    "yieldBrutoReal": number,
    "yieldNetoEstimado": number,
    "rentaMercadoEstimada": number,
    "precioMaximoRecomendado": number,
    "descuentoSugerido": number,
    "escenarios": {
      "conservador": { "precio", "yield", "cashFlowMensual" },
      "base": { "precio", "yield", "cashFlowMensual" },
      "optimista": { "precio", "yield", "cashFlowMensual" }
    },
    "conclusion": "COMPRAR|NEGOCIAR|DESCARTAR",
    "resumenEjecutivo": string
  }
}`;

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

    if (!file && !text) {
      return NextResponse.json({ error: 'Se requiere un archivo o texto con la propuesta del broker' }, { status: 400 });
    }

    let documentContent = text || '';
    let fileName = 'propuesta-broker';

    if (file) {
      fileName = file.name;
      if (file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        documentContent = await file.text();
      } else if (file.type.includes('image') || file.type === 'application/pdf') {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        documentContent = `[ARCHIVO: ${fileName}]\n[BASE64_DATA_AVAILABLE]\n`;

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
            text: `Analiza esta propuesta de broker/inmobiliario. ${additionalContext || ''}\n\nEl documento es: ${fileName}\n\nExtrae el rent roll, cuestiona los datos y genera tu análisis independiente. Responde SOLO con JSON válido.`,
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

        return parseAndReturnResult(rawAnalysis);
      }
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Analiza esta propuesta de broker/inmobiliario. ${additionalContext || ''}\n\nContenido:\n${documentContent.substring(0, 20000)}\n\nExtrae el rent roll, cuestiona los datos y genera tu análisis independiente. Responde SOLO con JSON válido.`,
      }],
    });

    const textContent = response.content.find((c: any) => c.type === 'text') as any;
    const rawAnalysis = textContent?.text || '';

    return parseAndReturnResult(rawAnalysis);
  } catch (error: any) {
    logger.error('[AI Analyze Proposal]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error analizando propuesta' }, { status: 500 });
  }
}

function parseAndReturnResult(rawAnalysis: string) {
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
        estado: u.estado || 'alquilado',
      })),
      datosActivo: parsed.datosActivo || {},
      analisisCritico: parsed.analisisCritico || null,
      analisisIndependiente: parsed.analisisIndependiente || null,
      rawAnalysis,
    },
  });
}
