/**
 * API Route: Análisis de Documentos con IA
 * 
 * Endpoint para analizar documentos usando el AI Document Agent Service.
 * Soporta subida de archivos y análisis de texto.
 * 
 * Usa el servicio real de Anthropic Claude cuando ANTHROPIC_API_KEY está configurado,
 * con fallback a análisis básico si no está disponible.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  analyzeDocument, 
  isAIConfigured,
  DocumentAnalysisInput,
} from '@/lib/ai-document-agent-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verifica si el archivo es una imagen
 */
function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Convierte un archivo a base64
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

/**
 * Analiza una imagen usando Claude Vision
 */
async function analyzeImageWithVision(
  file: File,
  companyInfo: { cif: string | null; nombre: string; direccion: string | null }
): Promise<any> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no configurada');
  }
  
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const base64Image = await fileToBase64(file);
  
  // Determinar el media type correcto
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  if (file.type === 'image/png') mediaType = 'image/png';
  else if (file.type === 'image/gif') mediaType = 'image/gif';
  else if (file.type === 'image/webp') mediaType = 'image/webp';
  
  const prompt = `Analiza esta imagen de documento y extrae toda la información visible.

CONTEXTO:
- Empresa del usuario: ${companyInfo.nombre}
- CIF de la empresa: ${companyInfo.cif || 'No proporcionado'}

INSTRUCCIONES:
1. Identifica el tipo de documento (DNI, NIE, pasaporte, contrato, factura, etc.)
2. Extrae TODOS los datos visibles de forma estructurada
3. Si es un documento de identidad (DNI/NIE), extrae:
   - Nombre completo
   - Número de documento (DNI/NIE)
   - Fecha de nacimiento
   - Fecha de caducidad
   - Nacionalidad
   - Sexo
   - Dirección (si aparece)

RESPONDE EN FORMATO JSON:
{
  "documentType": "tipo de documento",
  "classification": {
    "category": "dni_nie|pasaporte|contrato_alquiler|factura|otro",
    "confidence": 0.0-1.0,
    "specificType": "descripción específica"
  },
  "extractedFields": [
    {
      "fieldName": "nombre del campo (ej: nombre_completo, dni, fecha_nacimiento)",
      "fieldValue": "valor extraído",
      "confidence": 0.0-1.0
    }
  ],
  "summary": "resumen breve del documento",
  "warnings": ["lista de advertencias si hay datos ilegibles o incompletos"]
}`;

  logger.info('[Vision Analysis] Analizando imagen con Claude Vision', {
    filename: file.name,
    fileType: file.type,
    fileSize: file.size,
  });

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022', // Modelo con mejor visión
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    // Extraer JSON de la respuesta
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      
      logger.info('[Vision Analysis] Análisis completado', {
        documentType: result.documentType,
        fieldsExtracted: result.extractedFields?.length || 0,
      });
      
      // Mapear a la estructura esperada
      return {
        classification: {
          category: result.classification?.category || 'otro',
          confidence: result.classification?.confidence || 0.7,
          specificType: result.classification?.specificType || result.documentType || 'Documento',
          reasoning: 'Análisis mediante Claude Vision',
        },
        ownershipValidation: {
          isOwned: true,
          detectedCIF: null,
          detectedCompanyName: null,
          matchesCIF: false,
          matchesName: false,
          confidence: 0.5,
          notes: 'Documento de identidad personal',
        },
        extractedFields: (result.extractedFields || []).map((f: any) => ({
          fieldName: f.fieldName,
          fieldValue: f.fieldValue,
          dataType: 'tenant_info',
          confidence: f.confidence || 0.8,
          targetEntity: 'Tenant',
          targetField: mapFieldNameToTarget(f.fieldName),
        })),
        summary: result.summary || 'Documento analizado con visión artificial',
        warnings: result.warnings || [],
        suggestedActions: [],
        sensitiveData: {
          hasSensitive: true,
          types: ['documento_identidad'],
        },
        processingMetadata: {
          tokensUsed: response.usage?.output_tokens || 0,
          processingTimeMs: 0,
          modelUsed: 'claude-3-5-sonnet-vision',
        },
      };
    }
  }
  
  throw new Error('No se pudo procesar la respuesta de visión');
}

