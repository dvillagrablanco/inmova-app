import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmada, asistio, realizada, feedback } = body;

    const visit = await prisma.visit.update({
      where: { id: params.id },
      data: {
        confirmada,
        asistio: asistio ?? realizada,
        feedback,
      },
      include: {
        candidate: {
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

    return NextResponse.json(visit);
  } catch (error) {
    logger.error('Error updating visit:', error);
    return NextResponse.json({ error: 'Error al actualizar visita' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return PUT(request, { params });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.visit.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Visita eliminada' });
  } catch (error) {
    logger.error('Error deleting visit:', error);
    return NextResponse.json({ error: 'Error al eliminar visita' }, { status: 500 });
  }
}
