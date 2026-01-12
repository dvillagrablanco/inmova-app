import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener reviews
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const estado = searchParams.get('estado');

    const reviews = await prisma.review.findMany({
      where: {
        companyId: user.companyId,
        ...(entityType && { entityType: entityType as any }),
        ...(entityId && { entityId }),
        ...(estado && { estado: estado as any })
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json(reviews);
  } catch (error) {
    logger.error('Error al obtener reviews:', error);
    return NextResponse.json({ error: 'Error al obtener reviews' }, { status: 500 });
  }
}

// POST - Crear review
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();

    const review = await prisma.review.create({
      data: {
        companyId: user.companyId,
        entityType: body.entityType,
        entityId: body.entityId,
        reviewerId: body.reviewerId || user.id,
        reviewerType: body.reviewerType || 'user',
        reviewerName: body.reviewerName || user.name,
        rating: body.rating,
        titulo: body.titulo,
        comentario: body.comentario,
        aspectos: body.aspectos,
        verificado: body.verificado || false,
        contratoId: body.contratoId,
        ordenTrabajoId: body.ordenTrabajoId,
        estado: 'pendiente'
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    logger.error('Error al crear review:', error);
    return NextResponse.json({ error: 'Error al crear review' }, { status: 500 });
  }
}

// PATCH - Actualizar review (moderar, responder)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { id, ...data } = body;

    const updateData: any = { ...data };

    if (data.estado === 'publicada') {
      updateData.moderadoPor = user.id;
      updateData.fechaModeracion = new Date();
    }

    if (data.respuesta) {
      updateData.respondidoPor = user.id;
      updateData.fechaRespuesta = new Date();
    }

    const review = await prisma.review.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(review);
  } catch (error) {
    logger.error('Error al actualizar review:', error);
    return NextResponse.json({ error: 'Error al actualizar review' }, { status: 500 });
  }
}
