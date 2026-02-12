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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[eWoorker Plan GET Error]:', { message });
    return NextResponse.json(
      {
        error: 'Error al obtener plan',
        message,
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
            action: 'UPDATE',
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[eWoorker Plan PUT Error]:', { message });

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
        message,
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

    // Verificar que el plan existe
    const existing = await prisma.ewoorkerPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const planActualMap: Record<
      string,
      'OBRERO_FREE' | 'CAPATAZ_PRO' | 'CONSTRUCTOR_ENTERPRISE'
    > = {
      OBRERO: 'OBRERO_FREE',
      CAPATAZ: 'CAPATAZ_PRO',
      CONSTRUCTOR: 'CONSTRUCTOR_ENTERPRISE',
    };

    const planActual = planActualMap[existing.codigo];

    const [activeSubscriptions, activeProfiles] = await Promise.all([
      prisma.ewoorkerSuscripcion.count({
        where: {
          plan: existing.codigo,
          estado: {
            in: ['ACTIVA', 'PENDIENTE', 'PAUSADA'],
          },
        },
      }),
      planActual
        ? prisma.ewoorkerPerfilEmpresa.count({
            where: { planActual },
          })
        : Promise.resolve(0),
    ]);

    if (activeSubscriptions > 0 || activeProfiles > 0) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar el plan',
          message:
            'Existen empresas suscritas o perfiles activos asociados a este plan.',
          activeSubscriptions,
          activeProfiles,
        },
        { status: 409 }
      );
    }

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
            action: 'DELETE',
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[eWoorker Plan DELETE Error]:', { message });
    return NextResponse.json(
      {
        error: 'Error eliminando plan',
        message,
      },
      { status: 500 }
    );
  }
}
