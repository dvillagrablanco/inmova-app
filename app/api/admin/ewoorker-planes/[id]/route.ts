import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/ewoorker-planes/[id]
 * Obtener un plan específico
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const plan = await prisma.ewoorkerPlan.findUnique({
      where: { id: params.id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    logger.error('[eWoorker Plan GET Error]:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener plan',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ewoorker-planes/[id]
 * Actualizar un plan
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validación
    const schema = z.object({
      nombre: z.string().min(3).max(100).optional(),
      descripcion: z.string().min(10).optional(),
      precioMensual: z.number().min(0).optional(),
      precioAnual: z.number().min(0).optional(),
      maxOfertas: z.number().optional(),
      comisionEscrow: z.number().min(0).max(100).optional(),
      features: z.array(z.string()).optional(),
      socioPercentage: z.number().min(0).max(100).optional(),
      plataformaPercentage: z.number().min(0).max(100).optional(),
      destacado: z.boolean().optional(),
      activo: z.boolean().optional(),
      orden: z.number().optional(),
    });

    const validated = schema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que el plan existe
    const existing = await prisma.ewoorkerPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // Si se está marcando como destacado, quitar destacado de los demás
    if (validated.destacado) {
      await prisma.ewoorkerPlan.updateMany({
        where: {
          destacado: true,
          id: { not: params.id },
        },
        data: { destacado: false },
      });
    }

    // Actualizar plan
    const plan = await prisma.ewoorkerPlan.update({
      where: { id: params.id },
      data: validated,
    });

    // Log de auditoría (solo si hay companyId)
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyId: true },
      });
      
      if (user?.companyId) {
        await prisma.auditLog.create({
          data: {
            companyId: user.companyId,
            userId: session.user.id,
            action: 'PLATFORM_SETTINGS_UPDATED',
            entityType: 'EWOORKER_PLAN',
            entityId: plan.id,
            entityName: plan.nombre,
            changes: JSON.stringify({
              action: 'updated',
              codigo: plan.codigo,
              changes: validated,
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });
      }
    } catch (auditError) {
      logger.warn('[Audit Log Warning]:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan actualizado exitosamente',
    });
  } catch (error: any) {
    logger.error('[eWoorker Plan PUT Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error actualizando plan',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ewoorker-planes/[id]
 * Eliminar un plan
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que el plan existe
    const existing = await prisma.ewoorkerPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // TODO: Verificar si hay empresas suscritas a este plan

    // Eliminar plan
    await prisma.ewoorkerPlan.delete({
      where: { id: params.id },
    });

    // Log de auditoría (solo si hay companyId)
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyId: true },
      });
      
      if (user?.companyId) {
        await prisma.auditLog.create({
          data: {
            companyId: user.companyId,
            userId: session.user.id,
            action: 'PLATFORM_SETTINGS_UPDATED',
            entityType: 'EWOORKER_PLAN',
            entityId: params.id,
            entityName: existing.nombre,
            changes: JSON.stringify({
              action: 'deleted',
              codigo: existing.codigo,
              nombre: existing.nombre,
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });
      }
    } catch (auditError) {
      logger.warn('[Audit Log Warning]:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Plan eliminado exitosamente',
    });
  } catch (error: any) {
    logger.error('[eWoorker Plan DELETE Error]:', error);
    return NextResponse.json(
      {
        error: 'Error eliminando plan',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
