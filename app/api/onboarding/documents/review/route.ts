/**
 * API: Document Data Review
 * 
 * POST /api/onboarding/documents/review
 * Permite revisar, aprobar o rechazar datos extraídos de documentos
 * 
 * @module app/api/onboarding/documents/review/route
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// VALIDACIÓN
// ============================================================================

const reviewActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'correct']),
  documentId: z.string().optional(),
  dataId: z.string().optional(),
  correctedValue: z.string().optional(),
  note: z.string().optional(),
});

const bulkReviewSchema = z.object({
  batchId: z.string(),
  action: z.enum(['approve_all', 'approve_high_confidence', 'reject_all']),
  confidenceThreshold: z.number().min(0).max(1).optional().default(0.8),
});

// ============================================================================
// POST - Revisar datos
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const isBulk = searchParams.get('bulk') === 'true';

    if (isBulk) {
      // Revisión masiva
      const data = bulkReviewSchema.parse(body);
      return handleBulkReview(data, session.user.id, session.user.companyId);
    } else {
      // Revisión individual
      const data = reviewActionSchema.parse(body);
      return handleIndividualReview(data, session.user.id, session.user.companyId);
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Error en revisión:', error);
    return NextResponse.json(
      { error: 'Error al procesar la revisión' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Maneja revisión individual de un dato o documento
 */
async function handleIndividualReview(
  data: z.infer<typeof reviewActionSchema>,
  userId: string,
  companyId: string
) {
  if (data.dataId) {
    // Revisar un dato específico
    const extractedData = await prisma.extractedDocumentData.findFirst({
      where: {
        id: data.dataId,
        document: {
          companyId,
        },
      },
      include: {
        document: true,
      },
    });

    if (!extractedData) {
      return NextResponse.json(
        { error: 'Dato no encontrado' },
        { status: 404 }
      );
    }

    if (data.action === 'approve') {
      await prisma.extractedDocumentData.update({
        where: { id: data.dataId },
        data: {
          isValidated: true,
          validatedBy: userId,
          validatedAt: new Date(),
        },
      });
    } else if (data.action === 'reject') {
      await prisma.extractedDocumentData.delete({
        where: { id: data.dataId },
      });
    } else if (data.action === 'correct' && data.correctedValue) {
      await prisma.extractedDocumentData.update({
        where: { id: data.dataId },
        data: {
          originalValue: extractedData.fieldValue,
          fieldValue: data.correctedValue,
          wasCorrected: true,
          isValidated: true,
          validatedBy: userId,
          validatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Dato ${data.action === 'approve' ? 'aprobado' : data.action === 'reject' ? 'rechazado' : 'corregido'}`,
    });

  } else if (data.documentId) {
    // Revisar un documento completo
    const document = await prisma.documentImport.findFirst({
      where: {
        id: data.documentId,
        companyId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    if (data.action === 'approve') {
      // Aprobar documento y todos sus datos
      await prisma.$transaction([
        prisma.documentImport.update({
          where: { id: data.documentId },
          data: { status: 'approved' },
        }),
        prisma.extractedDocumentData.updateMany({
          where: { documentId: data.documentId },
          data: {
            isValidated: true,
            validatedBy: userId,
            validatedAt: new Date(),
          },
        }),
      ]);
    } else if (data.action === 'reject') {
      await prisma.documentImport.update({
        where: { id: data.documentId },
        data: { status: 'rejected' },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Documento ${data.action === 'approve' ? 'aprobado' : 'rechazado'}`,
    });
  }

  return NextResponse.json(
    { error: 'Debe proporcionar documentId o dataId' },
    { status: 400 }
  );
}

/**
 * Maneja revisión masiva de un batch
 */
async function handleBulkReview(
  data: z.infer<typeof bulkReviewSchema>,
  userId: string,
  companyId: string
) {
  // Verificar que el batch pertenece a la empresa
  const batch = await prisma.documentImportBatch.findFirst({
    where: {
      id: data.batchId,
      companyId,
    },
    include: {
      documents: {
        include: {
          extractedData: true,
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

  let updatedCount = 0;

  if (data.action === 'approve_all') {
    // Aprobar todos los documentos y datos
    const result = await prisma.$transaction([
      prisma.documentImport.updateMany({
        where: {
          batchId: data.batchId,
          status: 'awaiting_review',
        },
        data: { status: 'approved' },
      }),
      prisma.extractedDocumentData.updateMany({
        where: {
          document: { batchId: data.batchId },
          isValidated: false,
        },
        data: {
          isValidated: true,
          validatedBy: userId,
          validatedAt: new Date(),
        },
      }),
    ]);
    updatedCount = result[0].count;

  } else if (data.action === 'approve_high_confidence') {
    // Aprobar solo datos con alta confianza
    const highConfidenceDataIds = batch.documents.flatMap(doc =>
      doc.extractedData
        .filter(d => d.confidence >= data.confidenceThreshold && !d.isValidated)
        .map(d => d.id)
    );

    if (highConfidenceDataIds.length > 0) {
      await prisma.extractedDocumentData.updateMany({
        where: {
          id: { in: highConfidenceDataIds },
        },
        data: {
          isValidated: true,
          validatedBy: userId,
          validatedAt: new Date(),
        },
      });
      updatedCount = highConfidenceDataIds.length;

      // Aprobar documentos donde todos los datos están validados
      for (const doc of batch.documents) {
        const unvalidatedCount = await prisma.extractedDocumentData.count({
          where: {
            documentId: doc.id,
            isValidated: false,
          },
        });

        if (unvalidatedCount === 0) {
          await prisma.documentImport.update({
            where: { id: doc.id },
            data: { status: 'approved' },
          });
        }
      }
    }

  } else if (data.action === 'reject_all') {
    // Rechazar todos los documentos
    const result = await prisma.documentImport.updateMany({
      where: {
        batchId: data.batchId,
        status: 'awaiting_review',
      },
      data: { status: 'rejected' },
    });
    updatedCount = result.count;
  }

  // Actualizar estado del batch
  const stats = await prisma.documentImport.groupBy({
    by: ['status'],
    where: { batchId: data.batchId },
    _count: true,
  });

  const allApproved = stats.every(s => s.status !== 'awaiting_review');
  if (allApproved) {
    await prisma.documentImportBatch.update({
      where: { id: data.batchId },
      data: { status: data.action === 'reject_all' ? 'rejected' : 'approved' },
    });
  }

  logger.info('📋 Revisión masiva completada', {
    batchId: data.batchId,
    action: data.action,
    updatedCount,
  });

  return NextResponse.json({
    success: true,
    message: `${updatedCount} elementos actualizados`,
    updatedCount,
  });
}
