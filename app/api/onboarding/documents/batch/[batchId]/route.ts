/**
 * API: Onboarding Document Batch Details
 * 
 * GET /api/onboarding/documents/batch/[batchId]
 * Obtiene detalles de un batch de importación
 * 
 * DELETE /api/onboarding/documents/batch/[batchId]
 * Cancela un batch de importación
 * 
 * @module app/api/onboarding/documents/batch/[batchId]/route
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ============================================================================
// GET - Obtener detalles del batch
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { batchId } = params;

    const batch = await prisma.documentImportBatch.findFirst({
      where: {
        id: batchId,
        companyId: session.user.companyId,
      },
      include: {
        documents: {
          select: {
            id: true,
            originalFilename: true,
            mimeType: true,
            fileSize: true,
            status: true,
            detectedCategory: true,
            categoryConfidence: true,
            ownershipValidated: true,
            matchesCompanyCIF: true,
            processingStage: true,
            errorMessage: true,
            processedAt: true,
            createdAt: true,
            analyses: {
              select: {
                id: true,
                summary: true,
                documentType: true,
                overallConfidence: true,
                hasWarnings: true,
                warnings: true,
                suggestedActions: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            extractedData: {
              select: {
                id: true,
                dataType: true,
                fieldName: true,
                fieldValue: true,
                confidence: true,
                isValidated: true,
                wasApplied: true,
                targetEntity: true,
                targetField: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch no encontrado' },
        { status: 404 }
      );
    }

    // Calcular estadísticas
    const stats = {
      totalFiles: batch.documents.length,
      processed: batch.documents.filter(d => d.status !== 'pending' && d.status !== 'processing').length,
      pending: batch.documents.filter(d => d.status === 'pending').length,
      processing: batch.documents.filter(d => d.status === 'processing').length,
      awaitingReview: batch.documents.filter(d => d.status === 'awaiting_review').length,
      approved: batch.documents.filter(d => d.status === 'approved').length,
      rejected: batch.documents.filter(d => d.status === 'rejected').length,
      failed: batch.documents.filter(d => d.status === 'failed').length,
      
      // Estadísticas de categorías
      categoryCounts: batch.documents.reduce((acc, doc) => {
        const cat = doc.detectedCategory || 'sin_clasificar';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Estadísticas de entidades extraídas
      entitiesFound: {
        properties: batch.documents.filter(d => 
          d.extractedData.some(e => e.targetEntity === 'Building' || e.targetEntity === 'Unit')
        ).length,
        tenants: batch.documents.filter(d =>
          d.extractedData.some(e => e.targetEntity === 'Tenant')
        ).length,
        contracts: batch.documents.filter(d =>
          d.extractedData.some(e => e.targetEntity === 'Contract')
        ).length,
      },

      // Datos pendientes de revisión
      dataAwaitingReview: batch.documents.reduce((acc, doc) => {
        return acc + doc.extractedData.filter(e => !e.isValidated && !e.wasApplied).length;
      }, 0),
    };

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        name: batch.name,
        description: batch.description,
        status: batch.status,
        progress: batch.progress,
        autoApprove: batch.autoApprove,
        confidenceThreshold: batch.confidenceThreshold,
        createdBy: batch.user,
        startedAt: batch.startedAt,
        completedAt: batch.completedAt,
        createdAt: batch.createdAt,
      },
      documents: batch.documents,
      stats,
    });

  } catch (error: any) {
    logger.error('Error obteniendo batch:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles del batch' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cancelar batch
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { batchId } = params;

    // Verificar que el batch pertenece a la empresa
    const batch = await prisma.documentImportBatch.findFirst({
      where: {
        id: batchId,
        companyId: session.user.companyId,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch no encontrado' },
        { status: 404 }
      );
    }

    // No permitir cancelar batches ya completados o aplicados
    if (batch.status === 'approved') {
      return NextResponse.json(
        { error: 'No se puede cancelar un batch ya aprobado' },
        { status: 400 }
      );
    }

    const documents = await prisma.documentImport.findMany({
      where: { batchId },
      select: { s3Key: true },
    });
    const s3Keys = documents
      .map((doc) => doc.s3Key)
      .filter((key): key is string => Boolean(key));

    // Eliminar todos los datos relacionados
    await prisma.$transaction([
      // Eliminar datos extraídos
      prisma.extractedDocumentData.deleteMany({
        where: {
          document: {
            batchId,
          },
        },
      }),
      // Eliminar análisis
      prisma.aIDocumentAnalysis.deleteMany({
        where: {
          document: {
            batchId,
          },
        },
      }),
      // Eliminar documentos
      prisma.documentImport.deleteMany({
        where: { batchId },
      }),
      // Eliminar batch
      prisma.documentImportBatch.delete({
        where: { id: batchId },
      }),
    ]);

    if (s3Keys.length > 0) {
      const { deleteFromS3 } = await import('@/lib/aws-s3-service');
      const deletionResults = await Promise.allSettled(
        s3Keys.map((key) => deleteFromS3(key))
      );
      const failedDeletes = deletionResults.filter(
        (result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)
      );
      if (failedDeletes.length > 0) {
        logger.warn('No se pudieron eliminar algunos archivos de S3', {
          batchId,
          failed: failedDeletes.length,
        });
      }
    }

    logger.info('🗑️ Batch cancelado y eliminado', { batchId });

    return NextResponse.json({
      success: true,
      message: 'Batch cancelado y eliminado correctamente',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error cancelando batch:', error);
    return NextResponse.json(
      { error: 'Error al cancelar el batch', details: message },
      { status: 500 }
    );
  }
}
