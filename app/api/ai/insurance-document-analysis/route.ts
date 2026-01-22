import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INSURANCE_ANALYSIS_PROMPT = `Eres un experto en seguros inmobiliarios en España.

TAREA: Analiza este documento de póliza de seguro y extrae los datos relevantes.

TIPOS DE DOCUMENTOS DE SEGURO:
1. Póliza completa / Condiciones particulares
2. Recibo / Justificante de pago
3. Certificado de seguro
4. Condiciones generales
5. Suplemento / Modificación de póliza

DATOS A EXTRAER:
- tipoSeguro: EDIFICIO, RESPONSABILIDAD_CIVIL, HOGAR, ALQUILER, VIDA, ACCIDENTES
- numeroPoliza: Número de póliza
- aseguradora: Nombre de la compañía aseguradora
- fechaInicio: Fecha de efecto (formato YYYY-MM-DD)
- fechaFin: Fecha de vencimiento (formato YYYY-MM-DD)
- primaAnual: Prima anual en euros (solo número)
- cobertura: Capital asegurado en euros (solo número)
- franquicia: Franquicia/Deducible en euros (solo número)
- tomador: Nombre del tomador del seguro
- direccionRiesgo: Dirección del inmueble asegurado

COBERTURAS TÍPICAS A IDENTIFICAR:
- Incendio
- Robo
- Daños por agua
- Responsabilidad civil
- Cristales
- Daños eléctricos
- Actos vandálicos
- Fenómenos atmosféricos
- Asistencia en viaje/hogar

RESPONDE EN JSON:
{
  "success": true,
  "documentType": "poliza" | "recibo" | "certificado" | "condiciones" | "suplemento",
  "confidence": 0.0-1.0,
  "extractedData": {
    "tipoSeguro": "valor o null",
    "numeroPoliza": "valor o null",
    "aseguradora": "valor o null",
    "fechaInicio": "YYYY-MM-DD o null",
    "fechaFin": "YYYY-MM-DD o null",
    "primaAnual": "número o null",
    "cobertura": "número o null",
    "franquicia": "número o null",
    "tomador": "valor o null",
    "direccionRiesgo": "valor o null"
  },
  "coverageDetails": ["cobertura1", "cobertura2"],
  "summary": "Resumen del documento analizado",
  "warnings": ["advertencia si hay información incompleta"]
}

IMPORTANTE:
- Extrae números sin símbolos de moneda
- Fechas en formato YYYY-MM-DD
- Si es un recibo, extrae lo que puedas (puede tener menos datos)
- Indica coberturas específicas encontradas`;

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

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido' },
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
      console.error('[Insurance Analysis] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'Servicio de IA no configurado' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    let messages: Anthropic.MessageParam[];

    if (file.type === 'application/pdf') {
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64,
              },
            },
            {
              type: 'text',
              text: INSURANCE_ANALYSIS_PROMPT + '\n\nANALIZA ESTE DOCUMENTO DE SEGURO.',
            },
          ],
        },
      ];
    } else {
      messages = [
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
              text: INSURANCE_ANALYSIS_PROMPT + '\n\nANALIZA ESTE DOCUMENTO DE SEGURO.',
            },
          ],
        },
      ];
    }

    console.log('[Insurance Analysis] Sending request to Claude');

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
      console.error('[Insurance Analysis] JSON parse error:', parseError);
      console.error('[Insurance Analysis] Raw response:', textContent.text);
      
      analysisResult = {
        success: false,
        documentType: 'unknown',
        confidence: 0,
        extractedData: {},
        coverageDetails: [],
        summary: 'No se pudo analizar el documento correctamente',
        warnings: ['El documento no pudo ser procesado. Intenta con otra imagen más clara.'],
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
    console.error('[Insurance Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Error al analizar el documento', details: error.message },
      { status: 500 }
    );
  }
}
