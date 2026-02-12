/**
 * API: Onboarding Document Upload
 * 
 * POST /api/onboarding/documents/upload
 * 
 * Permite subir documentos (individuales o ZIP) para el proceso de onboarding
 * con análisis automático de IA.
 * 
 * @module app/api/onboarding/documents/upload/route
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadDocument } from '@/lib/document-service';
import { 
  processFile, 
  processZipFile, 
  isZipFile, 
  calculateChecksum 
} from '@/lib/document-import-processor-service';
import logger from '@/lib/logger';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES_PER_BATCH = 50;
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB total

// ============================================================================
// VALIDACIÓN
// ============================================================================

const uploadOptionsSchema = z.object({
  batchName: z.string().optional(),
  batchDescription: z.string().optional(),
  autoApprove: z.boolean().optional().default(false),
  confidenceThreshold: z.number().min(0).max(1).optional().default(0.8),
});
type UploadOptions = z.infer<typeof uploadOptionsSchema>;

// ============================================================================
// POST - Subir documentos
// ============================================================================

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  const startTime = Date.now();

  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;

    // 2. Obtener datos de la empresa para validación
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        nombre: true,
        cif: true,
        direccion: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // 3. Parsear FormData
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const optionsJson = formData.get('options') as string;
    
    let options: UploadOptions = { autoApprove: false, confidenceThreshold: 0.8 };
    if (optionsJson) {
      try {
        const parsed = JSON.parse(optionsJson);
        options = uploadOptionsSchema.parse(parsed);
      } catch (e) {
        logger.warn('Opciones de upload inválidas, usando defaults');
      }
    }

    // 4. Validar archivos
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron archivos' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_BATCH) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES_PER_BATCH} archivos por lote` },
        { status: 400 }
      );
    }

    // Calcular tamaño total
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: `Tamaño total excede ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    logger.info('📤 Iniciando upload de documentos', {
      userId,
      companyId,
      fileCount: files.length,
      totalSize,
    });

    // 5. Crear batch de importación
    const batch = await prisma.documentImportBatch.create({
      data: {
        companyId,
        userId,
        name: options.batchName || `Import ${new Date().toLocaleDateString('es-ES')}`,
        description: options.batchDescription,
        totalFiles: files.length,
        status: 'processing',
        autoApprove: options.autoApprove,
        confidenceThreshold: options.confidenceThreshold,
        startedAt: new Date(),
      },
    });

    // 6. Procesar archivos
    const results: Array<{
      originalFilename: string;
      documentImportId: string;
      status: 'success' | 'error';
      error?: string;
    }> = [];

    for (const file of files) {
      try {
        // Validar tamaño individual
        if (file.size > MAX_FILE_SIZE) {
          results.push({
            originalFilename: file.name,
            documentImportId: '',
            status: 'error',
            error: `Archivo excede ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          });
          continue;
        }

        // Convertir a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Si es ZIP, procesar contenidos
        if (isZipFile(file.type) || file.name.toLowerCase().endsWith('.zip')) {
          const zipContents = await processZipFile(buffer, file.name);
          
          // Crear DocumentImport para cada archivo del ZIP
          for (const zipFile of zipContents.files) {
            try {
              const docImport = await createDocumentImport(
                batch.id,
                companyId,
                zipFile.originalFilename,
                zipFile.mimeType,
                zipFile.size,
                zipFile.checksum,
                zipFile.buffer
              );

              results.push({
                originalFilename: zipFile.originalFilename,
                documentImportId: docImport.id,
                status: 'success',
              });
            } catch (err: any) {
              results.push({
                originalFilename: zipFile.originalFilename,
                documentImportId: '',
                status: 'error',
                error: err.message,
              });
            }
          }

          // Agregar errores del ZIP
          for (const error of zipContents.errors) {
            results.push({
              originalFilename: error.filename,
              documentImportId: '',
              status: 'error',
              error: error.error,
            });
          }
        } else {
          // Archivo individual
          const checksum = calculateChecksum(buffer);
          
          const docImport = await createDocumentImport(
            batch.id,
            companyId,
            file.name,
            file.type,
            file.size,
            checksum,
            buffer
          );

          results.push({
            originalFilename: file.name,
            documentImportId: docImport.id,
            status: 'success',
          });
        }
      } catch (err: any) {
        logger.error('Error procesando archivo:', { filename: file.name, error: err.message });
        results.push({
          originalFilename: file.name,
          documentImportId: '',
          status: 'error',
          error: err.message,
        });
      }
    }

    // 7. Actualizar estadísticas del batch
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'error').length;

    await prisma.documentImportBatch.update({
      where: { id: batch.id },
      data: {
        totalFiles: results.length,
        processedFiles: successCount,
        successfulFiles: successCount,
        failedFiles: failedCount,
        status: successCount > 0 ? 'analyzing' : 'failed',
        errors: results.filter(r => r.error).map(r => ({
          filename: r.originalFilename,
          error: r.error,
        })),
      },
    });

    // 8. Iniciar procesamiento de IA en background (async)
    if (successCount > 0) {
      // En un entorno real, esto se haría con una cola (BullMQ)
      // Por ahora, usamos un setTimeout para no bloquear la respuesta
      processDocumentsAsync(batch.id, company).catch(err => {
        logger.error('Error en procesamiento async:', err);
      });
    }

    const processingTime = Date.now() - startTime;

    logger.info('✅ Upload completado', {
      batchId: batch.id,
      totalFiles: results.length,
      successful: successCount,
      failed: failedCount,
      processingTimeMs: processingTime,
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalFiles: results.length,
      successfulFiles: successCount,
      failedFiles: failedCount,
      results,
      message: successCount > 0 
        ? 'Archivos subidos. El análisis de IA comenzará en breve.'
        : 'No se pudieron procesar los archivos.',
    }, { status: successCount > 0 ? 200 : 400 });

  } catch (error: any) {
    logger.error('❌ Error en upload de documentos:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la subida de documentos',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Crea un registro de DocumentImport y sube el archivo a S3
 */
