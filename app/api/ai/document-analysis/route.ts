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

/**
 * Convierte un PDF a imagen PNG usando pdftoppm (poppler-utils)
 * Requiere que poppler-utils esté instalado en el servidor
 */
async function convertPDFToImage(file: File): Promise<{ base64: string; mimeType: string }> {
  const { spawn } = await import('child_process');
  const { writeFile, readFile, unlink, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const os = await import('os');
  
  const tmpDir = os.tmpdir();
  const timestamp = Date.now();
  const pdfPath = join(tmpDir, `pdf_${timestamp}.pdf`);
  const outputPrefix = join(tmpDir, `img_${timestamp}`);
  const outputPath = `${outputPrefix}-1.png`;
  
  try {
    // Guardar PDF temporalmente
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    await writeFile(pdfPath, pdfBuffer);
    
    logger.info('[PDF to Image] Iniciando conversión con pdftoppm...', {
      filename: file.name,
      size: file.size,
    });
    
    // Convertir PDF a PNG usando pdftoppm
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('pdftoppm', [
        '-png',           // Formato PNG
        '-f', '1',        // Primera página
        '-l', '1',        // Hasta primera página
        '-r', '200',      // Resolución 200 DPI
        pdfPath,
        outputPrefix
      ]);
      
      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pdftoppm falló (code ${code}): ${stderr}`));
        }
      });
      
      proc.on('error', (err) => {
        reject(new Error(`No se pudo ejecutar pdftoppm: ${err.message}. ¿Está instalado poppler-utils?`));
      });
    });
    
    // Leer imagen generada
    const imageBuffer = await readFile(outputPath);
    const base64 = imageBuffer.toString('base64');
    
    logger.info('[PDF to Image] Conversión exitosa', {
      filename: file.name,
      originalSize: file.size,
      imageSize: imageBuffer.length,
    });
    
    // Limpiar archivos temporales
    await unlink(pdfPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    
    return {
      base64,
      mimeType: 'image/png',
    };
  } catch (error: any) {
    // Limpiar archivos temporales en caso de error
    await unlink(pdfPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    
    logger.error('[PDF to Image] Error convirtiendo PDF:', error.message);
    throw new Error(`No se pudo convertir el PDF a imagen: ${error.message}`);
  }
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
    const aiConfigured = isAIConfigured();
    console.error(`${timestamp}: [INFO] [AI Document Analysis] 🤖 IA configurada: ${aiConfigured}`);
    
    if (!aiConfigured) {
      console.error(`${timestamp}: [WARN] [AI Document Analysis] ANTHROPIC_API_KEY no configurado`);
      const basicResult = basicAnalysis(file.name, file.type);
      return NextResponse.json(basicResult);
    }

    // Obtener información de la empresa del usuario
    let companyInfo: DocumentAnalysisInput['companyInfo'] = {
      cif: null,
      nombre: session.user.name || 'Usuario',
      direccion: null,
    };

    console.error(`${timestamp}: [INFO] [AI Document Analysis] 👤 Usuario companyId: ${session.user.companyId || 'ninguno'}`);

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
        console.error(`${timestamp}: [INFO] [AI Document Analysis] 🏢 Empresa obtenida: ${company?.nombre || 'no encontrada'}`);
      } catch (e: any) {
        console.error(`${timestamp}: [ERROR] [AI Document Analysis] Error obteniendo empresa: ${e.message}`);
      }
    }

    const isImage = isImageFile(file.type, file.name);
    const isPDF = isPDFFile(file.type, file.name);
    
    // LOG: Información del archivo recibido
    console.error(`${timestamp}: [INFO] [AI Document Analysis] 📋 ARCHIVO: tipo="${file.type}", nombre="${file.name}", isImage=${isImage}, isPDF=${isPDF}`);

    let analysis;

    // ESTRATEGIA SIMPLE:
    // - Imágenes (JPG, PNG, GIF, WebP) → Claude Vision ✅
    // - PDFs escaneados → Convertir a imagen → Claude Vision ✅
    // - PDFs con texto → Análisis de texto ✅
    // - Otros documentos → Análisis de texto ✅
    
    console.error(`${timestamp}: [INFO] [AI Document Analysis] 🔄 Iniciando análisis...`);
    
    if (isImage) {
      // ✅ IMÁGENES: Usar Claude Vision directamente
      console.error(`${timestamp}: [INFO] [AI Document Analysis] 🖼️ IMAGEN detectada - Usando Claude Vision`);
      
      try {
        const imageBase64 = await fileToBase64(file);
        console.error(`${timestamp}: [INFO] [AI Document Analysis] 📤 Enviando imagen a Claude...`);
        
        analysis = await analyzeImageDocument(
          imageBase64,
          file.type,
          file.name,
          companyInfo
        );
        console.error(`${timestamp}: [INFO] [AI Document Analysis] ✅ Análisis de imagen completado`);
      } catch (imgError: any) {
        console.error(`${timestamp}: [ERROR] [AI Document Analysis] Error analizando imagen: ${imgError.message}`);
        throw imgError;
      }
    } else if (isPDF) {
      // PDFs: Verificar si tiene texto real o es escaneado
      console.error(`${timestamp}: [INFO] [AI Document Analysis] 📄 PDF detectado - Extrayendo texto...`);
      const extractedText = await extractTextFromFile(file);
      const hasRealText = extractedText && 
                         extractedText.includes('Texto extraído:') &&
                         isRealTextContent(extractedText);
      
      console.error(`${timestamp}: [INFO] [AI Document Analysis] 📄 PDF hasRealText=${hasRealText}`);
      
      if (hasRealText) {
        // ✅ PDF con texto real: usar análisis de texto
        console.error(`${timestamp}: [INFO] [AI Document Analysis] 📝 Analizando texto del PDF...`);
        analysis = await analyzeDocument({
          text: extractedText,
          filename: file.name,
          mimeType: file.type,
          companyInfo,
        });
        console.error(`${timestamp}: [INFO] [AI Document Analysis] ✅ Análisis de texto completado`);
      } else {
        // 🔄 PDF escaneado: Convertir a imagen y usar Claude Vision
        console.error(`${timestamp}: [INFO] [AI Document Analysis] 🔄 PDF escaneado - Convirtiendo a imagen con pdftoppm...`);
        
        try {
          // Convertir PDF a imagen PNG
          const { base64: imageBase64, mimeType: imageMimeType } = await convertPDFToImage(file);
          
          console.error(`${timestamp}: [INFO] [AI Document Analysis] ✅ PDF convertido - Enviando a Claude Vision...`);
          
          // Analizar la imagen con Claude Vision
          analysis = await analyzeImageDocument(
            imageBase64,
            imageMimeType,
            file.name.replace('.pdf', '.png'),
            companyInfo
          );
          console.error(`${timestamp}: [INFO] [AI Document Analysis] ✅ Análisis de PDF completado`);
        } catch (convError: any) {
          console.error(`${timestamp}: [ERROR] [AI Document Analysis] Error convirtiendo PDF: ${convError.message}`);
          
          // Fallback: mensaje de error amigable
          return NextResponse.json({
            classification: {
              category: 'dni_nie',
              confidence: 0.5,
              specificType: 'Documento escaneado',
              reasoning: 'Error al procesar PDF',
            },
            ownershipValidation: {
              isOwned: false,
              detectedCIF: null,
              detectedCompanyName: null,
              matchesCIF: false,
              matchesName: false,
              confidence: 0,
              notes: 'No se pudo procesar',
            },
            extractedFields: [],
            summary: 'No se pudo procesar el PDF. Por favor, intenta subir una imagen JPG o PNG.',
            warnings: [
              `⚠️ Error procesando PDF: ${convError.message}`,
              '📷 Alternativa: Sube el documento como imagen JPG o PNG.',
            ],
            suggestedActions: [],
            sensitiveData: { hasSensitive: true, types: ['documento_identidad'] },
            processingMetadata: {
              tokensUsed: 0,
              processingTimeMs: 0,
              modelUsed: 'none',
            },
          });
        }
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

    console.error(`${timestamp}: [INFO] [AI Document Analysis] ✅ ANÁLISIS COMPLETADO:`, JSON.stringify({
      filename: file.name,
      category: analysis.classification.category,
      confidence: analysis.classification.confidence,
      summary: analysis.summary?.substring(0, 100),
      fieldsCount: analysis.extractedFields?.length || 0,
    }));

    // Log del resultado completo para debug
    console.error(`${timestamp}: [DEBUG] [AI Document Analysis] 📤 ENVIANDO RESPUESTA AL CLIENTE`);

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
