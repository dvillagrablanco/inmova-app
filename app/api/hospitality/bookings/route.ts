/**
 * API Endpoint: Reservas de Hospitality
 * Utiliza el modelo STRBooking existente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BOOKING_STATUSES = ['PENDIENTE', 'CONFIRMADA', 'CHECK_IN', 'CHECK_OUT', 'CANCELADA', 'NO_SHOW'] as const;
type BookingStatusValue = (typeof BOOKING_STATUSES)[number];
const BOOKING_STATUS_MAP: Record<string, BookingStatusValue> = {
  pendiente: 'PENDIENTE',
  confirmada: 'CONFIRMADA',
  check_in: 'CHECK_IN',
  check_out: 'CHECK_OUT',
  cancelada: 'CANCELADA',
  no_show: 'NO_SHOW',
};

const CHANNEL_TYPES = ['AIRBNB', 'BOOKING', 'VRBO', 'HOMEAWAY', 'WEB_PROPIA', 'EXPEDIA', 'TRIPADVISOR', 'OTROS'] as const;
type ChannelTypeValue = (typeof CHANNEL_TYPES)[number];
const CHANNEL_MAP: Record<string, ChannelTypeValue> = {
  directo: 'WEB_PROPIA',
  web: 'WEB_PROPIA',
  booking: 'BOOKING',
  airbnb: 'AIRBNB',
  vrbo: 'VRBO',
  homeaway: 'HOMEAWAY',
  expedia: 'EXPEDIA',
  tripadvisor: 'TRIPADVISOR',
  otros: 'OTROS',
};
const CHANNEL_REVERSE_MAP: Record<ChannelTypeValue, string> = {
  WEB_PROPIA: 'directo',
  BOOKING: 'booking',
  AIRBNB: 'airbnb',
  VRBO: 'vrbo',
  HOMEAWAY: 'homeaway',
  EXPEDIA: 'expedia',
  TRIPADVISOR: 'tripadvisor',
  OTROS: 'otros',
};
const DEFAULT_CHANNEL: ChannelTypeValue = 'WEB_PROPIA';

const createBookingSchema = z.object({
  roomId: z.string(),
  buildingId: z.string(),
  guestName: z.string(),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  checkIn: z.string(), // ISO date
  checkOut: z.string(), // ISO date
  numGuests: z.number().int().min(1),
  precioTotal: z.number().min(0),
  notas: z.string().optional(),
  origen: z.string().default('directo'), // directo, booking, airbnb, etc.
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const { prisma } = await import('@/lib/db');

    const estadoNormalizado = estado?.toLowerCase();
    const estadoValue =
      (estadoNormalizado && BOOKING_STATUS_MAP[estadoNormalizado]) ||
      (estado && BOOKING_STATUSES.includes(estado as BookingStatusValue) ? (estado as BookingStatusValue) : undefined);

    // Obtener reservas
    const bookings = await prisma.sTRBooking.findMany({
      where: {
        companyId,
        ...(buildingId && { listing: { unit: { buildingId } } }),
        ...(estadoValue && { estado: estadoValue }),
        ...(fechaDesde && {
          checkInDate: { gte: new Date(fechaDesde) },
        }),
        ...(fechaHasta && {
          checkOutDate: { lte: new Date(fechaHasta) },
        }),
      },
      include: {
        listing: {
          select: { titulo: true },
        },
      },
      orderBy: { checkInDate: 'desc' },
      take: 100,
    });

    // Estadísticas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      total: bookings.length,
      confirmadas: bookings.filter(b => b.estado === 'CONFIRMADA').length,
      pendientes: bookings.filter(b => b.estado === 'PENDIENTE').length,
      checkinHoy: bookings.filter(b => {
        const checkIn = new Date(b.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime();
      }).length,
      checkoutHoy: bookings.filter(b => {
        const checkOut = new Date(b.checkOutDate);
        checkOut.setHours(0, 0, 0, 0);
        return checkOut.getTime() === today.getTime();
      }).length,
      ingresosMes: bookings
        .filter(b => {
          const checkIn = new Date(b.checkInDate);
          return checkIn.getMonth() === today.getMonth() && 
                 checkIn.getFullYear() === today.getFullYear();
        })
        .reduce((sum, b) => sum + (b.precioTotal || 0), 0),
    };

    const bookingsResponse = bookings.map(booking => ({
      id: booking.id,
      guestName: booking.guestNombre,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestTelefono || undefined,
      checkIn: booking.checkInDate.toISOString(),
      checkOut: booking.checkOutDate.toISOString(),
      numGuests: booking.numHuespedes,
      precioTotal: booking.precioTotal,
      estado: booking.estado,
      notas: booking.notasEspeciales || undefined,
      plataforma: CHANNEL_REVERSE_MAP[booking.canal] || 'directo',
      listing: booking.listing ? { titulo: booking.listing.titulo } : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: bookingsResponse,
      stats,
    });
  } catch (error: unknown) {
    logger.error('Error fetching hospitality bookings:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createBookingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'La fecha de salida debe ser posterior a la de entrada' }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: {
        id: data.roomId,
        companyId,
      },
      select: {
        id: true,
        unitId: true,
        unit: {
          select: {
            id: true,
            buildingId: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Habitación no encontrada' }, { status: 404 });
    }

    if (data.buildingId && room.unit?.buildingId !== data.buildingId) {
      return NextResponse.json({ error: 'La habitación no pertenece al edificio indicado' }, { status: 400 });
    }

    const listing = await prisma.sTRListing.findFirst({
      where: {
        companyId,
        unitId: room.unitId,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'No existe un listing STR para esta unidad. Configúralo antes de crear reservas.' },
        { status: 400 }
      );
    }

    const origenNormalizado = data.origen?.toLowerCase() || 'directo';
    const canalValue = CHANNEL_MAP[origenNormalizado] || DEFAULT_CHANNEL;
    const numNoches = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const tarifaNocturna = numNoches > 0 ? data.precioTotal / numNoches : data.precioTotal;
    const ingresoNeto = data.precioTotal;

    // Verificar que la habitación está disponible
    const existingBooking = await prisma.sTRBooking.findFirst({
      where: {
        companyId,
        listingId: listing.id,
        estado: { in: ['CONFIRMADA', 'PENDIENTE'] },
        checkInDate: { lte: checkOutDate },
        checkOutDate: { gte: checkInDate },
      },
    });

    if (existingBooking) {
      return NextResponse.json({
        error: 'Habitación no disponible para esas fechas',
      }, { status: 400 });
    }

    const booking = await prisma.sTRBooking.create({
      data: {
        companyId,
        listingId: listing.id,
        canal: canalValue,
        guestNombre: data.guestName,
        guestEmail: data.guestEmail,
        guestTelefono: data.guestPhone,
        checkInDate,
        checkOutDate,
        numHuespedes: data.numGuests,
        numNoches,
        precioTotal: data.precioTotal,
        tarifaNocturna,
        ingresoNeto,
        notasEspeciales: data.notas,
        estado: 'PENDIENTE',
      },
      include: {
        listing: {
          select: { titulo: true },
        },
      },
    });

    logger.info('Hospitality booking created', { bookingId: booking.id, companyId });

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        guestName: booking.guestNombre,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestTelefono || undefined,
        checkIn: booking.checkInDate.toISOString(),
        checkOut: booking.checkOutDate.toISOString(),
        numGuests: booking.numHuespedes,
        precioTotal: booking.precioTotal,
        estado: booking.estado,
        notas: booking.notasEspeciales || undefined,
        plataforma: CHANNEL_REVERSE_MAP[booking.canal] || 'directo',
        listing: booking.listing ? { titulo: booking.listing.titulo } : undefined,
      },
      message: 'Reserva creada exitosamente',
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error creating hospitality booking:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
