import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await prisma.sTRReview.findMany({
      where: {
        listing: {
          companyId: session.user.companyId,
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            titulo: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    const response = reviews.map((review) => ({
      id: review.id,
      propertyId: review.listingId,
      propertyName: review.listing?.titulo || 'Propiedad',
      guestName: review.guestNombre,
      channel: review.canal,
      rating: review.rating,
      comment: review.comentario,
      date: review.fecha.toISOString(),
      responded: Boolean(review.respuesta),
      response: review.respuesta ?? undefined,
      categories: {
        cleanliness: review.ratingLimpieza ?? review.rating,
        communication: review.ratingComunicacion ?? review.rating,
        location: review.ratingUbicacion ?? review.rating,
        value: review.ratingPrecio ?? review.rating,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching STR reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
