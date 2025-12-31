import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        visits: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    logger.error('Error fetching candidate:', error);
    return NextResponse.json({ error: 'Error al obtener candidato' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { estado, notas, scoring } = body;

    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: {
        estado,
        notas,
        scoring: scoring ? parseInt(scoring) : undefined,
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        visits: true,
      },
    });

    return NextResponse.json(candidate);
  } catch (error) {
    logger.error('Error updating candidate:', error);
    return NextResponse.json({ error: 'Error al actualizar candidato' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.candidate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Candidato eliminado' });
  } catch (error) {
    logger.error('Error deleting candidate:', error);
    return NextResponse.json({ error: 'Error al eliminar candidato' }, { status: 500 });
  }
}
