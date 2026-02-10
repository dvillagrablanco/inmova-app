/**
 * API: Apply Document Parametrization
 * 
 * POST /api/onboarding/documents/apply
 * Aplica los datos extraídos y validados al sistema
 * 
 * GET /api/onboarding/documents/apply?batchId=xxx
 * Obtiene preview de los cambios que se aplicarán
 * 
 * @module app/api/onboarding/documents/apply/route
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  applyBatchParametrization, 
  previewParametrization 
} from '@/lib/document-parametrization-service';
import logger from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// VALIDACIÓN
// ============================================================================

const applySchema = z.object({
  batchId: z.string(),
  confirmChanges: z.boolean().optional().default(false),
});

// ============================================================================
// GET - Preview de cambios
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'batchId es requerido' },
        { status: 400 }
      );
    }

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

    // Obtener preview
    const preview = await previewParametrization(batchId, session.user.companyId);

    return NextResponse.json({
      success: true,
      batchId,
      preview,
      summary: {
        willCreate: preview.willCreate.length,
        willUpdate: preview.willUpdate.length,
        conflicts: preview.conflicts.length,
      },
    });

  } catch (error: any) {
    logger.error('Error obteniendo preview:', error);
    return NextResponse.json(
      { error: 'Error al generar preview' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Aplicar parametrización
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
    const { batchId, confirmChanges } = applySchema.parse(body);

    // Verificar que el batch pertenece a la empresa
    const batch = await prisma.documentImportBatch.findFirst({
      where: {
        id: batchId,
        companyId: session.user.companyId,
      },
      include: {
        documents: {
          where: { status: 'approved' },
          select: { id: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que hay documentos aprobados
    if (batch.documents.length === 0) {
      return NextResponse.json(
        { error: 'No hay documentos aprobados para aplicar' },
        { status: 400 }
      );
    }

    // Si no confirma, devolver preview
    if (!confirmChanges) {
      const preview = await previewParametrization(batchId, session.user.companyId);
      return NextResponse.json({
        success: true,
        requiresConfirmation: true,
        preview,
        message: 'Revisa los cambios y envía confirmChanges: true para aplicar',
      });
    }

    // Aplicar parametrización
    logger.info('🚀 Aplicando parametrización', { 
      batchId, 
      documentsCount: batch.documents.length 
    });

    const result = await applyBatchParametrization(
      batchId,
      session.user.companyId,
      session.user.id
    );

    // Actualizar sesión de onboarding si existe
    await prisma.onboardingDocumentSession.updateMany({
      where: { companyId: session.user.companyId },
      data: {
        currentPhase: 'complete',
        propertiesFound: result.summary.buildings.created + result.summary.buildings.updated +
                        result.summary.units.created + result.summary.units.updated,
        tenantsFound: result.summary.tenants.created + result.summary.tenants.updated,
        contractsFound: result.summary.contracts.created + result.summary.contracts.updated,
        entitiesCreated: {
          buildings: result.entitiesCreated.filter(e => e.entityType === 'Building').map(e => e.entityId),
          units: result.entitiesCreated.filter(e => e.entityType === 'Unit').map(e => e.entityId),
          tenants: result.entitiesCreated.filter(e => e.entityType === 'Tenant').map(e => e.entityId),
          contracts: result.entitiesCreated.filter(e => e.entityType === 'Contract').map(e => e.entityId),
        },
        completedAt: new Date(),
      },
    });

    logger.info('✅ Parametrización completada', {
      batchId,
      created: result.entitiesCreated.length,
      updated: result.entitiesUpdated.length,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: result.success,
      result: {
        entitiesCreated: result.entitiesCreated,
        entitiesUpdated: result.entitiesUpdated,
        errors: result.errors,
        summary: result.summary,
      },
      message: result.success 
        ? `Se han creado ${result.entitiesCreated.length} y actualizado ${result.entitiesUpdated.length} entidades`
        : 'La parametrización completó con errores',
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Error aplicando parametrización:', error);
    return NextResponse.json(
      { error: 'Error al aplicar parametrización' },
      { status: 500 }
    );
  }
}
