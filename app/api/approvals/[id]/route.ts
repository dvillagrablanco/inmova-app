import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { createNotification } from '@/lib/notification-generator';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/approvals/[id]
 * Aprueba o rechaza una solicitud de aprobación
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    // Solo administradores y super_admin pueden aprobar/rechazar
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden aprobar solicitudes' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { accion, comentarioRechazo } = body; // accion: 'aprobar' | 'rechazar'

    if (!accion || !['aprobar', 'rechazar'].includes(accion)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    // Obtener la solicitud de aprobación
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        expense: {
          include: {
            building: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
        maintenance: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!approval) {
      return NextResponse.json({ error: 'Solicitud de aprobación no encontrada' }, { status: 404 });
    }

    // Verificar que pertenece a la empresa del usuario
    let belongsToCompany = false;
    if (approval.expense) {
      const building = approval.expense.building || approval.expense.unit?.building;
      belongsToCompany = building?.companyId === user.companyId;
    } else if (approval.maintenance) {
      belongsToCompany = approval.maintenance.unit?.building?.companyId === user.companyId;
    }

    if (!belongsToCompany) {
      return NextResponse.json(
        { error: 'No tienes permiso para revisar esta solicitud' },
        { status: 403 }
      );
    }

    const nuevoEstado = accion === 'aprobar' ? 'aprobado' : 'rechazado';

    // Actualizar la solicitud de aprobación
    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        revisadoPor: user.id,
        fechaRevision: new Date(),
        comentarioRechazo: accion === 'rechazar' ? comentarioRechazo : undefined,
      },
    });

    // Actualizar el estado de la entidad
    if (approval.tipo === 'gasto' && approval.expenseId) {
      await prisma.expense.update({
        where: { id: approval.expenseId },
        data: {
          estadoAprobacion: nuevoEstado,
        },
      });
    } else if (approval.tipo === 'mantenimiento' && approval.maintenanceId) {
      await prisma.maintenanceRequest.update({
        where: { id: approval.maintenanceId },
        data: {
          estadoAprobacion: nuevoEstado,
        },
      });
    }

    // Notificar al solicitante
    await createNotification({
      companyId: user.companyId,
      userId: approval.solicitadoPor,
      tipo: 'alerta_sistema',
      titulo: `Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'}`,
      mensaje: `Tu solicitud de ${approval.tipo} por ${approval.monto?.toFixed(2) || 0} ��� ha sido ${accion === 'aprobar' ? 'aprobada' : 'rechazada'}${comentarioRechazo ? `: ${comentarioRechazo}` : ''}`,
      prioridad: 'medio',
      entityId: approval.entityId,
      entityType: approval.tipo,
    });

    return NextResponse.json(updatedApproval);
  } catch (error: any) {
    logger.error('Error al procesar aprobación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al procesar aprobación' }, { status: 500 });
  }
}

/**
 * DELETE /api/approvals/[id]
 * Cancela una solicitud de aprobación (solo el solicitante)
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const approval = await prisma.approval.findUnique({
      where: { id },
    });

    if (!approval) {
      return NextResponse.json({ error: 'Solicitud de aprobación no encontrada' }, { status: 404 });
    }

    // Solo el solicitante, administrador o super_admin pueden cancelar
    if (
      approval.solicitadoPor !== user.id &&
      user.role !== 'administrador' &&
      user.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'No tienes permiso para cancelar esta solicitud' },
        { status: 403 }
      );
    }

    // No se puede cancelar si ya fue revisada
    if (approval.estado !== 'pendiente') {
      return NextResponse.json(
        { error: 'No se puede cancelar una solicitud ya revisada' },
        { status: 400 }
      );
    }

    await prisma.approval.delete({
      where: { id },
    });

    // Actualizar el estado de la entidad
    if (approval.tipo === 'gasto' && approval.expenseId) {
      await prisma.expense.update({
        where: { id: approval.expenseId },
        data: {
          requiereAprobacion: false,
          estadoAprobacion: null,
        },
      });
    } else if (approval.tipo === 'mantenimiento' && approval.maintenanceId) {
      await prisma.maintenanceRequest.update({
        where: { id: approval.maintenanceId },
        data: {
          requiereAprobacion: false,
          estadoAprobacion: null,
        },
      });
    }

    return NextResponse.json({ message: 'Solicitud cancelada correctamente' });
  } catch (error: any) {
    logger.error('Error al cancelar aprobación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al cancelar aprobación' }, { status: 500 });
  }
}
