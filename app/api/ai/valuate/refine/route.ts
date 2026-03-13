/**
 * API Route: Refinar Valoración con Feedback del Usuario
 * POST /api/ai/valuate/refine
 *
 * Recibe una valoración previa + comentarios del usuario y genera
 * una nueva valoración ajustada por la IA, teniendo en cuenta el feedback.
 *
 * El prompt prioriza comparables de mercado sobre capitalización de rentas
 * y ajusta según las observaciones del usuario.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
import { z } from 'zod';
import { checkAILimit, createLimitExceededResponse, logUsageWarning } from '@/lib/usage-limits';
import { trackUsage } from '@/lib/usage-tracking-service';
import logger from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const refineSchema = z.object({
  previousValuation: z.object({
    valorEstimado: z.number(),
    valorMinimo: z.number().optional(),
    valorMaximo: z.number().optional(),
    precioM2: z.number().optional(),
    confianza: z.number().optional(),
    tendenciaMercado: z.string().optional(),
    porcentajeTendencia: z.number().optional(),
    comparables: z.array(z.any()).optional(),
    factoresPositivos: z.array(z.string()).optional(),
    factoresNegativos: z.array(z.string()).optional(),
    recomendaciones: z.array(z.string()).optional(),
    analisisMercado: z.string().optional(),
    tiempoEstimadoVenta: z.string().optional(),
    rentabilidadAlquiler: z.number().optional(),
    alquilerEstimado: z.number().optional(),
    reasoning: z.string().optional(),
    metodologiaUsada: z.string().optional(),
    alquilerMediaEstancia: z.number().nullable().optional(),
    alquilerMediaEstanciaMin: z.number().nullable().optional(),
    alquilerMediaEstanciaMax: z.number().nullable().optional(),
    rentabilidadMediaEstancia: z.number().nullable().optional(),
    ocupacionEstimadaMediaEstancia: z.number().nullable().optional(),
    perfilInquilinoMediaEstancia: z.string().nullable().optional(),
  }),
  propertyData: z.object({
    tipoActivo: z.string().optional().default('vivienda'),
    superficie: z.string().or(z.number()).optional(),
    habitaciones: z.string().or(z.number()).optional(),
    banos: z.string().or(z.number()).optional(),
    antiguedad: z.string().or(z.number()).optional(),
    planta: z.string().or(z.number()).optional(),
    estadoConservacion: z.string().optional(),
    orientacion: z.string().optional(),
    finalidad: z.string().optional(),
    caracteristicas: z.array(z.string()).optional(),
    direccionManual: z.string().optional(),
    ciudadManual: z.string().optional(),
    codigoPostalManual: z.string().optional(),
    descripcionAdicional: z.string().optional(),
    eficienciaEnergetica: z.string().optional(),
  }),
  userFeedback: z.string().min(1).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión para refinar la valoración.' },
        { status: 401 }
      );
    }

    // 2. AI limit check
    const ESTIMATED_TOKENS = 1500;
    const limitCheck = await checkAILimit(session.user.companyId, ESTIMATED_TOKENS);
    if (!limitCheck.allowed) {
      return createLimitExceededResponse(limitCheck);
    }
    logUsageWarning(session.user.companyId, limitCheck);

    // 3. Validate body
    const body = await request.json();
    const validated = refineSchema.parse(body);
    const { previousValuation, propertyData, userFeedback } = validated;

    // 4. Check Claude is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'IA no configurada', message: 'Claude AI no está disponible.' },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const superficie = Number(propertyData.superficie) || 0;
    const habitaciones = Number(propertyData.habitaciones) || 0;
    const banos = Number(propertyData.banos) || 0;
    const direccion = propertyData.direccionManual || '';
    const ciudad = propertyData.ciudadManual || '';

    // 5. Build refinement prompt
    const comparablesText = previousValuation.comparables?.length
      ? previousValuation.comparables
          .map(
            (c: any) =>
              `- ${c.direccion}: ${c.precio}€ (${c.superficie}m², ${c.precioM2}€/m², similitud ${Math.round((c.similitud || 0) * 100)}%)`
          )
          .join('\n')
      : 'Sin comparables previos';

    const prompt = `Eres un tasador inmobiliario certificado con 20 años de experiencia en el mercado español.
Has realizado una valoración previa que el propietario/inversor quiere AJUSTAR en base a su conocimiento del mercado local.

═══ DATOS DEL INMUEBLE ═══
- Tipo: ${propertyData.tipoActivo || 'vivienda'}
- Ubicación: ${direccion}, ${ciudad} ${propertyData.codigoPostalManual || ''}
- Superficie: ${superficie}m²
- Habitaciones: ${habitaciones} | Baños: ${banos}
- Antigüedad: ${propertyData.antiguedad || 'N/A'} años
- Estado: ${propertyData.estadoConservacion || 'bueno'}
- Orientación: ${propertyData.orientacion || 'N/A'}
- Eficiencia energética: ${propertyData.eficienciaEnergetica || 'Sin certificar'}
- Características: ${propertyData.caracteristicas?.join(', ') || 'Ninguna'}
${propertyData.descripcionAdicional ? `- Info adicional: ${propertyData.descripcionAdicional}` : ''}

═══ VALORACIÓN PREVIA ═══
- Valor estimado: ${previousValuation.valorEstimado}€
- Rango: ${previousValuation.valorMinimo || '?'}€ — ${previousValuation.valorMaximo || '?'}€
- Precio/m²: ${previousValuation.precioM2 || '?'}€
- Confianza: ${previousValuation.confianza || '?'}%
- Tendencia: ${previousValuation.tendenciaMercado || '?'}
- Alquiler estimado: ${previousValuation.alquilerEstimado || 0}€/mes
- Rentabilidad: ${previousValuation.rentabilidadAlquiler || 0}%
- Metodología: ${previousValuation.metodologiaUsada || 'Comparables + Capitalización'}
- Razonamiento: ${previousValuation.reasoning || 'N/A'}

Comparables usados:
${comparablesText}

Factores positivos: ${previousValuation.factoresPositivos?.join('; ') || 'N/A'}
Factores negativos: ${previousValuation.factoresNegativos?.join('; ') || 'N/A'}

═══ FEEDBACK DEL PROPIETARIO/INVERSOR ═══
"${userFeedback}"

═══ INSTRUCCIONES DE AJUSTE ═══

1. ANALIZA el feedback del propietario/inversor cuidadosamente. Su conocimiento del mercado local es valioso.

2. PRIORIDAD DE MÉTODOS (ajustada):
   - Comparables de mercado REALES (transacciones escrituradas): 65% del peso
   - Criterio experto + feedback del propietario: 20% del peso
   - Capitalización de rentas: 15% del peso (SOLO como validación cruzada)

3. Si el feedback indica que:
   - El precio de mercado real es diferente → AJUSTA el valor hacia lo que indica el mercado real
   - La capitalización pesa demasiado → REDUCE el peso de capitalización y PRIORIZA comparables
   - Conoce transacciones recientes en la zona → USA esos datos como referencia principal
   - El alquiler está inflado/deflactado → AJUSTA la rentabilidad pero NO dejes que distorsione el valor de venta

4. El precio de cierre de ESCRITURAS debe ser la referencia, NO el asking price de portales (que suele ser 10-15% superior).

5. Proporciona REASONING detallado explicando:
   - Qué cambió respecto a la valoración anterior
   - Por qué se ajustó en base al feedback
   - Qué datos nuevos se incorporaron

Responde SOLO con JSON válido (sin texto adicional):
{
  "valorEstimado": <entero en euros>,
  "valorMinimo": <entero>,
  "valorMaximo": <entero>,
  "precioM2": <entero>,
  "confianza": <50-98>,
  "tendenciaMercado": "<alcista|bajista|estable>",
  "porcentajeTendencia": <0.5-12>,
  "comparables": [
    {"direccion": "<zona similar>", "precio": <número>, "superficie": <número>, "precioM2": <número>, "similitud": <0.7-0.95>}
  ],
  "factoresPositivos": ["<factor>"],
  "factoresNegativos": ["<factor>"],
  "recomendaciones": ["<recomendación>"],
  "analisisMercado": "<análisis actualizado del mercado>",
  "tiempoEstimadoVenta": "<ej: 2-3 meses>",
  "rentabilidadAlquiler": <% bruto anual>,
  "alquilerEstimado": <entero mensual>,
  "reasoning": "<4-6 párrafos: 1) Qué indicó el propietario, 2) Cómo se ajustó la valoración, 3) Qué datos se priorizaron, 4) Nueva ponderación aplicada, 5) Conclusión>",
  "metodologiaUsada": "<Métodos aplicados con ajuste por feedback del propietario>"
}`;

    // 6. Call Claude
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || CLAUDE_MODEL_PRIMARY,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada de Claude');
    }

    // 7. Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo parsear la respuesta JSON de Claude');
    }

    const refinedValuation = JSON.parse(jsonMatch[0]);

    // Ensure comparables have at least some entries
    if (!refinedValuation.comparables || refinedValuation.comparables.length < 2) {
      refinedValuation.comparables = previousValuation.comparables || [];
    }

    // Preserve media estancia data from previous valuation if not re-generated
    if (previousValuation.alquilerMediaEstancia && !refinedValuation.alquilerMediaEstancia) {
      refinedValuation.alquilerMediaEstancia = previousValuation.alquilerMediaEstancia;
      refinedValuation.alquilerMediaEstanciaMin = previousValuation.alquilerMediaEstanciaMin;
      refinedValuation.alquilerMediaEstanciaMax = previousValuation.alquilerMediaEstanciaMax;
      refinedValuation.rentabilidadMediaEstancia = previousValuation.rentabilidadMediaEstancia;
      refinedValuation.ocupacionEstimadaMediaEstancia =
        previousValuation.ocupacionEstimadaMediaEstancia;
      refinedValuation.perfilInquilinoMediaEstancia =
        previousValuation.perfilInquilinoMediaEstancia;
    }

    // 8. Track usage
    await trackUsage({
      companyId: session.user.companyId,
      service: 'claude',
      metric: 'tokens',
      value: ESTIMATED_TOKENS,
      metadata: {
        action: 'valuation_refine',
        address: direccion,
        previousValue: previousValuation.valorEstimado,
        refinedValue: refinedValuation.valorEstimado,
        feedbackLength: userFeedback.length,
      },
    });

    logger.info('[AI Valuate Refine] Valoración refinada', {
      previousValue: previousValuation.valorEstimado,
      refinedValue: refinedValuation.valorEstimado,
      changePercent: previousValuation.valorEstimado
        ? Math.round(
            ((refinedValuation.valorEstimado - previousValuation.valorEstimado) /
              previousValuation.valorEstimado) *
              100
          )
        : 0,
    });

    // 9. Return refined valuation
    return NextResponse.json({
      success: true,
      refined: true,
      // Direct fields for UI compatibility
      valorEstimado: refinedValuation.valorEstimado,
      valorMinimo: refinedValuation.valorMinimo,
      valorMaximo: refinedValuation.valorMaximo,
      precioM2: refinedValuation.precioM2,
      confianza: refinedValuation.confianza,
      tendenciaMercado: refinedValuation.tendenciaMercado,
      porcentajeTendencia: refinedValuation.porcentajeTendencia,
      comparables: refinedValuation.comparables,
      factoresPositivos: refinedValuation.factoresPositivos,
      factoresNegativos: refinedValuation.factoresNegativos,
      recomendaciones: refinedValuation.recomendaciones,
      analisisMercado: refinedValuation.analisisMercado,
      tiempoEstimadoVenta: refinedValuation.tiempoEstimadoVenta,
      rentabilidadAlquiler: refinedValuation.rentabilidadAlquiler,
      alquilerEstimado: refinedValuation.alquilerEstimado,
      reasoning: refinedValuation.reasoning,
      metodologiaUsada: refinedValuation.metodologiaUsada,
      // Media estancia (preserved or updated)
      alquilerMediaEstancia: refinedValuation.alquilerMediaEstancia || null,
      alquilerMediaEstanciaMin: refinedValuation.alquilerMediaEstanciaMin || null,
      alquilerMediaEstanciaMax: refinedValuation.alquilerMediaEstanciaMax || null,
      rentabilidadMediaEstancia: refinedValuation.rentabilidadMediaEstancia || null,
      ocupacionEstimadaMediaEstancia: refinedValuation.ocupacionEstimadaMediaEstancia || null,
      perfilInquilinoMediaEstancia: refinedValuation.perfilInquilinoMediaEstancia || null,
      // Platform sources from previous valuation (not re-queried)
      platformSources: null,
      aiSourcesUsed: ['claude_ai', 'user_feedback'],
      message: 'Valoración refinada con éxito según feedback del propietario',
    });
  } catch (error: any) {
    logger.error('[API AI Valuate Refine] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error refinando valoración',
        message: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
