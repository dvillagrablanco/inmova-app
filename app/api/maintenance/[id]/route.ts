import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            building: true,
            tenant: true,
          },
        },
      },
    });

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    logger.error('Error fetching maintenance request:', error);
    return NextResponse.json({ error: 'Error al obtener solicitud de mantenimiento' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { titulo, descripcion, prioridad, estado, fechaProgramada, fechaCompletada, providerId, costoEstimado, costoReal } = body;

    const maintenanceRequest = await prisma.maintenanceRequest.update({
      where: { id: params.id },
      data: {
        titulo,
        descripcion,
        prioridad,
        estado,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        fechaCompletada: fechaCompletada ? new Date(fechaCompletada) : null,
        providerId,
        costoEstimado: costoEstimado ? parseFloat(costoEstimado) : null,
        costoReal: costoReal ? parseFloat(costoReal) : null,
      },
    });

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    logger.error('Error updating maintenance request:', error);
    return NextResponse.json({ error: 'Error al actualizar solicitud de mantenimiento' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.maintenanceRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Solicitud de mantenimiento eliminada' });
  } catch (error) {
    logger.error('Error deleting maintenance request:', error);
    return NextResponse.json({ error: 'Error al eliminar solicitud de mantenimiento' }, { status: 500 });
  }
}
