import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';

// Función para procesar documentos con OCR usando Abacus.AI LLM API
async function processDocumentWithOCR(fileBuffer: Buffer, fileName: string, documentType: string) {
  try {
    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      throw new Error('ABACUSAI_API_KEY no configurada');
    }

    // Convertir el buffer a base64
    const base64File = fileBuffer.toString('base64');
    const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

    // Definir el prompt según el tipo de documento
    const prompts: Record<string, string> = {
      'dni': 'Extrae la siguiente información del documento de identidad: nombre completo, número de documento, fecha de nacimiento, fecha de expedición, fecha de vencimiento, nacionalidad. Responde en formato JSON.',
      'contrato': 'Extrae la siguiente información del contrato: partes del contrato, fecha de inicio, fecha de fin, monto mensual, depósito/fianza, cláusulas importantes. Responde en formato JSON.',
      'nomina': 'Extrae la siguiente información de la nómina: nombre del empleado, empresa, cargo, salario bruto mensual, salario neto, fecha de pago. Responde en formato JSON.',
      'curriculum': 'Extrae la siguiente información del currículum: nombre completo, educación, experiencia laboral (últimos 3 trabajos), habilidades, idiomas. Responde en formato JSON.',
      'otro': 'Analiza este documento y extrae la información más relevante. Responde en formato JSON con las claves apropiadas.',
    };

    const prompt = prompts[documentType] || prompts['otro'];

    // Llamar a la API de Abacus.AI
    const response = await fetch('https://api.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'file',
                file_content: base64File,
                mime_type: mimeType,
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en API de Abacus.AI: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No se recibió respuesta de la API');
    }

    // Intentar parsear el JSON de la respuesta
    try {
      // Extraer JSON del texto si está envuelto en backticks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonText.trim());
    } catch (parseError) {
      // Si no se puede parsear, devolver el texto plano
      return { rawText: content };
    }
  } catch (error) {
    logError(new Error('Error en processDocumentWithOCR'), error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten PDF, JPEG y PNG' },
        { status: 400 }
      );
    }

    // Convertir a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validar tamaño (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    logger.info(`Procesando documento: ${file.name}, tipo: ${documentType}`);

    // Subir a S3
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = await uploadFile(buffer, `documents/${timestamp}-${sanitizedFileName}`);

    logger.info(`Archivo subido a S3: ${s3Key}`);

    // Procesar con OCR
    const extractedData = await processDocumentWithOCR(buffer, file.name, documentType || 'otro');

    logger.info('OCR completado exitosamente');

    return NextResponse.json({
      success: true,
      s3Key,
      fileName: file.name,
      fileSize: buffer.length,
      extractedData,
    });
  } catch (error) {
    logError(new Error('Error en POST /api/documents/ocr'), error);
    return NextResponse.json(
      { error: 'Error al procesar el documento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
