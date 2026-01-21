import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const [reviews, listingsCount] = await Promise.all([
      prisma.sTRReview.findMany({
        where: { listing: { companyId } },
        include: { listing: { select: { titulo: true } } },
        orderBy: { fecha: 'desc' },
        take: 50,
      }),
      prisma.sTRListing.count({ where: { companyId, activo: true } }),
    ]);

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

    const responseTimes = reviews
      .filter((review) => review.respondidoEn)
      .map((review) => {
        const respondedAt = review.respondidoEn?.getTime() || 0;
        return Math.max(0, respondedAt - review.fecha.getTime());
      })
      .filter((value) => value > 0);

    const avgResponseTimeMinutes =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length / 60000
          )
        : 0;

    return NextResponse.json({
      metrics: {
        avgRating: Number(avgRating.toFixed(2)),
        totalReviews,
        guidesCount: listingsCount,
        avgResponseTimeMinutes,
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        guest: review.guestNombre,
        property: review.listing.titulo,
        rating: review.rating,
        date: review.fecha.toISOString(),
        comment: review.comentario,
        response: review.respuesta,
        respondedAt: review.respondidoEn?.toISOString() || null,
      })),
    });
  } catch (error) {
    logger.error('[Guest Experience] Error al cargar reseñas', error);
    return NextResponse.json({ error: 'Error al cargar reseñas' }, { status: 500 });
  }
}
