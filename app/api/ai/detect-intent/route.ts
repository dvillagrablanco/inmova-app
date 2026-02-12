import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const detectIntentSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  context: z.record(z.any()).optional(),
});

/**
 * API para detectar la intención del usuario usando IA
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = detectIntentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const { message, context } = parsed.data;

    // Construir prompt para el LLM
    const systemPrompt = `Eres un asistente experto en gestión inmobiliaria que ayuda a detectar la intención del usuario.

Analiza el mensaje del usuario y determina su intención principal entre estas opciones:
- create_building: Quiere crear un nuevo edificio/propiedad
- create_tenant: Quiere registrar un nuevo inquilino
- create_contract: Quiere crear un contrato
- help: Necesita ayuda o tiene dudas
- navigate: Quiere ir a una sección específica
- report_issue: Quiere reportar un problema o incidencia
- configure: Quiere configurar algo
- other: Cualquier otra intención

Además, extrae entidades relevantes del mensaje (nombres, lugares, fechas, cantidades, etc.).

Responde en JSON con la siguiente estructura:
{
  "intent": "nombre_de_la_intencion",
  "confidence": 0.95,
  "entities": {
    "entityName": "value"
  },
  "suggestedAction": {
    "label": "Crear edificio",
    "route": "/edificios/nuevo"
  }
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const userMessage = context
      ? `Mensaje del usuario: "${message}"\n\nContexto adicional: ${JSON.stringify(context)}`
      : `Mensaje del usuario: "${message}"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    // Llamada al LLM API
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Error calling LLM API');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error detecting intent:', error);
    return NextResponse.json(
      { error: 'Failed to detect intent' },
      { status: 500 }
    );
  }
}
