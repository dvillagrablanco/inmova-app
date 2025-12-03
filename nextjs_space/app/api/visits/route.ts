import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const visits = await prisma.visit.findMany({
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
      orderBy: {
        fechaVisita: 'asc',
      },
    });

    return NextResponse.json(visits);
  } catch (error) {
    logger.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Error al obtener visitas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { candidateId, fechaVisita, confirmada } = body;

    const visit = await prisma.visit.create({
      data: {
        candidateId,
        fechaVisita: new Date(fechaVisita),
        confirmada: confirmada || false,
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

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    logger.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Error al crear visita' }, { status: 500 });
  }
}
