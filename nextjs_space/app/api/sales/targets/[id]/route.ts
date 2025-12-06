import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/sales/targets/[id] - Obtener un objetivo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const target = await prisma.salesTarget.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!target) {
      return NextResponse.json(
        { error: 'Objetivo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(target);
  } catch (error) {
    logError('Error en GET /api/sales/targets/[id]', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener objetivo' },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/targets/[id] - Actualizar un objetivo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden actualizar objetivos
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Verificar que el objetivo existe y pertenece a la company
    const existingTarget = await prisma.salesTarget.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingTarget) {
      return NextResponse.json(
        { error: 'Objetivo no encontrado' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Campos actualizables
    if (data.metaVentas !== undefined) updateData.metaVentas = data.metaVentas;
    if (data.metaLeads !== undefined) updateData.metaLeads = data.metaLeads;
    if (data.metaConversiones !== undefined)
      updateData.metaConversiones = data.metaConversiones;
    if (data.metaRevenue !== undefined) updateData.metaRevenue = data.metaRevenue;
    if (data.ventasActuales !== undefined)
      updateData.ventasActuales = data.ventasActuales;
    if (data.leadsActuales !== undefined) updateData.leadsActuales = data.leadsActuales;
    if (data.conversionesActuales !== undefined)
      updateData.conversionesActuales = data.conversionesActuales;
    if (data.revenueActual !== undefined) updateData.revenueActual = data.revenueActual;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.activo !== undefined) updateData.activo = data.activo;
    if (data.fechaInicio !== undefined)
      updateData.fechaInicio = new Date(data.fechaInicio);
    if (data.fechaFin !== undefined) updateData.fechaFin = new Date(data.fechaFin);

    const target = await prisma.salesTarget.update({
      where: { id: params.id },
      data: updateData,
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    logger.info(`Objetivo actualizado: ${target.id}`);

    return NextResponse.json(target);
  } catch (error) {
    logError('Error en PATCH /api/sales/targets/[id]', error as Error);
    return NextResponse.json(
      { error: 'Error al actualizar objetivo' },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/targets/[id] - Eliminar un objetivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden eliminar objetivos
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar que el objetivo existe y pertenece a la company
    const existingTarget = await prisma.salesTarget.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingTarget) {
      return NextResponse.json(
        { error: 'Objetivo no encontrado' },
        { status: 404 }
      );
    }

    await prisma.salesTarget.delete({
      where: { id: params.id },
    });

    logger.info(`Objetivo eliminado: ${params.id}`);

    return NextResponse.json({ message: 'Objetivo eliminado correctamente' });
  } catch (error) {
    logError('Error en DELETE /api/sales/targets/[id]', error as Error);
    return NextResponse.json(
      { error: 'Error al eliminar objetivo' },
      { status: 500 }
    );
  }
}
