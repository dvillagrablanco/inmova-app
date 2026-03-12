export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const SYSTEM_PROMPT = `Eres un abogado inmobiliario español experto en interpretar notas simples del Registro de la Propiedad.

Analiza el texto de la nota simple y extrae la siguiente información en formato JSON:

{
  "finca": {
    "descripcion": "descripción de la finca",
    "superficieRegistral": número o null,
    "planta": "string o null",
    "uso": "vivienda|local|garaje|trastero|otro",
    "referenciaCatastral": "string o null"
  },
  "titulares": [
    {
      "nombre": "string",
      "porcentaje": número,
      "regimen": "pleno dominio|nuda propiedad|usufructo|gananciales|separación bienes|otro",
      "titulo": "compraventa|herencia|donación|otro"
    }
  ],
  "cargas": [
    {
      "tipo": "hipoteca|embargo|servidumbre|condicion_resolutoria|afeccion_fiscal|anotacion_preventiva|otro",
      "descripcion": "string",
      "importe": número o null,
      "acreedor": "string o null",
      "fecha": "string o null",
      "critico": boolean
    }
  ],
  "documentosPendientes": ["string"],
  "alertas": [
    {
      "nivel": "rojo|amarillo|verde",
      "mensaje": "string"
    }
  ],
  "resumenEjecutivo": "string con 2-3 frases resumen del estado de la finca",
  "semaforoOperacion": "verde|amarillo|rojo",
  "recomendaciones": ["string"]
}

Reglas de semáforo:
- ROJO: hipotecas vivas, embargos activos, problemas de titularidad, cargas que impiden la compra
- AMARILLO: afecciones fiscales pendientes de prescripción, servidumbres, documentos pendientes
- VERDE: sin cargas relevantes, titularidad clara, finca libre

Si el texto no es una nota simple o no es interpretable, responde con un JSON indicando el error.`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.length < 50) {
      return NextResponse.json({ error: 'Texto de nota simple requerido (mínimo 50 caracteres)' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'Servicio IA no configurado',
        fallback: {
          resumenEjecutivo: 'No se pudo analizar la nota simple automáticamente. Revisa manualmente los campos de titularidad, cargas e hipotecas.',
          semaforoOperacion: 'amarillo',
          alertas: [{ nivel: 'amarillo', mensaje: 'Análisis automático no disponible. Verificar manualmente.' }],
          recomendaciones: [
            'Verificar titularidad y régimen de propiedad',
            'Comprobar cargas, hipotecas y embargos',
            'Revisar afecciones fiscales',
            'Confirmar superficie registral vs catastral',
          ],
        },
      });
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        { role: 'user', content: `Analiza esta nota simple del Registro de la Propiedad:\n\n${text.substring(0, 8000)}` },
      ],
      system: SYSTEM_PROMPT,
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No se pudo parsear la respuesta IA', raw: responseText }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, data: parsed });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[parse-nota-simple] Error:', msg);
    return NextResponse.json({ error: 'Error procesando nota simple', details: msg }, { status: 500 });
  }
}
