import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  createVoting,
  castVote,
  getVotingResults,
  CreateVotingParams,
} from '@/lib/services/community-management-service';
import { VoteType } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/communities/votes:
 *   get:
 *     summary: Obtener votaciones
 *     tags: [Comunidades]
 *   post:
 *     summary: Crear votación o emitir voto
 *     tags: [Comunidades]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const buildingId = searchParams.get('buildingId');
    const voteId = searchParams.get('voteId');

    if (voteId) {
      // Obtener resultados de una votación específica
      const results = await getVotingResults(voteId);
      return NextResponse.json(results);
    }

    const where: any = {};
    if (buildingId) where.buildingId = buildingId;

    const votes = await prisma.communityVote.findMany({
      where,
      include: {
        building: true,
        votos: true,
      },
      orderBy: { fechaInicio: 'desc' },
    });

    return NextResponse.json(votes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener votaciones' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === 'create') {
      // Crear votación
      const params: CreateVotingParams = {
        buildingId: body.buildingId,
        companyId: body.companyId,
        titulo: body.titulo,
        descripcion: body.descripcion,
        opciones: body.opciones,
        fechaInicio: new Date(body.fechaInicio),
        fechaFin: new Date(body.fechaFin),
        tipo: body.tipo as VoteType,
        totalElegibles: body.totalElegibles,
        creadoPor: session.user.id!,
      };

      const voting = await createVoting(params);
      return NextResponse.json(voting, { status: 201 });
    }

    if (body.action === 'cast_vote') {
      // Emitir voto
      const vote = await castVote(body.voteId, session.user.id!, body.opcion);
      return NextResponse.json(vote);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar votación' },
      { status: 500 }
    );
  }
}
