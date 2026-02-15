/**
 * POST /api/investment/analysis/ai-extract
 *
 * Recibe un documento (PDF, imagen, texto) y extrae datos del rent roll,
 * gastos y datos del activo usando IA documental (Claude).
 * Tambien lanza valoracion IA del activo si hay datos suficientes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const analysisContext = formData.get('context') as string | null;

    if (!file && !text) {
      return NextResponse.json({ error: 'Se requiere un archivo o texto' }, { status: 400 });
    }

    // 1. Analizar documento con IA
    const { analyzeDocument, isAIConfigured } = await import('@/lib/ai-document-agent-service');

    if (!isAIConfigured()) {
      return NextResponse.json({
        error: 'IA no configurada. Se requiere ANTHROPIC_API_KEY.',
      }, { status: 503 });
    }

    let documentContent = text || '';
    let fileName = 'texto-manual';
    let mimeType = 'text/plain';

    if (file) {
      fileName = file.name;
      mimeType = file.type;
      // Para texto/CSV, leer contenido
      if (file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        documentContent = await file.text();
      }
    }

    const prompt = `Analiza este documento inmobiliario y extrae la siguiente informacion en formato JSON:

1. **rent_roll**: Array de unidades con campos:
   - tipo: "vivienda" | "garaje" | "local" | "trastero" | "oficina" | "otro"
   - referencia: identificador (ej: "1A", "Local B", "Garaje 3")
   - superficie: metros cuadrados (numero)
   - rentaMensual: renta mensual en euros (numero)
   - estado: "alquilado" | "vacio" | "reforma"

2. **datos_activo**: Objeto con:
   - nombre: nombre o descripcion del activo
   - direccion: direccion completa
   - ciudad: ciudad
   - askingPrice: precio de venta (numero)
   - ibiAnual: IBI anual si aparece
   - comunidadMensual: gastos comunidad mensuales
   - seguroAnual: seguro anual
   - superficieTotal: superficie total del activo
   - anosConstruccion: ano de construccion
   - estadoConservacion: estado general

3. **valoracion_datos**: Si hay datos suficientes para valorar:
   - address, city, postalCode, squareMeters, rooms, bathrooms, condition

Contexto adicional: ${analysisContext || 'Analisis de inversion inmobiliaria para sociedad patrimonial'}

Documento: ${fileName} (${mimeType})
Contenido:
${documentContent.substring(0, 15000)}

Responde SOLO con JSON valido, sin markdown.`;

    const analysisResult = await analyzeDocument({
      documentContent: prompt,
      analysisType: 'investment_analysis',
      additionalContext: analysisContext || undefined,
    });

    // 2. Parsear resultado de IA
    let extracted: any = {};
    try {
      // Intentar parsear JSON de la respuesta
      const jsonMatch = analysisResult.analysis?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      logger.warn('[AI Extract] Could not parse JSON from AI response:', parseErr);
      extracted = { raw: analysisResult.analysis };
    }

    // 3. Si hay datos de valoracion, lanzar valoracion IA en paralelo
    let valuation = null;
    if (extracted.valoracion_datos?.address && extracted.valoracion_datos?.squareMeters) {
      try {
        const valuationRes = await fetch(new URL('/api/valuations/estimate', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            ...extracted.valoracion_datos,
            rooms: extracted.valoracion_datos.rooms || 2,
            bathrooms: extracted.valoracion_datos.bathrooms || 1,
            condition: extracted.valoracion_datos.condition || 'GOOD',
          }),
        });
        if (valuationRes.ok) {
          valuation = await valuationRes.json();
        }
      } catch (valErr) {
        logger.warn('[AI Extract] Valuation failed:', valErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        rentRoll: extracted.rent_roll || [],
        datosActivo: extracted.datos_activo || {},
        valoracionDatos: extracted.valoracion_datos || null,
        valoracionIA: valuation?.data || null,
        rawAnalysis: analysisResult.analysis,
      },
    });
  } catch (error: any) {
    logger.error('[AI Extract]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error analizando documento' }, { status: 500 });
  }
}
