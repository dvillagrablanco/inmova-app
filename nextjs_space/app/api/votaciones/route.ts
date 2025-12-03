import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/votaciones - Obtener votaciones
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');

    const votaciones = await prisma.communityVote.findMany({
      where: {
        companyId: session.user.companyId,
        ...(buildingId && { buildingId }),
        ...(estado && { estado: estado as any }),
      },
      include: {
        building: { select: { nombre: true } },
        votos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(votaciones);
  } catch (error) {
    logger.error('Error fetching votaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener votaciones' },
      { status: 500 }
    );
  }
}

// POST /api/votaciones - Crear votación
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      buildingId,
      titulo,
      descripcion,
      tipo,
      opciones,
      fechaCierre,
      requiereQuorum,
      quorumRequerido,
    } = body;

    const votacion = await prisma.communityVote.create({
      data: {
        companyId: session.user.companyId,
        buildingId,
        titulo,
        descripcion,
        tipo,
        opciones,
        fechaCierre: new Date(fechaCierre),
        requiereQuorum: requiereQuorum !== undefined ? requiereQuorum : true,
        quorumRequerido: quorumRequerido || 50,
        creadoPor: session.user.id!,
      },
      include: {
        building: true,
      },
    });

    return NextResponse.json(votacion, { status: 201 });
  } catch (error) {
    logger.error('Error creating votacion:', error);
    return NextResponse.json(
      { error: 'Error al crear votación' },
      { status: 500 }
    );
  }
}
