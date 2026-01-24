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
 * Extrae texto de un archivo (PDF, imagen, texto)
 * En producción, esto debería usar un servicio OCR como AWS Textract o Google Vision
 */
async function extractTextFromFile(file: File): Promise<string> {
  // Para archivos de texto
  if (file.type === 'text/plain') {
    return await file.text();
  }

  // Para PDFs y documentos - usar el nombre del archivo como contexto básico
  // En producción, aquí se integraría con un servicio OCR
  const basicInfo = `
Nombre de archivo: ${file.name}
Tipo MIME: ${file.type}
Tamaño: ${(file.size / 1024).toFixed(2)} KB
Fecha de carga: ${new Date().toISOString()}
  `.trim();

  // Si el archivo es un PDF o documento, intentar leer como texto
  // (muchos PDFs generados digitalmente contienen texto extraíble)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Buscar texto legible en el buffer (para PDFs con texto)
    let extractedText = '';
    let textChars: number[] = [];
    
    for (let i = 0; i < uint8Array.length && extractedText.length < 50000; i++) {
      const byte = uint8Array[i];
      // Caracteres ASCII imprimibles y espacios
      if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
        textChars.push(byte);
      } else if (textChars.length > 10) {
        // Si tenemos una secuencia de caracteres legibles, añadirla
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
    });

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