/**
 * Mapea nombres de campo extraídos a campos del sistema
 */
function mapFieldNameToTarget(fieldName: string): string {
  const mapping: Record<string, string> = {
    'nombre_completo': 'nombreCompleto',
    'nombre': 'nombreCompleto',
    'dni': 'documentoIdentidad',
    'nie': 'documentoIdentidad',
    'numero_documento': 'documentoIdentidad',
    'fecha_nacimiento': 'fechaNacimiento',
    'nacionalidad': 'nacionalidad',
    'email': 'email',
    'telefono': 'telefono',
    'direccion': 'direccion',
    'sexo': 'sexo',
  };
  
  const lowerName = fieldName.toLowerCase().replace(/\s+/g, '_');
  return mapping[lowerName] || fieldName;
}

/**
 * Extrae texto de un archivo (PDF, documento de texto)
 * Para imágenes, se usa Claude Vision directamente
 */
async function extractTextFromFile(file: File): Promise<string> {
  // Para archivos de texto
  if (file.type === 'text/plain') {
    return await file.text();
  }

  // Para imágenes, retornar solo info básica (se procesará con Vision)
  if (isImageFile(file)) {
    return `[IMAGEN: ${file.name}] - Este archivo se procesará con análisis de visión.`;
  }

  // Para PDFs y documentos - usar el nombre del archivo como contexto básico
  const basicInfo = `
Nombre de archivo: ${file.name}
Tipo MIME: ${file.type}
Tamaño: ${(file.size / 1024).toFixed(2)} KB
Fecha de carga: ${new Date().toISOString()}
  `.trim();

  // Si el archivo es un PDF o documento, intentar leer como texto
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let extractedText = '';
    let textChars: number[] = [];
    
    for (let i = 0; i < uint8Array.length && extractedText.length < 50000; i++) {
      const byte = uint8Array[i];
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
    // Si falla la extracción, usar solo info básica
  }

  return basicInfo;
}

/**
 * Análisis básico cuando la IA no está disponible
 */
function basicAnalysis(filename: string, fileType: string) {
  const lowerName = filename.toLowerCase();
  
  let category = 'otro';
  let specificType = 'Documento general';
  
  if (lowerName.includes('contrato') || lowerName.includes('alquiler')) {
    category = 'contrato_alquiler';
    specificType = 'Contrato de arrendamiento';
  } else if (lowerName.includes('dni') || lowerName.includes('nie')) {
    category = 'dni_nie';
    specificType = 'Documento de identidad';
  } else if (lowerName.includes('factura')) {
    category = 'factura';
    specificType = 'Factura';
  } else if (lowerName.includes('seguro') || lowerName.includes('poliza')) {
    category = 'seguro';
    specificType = 'Póliza de seguro';
  } else if (lowerName.includes('escritura')) {
    category = 'escritura_propiedad';
    specificType = 'Escritura de propiedad';
  } else if (lowerName.includes('certificado') && lowerName.includes('energetico')) {
    category = 'certificado_energetico';
    specificType = 'Certificado de eficiencia energética';
  }

  return {
    classification: {
      category,
      confidence: 0.5,
      specificType,
      reasoning: 'Clasificación basada en el nombre del archivo (IA no configurada)',
    },
    ownershipValidation: {
      isOwned: true,
      detectedCIF: null,
      detectedCompanyName: null,
      matchesCIF: false,
      matchesName: false,
      confidence: 0.3,
      notes: 'Validación básica - configure ANTHROPIC_API_KEY para análisis completo',
    },
    extractedFields: [],
    summary: `Documento: ${filename}. Para análisis detallado, configure la integración con IA.`,
    warnings: ['IA no configurada - análisis limitado'],
    suggestedActions: [],
    sensitiveData: {
      hasSensitive: false,
      types: [],
    },
    processingMetadata: {
      tokensUsed: 0,
      processingTimeMs: 50,
      modelUsed: 'basic-fallback',
    },
  };
}

