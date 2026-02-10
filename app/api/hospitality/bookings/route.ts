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

type BookingStatusDb =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'CANCELADA'
  | 'NO_SHOW';

type ChannelTypeDb =
  | 'AIRBNB'
  | 'BOOKING'
  | 'VRBO'
  | 'HOMEAWAY'
  | 'WEB_PROPIA'
  | 'EXPEDIA'
  | 'TRIPADVISOR'
  | 'OTROS';

const normalizeBookingStatus = (estado?: string | null): BookingStatusDb | null => {
  if (!estado) return null;
  const normalized = estado.trim().toLowerCase();
  switch (normalized) {
    case 'pendiente':
      return 'PENDIENTE';
    case 'confirmada':
      return 'CONFIRMADA';
    case 'check_in':
    case 'checkin':
      return 'CHECK_IN';
    case 'check_out':
    case 'checkout':
      return 'CHECK_OUT';
    case 'cancelada':
      return 'CANCELADA';
    case 'no_show':
    case 'noshow':
      return 'NO_SHOW';
    default:
      return null;
  }
};

const mapBookingStatusToUi = (estado: BookingStatusDb): string => {
  switch (estado) {
    case 'PENDIENTE':
      return 'pendiente';
    case 'CONFIRMADA':
      return 'confirmada';
    case 'CHECK_IN':
      return 'check_in';
    case 'CHECK_OUT':
      return 'check_out';
    case 'CANCELADA':
      return 'cancelada';
    case 'NO_SHOW':
      return 'no_show';
    default:
      return 'pendiente';
  }
};

const mapOrigenToChannel = (origen?: string): ChannelTypeDb => {
  const normalized = (origen || '').trim().toLowerCase();
  switch (normalized) {
    case 'airbnb':
      return 'AIRBNB';
    case 'booking':
      return 'BOOKING';
    case 'vrbo':
      return 'VRBO';
    case 'homeaway':
      return 'HOMEAWAY';
    case 'expedia':
      return 'EXPEDIA';
    case 'tripadvisor':
      return 'TRIPADVISOR';
    case 'directo':
    case 'web':
    case 'web_propia':
      return 'WEB_PROPIA';
    default:
      return 'OTROS';
  }
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const normalizedEstado = normalizeBookingStatus(estado);

    const { prisma } = await import('@/lib/db');

    // Obtener reservas
    const bookings = await prisma.sTRBooking.findMany({
      where: {
        companyId,
        ...(buildingId && { listing: { unit: { buildingId } } }),
        ...(normalizedEstado && { estado: normalizedEstado }),
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

    const bookingsFormateadas = bookings.map((booking) => ({
      ...booking,
      estado: mapBookingStatusToUi(booking.estado as BookingStatusDb),
    }));

    return NextResponse.json({
      success: true,
      data: bookingsFormateadas,
      stats,
    });
  } catch (error: any) {
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
    const numNoches = Math.max(
      1,
      Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const tarifaNocturna = numNoches > 0 ? data.precioTotal / numNoches : data.precioTotal;
    const canal = mapOrigenToChannel(data.origen);

    // Verificar que la habitación está disponible
    const existingBooking = await prisma.sTRBooking.findFirst({
      where: {
        companyId,
        estado: { in: ['CONFIRMADA', 'PENDIENTE', 'CHECK_IN'] },
        OR: [
          {
            checkInDate: { lte: checkOutDate },
            checkOutDate: { gte: checkInDate },
          },
        ],
      },
    });

    if (existingBooking) {
      return NextResponse.json({
        error: 'Habitación no disponible para esas fechas',
      }, { status: 400 });
    }

    // Buscar o crear un listing para este edificio
    const unitId = data.roomId;
    let listing = await prisma.sTRListing.findFirst({
      where: { companyId, unitId },
    });

    if (!listing) {
      listing = await prisma.sTRListing.create({
        data: {
          companyId,
          unitId,
          titulo: 'Reserva Directa',
          descripcion: 'Reservas directas del sistema',
          tipoPropiedad: 'habitacion',
          capacidadMaxima: data.numGuests,
          numDormitorios: 1,
          numCamas: Math.max(1, data.numGuests),
          numBanos: 1,
          precioPorNoche: tarifaNocturna,
        },
      });
    }

    const booking = await prisma.sTRBooking.create({
      data: {
        companyId,
        listingId: listing.id,
        canal,
        guestNombre: data.guestName,
        guestEmail: data.guestEmail,
        guestTelefono: data.guestPhone,
        checkInDate,
        checkOutDate,
        numHuespedes: data.numGuests,
        numNoches,
        precioTotal: data.precioTotal,
        tarifaNocturna,
        ingresoNeto: data.precioTotal,
        notasEspeciales: data.notas,
        estado: 'PENDIENTE',
      },
    });

    logger.info('Hospitality booking created', { bookingId: booking.id, companyId });

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Reserva creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating hospitality booking:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
