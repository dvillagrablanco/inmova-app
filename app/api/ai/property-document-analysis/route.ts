import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROPERTY_EXTRACTION_PROMPT = `Eres un experto en análisis de documentos inmobiliarios españoles.

TAREA: Analiza la imagen/documento de una propiedad y extrae todos los datos relevantes.

TIPOS DE DOCUMENTOS QUE PUEDES ENCONTRAR:
1. Fotos de propiedades (interior/exterior)
2. Planos de vivienda
3. Fichas catastrales
4. Certificados de eficiencia energética
5. Cédulas de habitabilidad
6. Notas simples del registro

DATOS A EXTRAER (si están visibles):
- tipo: Tipo de propiedad (piso, casa, local, oficina, garaje, trastero, nave, terreno)
- superficie: Metros cuadrados construidos
- superficieUtil: Metros cuadrados útiles
- habitaciones: Número de habitaciones/dormitorios
- banos: Número de baños/aseos
- planta: Planta del inmueble
- orientacion: Norte, Sur, Este, Oeste
- estado: Estado de conservación (nuevo, buen_estado, reformar)
- rentaMensual: Precio de alquiler si se indica
- descripcion: Descripción general si hay texto
- aireAcondicionado: Si tiene aire acondicionado (true/false)
- calefaccion: Si tiene calefacción (true/false)
- terraza: Si tiene terraza (true/false)
- balcon: Si tiene balcón (true/false)
- amueblado: Si está amueblado (true/false)

PARA FOTOS:
- Analiza el espacio visible
- Cuenta habitaciones/baños si se ven
- Detecta características (terraza visible, aire acondicionado instalado, etc.)
- Estima tipo de propiedad por lo que ves

PARA PLANOS:
- Extrae medidas si están indicadas
- Cuenta estancias
- Identifica distribución

PARA DOCUMENTOS OFICIALES:
- Extrae datos exactos del documento
- Referencia catastral si aparece
- Superficie oficial

RESPONDE EN JSON:
{
  "success": true,
  "documentType": "foto_interior" | "foto_exterior" | "plano" | "ficha_catastral" | "certificado_energetico" | "otro",
  "confidence": 0.0-1.0,
  "extractedData": {
    "tipo": "valor o null",
    "superficie": "valor numérico o null",
    "superficieUtil": "valor numérico o null",
    "habitaciones": "valor numérico o null",
    "banos": "valor numérico o null",
    "planta": "valor o null",
    "orientacion": "valor o null",
    "estado": "valor o null",
    "rentaMensual": "valor numérico o null",
    "descripcion": "texto o null",
    "aireAcondicionado": true/false/null,
    "calefaccion": true/false/null,
    "terraza": true/false/null,
    "balcon": true/false/null,
    "amueblado": true/false/null
  },
  "propertyFeatures": ["característica1", "característica2"],
  "summary": "Breve descripción de lo analizado",
  "warnings": ["advertencia si hay datos inciertos"]
}

IMPORTANTE:
- Solo incluye campos de los que estés razonablemente seguro
- Para fotos, es normal tener menos datos que para documentos oficiales
- Indica la confianza general del análisis
- propertyFeatures son características visuales detectadas (ej: "cocina moderna", "suelo de parquet", "ventanas grandes")`;

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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Property Document Analysis] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'Servicio de IA no configurado' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    let messages: Anthropic.MessageParam[];

    if (file.type === 'application/pdf') {
      // For PDFs, we'll describe what we need
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png', // PDFs converted to image
                data: base64,
              },
            },
            {
              type: 'text',
              text: PROPERTY_EXTRACTION_PROMPT + '\n\nANALIZA ESTE DOCUMENTO DE PROPIEDAD.',
            },
          ],
        },
      ];
    } else {
      // For images
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      
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
              text: PROPERTY_EXTRACTION_PROMPT + '\n\nANALIZA ESTA IMAGEN DE PROPIEDAD.',
            },
          ],
        },
      ];
    }

    console.log('[Property Document Analysis] Sending request to Claude');

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

    // Parse JSON response
    let analysisResult;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Property Document Analysis] JSON parse error:', parseError);
      console.error('[Property Document Analysis] Raw response:', textContent.text);
      
      // Return fallback response
      analysisResult = {
        success: false,
        documentType: 'unknown',
        confidence: 0,
        extractedData: {},
        propertyFeatures: [],
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
    console.error('[Property Document Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Error al analizar el documento', details: error.message },
      { status: 500 }
    );
  }
}
