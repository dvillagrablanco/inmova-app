import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/ocr-import
 * Procesa una imagen usando OCR (visión LLM) y extrae datos estructurados
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string; // 'dni', 'invoice', 'contract', 'generic'

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (imágenes)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se aceptan imágenes (JPG, PNG, WEBP, GIF)' },
        { status: 400 }
      );
    }

    // Convertir archivo a base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const imageDataUrl = `data:${file.type};base64,${base64Image}`;

    // Preparar prompt según el tipo de documento
    let systemPrompt = '';
    let userPrompt = '';

    switch (documentType) {
      case 'dni':
        systemPrompt = 'Eres un asistente especializado en extraer información de DNI/NIE españoles.';
        userPrompt = `Analiza esta imagen de un DNI/NIE español y extrae la siguiente información en formato JSON:
{
  "tipo": "DNI" o "NIE",
  "numero": "número del documento",
  "nombre": "nombre completo",
  "apellidos": "apellidos",
  "fechaNacimiento": "DD/MM/YYYY",
  "fechaCaducidad": "DD/MM/YYYY",
  "nacionalidad": "nacionalidad"
}

Si algún campo no es visible o legible, déjalo como null.`;
        break;

      case 'invoice':
        systemPrompt = 'Eres un asistente especializado en extraer información de facturas.';
        userPrompt = `Analiza esta imagen de una factura y extrae la siguiente información en formato JSON:
{
  "numeroFactura": "número de factura",
  "fecha": "DD/MM/YYYY",
  "proveedor": "nombre del proveedor",
  "cif": "CIF/NIF del proveedor",
  "importeTotal": número (sin símbolo de moneda),
  "iva": número (porcentaje),
  "concepto": "descripción o concepto",
  "lineItems": [
    {
      "descripcion": "descripción del artículo/servicio",
      "cantidad": número,
      "precioUnitario": número,
      "total": número
    }
  ]
}

Si algún campo no es visible o legible, déjalo como null.`;
        break;

      case 'contract':
        systemPrompt = 'Eres un asistente especializado en extraer información de contratos de arrendamiento.';
        userPrompt = `Analiza esta imagen de un contrato de arrendamiento y extrae la siguiente información en formato JSON:
{
  "tipoContrato": "tipo de contrato",
  "arrendador": "nombre del arrendador",
  "arrendatario": "nombre del arrendatario",
  "direccionInmueble": "dirección completa del inmueble",
  "rentaMensual": número (sin símbolo de moneda),
  "fianza": número (sin símbolo de moneda),
  "fechaInicio": "DD/MM/YYYY",
  "duracion": "duración del contrato",
  "fechaFin": "DD/MM/YYYY",
  "formaPago": "forma de pago"
}

Si algún campo no es visible o legible, déjalo como null.`;
        break;

      case 'generic':
      default:
        systemPrompt = 'Eres un asistente especializado en extraer información de documentos.';
        userPrompt = `Analiza esta imagen de un documento y extrae toda la información relevante en formato JSON estructurado.
Identifica el tipo de documento y organiza los datos de manera lógica.
Si es un formulario, extrae todos los campos y sus valores.
Si es un documento de texto, extrae las secciones principales y su contenido.

Devuelve el resultado en formato JSON.`;
        break;
    }

    // Llamar a la API de Abacus.AI con visión
    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      throw new Error('ABACUSAI_API_KEY no configurada');
    }

    const apiResponse = await fetch('https://apis.abacus.ai/api/v1/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        model: 'gpt-4-vision-preview',
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      logger.error('Error en API de visión:', errorText);
      throw new Error(`Error al procesar la imagen: ${apiResponse.statusText}`);
    }

    const apiResult = await apiResponse.json();
    const extractedText = apiResult.choices?.[0]?.message?.content || '';

    // Intentar parsear el JSON extraído
    let extractedData: any = null;
    try {
      // Buscar y extraer el JSON del texto
      const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        extractedData = JSON.parse(jsonStr);
      } else {
        extractedData = JSON.parse(extractedText);
      }
    } catch (e) {
      logger.error('Error parseando JSON:', e);
      // Si no se puede parsear como JSON, devolver el texto extraído
      extractedData = { rawText: extractedText };
    }

    return NextResponse.json({
      success: true,
      documentType,
      extractedData,
      rawText: extractedText,
    });
  } catch (error: any) {
    logger.error('Error en OCR import:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar la imagen',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
