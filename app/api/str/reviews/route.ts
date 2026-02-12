import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    const reviews = await prisma.sTRReview.findMany({
      where: {
        listing: { companyId },
      },
      include: {
        listing: {
          select: { id: true, titulo: true },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 50,
    });

    const mapped = reviews.map((r: any) => ({
      id: r.id,
      propertyId: r.listingId,
      propertyName: r.listing?.titulo || '',
      guestName: r.guestNombre,
      channel: r.canal,
      rating: r.rating,
      comment: r.comentario,
      date: r.fecha?.toISOString().split('T')[0] || '',
      responded: !!r.respuesta,
      response: r.respuesta || undefined,
      categories: {
        cleanliness: r.ratingLimpieza ?? r.rating,
        communication: r.ratingComunicacion ?? r.rating,
        location: r.ratingUbicacion ?? r.rating,
        value: r.ratingValor ?? r.rating,
      },
    }));

    return NextResponse.json({ data: mapped });
  } catch (error: any) {
    logger.error('[STR Reviews GET]:', error);
    return NextResponse.json({ error: 'Error al obtener reviews' }, { status: 500 });
  }
}