async function createDocumentImport(
  batchId: string,
  companyId: string,
  filename: string,
  mimeType: string,
  size: number,
  checksum: string,
  buffer: Buffer
): Promise<{ id: string; s3Key: string }> {
  // Generar S3 key
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = filename.split('.').pop() || 'dat';
  const s3Key = `${companyId}/onboarding-imports/${batchId}/${timestamp}-${random}.${ext}`;

  // Subir a S3 (usando el servicio existente)
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          originalFilename: filename,
          batchId,
        },
      })
    );
  } catch (s3Error: any) {
    logger.warn('⚠️ Error subiendo a S3, guardando localmente:', s3Error.message);
    // En desarrollo, podemos continuar sin S3
  }

  // Crear registro en BD
  const docImport = await prisma.documentImport.create({
    data: {
      batchId,
      companyId,
      originalFilename: filename,
      mimeType,
      fileSize: size,
      s3Key,
      checksum,
      status: 'pending',
      processingStage: 'uploaded',
    },
  });

  return { id: docImport.id, s3Key };
}

/**
 * Procesa documentos con IA de forma asíncrona
 */
async function processDocumentsAsync(
  batchId: string,
  company: { id: string; nombre: string; cif: string | null; direccion: string | null }
) {
  const prisma = await getPrisma();
  try {
    // Importar servicios de IA
    const { processFile } = await import('@/lib/document-import-processor-service');
    const { analyzeDocument, isAIConfigured } = await import('@/lib/ai-document-agent-service');
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');

    if (!isAIConfigured()) {
      logger.warn('⚠️ IA no configurada, saltando análisis');
      await prisma.documentImportBatch.update({
        where: { id: batchId },
        data: { 
          status: 'awaiting_review',
          progress: 100,
        },
      });
      return;
    }

    // Obtener documentos pendientes
    const documents = await prisma.documentImport.findMany({
      where: { 
        batchId,
        status: 'pending',
      },
    });

    logger.info('🤖 Iniciando análisis de IA', { 
      batchId, 
      documentCount: documents.length 
    });

    let processed = 0;
    
    for (const doc of documents) {
      try {
        // Actualizar estado
        await prisma.documentImport.update({
          where: { id: doc.id },
          data: { 
            status: 'processing',
            processingStage: 'downloading',
          },
        });

        // Descargar de S3 (o leer localmente en dev)
        let buffer: Buffer;
        try {
          const s3Client = new S3Client({
            region: process.env.AWS_REGION!,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
          });

          const response = await s3Client.send(
            new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET!,
              Key: doc.s3Key,
            })
          );

          const chunks: Uint8Array[] = [];
          for await (const chunk of response.Body as any) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
        } catch (s3Error) {
          logger.warn('No se pudo descargar de S3, saltando documento');
          await prisma.documentImport.update({
            where: { id: doc.id },
            data: { 
              status: 'failed',
              errorMessage: 'No se pudo descargar el archivo',
            },
          });
          continue;
        }

        // Procesar archivo (extraer texto)
        await prisma.documentImport.update({
          where: { id: doc.id },
          data: { processingStage: 'ocr' },
        });

        const processedFile = await processFile(buffer, doc.originalFilename, doc.mimeType);
        
        if (processedFile.error) {
          throw new Error(processedFile.error);
        }

        // Actualizar con texto OCR
        await prisma.documentImport.update({
          where: { id: doc.id },
          data: {
            ocrText: processedFile.text,
            ocrConfidence: processedFile.textConfidence,
            ocrLanguage: 'spa',
            pageCount: processedFile.pageCount,
            processingStage: 'ai_analysis',
          },
        });

        // Análisis de IA
        const analysis = await analyzeDocument({
          text: processedFile.text,
          filename: doc.originalFilename,
          mimeType: doc.mimeType,
          pageCount: processedFile.pageCount,
          companyInfo: {
            cif: company.cif,
            nombre: company.nombre,
            direccion: company.direccion,
          },
        });

        // Guardar análisis
        await prisma.aIDocumentAnalysis.create({
          data: {
            documentId: doc.id,
            aiModel: analysis.processingMetadata.modelUsed,
            summary: analysis.summary,
            documentType: analysis.classification.specificType,
            keyEntities: JSON.parse(
              JSON.stringify(analysis.extractedFields)
            ) as Prisma.InputJsonValue,
            overallConfidence: analysis.classification.confidence,
            hasWarnings: analysis.warnings.length > 0,
            warnings: analysis.warnings,
            hasSensitiveData: analysis.sensitiveData.hasSensitive,
            sensitiveDataTypes: analysis.sensitiveData.types,
            suggestedActions: JSON.parse(
              JSON.stringify(analysis.suggestedActions)
            ) as Prisma.InputJsonValue,
            processingTimeMs: analysis.processingMetadata.processingTimeMs,
            tokensUsed: analysis.processingMetadata.tokensUsed,
          },
        });

        // Guardar datos extraídos
        for (const field of analysis.extractedFields) {
          await prisma.extractedDocumentData.create({
            data: {
              documentId: doc.id,
              dataType: field.dataType,
              fieldName: field.fieldName,
              fieldValue: field.fieldValue,
              confidence: field.confidence,
              pageNumber: field.pageNumber,
              targetEntity: field.targetEntity,
              targetField: field.targetField,
            },
          });
        }

        // Actualizar documento
        await prisma.documentImport.update({
          where: { id: doc.id },
          data: {
            status: analysis.classification.confidence >= 0.8 ? 'awaiting_review' : 'awaiting_review',
            detectedCategory: analysis.classification.category,
            categoryConfidence: analysis.classification.confidence,
            ownershipValidated: analysis.ownershipValidation.isOwned,
            detectedCIF: analysis.ownershipValidation.detectedCIF,
            matchesCompanyCIF: analysis.ownershipValidation.matchesCIF,
            ownershipNotes: analysis.ownershipValidation.notes,
            processingStage: 'completed',
            processedAt: new Date(),
          },
        });

        processed++;
        
        // Actualizar progreso del batch
        const progress = Math.round((processed / documents.length) * 100);
        await prisma.documentImportBatch.update({
          where: { id: batchId },
          data: {
            processedFiles: processed,
            progress,
            pendingReview: processed,
          },
        });

      } catch (docError: any) {
        logger.error('Error procesando documento:', { 
          docId: doc.id, 
          error: docError.message 
        });
        
        await prisma.documentImport.update({
          where: { id: doc.id },
          data: {
            status: 'failed',
            errorMessage: docError.message,
            processedAt: new Date(),
          },
        });
      }
    }

    // Finalizar batch
    await prisma.documentImportBatch.update({
      where: { id: batchId },
      data: {
        status: 'awaiting_review',
        progress: 100,
        completedAt: new Date(),
      },
    });

    logger.info('✅ Análisis de IA completado', { 
      batchId, 
      processed,
      total: documents.length,
    });

  } catch (error: any) {
    logger.error('❌ Error en procesamiento async:', error);
    
    await prisma.documentImportBatch.update({
      where: { id: batchId },
      data: {
        status: 'failed',
        errors: { message: error.message },
      },
    });
  }
}
