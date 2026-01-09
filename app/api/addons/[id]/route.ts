import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/addons/[id]
 * Obtiene un add-on específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const addon = await prisma.addOn.findUnique({
      where: { id },
      include: {
        suscripciones: {
          include: {
            company: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
    });

    if (!addon) {
      return NextResponse.json(
        { error: 'Add-on no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: addon,
    });
  } catch (error: any) {
    console.error('[Add-ons GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo add-on', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/addons/[id]
 * Actualiza un add-on existente (solo admin)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Schema de validación para actualización (todos los campos opcionales)
    const schema = z.object({
      nombre: z.string().min(3).max(100).optional(),
      descripcion: z.string().min(10).optional(),
      categoria: z.enum(['usage', 'feature', 'premium']).optional(),
      precioMensual: z.number().min(0).optional(),
      precioAnual: z.number().min(0).nullable().optional(),
      unidades: z.number().nullable().optional(),
      tipoUnidad: z.string().nullable().optional(),
      disponiblePara: z.array(z.string()).optional(),
      incluidoEn: z.array(z.string()).optional(),
      margenPorcentaje: z.number().min(0).max(100).nullable().optional(),
      costoUnitario: z.number().min(0).nullable().optional(),
      destacado: z.boolean().optional(),
      activo: z.boolean().optional(),
      orden: z.number().optional(),
      stripePriceIdMonthly: z.string().nullable().optional(),
      stripePriceIdAnnual: z.string().nullable().optional(),
    });

    const validated = schema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que el add-on existe
    const existing = await prisma.addOn.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Add-on no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar add-on
    const addon = await prisma.addOn.update({
      where: { id },
      data: validated,
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADDON_UPDATED',
        entityType: 'ADDON',
        entityId: addon.id,
        details: {
          changes: Object.keys(validated),
          addonName: addon.nombre,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: addon,
      message: 'Add-on actualizado correctamente',
    });
  } catch (error: any) {
    console.error('[Add-ons PUT Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error actualizando add-on',
      message: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/addons/[id]
 * Elimina un add-on (solo admin)
 * Soft delete si tiene suscripciones activas
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que el add-on existe
    const addon = await prisma.addOn.findUnique({
      where: { id },
      include: {
        suscripciones: {
          where: { activo: true },
        },
      },
    });

    if (!addon) {
      return NextResponse.json(
        { error: 'Add-on no encontrado' },
        { status: 404 }
      );
    }

    // Si tiene suscripciones activas, hacer soft delete
    if (addon.suscripciones.length > 0) {
      await prisma.addOn.update({
        where: { id },
        data: { activo: false },
      });

      // Log de auditoría
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADDON_DEACTIVATED',
          entityType: 'ADDON',
          entityId: addon.id,
          details: {
            addonName: addon.nombre,
            reason: 'Has active subscriptions',
            activeSubscriptions: addon.suscripciones.length,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Add-on desactivado (tiene ${addon.suscripciones.length} suscripciones activas)`,
        softDelete: true,
      });
    }

    // Si no tiene suscripciones, eliminar definitivamente
    await prisma.addOn.delete({
      where: { id },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADDON_DELETED',
        entityType: 'ADDON',
        entityId: id,
        details: {
          addonName: addon.nombre,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Add-on eliminado correctamente',
    });
  } catch (error: any) {
    console.error('[Add-ons DELETE Error]:', error);
    return NextResponse.json({
      error: 'Error eliminando add-on',
      message: error.message,
    }, { status: 500 });
  }
}