export async function POST(request: NextRequest) {
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
    const context = formData.get('context') as string || 'general';

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
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido' },
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
    if (!isAIConfigured()) {
      logger.warn('[AI Document Analysis] ANTHROPIC_API_KEY no configurado, usando análisis básico');
      const basicResult = basicAnalysis(file.name, file.type);
      return NextResponse.json(basicResult);
    }

    // Extraer texto del archivo
    const extractedText = await extractTextFromFile(file);

    // Obtener información de la empresa del usuario
    let companyInfo: DocumentAnalysisInput['companyInfo'] = {
      cif: null,
      nombre: session.user.name || 'Usuario',
      direccion: null,
    };

    // Intentar obtener info de la empresa del usuario
    if (session.user.companyId) {
      try {
        const company = await prisma.company.findUnique({
          where: { id: session.user.companyId },
          select: {
            cif: true,
            nombre: true,
            direccion: true,
          },
        });
        if (company) {
          companyInfo = {
            cif: company.cif || null,
            nombre: company.nombre,
            direccion: company.direccion || null,
          };
        }
      } catch (e) {
        logger.warn('[AI Document Analysis] No se pudo obtener info de empresa');
      }
    }

    // Analizar documento con IA real
    logger.info('[AI Document Analysis] Iniciando análisis con IA', {
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: session.user.id,
      isImage: isImageFile(file),
    });

    // Si es una imagen, usar Claude Vision directamente
    if (isImageFile(file)) {
      logger.info('[AI Document Analysis] Usando análisis de visión para imagen');
      const visionAnalysis = await analyzeImageWithVision(file, companyInfo);
      
      logger.info('[AI Document Analysis] Análisis de visión completado', {
        filename: file.name,
        category: visionAnalysis.classification?.category,
        fieldsExtracted: visionAnalysis.extractedFields?.length || 0,
      });
      
      return NextResponse.json(visionAnalysis);
    }

    // Para documentos de texto/PDF, usar el análisis tradicional
    const analysis = await analyzeDocument({
      text: extractedText,
      filename: file.name,
      mimeType: file.type,
      companyInfo,
    });

    logger.info('[AI Document Analysis] Análisis completado', {
      filename: file.name,
      category: analysis.classification.category,
      confidence: analysis.classification.confidence,
      processingTimeMs: analysis.processingMetadata.processingTimeMs,
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Error desconocido';
    const errorDetails = {
      message: errorMessage,
      name: error?.name,
      status: error?.status,
      code: error?.code,
    };
    
    logger.error('[AI Document Analysis] Error:', errorDetails);
    
    // Registrar el error en el sistema de tracking
    try {
      const { trackError } = await import('@/lib/error-tracker');
      await trackError(error, {
        source: 'api',
        route: '/api/ai/document-analysis',
        severity: 'high',
        metadata: { errorDetails },
      });
    } catch (e) {
      // Ignorar errores de tracking
    }
    
    // Retornar análisis básico como fallback con mensaje de error claro
    return NextResponse.json({
      classification: {
        category: 'otro',
        confidence: 0,
        specificType: 'Error en análisis',
        reasoning: `No se pudo analizar el documento: ${errorMessage}`,
      },
      ownershipValidation: {
        isOwned: false,
        detectedCIF: null,
        detectedCompanyName: null,
        matchesCIF: false,
        matchesName: false,
        confidence: 0,
        notes: 'Error en el análisis',
      },
      extractedFields: [],
      summary: `Error: ${errorMessage}`,
      warnings: [`Error en análisis de IA: ${errorMessage}`],
      suggestedActions: [],
      sensitiveData: { hasSensitive: false, types: [] },
      processingMetadata: {
        tokensUsed: 0,
        processingTimeMs: 0,
        modelUsed: 'error-fallback',
      },
      error: true,
      errorMessage,
    });
  }
}
