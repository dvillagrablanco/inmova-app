import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireProviderAuth } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/portal-proveedor/work-orders/[id]/accept - Aceptar orden de trabajo
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

    // Verificar que la orden existe y pertenece al proveedor
    const workOrder = await prisma.providerWorkOrder.findUnique({
      where: { id: workOrderId },
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

    // Verificar que la orden está en estado adecuado para aceptar
    if (!['pendiente', 'asignada'].includes(workOrder.estado)) {
      return NextResponse.json(
        { error: `No se puede aceptar una orden en estado ${workOrder.estado}` },
        { status: 400 }
      );
    }

    // Obtener datos adicionales del request (opcional)
    const body = await req.json().catch(() => ({}));
    const { fechaInicio } = body;

    // Actualizar estado a aceptada
    const updatedWorkOrder = await prisma.providerWorkOrder.update({
      where: { id: workOrderId },
      data: {
        estado: 'aceptada',
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
      },
    });

    logger.info(
      `Orden ${workOrderId} aceptada por proveedor ${auth.provider.nombre}`
    );

    // TODO: Enviar notificación al gestor que asignó la orden

    return NextResponse.json({
      success: true,
      message: 'Orden aceptada exitosamente',
      workOrder: updatedWorkOrder,
    });
  } catch (error) {
    logger.error('Error al aceptar orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al aceptar orden de trabajo' },
      { status: 500 }
    );
  }
}
