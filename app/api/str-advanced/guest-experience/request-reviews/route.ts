import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);

    const bookings = await prisma.sTRBooking.findMany({
      where: {
        companyId,
        checkOutDate: { gte: sinceDate, lte: new Date() },
      },
      select: {
        id: true,
        guestEmail: true,
        guestNombre: true,
        listing: { select: { titulo: true } },
      },
    });

    if (bookings.length === 0) {
      return NextResponse.json({ requested: 0 });
    }

    const reviewed = await prisma.sTRReview.findMany({
      where: {
        bookingId: { in: bookings.map((booking) => booking.id) },
      },
      select: { bookingId: true },
    });

    const reviewedIds = new Set(reviewed.map((review) => review.bookingId).filter(Boolean));
    const pending = bookings.filter(
      (booking) => booking.guestEmail && !reviewedIds.has(booking.id)
    );

    if (pending.length === 0) {
      return NextResponse.json({ requested: 0 });
    }

    await prisma.notificationLog.createMany({
      data: pending.map((booking) => ({
        companyId,
        tipo: 'info',
        canal: 'email',
        destinatario: booking.guestEmail,
        asunto: `Cuéntanos tu experiencia en ${booking.listing.titulo}`,
        mensaje: `Hola ${booking.guestNombre}, nos encantaría conocer tu opinión sobre tu estancia en ${booking.listing.titulo}.`,
        estado: 'pendiente',
        metadatos: {
          bookingId: booking.id,
          listingTitle: booking.listing.titulo,
          type: 'review_request',
        },
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ requested: pending.length });
  } catch (error) {
    logger.error('[Guest Experience] Error solicitando reseñas', error);
    return NextResponse.json({ error: 'Error solicitando reseñas' }, { status: 500 });
  }
}
