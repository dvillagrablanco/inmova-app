/**
 * API Route: Análisis de Documentos de Inquilinos con IA
 * 
 * Endpoint especializado para analizar DNI, NIE, pasaportes y contratos
 * para extraer datos de inquilinos automáticamente.
 * 
 * Usa Claude de Anthropic para el análisis de documentos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialization para evitar errores en tests/SSR
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY no configurado');
    }
    anthropicClient = new Anthropic({
      apiKey,
    });
  }
  return anthropicClient;
}

// Prompt especializado para extracción de datos de inquilinos
const TENANT_EXTRACTION_PROMPT = `Eres un experto en extracción de datos de documentos de identificación españoles (DNI, NIE, Pasaporte) y contratos de arrendamiento.

TAREA: Analiza el siguiente texto/descripción de un documento y extrae los datos del inquilino.

INFORMACIÓN DEL ARCHIVO:
- Nombre: {filename}
- Tipo: {filetype}

TEXTO EXTRAÍDO/DESCRIPCIÓN:
---
{document_text}
---

DATOS A EXTRAER:

1. Para DNI/NIE/Pasaporte:
- nombre: Nombre y apellidos completos
- documentoIdentidad: Número del documento (ej: 12345678A para DNI, X1234567B para NIE)
- tipoDocumento: "dni", "nie" o "pasaporte"
- fechaNacimiento: En formato YYYY-MM-DD
- nacionalidad: País de nacionalidad
- sexo: "masculino" o "femenino" (si disponible)

2. Para Contratos de Arrendamiento:
- nombre: Nombre del arrendatario/inquilino
- documentoIdentidad: DNI/NIE del arrendatario
- tipoDocumento: "dni" o "nie"
- email: Correo electrónico (si aparece)
- telefono: Número de teléfono (si aparece)
- profesion: Ocupación o profesión (si aparece)
- ingresosMensuales: Ingresos declarados (si aparece, solo número)
- fechaNacimiento: Fecha de nacimiento (si aparece, formato YYYY-MM-DD)
- nacionalidad: Nacionalidad del inquilino
- estadoCivil: "soltero", "casado", "divorciado" o "viudo" (si aparece)

REGLAS:
1. Solo extrae datos que puedas identificar con certeza
2. Para fechas, usa formato YYYY-MM-DD
3. Para documentos de identidad, incluye la letra de verificación
4. Si el nombre está en formato "APELLIDOS, NOMBRE", conviértelo a "NOMBRE APELLIDOS"
5. Normaliza las mayúsculas (primera letra mayúscula para nombres)
6. Si no puedes extraer un campo, NO lo incluyas en la respuesta

RESPONDE EN JSON:
{
  "documentType": "dni" | "nie" | "pasaporte" | "contrato_arrendamiento" | "otro",
  "confidence": 0.0-1.0,
  "extractedData": {
    "nombre": "valor o null",
    "documentoIdentidad": "valor o null",
    "tipoDocumento": "valor o null",
    "fechaNacimiento": "valor o null",
    "nacionalidad": "valor o null",
    "email": "valor o null",
    "telefono": "valor o null",
    "profesion": "valor o null",
    "ingresosMensuales": "valor o null",
    "estadoCivil": "valor o null"
  },
  "summary": "Breve descripción del documento analizado",
  "warnings": ["advertencia1", "advertencia2"]
}

Solo incluye campos que hayas extraído con certeza. No inventes datos.`;

/**
 * Extrae texto de un archivo (básico, para PDFs e imágenes)
 * En producción, se debería usar OCR como AWS Textract o Google Vision
 */
async function extractTextFromFile(file: File): Promise<string> {
  // Para archivos de texto
  if (file.type === 'text/plain') {
    return await file.text();
  }

  const basicInfo = `
Nombre de archivo: ${file.name}
Tipo MIME: ${file.type}
Tamaño: ${(file.size / 1024).toFixed(2)} KB
  `.trim();

  // Intentar extraer texto legible del buffer
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let extractedText = '';
    let textChars: number[] = [];
    
    for (let i = 0; i < uint8Array.length && extractedText.length < 50000; i++) {
      const byte = uint8Array[i];
      // Caracteres ASCII imprimibles y espacios
      if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
        textChars.push(byte);
      } else if (textChars.length > 10) {
        const text = String.fromCharCode(...textChars);
        if (text.trim().length > 5 && /[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/.test(text)) {
          extractedText += text + ' ';
        }
        textChars = [];
      } else {
        textChars = [];
      }
    }
    
    if (extractedText.trim().length > 50) {
      return basicInfo + '\n\nTexto extraído:\n' + extractedText.trim();
    }
  } catch (e) {
    logger.warn('[Tenant Document Analysis] Error extrayendo texto:', e);
  }

  return basicInfo;
}

