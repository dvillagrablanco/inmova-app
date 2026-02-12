import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/marketplace/reviews/[id] - Obtener reseña específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const review = await prisma.serviceReview.findFirst({
      where: {
        id: params.id,
        companyId: session?.user?.companyId,
      },
      include: {
        provider: true,
        job: {
          include: {
            building: true,
            unit: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    logger.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Error al obtener reseña' },
      { status: 500 }
    );
  }
}

// PATCH /api/marketplace/reviews/[id] - Actualizar reseña
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Verificar que la reseña existe y pertenece a la compañía
    const existingReview = await prisma.serviceReview.findFirst({
      where: {
        id: params.id,
        companyId: session?.user?.companyId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Solo actualizar campos proporcionados
    if (body.calificacion !== undefined) {
      const rating = parseInt(body.calificacion);
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'La calificación debe estar entre 1 y 5' },
          { status: 400 }
        );
      }
      updateData.calificacion = rating;
    }
    if (body.puntualidad !== undefined) updateData.puntualidad = body.puntualidad ? parseInt(body.puntualidad) : null;
    if (body.calidad !== undefined) updateData.calidad = body.calidad ? parseInt(body.calidad) : null;
    if (body.comunicacion !== undefined) updateData.comunicacion = body.comunicacion ? parseInt(body.comunicacion) : null;
    if (body.precioJusto !== undefined) updateData.precioJusto = body.precioJusto ? parseInt(body.precioJusto) : null;
    if (body.comentario !== undefined) updateData.comentario = body.comentario;
    if (body.recomendaria !== undefined) updateData.recomendaria = body.recomendaria;

    const review = await prisma.serviceReview.update({
      where: { id: params.id },
      data: updateData,
      include: {
        provider: true,
        job: {
          include: {
            building: true,
            unit: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    logger.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reseña' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace/reviews/[id] - Eliminar reseña
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la reseña existe y pertenece a la compañía
    const existingReview = await prisma.serviceReview.findFirst({
      where: {
        id: params.id,
        companyId: session?.user?.companyId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    await prisma.serviceReview.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Reseña eliminada correctamente' });
  } catch (error) {
    logger.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reseña' },
      { status: 500 }
    );
  }
}
