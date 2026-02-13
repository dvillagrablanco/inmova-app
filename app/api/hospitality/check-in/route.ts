/**
 * API Hospitality: Check-in / Check-out
 * 
 * GET  - Lista reservas con check-in/check-out pendiente
 * POST - Realizar check-in o check-out de una reserva
 * 
 * Usa modelo STRBooking existente.
 */

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

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ data: [] });
    }

    // Obtener bookings activas (confirmadas o checked_in) de los próximos 7 días
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 1);
    const weekAhead = new Date(now);
    weekAhead.setDate(weekAhead.getDate() + 7);

    const bookings = await prisma.sTRBooking.findMany({
      where: {
        companyId,
        estado: { in: ['confirmada', 'checked_in', 'completada'] },
        OR: [
          { checkInDate: { gte: weekAgo, lte: weekAhead } },
          { checkOutDate: { gte: weekAgo, lte: weekAhead } },
          { estado: 'checked_in' },
        ],
      },
      include: {
        listing: {
          select: {
            titulo: true,
            unit: {
              select: {
                numero: true,
                building: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { checkInDate: 'asc' },
      take: 50,
    });

    return NextResponse.json({ data: bookings });
  } catch (error: any) {
    logger.error('Error en hospitality check-in GET:', error);
    return NextResponse.json({ error: 'Error interno', data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { bookingId, action } = await req.json();

    if (!bookingId || !['checkin', 'checkout'].includes(action)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const booking = await prisma.sTRBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    const newEstado = action === 'checkin' ? 'checked_in' : 'completada';

    const updated = await prisma.sTRBooking.update({
      where: { id: bookingId },
      data: { estado: newEstado },
    });

    logger.info(`Hospitality ${action}: booking ${bookingId}`, { userId: session.user.id });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error en hospitality check-in POST:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
