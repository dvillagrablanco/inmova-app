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
 * También verifica por extensión como fallback
 */
function isImageFile(mimeType: string, filename?: string): boolean {
  // Verificar por mimeType
  const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (imageMimeTypes.includes(mimeType?.toLowerCase())) {
    return true;
  }
  
  // Fallback: verificar por extensión de archivo
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (ext && imageExtensions.includes(ext)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verifica si el archivo es un PDF que debe procesarse con visión
 */
function isPDFFile(mimeType: string, filename?: string): boolean {
  if (mimeType === 'application/pdf') {
    return true;
  }
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    return ext === 'pdf';
  }
  return false;
}

/**
 * Convierte un archivo a base64
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
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
    
    // Validar que el texto extraído es REAL y no basura del PDF
    // Los PDFs de imagen contienen texto como "stream", "endstream", "obj", etc.
    const pdfGarbagePatterns = /\b(stream|endstream|endobj|xref|trailer|startxref|obj\s+\d|BT|ET|Tf|Td|Tj|TJ|cm|re|f|S|Q|q)\b/gi;
    const cleanedText = extractedText.replace(pdfGarbagePatterns, '').trim();
    
    // Contar palabras reales (3+ caracteres alfabéticos)
    const realWords = cleanedText.match(/[a-záéíóúñA-ZÁÉÍÓÚÑ]{3,}/g) || [];
    const hasRealContent = realWords.length >= 10; // Al menos 10 palabras reales
    
    if (hasRealContent && cleanedText.length > 100) {
      return basicInfo + '\n\nTexto extraído:\n' + cleanedText;
    }
  } catch (e) {
    // Si falla la extracción, usar solo info básica
  }

  return basicInfo;
}

/**
 * Verifica si el texto extraído es contenido real útil para análisis
 * o si son solo metadatos/basura del PDF
 */
function isRealTextContent(text: string): boolean {
  if (!text || text.length < 100) return false;
  
  // Patrones de código interno de PDF - si hay CUALQUIERA de estos, es basura
  const pdfCodePatterns = [
    /\d+\s+\d+\s+obj/i,           // "3 0 obj"
    /<<\s*\/[A-Z]/i,              // "<< /Filter"
    /\/FlateDecode/i,             // /FlateDecode
    /\/Length\s+\d+/i,            // /Length 88
    /endobj/i,                    // endobj
    /endstream/i,                 // endstream
    /\/Type\s*\/Page/i,           // /Type /Page
    /\/Resources/i,               // /Resources
    /\/MediaBox/i,                // /MediaBox
    /xref/i,                      // xref
    /trailer/i,                   // trailer
    /startxref/i,                 // startxref
  ];
  
  // Si encontramos CUALQUIER patrón de código PDF, no es texto real
  for (const pattern of pdfCodePatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }
  
  // Buscar palabras reales en español que indiquen contenido de documento
  const spanishWords = /(nombre|apellido|fecha|nacimiento|direccion|numero|documento|dni|nie|pasaporte|contrato|alquiler|propiedad|inquilino|arrendador|arrendatario|importe|euros)/gi;
  const spanishMatches = (text.match(spanishWords) || []).length;
  
  // Necesitamos al menos 3 palabras relevantes en español
  return spanishMatches >= 3;
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
  // Log inicial usando process.stdout directamente para garantizar captura por PM2
  const requestTimestamp = new Date().toISOString();
  try {
    process.stdout.write(`${requestTimestamp}: [INFO] [AI Document Analysis] 🚀 PETICIÓN RECIBIDA\n`);
  } catch (e) {
    // Fallback si process.stdout no está disponible
  }
  
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

    // LOG CRÍTICO: Ver qué archivo está llegando (usando console.error para PM2)
    const timestamp = new Date().toISOString();
    console.error(`${timestamp}: [INFO] [AI Document Analysis] 📥 ARCHIVO RECIBIDO:`, JSON.stringify({
      filename: file?.name,
      type: file?.type,
      size: file?.size,
      context,
      hasFile: !!file,
    }));

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Verificar tipo de archivo - Incluir más tipos de imagen
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/octet-stream', // Para cuando el navegador no detecta el tipo
    ];

    // LOG: Verificación de tipo (usando console.error para PM2)
    const isTypeAllowed = allowedTypes.includes(file.type);
    console.error(`${timestamp}: [INFO] [AI Document Analysis] 📋 Verificación de tipo:`, JSON.stringify({
      fileType: file.type,
      isAllowed: isTypeAllowed,
      extension: file.name.split('.').pop()?.toLowerCase(),
    }));

    // Si el tipo no está en la lista pero la extensión sugiere que es válido, permitir
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'txt'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!isTypeAllowed && !validExtensions.includes(fileExtension)) {
      console.error(`${timestamp}: [INFO] [AI Document Analysis] ❌ Tipo de archivo rechazado:`, JSON.stringify({
        type: file.type,
        extension: fileExtension,
      }));
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

    const isImage = isImageFile(file.type, file.name);
    const isPDF = isPDFFile(file.type, file.name);
    
    // LOG: Información del archivo recibido
    logger.error(`[AI Document Analysis] 📋 ARCHIVO RECIBIDO - tipo: "${file.type}", nombre: "${file.name}", ext: "${fileExtension}", isImage: ${isImage}, isPDF: ${isPDF}, tamaño: ${file.size}`);

    let analysis;

    // ESTRATEGIA:
    // - Imágenes (JPG, PNG, etc.) → Claude Vision (Haiku soporta imágenes)
    // - PDFs → Análisis de texto (Haiku puede no soportar type:'document' para PDFs)
    if (isImage) {
      logger.info(`[AI Document Analysis] 🖼️ Detectado IMAGEN - Usando Claude Vision`, {
        mimeType: file.type,
        filename: file.name,
      });
      
      try {
        const documentBase64 = await fileToBase64(file);
        logger.info('[AI Document Analysis] Base64 generado', { 
          base64Length: documentBase64.length,
        });
        
        analysis = await analyzeImageDocument(
          documentBase64,
          file.type,
          file.name,
          companyInfo
        );
      } catch (docError: any) {
        logger.error(`[AI Document Analysis] Error en análisis de imagen:`, {
          message: docError.message,
          status: docError.status,
          error: docError.error || docError,
        });
        throw docError;
      }
    } else if (isPDF) {
      // Para PDFs: intentar extraer texto primero
      logger.error(`[AI Document Analysis] 📄 Detectado PDF - Extrayendo texto`, {
        mimeType: file.type,
        filename: file.name,
      });
      
      try {
        const extractedText = await extractTextFromFile(file);
        
        // Verificar si el texto extraído es contenido REAL y útil
        // No solo metadatos o basura del PDF
        const hasRealText = extractedText && 
                           extractedText.includes('Texto extraído:') &&
                           isRealTextContent(extractedText);
        
        logger.error('[AI Document Analysis] 📄 Análisis de texto del PDF:', { 
          textLength: extractedText?.length || 0,
          hasRealText,
          textPreview: extractedText?.substring(0, 200),
        });
        
        if (hasRealText) {
          // El PDF tiene texto real útil, usar análisis de texto
          logger.info('[AI Document Analysis] PDF con texto REAL - Usando análisis de texto');
          
          analysis = await analyzeDocument({
            text: extractedText,
            filename: file.name,
            mimeType: file.type,
            companyInfo,
          });
        } else {
          // El PDF es una imagen escaneada o no tiene texto útil
          // Enviarlo a Claude Vision como imagen
          logger.error('[AI Document Analysis] PDF sin texto útil - Usando Claude Vision como IMAGEN');
          
          const documentBase64 = await fileToBase64(file);
          logger.error('[AI Document Analysis] PDF Base64 generado:', { base64Length: documentBase64.length });
          
          // Enviar como imagen para que Claude Vision lo analice visualmente
          analysis = await analyzeImageDocument(
            documentBase64,
            'image/png', // Forzar como imagen para análisis visual
            file.name,
            companyInfo
          );
        }
      } catch (pdfError: any) {
        logger.error(`[AI Document Analysis] Error procesando PDF:`, {
          message: pdfError.message,
          status: pdfError.status,
          error: pdfError,
        });
        throw pdfError;
      }
    } else {
      // Para otros documentos de texto (Word, TXT, etc.), usar análisis de texto
      logger.info('[AI Document Analysis] 📄 Detectado DOCUMENTO DE TEXTO - Usando análisis de texto');
      
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
