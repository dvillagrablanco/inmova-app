import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const detectBusinessSchema = z.object({
  companyName: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  propertyCount: z.number().optional(),
  propertyTypes: z.array(z.string()).optional(),
}).passthrough(); // Allow additional fields

/**
 * API para detectar automáticamente el modelo de negocio del usuario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = detectBusinessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.errors }, { status: 400 });
    }
    const userData = parsed.data;

    const systemPrompt = `Eres un experto en clasificación de modelos de negocio inmobiliario.

Analiza los datos del usuario y determina qué modelo de negocio inmobiliario tiene:

Modelos disponibles:
- alquiler_tradicional: Alquiler de larga duración de viviendas o locales
- str: Short-Term Rental (Airbnb, Booking, alquileres vacacionales)
- alquiler_habitaciones: Alquiler por habitaciones, coliving, residencias compartidas
- gestion_comunidades: Gestión de comunidades de propietarios
- flipping: Compra-venta, rehabilitación y reventa de inmuebles
- construccion: Promoción inmobiliaria, construcción de nuevos edificios
- profesional: Servicios profesionales (arquitectos, tasadores, etc.)
- general: Varios modelos o no claro

También sugiere qué módulos de la plataforma serían más útiles.

Responde en JSON con la siguiente estructura:
{
  "model": "nombre_del_modelo",
  "confidence": 0.95,
  "reasoning": "Explicación breve de por qué",
  "suggestedModules": ["modulo1", "modulo2", "modulo3"]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const userMessage = `Datos del usuario:\n${JSON.stringify(userData, null, 2)}`;

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
    logger.error('Error detecting business model:', error);
    return NextResponse.json(
      {
        model: 'general',
        confidence: 0,
        reasoning: 'No se pudo determinar el modelo',
        suggestedModules: [],
      },
      { status: 200 }
    );
  }
}
