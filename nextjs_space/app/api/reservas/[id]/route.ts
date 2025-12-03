import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ReservationStatus } from '@prisma/client';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/reservas/[id] - Obtener reserva por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const reserva = await prisma.spaceReservation.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        space: {
          select: {
            nombre: true,
            tipo: true,
            building: {
              select: {
                nombre: true,
                direccion: true,
              },
            },
          },
        },
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    if (!reserva) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(reserva);
  } catch (error) {
    logger.error('Error fetching reserva:', error);
    return NextResponse.json(
      { error: 'Error al obtener reserva' },
      { status: 500 }
    );
  }
}

// PATCH /api/reservas/[id] - Actualizar reserva
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { estado, motivoCancelacion, pagado, observaciones } = body;

    // Verificar que la reserva pertenece a la empresa del usuario
    const reservaExistente = await prisma.spaceReservation.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!reservaExistente) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (estado) {
      updateData.estado = estado;
      if (estado === 'cancelada') {
        updateData.fechaCancelacion = new Date();
        if (motivoCancelacion) {
          updateData.motivoCancelacion = motivoCancelacion;
        }
      } else if (estado === 'completada') {
        // Marcar como completada automáticamente
      }
    }

    if (pagado !== undefined) {
      updateData.pagado = pagado;
    }

    if (observaciones !== undefined) {
      updateData.observaciones = observaciones;
    }

    const reserva = await prisma.spaceReservation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        space: {
          select: {
            nombre: true,
            tipo: true,
            building: {
              select: {
                nombre: true,
              },
            },
          },
        },
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    return NextResponse.json(reserva);
  } catch (error) {
    logger.error('Error updating reserva:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reserva' },
      { status: 500 }
    );
  }
}

// DELETE /api/reservas/[id] - Eliminar reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Validar rol
    if (session.user.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar que la reserva pertenece a la empresa del usuario
    const reservaExistente = await prisma.spaceReservation.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!reservaExistente) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    await prisma.spaceReservation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Reserva eliminada exitosamente' });
  } catch (error) {
    logger.error('Error deleting reserva:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reserva' },
      { status: 500 }
    );
  }
}
