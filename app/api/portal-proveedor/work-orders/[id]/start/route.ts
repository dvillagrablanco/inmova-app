import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireProviderAuth } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/portal-proveedor/work-orders/[id]/start - Iniciar orden de trabajo
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

    // Verificar que la orden fue aceptada
    if (workOrder.estado !== 'aceptada') {
      return NextResponse.json(
        { error: 'Solo se pueden iniciar órdenes aceptadas' },
        { status: 400 }
      );
    }

    // Actualizar estado a en_progreso
    const updatedWorkOrder = await prisma.providerWorkOrder.update({
      where: { id: workOrderId },
      data: {
        estado: 'en_progreso',
        fechaInicio: new Date(),
      },
    });

    logger.info(
      `Orden ${workOrderId} iniciada por proveedor ${auth.provider.nombre}`
    );

    return NextResponse.json({
      success: true,
      message: 'Trabajo iniciado exitosamente',
      workOrder: updatedWorkOrder,
    });
  } catch (error) {
    logger.error('Error al iniciar orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al iniciar orden de trabajo' },
      { status: 500 }
    );
  }
}
