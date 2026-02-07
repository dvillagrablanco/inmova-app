import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireProviderAuth } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/portal-proveedor/work-orders/[id]/reject - Rechazar orden de trabajo
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const auth = await requireProviderAuth(req);
    if (!auth.authenticated || !auth.provider) {
      return NextResponse.json(
        { error: auth.error || 'No autenticado' },
        { status: auth.status || 401 }
      );
    }

    const workOrderId = params.id;

    // Obtener motivo del rechazo
    const body = await req.json().catch(() => ({}));
    const { motivo } = body;

    if (!motivo || motivo.trim() === '') {
      return NextResponse.json(
        { error: 'El motivo del rechazo es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la orden existe y pertenece al proveedor
    const workOrder = await prisma.providerWorkOrder.findUnique({
      where: { id: workOrderId },
      select: {
        id: true,
        providerId: true,
        estado: true,
        companyId: true,
        asignadoPor: true,
        titulo: true,
        comentarios: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }

    if (workOrder.providerId !== auth.provider.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar esta orden' },
        { status: 403 }
      );
    }

    // Verificar que la orden está en estado adecuado para rechazar
    if (!['pendiente', 'asignada', 'aceptada'].includes(workOrder.estado)) {
      return NextResponse.json(
        { error: `No se puede rechazar una orden en estado ${workOrder.estado}` },
        { status: 400 }
      );
    }

    // Actualizar estado a rechazada y agregar motivo en comentarios
    const motivoCompleto = `[RECHAZO] ${motivo}`;
    const comentariosActualizados = workOrder.comentarios
      ? `${workOrder.comentarios}\n\n${motivoCompleto}`
      : motivoCompleto;

    const updatedWorkOrder = await prisma.providerWorkOrder.update({
      where: { id: workOrderId },
      data: {
        estado: 'rechazada',
        comentarios: comentariosActualizados,
      },
    });

    logger.info(
      `Orden ${workOrderId} rechazada por proveedor ${auth.provider.nombre}. Motivo: ${motivo}`
    );

    const notificationData = {
      companyId: workOrder.companyId,
      tipo: 'info',
      titulo: 'Orden de trabajo rechazada',
      mensaje: `El proveedor ${auth.provider.nombre} rechazó la orden "${workOrder.titulo}". Motivo: ${motivo}`,
      entityId: workOrder.id,
      entityType: 'work_order',
      ...(workOrder.asignadoPor ? { userId: workOrder.asignadoPor } : {}),
    };
    await prisma.notification.create({ data: notificationData });

    return NextResponse.json({
      success: true,
      message: 'Orden rechazada exitosamente',
      workOrder: updatedWorkOrder,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error al rechazar orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al rechazar orden de trabajo', details: message },
      { status: 500 }
    );
  }
}