/**
 * Análisis básico cuando la IA no está disponible
 */
function basicAnalysis(filename: string, fileType: string) {
  const lowerName = filename.toLowerCase();
  
  let documentType = 'otro';
  
  if (lowerName.includes('dni') || lowerName.includes('identidad')) {
    documentType = 'dni';
  } else if (lowerName.includes('nie')) {
    documentType = 'nie';
  } else if (lowerName.includes('pasaporte') || lowerName.includes('passport')) {
    documentType = 'pasaporte';
  } else if (lowerName.includes('contrato') || lowerName.includes('arrendamiento')) {
    documentType = 'contrato_arrendamiento';
  }

  return {
    documentType,
    confidence: 0.3,
    extractedData: {},
    summary: `Documento: ${filename}. Configure ANTHROPIC_API_KEY para análisis con IA.`,
    warnings: ['IA no configurada - no se pueden extraer datos automáticamente'],
  };
}

/**
 * Convierte imagen a base64 para análisis con Claude Vision
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Verificar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Usa PDF, JPG o PNG.' },
        { status: 400 }
      );
    }

    // Verificar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 10MB' },
        { status: 400 }
      );
    }

    // Verificar si IA está configurada
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('[Tenant Document Analysis] ANTHROPIC_API_KEY no configurado');
      const basicResult = basicAnalysis(file.name, file.type);
      return NextResponse.json(basicResult);
    }

    logger.info('[Tenant Document Analysis] Iniciando análisis', {
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: session.user.id,
    });

    // Preparar el contenido para Claude
    let messages: Anthropic.MessageCreateParams['messages'];
    
    // Si es una imagen, usar Claude Vision
    if (file.type.startsWith('image/')) {
      const base64Data = await fileToBase64(file);
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: TENANT_EXTRACTION_PROMPT
                .replace('{filename}', file.name)
                .replace('{filetype}', file.type)
                .replace('{document_text}', 'Ver imagen adjunta'),
            },
          ],
        },
      ];
    } else {
      // Para PDFs, extraer texto
      const extractedText = await extractTextFromFile(file);
      
      messages = [
        {
          role: 'user',
          content: TENANT_EXTRACTION_PROMPT
            .replace('{filename}', file.name)
            .replace('{filetype}', file.type)
            .replace('{document_text}', extractedText),
        },
      ];
    }

    // Llamar a Claude - usar modelo disponible
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2048,
      temperature: 0.1, // Baja temperatura para extracción precisa
      messages,
    });

    // Parsear respuesta
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada de Claude');
    }

    // Buscar JSON en la respuesta
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo parsear la respuesta de la IA');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Limpiar datos extraídos (remover nulls)
    const cleanedData: Record<string, string> = {};
    if (result.extractedData) {
      Object.entries(result.extractedData).forEach(([key, value]) => {
        if (value && value !== 'null' && value !== null) {
          cleanedData[key] = String(value);
        }
      });
    }

    const processingTimeMs = Date.now() - startTime;

    logger.info('[Tenant Document Analysis] Análisis completado', {
      filename: file.name,
      documentType: result.documentType,
      confidence: result.confidence,
      fieldsExtracted: Object.keys(cleanedData).length,
      processingTimeMs,
    });

    return NextResponse.json({
      documentType: result.documentType,
      confidence: result.confidence,
      extractedData: cleanedData,
      fields: Object.entries(cleanedData).map(([key, value]) => ({
        fieldName: key,
        fieldValue: value,
        confidence: result.confidence,
        targetField: key,
      })),
      summary: result.summary,
      warnings: result.warnings || [],
      processingTimeMs,
    });

  } catch (error: any) {
    logger.error('[Tenant Document Analysis] Error:', error);
    
    // Si hay error con la IA, intentar análisis básico
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      
      if (file) {
        logger.warn('[Tenant Document Analysis] Usando análisis básico como fallback');
        const basicResult = basicAnalysis(file.name, file.type);
        basicResult.warnings.push(`Error en IA: ${error.message}`);
        return NextResponse.json(basicResult);
      }
    } catch (e) {
      // Ignorar error de re-lectura de formData
    }
    
    return NextResponse.json(
      { 
        error: 'Error al analizar el documento', 
        details: error.message,
        extractedData: {},
        warnings: ['Error durante el análisis']
      },
      { status: 500 }
    );
  }
}
