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
  analyzeImageDocument,
  isAIConfigured,
  DocumentAnalysisInput,
} from '@/lib/ai-document-agent-service';
import logger from '@/lib/logger';

/**
 * Verifica si el archivo es una imagen que puede ser analizada con visión
 */
function isImageFile(mimeType: string): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
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

    logger.info('[AI Document Analysis] Iniciando análisis con IA', {
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: session.user.id,
      isImage: isImageFile(file.type),
    });

    let analysis;

    // Si es una imagen, usar análisis con visión de Claude
    if (isImageFile(file.type)) {
      logger.info('[AI Document Analysis] Usando Claude Vision para análisis de imagen');
      
      const imageBase64 = await fileToBase64(file);
      
      analysis = await analyzeImageDocument(
        imageBase64,
        file.type,
        file.name,
        companyInfo
      );
    } else if (file.type === 'application/pdf') {
      // Para PDFs escaneados (como DNIs), pedir imagen
      // Los PDFs escaneados no tienen texto extraíble útil
      logger.info('[AI Document Analysis] PDF detectado - solicitando imagen');
      
      return NextResponse.json({
        classification: {
          category: 'dni_nie',
          confidence: 0.5,
          specificType: 'Documento de identidad (PDF)',
          reasoning: 'PDF detectado - se requiere imagen para análisis completo',
        },
        ownershipValidation: {
          isOwned: true,
          detectedCIF: null,
          detectedCompanyName: null,
          matchesCIF: false,
          matchesName: false,
          confidence: 0.3,
          notes: 'Sube una foto/imagen del documento para análisis completo',
        },
        extractedFields: [],
        summary: '📷 Para analizar documentos de identidad (DNI/NIE), por favor sube una FOTO o IMAGEN (JPG, PNG) en lugar de PDF. Esto permite un análisis más preciso.',
        warnings: [
          '⚠️ Los PDFs escaneados no permiten extracción de datos precisa.',
          '📷 Sube una foto directa del documento (JPG o PNG) para mejor análisis.',
        ],
        suggestedActions: ['Subir imagen JPG/PNG del documento'],
        sensitiveData: { hasSensitive: true, types: ['documento_identidad'] },
        processingMetadata: {
          tokensUsed: 0,
          processingTimeMs: 50,
          modelUsed: 'pdf-detection',
        },
      });
    } else {
      // Para documentos de texto (Word, TXT, etc.), usar análisis de texto
      const extractedText = await extractTextFromFile(file);
      
      analysis = await analyzeDocument({
        text: extractedText,
        filename: file.name,
        mimeType: file.type,
        companyInfo,
      });
    }

    logger.info('[AI Document Analysis] Análisis completado', {
      filename: file.name,
      category: analysis.classification.category,
      confidence: analysis.classification.confidence,
      processingTimeMs: analysis.processingMetadata.processingTimeMs,
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    logger.error('[AI Document Analysis] Error:', error);
    
    // Si hay error con la IA, intentar análisis básico como fallback
    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file') as File | null;
    
    if (file) {
      logger.warn('[AI Document Analysis] Usando análisis básico como fallback');
      const basicResult = basicAnalysis(file.name, file.type);
      basicResult.warnings.push(`Error en IA: ${error.message}`);
      return NextResponse.json(basicResult);
    }
    
    return NextResponse.json(
      { error: 'Error al analizar el documento', details: error.message },
      { status: 500 }
    );
  }
}
