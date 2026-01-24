import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAINTENANCE_ANALYSIS_PROMPT = `Eres un experto en mantenimiento de edificios y viviendas en España.

TAREA: Analiza esta imagen de una incidencia/problema de mantenimiento y clasifícala.

TIPOS DE INCIDENCIAS:
- fontaneria: Fugas, atascos, grifos, inodoros, calentadores
- electricidad: Enchufes, interruptores, cuadros eléctricos, cables
- climatizacion: Aire acondicionado, calefacción, radiadores
- cerrajeria: Cerraduras, puertas, ventanas
- cristaleria: Cristales rotos, ventanas
- pintura: Humedades, desconchados, manchas
- albanileria: Grietas, desperfectos en paredes/suelos
- electrodomesticos: Lavadora, nevera, horno, lavavajillas
- general: Otros problemas no categorizados

NIVELES DE URGENCIA:
- baja: Puede esperar días/semanas, no afecta habitabilidad
- media: Debería resolverse pronto pero no es urgente
- alta: Requiere atención rápida, afecta uso normal
- urgente: Emergencia, riesgo de seguridad o daños mayores

ANALIZA:
1. Qué tipo de problema se ve en la imagen
2. Gravedad y urgencia
3. Posibles causas
4. Recomendaciones de actuación

RESPONDE EN JSON:
{
  "success": true,
  "issueType": "tipo de incidencia",
  "urgency": "baja|media|alta|urgente",
  "confidence": 0.0-1.0,
  "extractedData": {
    "titulo": "Título descriptivo breve del problema",
    "descripcion": "Descripción detallada de lo observado en la imagen",
    "prioridad": "baja|media|alta",
    "tipo": "fontaneria|electricidad|climatizacion|cerrajeria|cristaleria|pintura|albanileria|electrodomesticos|general"
  },
  "summary": "Resumen del análisis en una frase",
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ],
  "estimatedCost": "Rango estimado de coste (ej: 50-100€)",
  "warnings": [
    "Advertencia si hay riesgo de seguridad"
  ]
}

CONSIDERACIONES:
- Si ves agua/humedad, indica urgencia
- Si hay cables expuestos o problemas eléctricos visibles, es urgente
- Si hay riesgo estructural (grietas grandes), es urgente
- Incluye recomendaciones prácticas
- El coste estimado es orientativo para España`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Usa JPG, PNG o WebP' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Maintenance Analysis] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'Servicio de IA no configurado' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: base64,
            },
          },
          {
            type: 'text',
            text: MAINTENANCE_ANALYSIS_PROMPT + '\n\nANALIZA ESTA IMAGEN DE INCIDENCIA.',
          },
        ],
      },
    ];

    console.log('[Maintenance Analysis] Sending request to Claude');

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.1,
      messages,
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No se recibió respuesta de texto');
    }

    let analysisResult;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Maintenance Analysis] JSON parse error:', parseError);
      console.error('[Maintenance Analysis] Raw response:', textContent.text);
      
      analysisResult = {
        success: false,
        issueType: 'general',
        urgency: 'media',
        confidence: 0,
        extractedData: {},
        summary: 'No se pudo analizar la imagen correctamente',
        recommendations: [],
        warnings: ['La imagen no pudo ser procesada. Intenta con otra imagen más clara.'],
      };
    }

    // Convert extractedData to fields array
    const fields = Object.entries(analysisResult.extractedData || {})
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        fieldName: key,
        fieldValue: value,
        confidence: analysisResult.confidence || 0.5,
        targetField: key,
      }));

    return NextResponse.json({
      ...analysisResult,
      fields,
    });
  } catch (error: any) {
    console.error('[Maintenance Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Error al analizar la imagen', details: error.message },
      { status: 500 }
    );
  }
}
